"""
Study Optimization Scheduler - Phase 1 (Greedy with Lookahead)
Generates personalized study schedules based on cognitive profile and energy state.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .cognitive import classify_cognitive_profile
from .energy import get_energy_level, calculate_energy_score


# Default topic database (will be user-configurable later)
DEFAULT_TOPICS = {
    "Physics": [
        {"name": "Mechanics", "weight": 1.0, "difficulty": "medium"},
        {"name": "Electromagnetism", "weight": 1.2, "difficulty": "hard"},
        {"name": "Thermodynamics", "weight": 0.9, "difficulty": "medium"},
        {"name": "Optics", "weight": 0.8, "difficulty": "easy"},
    ],
    "Math": [
        {"name": "Calculus", "weight": 1.2, "difficulty": "hard"},
        {"name": "Algebra", "weight": 1.0, "difficulty": "medium"},
        {"name": "Trigonometry", "weight": 0.8, "difficulty": "medium"},
        {"name": "Statistics", "weight": 0.7, "difficulty": "easy"},
    ],
    "Chemistry": [
        {"name": "Organic Chemistry", "weight": 1.1, "difficulty": "hard"},
        {"name": "Inorganic Chemistry", "weight": 0.9, "difficulty": "medium"},
        {"name": "Physical Chemistry", "weight": 1.0, "difficulty": "hard"},
    ]
}

# Study methods matched to cognitive profiles
METHODS_BY_PROFILE = {
    "struggling": ["Concept Review", "Video Lecture", "Guided Practice"],
    "fast_careless": ["Slow Practice", "Reflection Journal", "Error Analysis"],
    "slow_accurate": ["Timed Drills", "Speed Practice", "Pattern Recognition"],
    "balanced": ["Problem Practice", "Mixed Problems", "Active Recall"]
}

# Intensity levels matched to difficulty
INTENSITY_BY_DIFFICULTY = {
    "hard": "High",
    "medium": "Medium",
    "easy": "Low"
}


def parse_time_slot(slot: str) -> tuple:
    """Parse time slot string like '18:00-21:00' into start and end hours."""
    parts = slot.split("-")
    start = int(parts[0].split(":")[0])
    end = int(parts[1].split(":")[0])
    return start, end


def calculate_topic_score(
    topic: Dict[str, Any],
    mastery: float,
    energy_level: str,
    profile_type: str
) -> float:
    """
    Calculate topic score for scheduling.
    
    Score = learning_gain × energy_match × cognitive_fit
    
    Where:
    - learning_gain = (1 - mastery) × weight
    - energy_match = match of intensity to current energy
    - cognitive_fit = profile compatibility
    """
    difficulty = topic.get("difficulty", "medium")
    weight = topic.get("weight", 1.0)
    
    # Learning gain: prioritize weak topics
    learning_gain = (1 - mastery) * weight
    
    # Energy match: align difficulty with energy level
    energy_match_map = {
        "high": {"hard": 1.0, "medium": 0.7, "easy": 0.3},
        "medium": {"hard": 0.5, "medium": 1.0, "easy": 0.7},
        "low": {"hard": 0.2, "medium": 0.5, "easy": 1.0}
    }
    energy_match = energy_match_map.get(energy_level, {}).get(difficulty, 0.5)
    
    # Cognitive fit: some profiles handle certain difficulties better
    cognitive_fit_map = {
        "struggling": {"hard": 0.3, "medium": 0.7, "easy": 1.0},
        "fast_careless": {"hard": 0.7, "medium": 1.0, "easy": 0.5},
        "slow_accurate": {"hard": 1.0, "medium": 0.8, "easy": 0.5},
        "balanced": {"hard": 0.8, "medium": 1.0, "easy": 0.8}
    }
    cognitive_fit = cognitive_fit_map.get(profile_type, {}).get(difficulty, 0.7)
    
    return learning_gain * energy_match * cognitive_fit


def generate_schedule(
    user_subjects: List[str],
    free_slots: List[str],
    cognitive_events: List[Dict[str, Any]],
    energy_score: int,
    topic_mastery: Optional[Dict[str, float]] = None,
    preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate optimized study schedule using Greedy with Lookahead (Phase 1).
    
    Algorithm:
    1. Sort topics by (1 - mastery) × weight
    2. For each time slot:
       - Calculate scores for all topics
       - Select highest score
       - Apply fatigue accumulation
    3. Validate constraints
    4. Return schedule
    
    Args:
        user_subjects: List of subjects user is studying
        free_slots: Available time slots (e.g., ["18:00-21:00"])
        cognitive_events: Recent cognitive events for profile classification
        energy_score: Current energy score (0-100)
        topic_mastery: Dict of topic -> mastery (0-1), defaults to 0.3
        preferences: User preferences for session duration, breaks
    
    Returns:
        Complete study plan with slots
    """
    # Default preferences
    prefs = preferences or {}
    max_session = prefs.get("max_session_duration", 60)  # minutes
    min_break = prefs.get("min_break", 15)  # minutes
    
    # Get cognitive profile
    profile = classify_cognitive_profile(cognitive_events)
    profile_type = profile["type"]
    
    # Get energy level
    energy_level = get_energy_level(energy_score)
    
    # Default topic mastery
    mastery = topic_mastery or {}
    
    # Collect all available topics from user's subjects
    available_topics = []
    for subject in user_subjects:
        if subject in DEFAULT_TOPICS:
            for topic in DEFAULT_TOPICS[subject]:
                topic_key = f"{subject}:{topic['name']}"
                topic_mastery_val = mastery.get(topic_key, 0.3)
                available_topics.append({
                    **topic,
                    "subject": subject,
                    "mastery": topic_mastery_val,
                    "score": calculate_topic_score(
                        topic, topic_mastery_val, energy_level, profile_type
                    )
                })
    
    # Sort by score (descending)
    available_topics.sort(key=lambda x: x["score"], reverse=True)
    
    # Generate slots
    study_slots = []
    total_study_time = 0
    fatigue_accumulator = 0
    last_topic = None
    consecutive_same = 0
    
    for slot in free_slots:
        start_hour, end_hour = parse_time_slot(slot)
        current_hour = start_hour
        
        while current_hour < end_hour:
            # Check fatigue - insert break if needed
            if fatigue_accumulator >= 120:  # 2 hours of study
                # Insert break
                break_duration = min_break
                current_hour += break_duration // 60
                fatigue_accumulator = 0
                continue
            
            # Find best topic for this slot
            best_topic = None
            for topic in available_topics:
                # Constraint: No same topic > 2 consecutive slots
                if topic["name"] == last_topic:
                    consecutive_same += 1
                    if consecutive_same > 2:
                        continue
                else:
                    consecutive_same = 0
                
                best_topic = topic
                break
            
            if not best_topic:
                break
            
            # Create slot
            slot_duration = min(max_session, (end_hour - current_hour) * 60)
            
            # Get appropriate method
            methods = METHODS_BY_PROFILE.get(profile_type, ["Problem Practice"])
            method = methods[len(study_slots) % len(methods)]
            
            # Get intensity
            intensity = INTENSITY_BY_DIFFICULTY.get(
                best_topic["difficulty"], "Medium"
            )
            
            # Generate rationale
            rationale = generate_rationale(
                energy_level, best_topic, profile_type
            )
            
            study_slots.append({
                "time": f"{current_hour:02d}:00-{current_hour + slot_duration // 60:02d}:00",
                "subject": best_topic["subject"],
                "topic": best_topic["name"],
                "method": method,
                "intensity": intensity,
                "rationale": rationale
            })
            
            total_study_time += slot_duration
            fatigue_accumulator += slot_duration
            last_topic = best_topic["name"]
            current_hour += slot_duration // 60
    
    # Calculate estimated learning gain
    estimated_gain = sum(
        slot.get("score", 0.1) * 0.1 
        for slot in study_slots[:5]
    ) if study_slots else 0
    
    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "total_study_time": total_study_time,
        "estimated_learning_gain": round(estimated_gain, 2),
        "slots": study_slots,
        "cognitive_profile": profile,
        "energy_score": energy_score,
        "energy_level": energy_level
    }


def generate_rationale(
    energy_level: str, 
    topic: Dict[str, Any], 
    profile_type: str
) -> str:
    """Generate human-readable rationale for slot assignment."""
    energy_phrases = {
        "high": "Peak energy",
        "medium": "Moderate energy",
        "low": "Low energy"
    }
    
    mastery = topic.get("mastery", 0.3)
    if mastery < 0.4:
        strength = "weak topic"
    elif mastery < 0.7:
        strength = "developing topic"
    else:
        strength = "strong topic"
    
    profile_context = {
        "struggling": "needs foundational review",
        "fast_careless": "focus on accuracy",
        "slow_accurate": "speed practice beneficial",
        "balanced": "optimal learning conditions"
    }
    
    return f"{energy_phrases[energy_level]} + {strength} - {profile_context.get(profile_type, '')}"
