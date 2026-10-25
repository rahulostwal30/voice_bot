
from app.database import SessionLocal
from app.models import Doctor, DoctorSlot
from sqlalchemy import func

db = SessionLocal()

try:
    doctors = (
        db.query(Doctor)
        .filter(Doctor.specialty.ilike("Cardiology"))
        .all()
    )

    doctor_ids = [doctor.id for doctor in doctors]

    print("\n--- CARDIOLOGY SLOT SUMMARY ---")

    if not doctor_ids:
        print("No Cardiology doctors found.")
    else:
        results = (
            db.query(
                DoctorSlot.appointment_date,
                DoctorSlot.is_available,
                func.count(DoctorSlot.id),
            )
            .filter(DoctorSlot.doctor_id.in_(doctor_ids))
            .group_by(
                DoctorSlot.appointment_date,
                DoctorSlot.is_available,
            )
            .order_by(DoctorSlot.appointment_date)
            .all()
        )

        if not results:
            print("No slots exist for Cardiology doctors in the database.")

        for slot_date, available, count in results:
            print(
                f"Date: {slot_date} | "
                f"Available: {available} | Count: {count}"
            )

finally:
    db.close()
