"""
FastAPI Application - NeuroAdaptive Study Engine MVP
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from jose import JWTError, jwt
import bcrypt

from database import engine, get_db, Base
import models
import schemas
from engine.cognitive import classify_cognitive_profile
from engine.energy import calculate_energy_score, get_energy_level, get_energy_analysis
from engine.scheduler import generate_schedule
from engine.chatbot import generate_chat_response
from engine.gemini_chat import generate_gemini_response
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str


# Create tables
Base.metadata.create_all(bind=engine)

# Seed demo user
def create_demo_user():
    from database import SessionLocal
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "demo@example.com").first()
        if not existing:
            demo_user = models.User(
                name="Demo User",
                email="demo@example.com",
                hashed_password=bcrypt.hashpw("demo123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                subjects=["Mathematics", "Physics", "Chemistry"],
                exam_date="2026-06-15",
                daily_free_slots=["09:00-11:00", "14:00-16:00", "19:00-21:00"]
            )
            db.add(demo_user)
            db.commit()
            print("✅ Demo user created: demo@example.com / demo123")
    finally:
        db.close()

create_demo_user()

# JWT Settings
SECRET_KEY = "neuroadaptive-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


app = FastAPI(
    title="NeuroAdaptive Study Engine",
    description="Intelligent study optimization platform with behavior-driven, energy-aware study plans",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Helper Functions ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# --- Chatbot Endpoint ---
@app.post("/chat/message")
async def chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    message = payload.message
    print("📨 Chat message:", message)

    # --- cognitive context ---
    events = db.query(models.CognitiveEvent)\
        .filter(models.CognitiveEvent.user_id == current_user.id)\
        .order_by(models.CognitiveEvent.timestamp.desc())\
        .limit(20)\
        .all()

    cognitive_profile = None
    if events:
        cognitive_profile = classify_cognitive_profile([
            {
                "time_taken": e.time_taken,
                "correct": e.correct,
                "confidence": e.confidence,
                "retry_count": e.retry_count
            } for e in events
        ])

    # --- energy context ---
    energy_log = db.query(models.EnergyLog)\
        .filter(models.EnergyLog.user_id == current_user.id)\
        .order_by(models.EnergyLog.timestamp.desc())\
        .first()

    energy_state = None
    if energy_log:
        energy_state = get_energy_analysis(
            energy_log.sleep_hours,
            energy_log.tiredness
        )

    reply = generate_gemini_response(
        message,
        {
            "cognitive_profile": cognitive_profile,
            "energy": energy_state
        }
    )
    print("🤖 Gemini reply:", reply)


    return {"reply": reply}

# --- Health Check ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NeuroAdaptive Study Engine", "version": "1.0.0"}


# --- Auth Endpoints ---
@app.post("/auth/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        subjects=user.subjects,
        exam_date=user.exam_date,
        daily_free_slots=user.daily_free_slots
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/auth/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Cognitive Events ---
@app.post("/cognitive/submit", response_model=schemas.CognitiveEventResponse)
async def submit_cognitive_event(
    event: schemas.CognitiveEventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_event = models.CognitiveEvent(
        user_id=current_user.id,
        question_id=event.question_id,
        subject=event.subject,
        time_taken=event.time_taken,
        correct=event.correct,
        confidence=event.confidence
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@app.get("/cognitive/events", response_model=List[schemas.CognitiveEventResponse])
async def get_cognitive_events(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    events = db.query(models.CognitiveEvent)\
        .filter(models.CognitiveEvent.user_id == current_user.id)\
        .order_by(models.CognitiveEvent.timestamp.desc())\
        .limit(limit)\
        .all()
    return events


@app.get("/cognitive/profile")
async def get_cognitive_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    events = db.query(models.CognitiveEvent)\
        .filter(models.CognitiveEvent.user_id == current_user.id)\
        .order_by(models.CognitiveEvent.timestamp.desc())\
        .limit(20)\
        .all()
    
    # Convert to dict for engine
    events_data = [
        {
            "time_taken": e.time_taken,
            "correct": e.correct,
            "confidence": e.confidence,
            "retry_count": e.retry_count
        }
        for e in events
    ]
    
    profile = classify_cognitive_profile(events_data)
    return profile


# --- Energy Logs ---
@app.post("/energy/submit", response_model=schemas.EnergyLogResponse)
async def submit_energy_log(
    log: schemas.EnergyLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_log = models.EnergyLog(
        user_id=current_user.id,
        sleep_hours=log.sleep_hours,
        tiredness=log.tiredness,
        timestamp=log.timestamp or datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@app.get("/energy/current")
async def get_current_energy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get most recent energy log
    latest = db.query(models.EnergyLog)\
        .filter(models.EnergyLog.user_id == current_user.id)\
        .order_by(models.EnergyLog.timestamp.desc())\
        .first()
    
    if not latest:
        return {"message": "No energy data available", "energy_score": 50, "energy_level": "medium"}
    
    analysis = get_energy_analysis(latest.sleep_hours, latest.tiredness)
    return analysis


# --- Study Plan Generation ---
@app.post("/plan/generate", response_model=schemas.StudyPlanResponse)
async def generate_study_plan(
    request: schemas.PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get cognitive events
    events = db.query(models.CognitiveEvent)\
        .filter(models.CognitiveEvent.user_id == current_user.id)\
        .order_by(models.CognitiveEvent.timestamp.desc())\
        .limit(20)\
        .all()
    
    events_data = [
        {
            "time_taken": e.time_taken,
            "correct": e.correct,
            "confidence": e.confidence,
            "retry_count": e.retry_count
        }
        for e in events
    ]
    
    # Get latest energy
    latest_energy = db.query(models.EnergyLog)\
        .filter(models.EnergyLog.user_id == current_user.id)\
        .order_by(models.EnergyLog.timestamp.desc())\
        .first()
    
    energy_score = 50  # Default
    if latest_energy:
        energy_score = calculate_energy_score(latest_energy.sleep_hours, latest_energy.tiredness)
    
    # Use override slots or user's default slots
    free_slots = request.override_slots if request.override_slots else current_user.daily_free_slots
    
    # Generate schedule
    preferences = None
    if request.preferences:
        preferences = {
            "max_session_duration": request.preferences.max_session_duration,
            "min_break": request.preferences.min_break
        }
    
    schedule = generate_schedule(
        user_subjects=current_user.subjects,
        free_slots=free_slots,
        cognitive_events=events_data,
        energy_score=energy_score,
        preferences=preferences
    )
    
    # Save plan to database
    db_plan = models.StudyPlan(
        user_id=current_user.id,
        date=request.date,
        plan_data=schedule,
        cognitive_profile=schedule.get("cognitive_profile"),
        energy_score=energy_score
    )
    db.add(db_plan)
    db.commit()
    
    # Format response
    return {
        "cognitive_profile": schemas.CognitiveProfile(**schedule["cognitive_profile"]),
        "energy_score": schedule["energy_score"],
        "energy_level": schedule["energy_level"],
        "study_plan": [schemas.StudySlot(**slot) for slot in schedule["slots"]],
        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "model_version": "v1.0.0-rules",
            "total_study_time": schedule["total_study_time"],
            "estimated_learning_gain": schedule["estimated_learning_gain"]
        }
    }


@app.get("/plan/history")
async def get_plan_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plans = db.query(models.StudyPlan)\
        .filter(models.StudyPlan.user_id == current_user.id)\
        .order_by(models.StudyPlan.created_at.desc())\
        .limit(limit)\
        .all()
    
    return [
        {
            "id": p.id,
            "date": p.date,
            "cognitive_profile": p.cognitive_profile,
            "energy_score": p.energy_score,
            "created_at": p.created_at.isoformat()
        }
        for p in plans
    ]


# --- Feedback ---
@app.post("/feedback/submit")
async def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_feedback = models.Feedback(
        user_id=current_user.id,
        plan_id=feedback.plan_id,
        slot_index=feedback.slot_index,
        completion_rate=feedback.completion_rate,
        difficulty=feedback.difficulty,
        actual_time=feedback.actual_time,
        quiz_score=feedback.quiz_score
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return {"message": "Feedback submitted successfully", "id": db_feedback.id}


# --- Analytics ---
@app.get("/analytics/performance")
async def get_performance_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get cognitive events for trend analysis
    events = db.query(models.CognitiveEvent)\
        .filter(models.CognitiveEvent.user_id == current_user.id)\
        .order_by(models.CognitiveEvent.timestamp.asc())\
        .all()
    
    if not events:
        return {"message": "No data available", "data": []}
    
    # Group by date
    daily_stats = {}
    for e in events:
        date_key = e.timestamp.strftime("%Y-%m-%d")
        if date_key not in daily_stats:
            daily_stats[date_key] = {"correct": 0, "total": 0, "total_time": 0}
        daily_stats[date_key]["total"] += 1
        daily_stats[date_key]["total_time"] += e.time_taken
        if e.correct:
            daily_stats[date_key]["correct"] += 1
    
    # Format for charts
    chart_data = [
        {
            "date": date,
            "accuracy": round(stats["correct"] / stats["total"] * 100, 1),
            "avg_time": round(stats["total_time"] / stats["total"], 1),
            "questions": stats["total"]
        }
        for date, stats in daily_stats.items()
    ]
    
    return {"data": chart_data}
