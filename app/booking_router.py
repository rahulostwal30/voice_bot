import re
from datetime import date, datetime, time
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Doctor, DoctorSlot, Appointment


router = APIRouter(
    prefix="/api/booking",
    tags=["Doctor Appointment Booking"],
)


def get_current_time():
    return datetime.now().time().replace(microsecond=0)


def slot_is_future(slot_date: date, slot_time: time) -> bool:
    today = date.today()

    if slot_date < today:
        return False

    if slot_date == today:
        return slot_time > get_current_time()

    return True


@router.get("/doctors")
def search_doctors(
    specialty: str | None = Query(default=None, min_length=2),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor).filter(Doctor.is_active.is_(True))

    if specialty:
        query = query.filter(
            Doctor.specialty.ilike(f"%{specialty.strip()}%")
        )

    doctors = query.order_by(Doctor.name).all()

    return {
        "count": len(doctors),
        "doctors": [
            {
                "id": doctor.id,
                "name": doctor.name,
                "specialty": doctor.specialty,
            }
            for doctor in doctors
        ],
    }


@router.get("/availability")
def get_availability(
    doctor_id: int = Query(gt=0),
    appointment_date: date = Query(),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == doctor_id,
            Doctor.is_active.is_(True),
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found or inactive.",
        )

    slots = (
        db.query(DoctorSlot)
        .filter(
            DoctorSlot.doctor_id == doctor_id,
            DoctorSlot.appointment_date == appointment_date,
            DoctorSlot.is_available.is_(True),
        )
        .order_by(DoctorSlot.start_time)
        .all()
    )

    available_slots = [
        {
            "slot_id": slot.id,
            "date": slot.appointment_date.isoformat(),
            "time": slot.start_time.strftime("%H:%M"),
        }
        for slot in slots
        if slot_is_future(slot.appointment_date, slot.start_time)
    ]

    return {
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialty": doctor.specialty,
        },
        "date": appointment_date.isoformat(),
        "available_count": len(available_slots),
        "available_slots": available_slots,
    }


from datetime import date, datetime, time
from fastapi import Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Doctor, DoctorSlot


@router.get("/suggestions")
def get_booking_suggestions(
    specialty: str = Query(..., min_length=1),
    appointment_date: date = Query(...),
    requested_time: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    selected_specialty = specialty.strip()

    if not selected_specialty:
        raise HTTPException(status_code=400, detail="Please select a department.")

    # Exact department match: other departments are never included.
    doctors = (
        db.query(Doctor)
        .filter(
            Doctor.is_active.is_(True),
            func.lower(Doctor.specialty) == selected_specialty.lower(),
        )
        .all()
    )

    if not doctors:
        return {
            "success": True,
            "specialty": selected_specialty,
            "suggestions": [],
            "message": (
                f"No active doctors found in {selected_specialty}. "
                "Please try another date or time."
            ),
        }

    doctor_ids = [doctor.id for doctor in doctors]
    doctors_by_id = {doctor.id: doctor for doctor in doctors}

    slots = (
        db.query(DoctorSlot)
        .filter(
            DoctorSlot.doctor_id.in_(doctor_ids),
            DoctorSlot.appointment_date == appointment_date,
            DoctorSlot.is_available.is_(True),
        )
        .all()
    )

    print("DEBUG specialty:", selected_specialty)
    print("DEBUG active doctors:", [(d.id, d.name, d.specialty) for d in doctors])
    print("DEBUG date:", appointment_date)
    print("DEBUG matching slots:", [
        (s.id, s.doctor_id, s.appointment_date, s.start_time, s.is_available)
        for s in slots
    ])

    now = datetime.now()
    suggestions = []

    try:
        preferred_time = (
            time.fromisoformat(requested_time)
            if requested_time
            else None
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid time. Use HH:MM format, for example 14:30.",
        )

    for slot in slots:
        slot_time = slot.start_time

        if isinstance(slot_time, str):
            try:
                slot_time = time.fromisoformat(slot_time)
            except ValueError:
                continue

        if not isinstance(slot_time, time):
            continue

        slot_datetime = datetime.combine(appointment_date, slot_time)

        # Do not suggest slots that have already passed.
        if slot_datetime <= now:
            continue

        doctor = doctors_by_id[slot.doctor_id]

        difference = (
            abs(
                slot_time.hour * 60 + slot_time.minute
                - (preferred_time.hour * 60 + preferred_time.minute)
            )
            if preferred_time
            else 0
        )

        suggestions.append({
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "specialty": doctor.specialty,
            "slot_id": slot.id,
            "date": appointment_date.isoformat(),
            "time": slot_time.strftime("%H:%M"),
            "difference_from_requested_minutes": difference,
        })

    suggestions.sort(
        key=lambda item: (
            item["difference_from_requested_minutes"],
            item["time"],
        )
    )

    return {
        "success": True,
        "specialty": selected_specialty,
        "suggestions": suggestions[:5],
        "message": (
            f"Available slots in {selected_specialty}."
            if suggestions
            else (
                f"No available slots in {selected_specialty} "
                f"on {appointment_date.isoformat()}. "
                "Please try another date or time."
            )
        ),
    }


class BookingConfirmationRequest(BaseModel):
    patient_name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=7, max_length=20)
    doctor_id: int = Field(gt=0)
    slot_id: int = Field(gt=0)
    confirmed: bool = False


@router.post("/confirm", status_code=201)
def confirm_appointment(
    request: BookingConfirmationRequest,
    db: Session = Depends(get_db),
):
    # Final confirmation is mandatory.
    if request.confirmed is not True:
        raise HTTPException(
            status_code=400,
            detail="Booking was not confirmed by the user.",
        )

    patient_name = request.patient_name.strip()
    phone = request.phone.strip()

    if not patient_name:
        raise HTTPException(
            status_code=422,
            detail="Patient name cannot be empty.",
        )

    if not re.fullmatch(r"[+\d][\d\s()+-]{6,19}", phone):
        raise HTTPException(
            status_code=422,
            detail="Please provide a valid phone number.",
        )

    try:
        # Verify the doctor is active.
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
                detail="Doctor not found or inactive.",
            )

        # Lock the slot row to reduce concurrent booking conflicts.
        slot = (
            db.query(DoctorSlot)
            .filter(
                DoctorSlot.id == request.slot_id,
                DoctorSlot.doctor_id == request.doctor_id,
            )
            .with_for_update()
            .first()
        )

        if not slot:
            raise HTTPException(
                status_code=404,
                detail="The selected slot does not belong to this doctor.",
            )

        if not slot.is_available:
            raise HTTPException(
                status_code=409,
                detail="This slot is no longer available. Please choose another.",
            )

        if not slot_is_future(slot.appointment_date, slot.start_time):
            raise HTTPException(
                status_code=409,
                detail="This appointment time has already passed.",
            )

        appointment = Appointment(
            patient_name=patient_name,
            phone=phone,
            doctor_id=doctor.id,
            slot_id=slot.id,
            status="booked",
        )

        slot.is_available = False
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        return {
            "success": True,
            "message": "Appointment booked successfully.",
            "appointment": {
                "appointment_id": appointment.id,
                "patient_name": appointment.patient_name,
                "doctor_name": doctor.name,
                "specialty": doctor.specialty,
                "date": slot.appointment_date.isoformat(),
                "time": slot.start_time.strftime("%H:%M"),
                "status": appointment.status,
            },
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This slot has already been booked. Please select another slot.",
        )

    except Exception:
        db.rollback()
        raise


@router.post("/cancel/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    # Lock the appointment row while processing cancellation.
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .with_for_update()
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found.",
        )

    if appointment.status.lower() == "cancelled":
        raise HTTPException(
            status_code=409,
            detail="Appointment is already cancelled.",
        )

    if appointment.status.lower() != "booked":
        raise HTTPException(
            status_code=409,
            detail="Only booked appointments can be cancelled.",
        )

    # Find and lock the slot belonging to this appointment.
    slot = (
        db.query(DoctorSlot)
        .filter(DoctorSlot.id == appointment.slot_id)
        .with_for_update()
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=409,
            detail="Appointment slot not found. Cancellation was not completed.",
        )

    try:
        appointment.status = "cancelled"
        slot.is_available = True

        db.commit()

        return {
            "success": True,
            "message": "Appointment cancelled successfully.",
            "appointment_id": appointment.id,
            "status": appointment.status,
            "slot_id": slot.id,
            "slot_available": slot.is_available,
        }

    except Exception:
        db.rollback()
        raise
