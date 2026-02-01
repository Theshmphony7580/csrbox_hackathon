from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# --- Auth Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    subjects: List[str] = []
    exam_date: Optional[str] = None
    daily_free_slots: List[str] = []


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    subjects: List[str]
    exam_date: Optional[str]
    daily_free_slots: List[str]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# --- Cognitive Event Schemas ---
class CognitiveEventCreate(BaseModel):
    question_id: str
    subject: str
    time_taken: float
    correct: bool
    confidence: int  # 1-5


class CognitiveEventResponse(BaseModel):
    id: int
    question_id: str
    subject: str
    time_taken: float
    correct: bool
    confidence: int
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Energy Log Schemas ---
class EnergyLogCreate(BaseModel):
    sleep_hours: float
    tiredness: int  # 1-5
    timestamp: Optional[datetime] = None


class EnergyLogResponse(BaseModel):
    id: int
    sleep_hours: float
    tiredness: int
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Study Plan Schemas ---
class PlanPreferences(BaseModel):
    max_session_duration: int = 120  # minutes
    min_break: int = 15  # minutes


class PlanGenerateRequest(BaseModel):
    date: str
    override_slots: List[str] = []
    preferences: Optional[PlanPreferences] = None


class StudySlot(BaseModel):
    time: str
    subject: str
    topic: str
    method: str
    intensity: str
    rationale: str


class CognitiveProfile(BaseModel):
    type: str
    confidence: float
    features: dict


class StudyPlanResponse(BaseModel):
    cognitive_profile: CognitiveProfile
    energy_score: int
    energy_level: str
    study_plan: List[StudySlot]
    metadata: dict

    class Config:
        from_attributes = True


# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    plan_id: int
    slot_index: int
    completion_rate: int  # 0-100
    difficulty: int  # 1-5
    actual_time: Optional[int] = None
    quiz_score: Optional[float] = None
