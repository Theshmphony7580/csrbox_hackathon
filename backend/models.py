from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    subjects = Column(JSON, default=[])
    exam_date = Column(String, nullable=True)
    daily_free_slots = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    cognitive_events = relationship("CognitiveEvent", back_populates="user")
    energy_logs = relationship("EnergyLog", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")


class CognitiveEvent(Base):
    __tablename__ = "cognitive_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    time_taken = Column(Float, nullable=False)  # seconds
    correct = Column(Boolean, nullable=False)
    confidence = Column(Integer, nullable=False)  # 1-5
    retry_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cognitive_events")


class EnergyLog(Base):
    __tablename__ = "energy_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sleep_hours = Column(Float, nullable=False)
    tiredness = Column(Integer, nullable=False)  # 1-5
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="energy_logs")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    plan_data = Column(JSON, nullable=False)  # Full schedule JSON
    cognitive_profile = Column(JSON, nullable=True)
    energy_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_plans")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    slot_index = Column(Integer, nullable=False)
    completion_rate = Column(Integer, nullable=False)  # 0-100
    difficulty = Column(Integer, nullable=False)  # 1-5
    actual_time = Column(Integer, nullable=True)  # minutes
    quiz_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
