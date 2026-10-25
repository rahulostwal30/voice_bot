
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Doctor, DoctorSchedule, DoctorSlot


router = APIRouter(
    prefix="/api/booking",
    tags=["Doctor Schedule"],
)


class ScheduleCreate(BaseModel):
    doctor_id: int = Field(gt=0)
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(default=30, ge=5, le=180)

    @model_validator(mode="after")
    def validate_times(self):
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be later than start_time")
        return self


class GenerateSlotsRequest(BaseModel):
    doctor_id: int = Field(gt=0)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (self.end_date - self.start_date).days > 90:
            raise ValueError("Generate slots for at most 91 calendar days")
        return self


@router.post("/schedules", status_code=201)
def create_schedule(
    request: ScheduleCreate,
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == request.doctor_id,
            Doctor.is_active.is_(True),
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Active doctor not found.",
        )

    duplicate = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == request.doctor_id,
            DoctorSchedule.weekday == request.weekday,
            DoctorSchedule.start_time == request.start_time,
            DoctorSchedule.end_time == request.end_time,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This schedule already exists.",
        )

    schedule = DoctorSchedule(
        doctor_id=request.doctor_id,
        weekday=request.weekday,
        start_time=request.start_time,
        end_time=request.end_time,
        slot_duration_minutes=request.slot_duration_minutes,
        is_active=True,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "success": True,
        "message": "Doctor schedule created.",
        "schedule": {
            "id": schedule.id,
            "doctor_id": schedule.doctor_id,
            "weekday": schedule.weekday,
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "slot_duration_minutes": schedule.slot_duration_minutes,
        },
    }


@router.post("/generate-slots")
def generate_slots(
    request: GenerateSlotsRequest,
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == request.doctor_id,
            Doctor.is_active.is_(True),
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Active doctor not found.",
        )

    schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor.id,
            DoctorSchedule.is_active.is_(True),
        )
        .order_by(
            DoctorSchedule.weekday,
            DoctorSchedule.start_time,
        )
        .all()
    )

    if not schedules:
        raise HTTPException(
            status_code=409,
            detail="No active schedule exists for this doctor. Create a schedule first.",
        )

    today = date.today()
    current_time = datetime.now().time().replace(microsecond=0)
    created_count = 0
    skipped_count = 0

    try:
        current_date = request.start_date

        while current_date <= request.end_date:
            if current_date < today:
                current_date += timedelta(days=1)
                continue

            for schedule in schedules:
                if current_date.weekday() != schedule.weekday:
                    continue

                slot_start = datetime.combine(
                    current_date,
                    schedule.start_time,
                )
                schedule_end = datetime.combine(
                    current_date,
                    schedule.end_time,
                )
                duration = timedelta(
                    minutes=schedule.slot_duration_minutes
                )

                while slot_start + duration <= schedule_end:
                    slot_time = slot_start.time()

                    if (
                        current_date == today
                        and slot_time <= current_time
                    ):
                        skipped_count += 1
                        slot_start += duration
                        continue

                    existing = (
                        db.query(DoctorSlot.id)
                        .filter(
                            DoctorSlot.doctor_id == doctor.id,
                            DoctorSlot.appointment_date == current_date,
                            DoctorSlot.start_time == slot_time,
                        )
                        .first()
                    )

                    if existing:
                        skipped_count += 1
                    else:
                        db.add(
                            DoctorSlot(
                                doctor_id=doctor.id,
                                appointment_date=current_date,
                                start_time=slot_time,
                                is_available=True,
                            )
                        )
                        created_count += 1

                    slot_start += duration

            current_date += timedelta(days=1)

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "success": True,
        "doctor_id": doctor.id,
        "doctor_name": doctor.name,
        "start_date": request.start_date.isoformat(),
        "end_date": request.end_date.isoformat(),
        "created_slots": created_count,
        "skipped_existing_or_past_slots": skipped_count,
        "message": "Slot generation completed.",
    }
