from sqlalchemy import UniqueConstraint
from datetime import date, time, datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    Time,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    specialty = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    slots = relationship("DoctorSlot", back_populates="doctor")
    appointments = relationship(
        "Appointment", back_populates="doctor"
    )
    schedules = relationship(
        "DoctorSchedule",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_doctor_schedule",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False,
    )
    # Monday = 0, Tuesday = 1, ... Sunday = 6
    weekday = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration_minutes = Column(
        Integer,
        default=30,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)

    doctor = relationship("Doctor", back_populates="schedules")

class DoctorSlot(Base):
    __tablename__ = "doctor_slots"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(
        Integer, ForeignKey("doctors.id"), nullable=False
    )
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    doctor = relationship("Doctor", back_populates="slots")
    appointment = relationship(
        "Appointment", back_populates="slot", uselist=False
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    doctor_id = Column(
        Integer, ForeignKey("doctors.id"), nullable=False
    )
    slot_id = Column(
        Integer,
        ForeignKey("doctor_slots.id"),
        nullable=False,
        unique=True,
    )
    status = Column(String(30), default="booked", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="appointments")
    slot = relationship("DoctorSlot", back_populates="appointment")
