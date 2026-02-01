# Product Requirements Document
## NeuroAdaptive Study Engine

**Version:** 1.0  
**Last Updated:** January 31, 2026  
**Document Owner:** Product & Engineering Team

---

## Executive Summary

### Product Vision
Build an intelligent study optimization platform that adapts to individual cognitive patterns and energy states, delivering personalized study schedules that maximize learning efficiency while preventing burnout.

### Core Value Proposition
Unlike static calendar-based planners or generic AI tutors, NeuroAdaptive creates **behavior-driven, energy-aware study plans** using decision intelligence algorithms rather than prompt-based LLM responses.

### Target Users
- High school students (15-18 years)
- Undergraduate students preparing for exams
- Competitive exam aspirants (JEE, NEET, SAT, etc.)
- Self-learners with structured goals

---

## Problem Definition

### Primary Pain Points

**1. Static Scheduling Fallacy**
- Students use rigid time-table approaches
- Ignore fluctuating mental capacity
- No adaptation to learning pace variations

**2. Energy-Performance Mismatch**
- Study difficult topics when mentally exhausted
- Waste high-energy periods on low-value tasks
- No tracking of fatigue vs. performance correlation

**3. Cognitive Blindness**
- Students unaware of their learning behavior patterns
- Can't identify if they're rushing (fast-careless) or overthinking (slow-accurate)
- No feedback loop between behavior and schedule adjustment

**4. Burnout Through Ignorance**
- Push through fatigue without strategic rest
- Equal intensity across all time slots
- No early warning system for declining performance

---

## Solution Architecture

### System Philosophy

**Intelligence Layer Hierarchy:**
```
┌─────────────────────────────────────┐
│   Presentation (Optional LLM)       │ ← Natural language explanations only
├─────────────────────────────────────┤
│   Decision Intelligence Core        │ ← Optimization algorithms (CORE)
├─────────────────────────────────────┤
│   Inference Layer (ML-Ready)        │ ← Pattern recognition engines
├─────────────────────────────────────┤
│   Feature Engineering Pipeline      │ ← Signal processing
├─────────────────────────────────────┤
│   Event Ingestion Layer             │ ← Data normalization
└─────────────────────────────────────┘
```

**Key Principle:** LLMs assist presentation, NOT decision-making.

---

## Functional Requirements

### FR1: Behavioral Signal Capture

**FR1.1: Cognitive Event Tracking**
- Capture quiz/practice question attempts
- Required fields: `time_taken`, `correct`, `retry_count`, `confidence_level`
- Minimum sample size: 10 events for profile generation
- Real-time ingestion via REST API

**FR1.2: Energy State Logging**
- Daily sleep duration input (0-12 hours)
- Subjective tiredness scale (1-5)
- Optional: time-of-day energy check-ins
- Stored with ISO 8601 timestamps

**FR1.3: Contextual Metadata**
- Subject/topic tags
- Question difficulty estimates
- Session duration
- Device type (mobile/desktop indicator)

### FR2: Feature Engineering Pipeline

**FR2.1: Cognitive Feature Extraction**

From last N events (N=20 default):
- `avg_response_time`: Mean seconds per question
- `accuracy_rate`: Percentage correct
- `retry_pattern`: Frequency of repeated attempts
- `confidence_gap`: Difference between actual performance and self-reported confidence
- `speed_consistency`: Standard deviation of response times

**FR2.2: Energy Feature Computation**

From recent logs (7-day window):
- `fatigue_index`: Weighted formula `(tiredness × 0.6) + ((7 - sleep) × 0.4)`
- `recovery_trend`: Slope of energy scores over time
- `optimal_hour`: Time of day with highest historical performance
- `burnout_risk`: Exponential moving average of declining metrics

**FR2.3: Feature Normalization**
- Min-max scaling for all numeric features
- Handle missing values via forward-fill or user-specific medians
- Outlier capping at 3 standard deviations

### FR3: Inference Engines

**FR3.1: Cognitive Profile Classifier**

**Phase 1 (Prototype):** Rule-based stub
```
IF accuracy < 0.5 THEN "struggling"
ELIF avg_time < 12 AND accuracy < 0.75 THEN "fast_careless"
ELIF avg_time > 20 AND accuracy > 0.8 THEN "slow_accurate"
ELSE "balanced"
```

**Phase 2 (Production):** KMeans clustering (k=4) + Random Forest classifier
- Training data: 1000+ labeled student sessions
- Features: All cognitive features from FR2.1
- Output: Cluster assignment + confidence score

**FR3.2: Energy Scoring Model**

**Phase 1:** Formula-based
```python
energy_score = (sleep_hours × 12) - (tiredness × 10)
energy_score = max(0, min(100, energy_score))

IF energy_score >= 70: level = "high"
ELIF energy_score >= 40: level = "medium"
ELSE: level = "low"
```

**Phase 2:** Gradient Boosting Regressor
- Features: Sleep, tiredness, time_since_last_break, historical_performance_at_hour
- Target: Next-hour quiz accuracy (proxy for usable energy)
- Model: XGBoost with early stopping

**FR3.3: Model Versioning**
- All models served via inference API abstraction
- Swap models without code changes
- A/B testing capability for model comparison

### FR4: Study Optimization Scheduler

**FR4.1: Objective Function**

Maximize:
```
Score = Σ (learning_gain × energy_match × cognitive_fit - fatigue_penalty)
```

Where:
- `learning_gain = (1 - topic_mastery) × topic_weight`
- `energy_match = match_intensity_to_energy_level()`
- `cognitive_fit = profile_compatibility_score()`
- `fatigue_penalty = accumulated_intensity × burnout_risk`

**FR4.2: Constraint Handling**
- Respect user-defined available time slots
- Enforce maximum consecutive study hours (default: 2 hours)
- Minimum break duration between sessions (default: 15 min)
- Topic diversity: No same topic >2 consecutive slots

**FR4.3: Scheduling Algorithm**

**Greedy with Lookahead (Phase 1):**
1. Sort topics by `(1 - mastery) × weight`
2. For each time slot:
   - Calculate scores for all topics
   - Select highest score
   - Apply fatigue accumulation
3. Validate constraints
4. Return schedule

**Integer Linear Programming (Phase 2):**
- Use PuLP or OR-Tools
- Global optimization across all slots
- Hard constraints: time availability, topic coverage
- Soft constraints: energy alignment, diversity

**FR4.4: Schedule Output Schema**
```json
{
  "date": "2026-02-01",
  "total_study_time": 180,
  "estimated_learning_gain": 0.42,
  "slots": [
    {
      "time": "18:00-19:00",
      "subject": "Physics",
      "topic": "Electromagnetism",
      "method": "Problem Practice",
      "intensity": "High",
      "rationale": "Peak energy + weak topic"
    }
  ]
}
```

### FR5: Feedback Loop & Adaptation

**FR5.1: Post-Session Feedback Collection**
- Completion rate (0-100%)
- Subjective difficulty (1-5)
- Actual time spent
- Quiz score if applicable

**FR5.2: Mastery Update Rules**
```python
new_mastery = old_mastery + (
    learning_rate × completion_rate × quiz_accuracy
)
learning_rate = f(energy_level, cognitive_fit)  # Higher when conditions match
```

**FR5.3: Scheduler Retraining Triggers**
- Weekly mastery recalculation
- After 50+ new cognitive events
- Manual user request
- Significant drift detection in accuracy

---

## Non-Functional Requirements

### NFR1: Performance
- API response time: <200ms (p95)
- Schedule generation: <2 seconds
- Handle 10,000 concurrent users (Phase 2)

### NFR2: Reliability
- 99.5% uptime SLA
- Graceful degradation if ML models fail (fallback to rules)
- Data persistence: Zero event loss

### NFR3: Scalability
- Stateless API design for horizontal scaling
- Async processing for heavy computations
- Database sharding by user_id

### NFR4: Security & Privacy
- End-to-end encryption for personal data
- GDPR-compliant data export/deletion
- No PII in logs
- User consent for model training data

### NFR5: Maintainability
- 80%+ code test coverage
- Auto-generated API documentation (Swagger)
- Model experiment tracking (MLflow)
- Infrastructure as code (Terraform)

---

## Technical Architecture

### System Components

**1. API Gateway (FastAPI)**
- Request validation via Pydantic models
- Rate limiting: 100 req/min per user
- Authentication: JWT tokens
- CORS enabled for web clients

**2. Event Store (PostgreSQL)**
- Tables: `users`, `cognitive_events`, `energy_logs`, `study_plans`, `feedback`
- Indexes on `user_id`, `timestamp`
- Retention: 2 years for events, indefinite for plans

**3. Feature Store (Redis)**
- Cache computed features for 1 hour
- Key pattern: `features:{user_id}:{feature_type}`
- TTL-based invalidation

**4. Model Serving (FastAPI + Docker)**
- Isolated service for inference
- Load models from S3/GCS
- Health check endpoint
- Rolling deployments for updates

**5. Scheduler Service (Python)**
- Stateless compute worker
- Triggered by API calls
- Publishes results to message queue

**6. Frontend (React + TypeScript)**
- Dashboard: Visual cognitive profile
- Calendar view: Interactive schedule editor
- Analytics: Performance trends over time
- Mobile-responsive design

### Data Flow

```
User Input → API Gateway → Event Ingestion
                ↓
         Feature Pipeline
                ↓
         Inference Engines → Cached Profiles
                ↓
         Scheduler Service ← User Constraints
                ↓
         Plan Generation → Database
                ↓
         API Response → Frontend
```

### Deployment Architecture

**Phase 1 (MVP):**
- Single Docker container
- FastAPI + Scheduler + Stub engines
- SQLite for development
- Deploy on Render/Railway (free tier)

**Phase 2 (Production):**
- Kubernetes cluster (GKE/EKS)
- Microservices: API, Scheduler, ML Inference
- Managed PostgreSQL (AWS RDS)
- Redis Cluster (ElastiCache)
- CDN for frontend (Cloudflare)

---

## API Specification

### Endpoints

**POST /auth/register**
```json
{
  "name": "Alex Smith",
  "email": "alex@example.com",
  "subjects": ["Math", "Physics"],
  "exam_date": "2026-03-15",
  "daily_free_slots": ["18:00-21:00"]
}
```

**POST /cognitive/submit**
```json
{
  "question_id": "q_123",
  "subject": "Physics",
  "time_taken": 18.5,
  "correct": true,
  "confidence": 3
}
```

**POST /energy/submit**
```json
{
  "sleep_hours": 6.5,
  "tiredness": 4,
  "timestamp": "2026-02-01T08:00:00Z"
}
```

**POST /plan/generate**
```json
{
  "date": "2026-02-01",
  "override_slots": [],  // Optional manual adjustments
  "preferences": {
    "max_session_duration": 120,
    "min_break": 15
  }
}
```

**Response:**
```json
{
  "cognitive_profile": {
    "type": "balanced",
    "confidence": 0.89,
    "features": {...}
  },
  "energy_score": 62,
  "energy_level": "medium",
  "study_plan": [...],
  "metadata": {
    "generated_at": "2026-02-01T10:00:00Z",
    "model_version": "v1.2.3"
  }
}
```

**GET /analytics/performance**
- Returns time-series data for charts
- Cognitive profile evolution
- Energy trends
- Topic mastery progression

---

## Success Metrics

### Product Metrics
- **Activation:** 80% of users submit ≥10 cognitive events in first week
- **Engagement:** 60% of users generate plans ≥3 times/week
- **Retention:** 40% DAU/MAU ratio (Month 3)

### Performance Metrics
- **Learning Efficiency:** 25% improvement in quiz scores vs. baseline
- **Burnout Reduction:** 30% fewer reported "exhausted study sessions"
- **Schedule Adherence:** 70% of planned sessions marked complete

### Technical Metrics
- API uptime: >99.5%
- P95 latency: <200ms
- Model accuracy (cognitive classification): >85%
- Energy prediction MAE: <10 points

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Insufficient training data for ML models | High | Start with rule-based stubs, collect real data |
| Users abandon after initial signup | High | Gamification, progress streaks, email nudges |
| Scheduling algorithm too complex | Medium | Greedy fallback if ILP times out |
| Privacy concerns with behavioral tracking | High | Clear consent flow, data anonymization options |
| Incorrect energy predictions lead to bad plans | Medium | Allow manual energy override, learn from feedback |

---

## Development Roadmap

### Phase 1: MVP (Week 1-2)
- ✅ FastAPI backend with stub engines
- ✅ Basic cognitive + energy ingestion
- ✅ Rule-based scheduler
- ✅ Simple dashboard UI
- ✅ SQLite database
- ✅ Deploy on free hosting

### Phase 2: Intelligence Upgrade (Week 3-4)
- 🔄 Train KMeans cognitive classifier
- 🔄 XGBoost energy predictor
- 🔄 Implement ILP scheduler
- 🔄 Add feedback loop
- 🔄 Performance analytics dashboard

### Phase 3: Production Ready (Week 5-6)
- 🔄 PostgreSQL + Redis migration
- 🔄 Kubernetes deployment
- 🔄 A/B testing framework
- 🔄 Mobile app (React Native)
- 🔄 Advanced visualizations (D3.js)

### Phase 4: Scale & Optimize (Week 7-8)
- 🔄 Real-time collaborative features
- 🔄 Multi-user study groups
- 🔄 Integration with LMS platforms
- 🔄 Advanced ML (LSTM for temporal patterns)

---

## Appendix

### A. Cognitive Profile Definitions

**Struggling:**
- Accuracy <50%
- High retry rate
- Low confidence
- **Intervention:** Concept review, simpler problems, spaced repetition

**Fast Careless:**
- Low response time (<12s)
- Accuracy <75%
- Low retry rate
- **Intervention:** Slow practice, reflection prompts, penalty for speed

**Slow Accurate:**
- High response time (>20s)
- Accuracy >80%
- Medium confidence
- **Intervention:** Timed drills, pattern recognition training

**Balanced:**
- Moderate time + accuracy
- **Intervention:** Standard practice, gradual difficulty increase

### B. Energy-Intensity Matching Rules

| Energy Level | Recommended Activities | Avoid |
|--------------|------------------------|-------|
| High (70-100) | New concepts, hard problems, active recall | Passive reading, easy revision |
| Medium (40-69) | Practice problems, note-making, discussion | Extremely difficult topics |
| Low (0-39) | Revision, flashcards, light reading | Learning new material |

### C. Technology Stack

**Backend:**
- Python 3.11+
- FastAPI 0.104+
- Pydantic 2.0+
- SQLAlchemy 2.0
- Redis 7.0
- PostgreSQL 15

**ML/Data:**
- scikit-learn 1.3+
- XGBoost 2.0+
- pandas 2.0+
- numpy 1.24+

**Frontend:**
- React 18
- TypeScript 5
- Tailwind CSS 3
- Recharts (visualizations)
- Zustand (state management)

**DevOps:**
- Docker
- Kubernetes
- GitHub Actions (CI/CD)
- Prometheus + Grafana (monitoring)

---

**Document Approved By:**
- Product Lead: _____________
- Engineering Lead: _____________
- Data Science Lead: _____________
- Date: January 31, 2026