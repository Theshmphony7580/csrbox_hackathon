"""
Energy Scoring Model - Phase 1 (Formula-based)
Calculates energy levels based on sleep and tiredness inputs.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta


def calculate_energy_score(sleep_hours: float, tiredness: int) -> int:
    """
    Calculate energy score using formula from PRD.
    
    Formula: energy_score = (sleep_hours × 12) - (tiredness × 10)
    Clamped to [0, 100]
    
    Args:
        sleep_hours: Hours of sleep (0-12)
        tiredness: Subjective tiredness scale (1-5)
    
    Returns:
        Energy score (0-100)
    """
    score = (sleep_hours * 12) - (tiredness * 10)
    return max(0, min(100, int(score)))


def get_energy_level(energy_score: int) -> str:
    """
    Classify energy score into levels.
    
    - High (70-100): Peak cognitive capacity
    - Medium (40-69): Normal functioning
    - Low (0-39): Reduced capacity
    """
    if energy_score >= 70:
        return "high"
    elif energy_score >= 40:
        return "medium"
    else:
        return "low"


def calculate_fatigue_index(tiredness: int, sleep_hours: float) -> float:
    """
    Calculate fatigue index from PRD FR2.2.
    
    Formula: (tiredness × 0.6) + ((7 - sleep) × 0.4)
    """
    fatigue = (tiredness * 0.6) + ((7 - sleep_hours) * 0.4)
    return round(max(0, fatigue), 2)


def calculate_burnout_risk(energy_logs: List[Dict[str, Any]], window_days: int = 7) -> float:
    """
    Calculate burnout risk using exponential moving average of declining metrics.
    
    Args:
        energy_logs: List of recent energy logs with sleep_hours and tiredness
        window_days: Number of days to consider
    
    Returns:
        Burnout risk score (0-1)
    """
    if not energy_logs:
        return 0.5  # Default moderate risk when no data
    
    # Sort by timestamp (most recent first)
    sorted_logs = sorted(
        energy_logs, 
        key=lambda x: x.get("timestamp", datetime.min), 
        reverse=True
    )
    
    # Take logs from window
    recent_logs = sorted_logs[:window_days]
    
    # Calculate trend in fatigue
    fatigue_scores = [
        calculate_fatigue_index(log["tiredness"], log["sleep_hours"])
        for log in recent_logs
    ]
    
    if len(fatigue_scores) < 2:
        return 0.3  # Low risk with insufficient data
    
    # Calculate slope (positive = increasing fatigue = higher risk)
    # Simple linear approximation
    n = len(fatigue_scores)
    avg_fatigue = sum(fatigue_scores) / n
    
    # Higher average fatigue = higher burnout risk
    # Scale to 0-1
    risk = min(1.0, avg_fatigue / 5.0)
    
    return round(risk, 2)


def get_recommended_activities(energy_level: str) -> Dict[str, List[str]]:
    """
    Get recommended and avoided activities based on energy level.
    From PRD Appendix B.
    """
    recommendations = {
        "high": {
            "recommended": ["New concepts", "Hard problems", "Active recall"],
            "avoid": ["Passive reading", "Easy revision"]
        },
        "medium": {
            "recommended": ["Practice problems", "Note-making", "Discussion"],
            "avoid": ["Extremely difficult topics"]
        },
        "low": {
            "recommended": ["Revision", "Flashcards", "Light reading"],
            "avoid": ["Learning new material"]
        }
    }
    return recommendations.get(energy_level, recommendations["medium"])


def get_energy_analysis(sleep_hours: float, tiredness: int) -> Dict[str, Any]:
    """
    Complete energy analysis combining all metrics.
    
    Returns full energy assessment including:
    - score
    - level
    - fatigue_index
    - recommendations
    """
    score = calculate_energy_score(sleep_hours, tiredness)
    level = get_energy_level(score)
    fatigue = calculate_fatigue_index(tiredness, sleep_hours)
    activities = get_recommended_activities(level)
    
    return {
        "energy_score": score,
        "energy_level": level,
        "fatigue_index": fatigue,
        "recommended_activities": activities["recommended"],
        "avoid_activities": activities["avoid"]
    }
