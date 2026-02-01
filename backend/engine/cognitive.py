"""
Cognitive Profile Classifier - Phase 1 (Rule-based Stub)
Classifies students into cognitive profiles based on quiz performance.
"""

from typing import List, Dict, Any
from statistics import mean, stdev


def extract_cognitive_features(events: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Extract cognitive features from the last N events.
    
    Features:
    - avg_response_time: Mean seconds per question
    - accuracy_rate: Percentage correct
    - retry_pattern: Frequency of repeated attempts
    - confidence_gap: Difference between actual vs self-reported confidence
    - speed_consistency: Standard deviation of response times
    """
    if not events:
        return {
            "avg_response_time": 0.0,
            "accuracy_rate": 0.0,
            "retry_pattern": 0.0,
            "confidence_gap": 0.0,
            "speed_consistency": 0.0
        }
    
    times = [e["time_taken"] for e in events]
    correct_count = sum(1 for e in events if e["correct"])
    total = len(events)
    
    avg_response_time = mean(times) if times else 0.0
    accuracy_rate = correct_count / total if total > 0 else 0.0
    
    # Retry pattern (average retry count)
    retry_pattern = mean([e.get("retry_count", 0) for e in events])
    
    # Confidence gap: difference between accuracy and avg confidence (normalized 0-1)
    avg_confidence = mean([e["confidence"] for e in events]) / 5.0
    confidence_gap = abs(accuracy_rate - avg_confidence)
    
    # Speed consistency (lower = more consistent)
    speed_consistency = stdev(times) if len(times) > 1 else 0.0
    
    return {
        "avg_response_time": round(avg_response_time, 2),
        "accuracy_rate": round(accuracy_rate, 2),
        "retry_pattern": round(retry_pattern, 2),
        "confidence_gap": round(confidence_gap, 2),
        "speed_consistency": round(speed_consistency, 2)
    }


def classify_cognitive_profile(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Classify cognitive profile using rule-based logic (Phase 1).
    
    Profiles:
    - struggling: accuracy < 0.5
    - fast_careless: avg_time < 12 AND accuracy < 0.75
    - slow_accurate: avg_time > 20 AND accuracy > 0.8
    - balanced: default
    
    Returns:
        {
            "type": "balanced",
            "confidence": 0.85,
            "features": {...}
        }
    """
    features = extract_cognitive_features(events)
    
    accuracy = features["accuracy_rate"]
    avg_time = features["avg_response_time"]
    
    # Rule-based classification
    if accuracy < 0.5:
        profile_type = "struggling"
        confidence = 0.9  # High confidence when accuracy is clearly low
    elif avg_time < 12 and accuracy < 0.75:
        profile_type = "fast_careless"
        confidence = 0.85
    elif avg_time > 20 and accuracy > 0.8:
        profile_type = "slow_accurate"
        confidence = 0.85
    else:
        profile_type = "balanced"
        confidence = 0.8
    
    # Adjust confidence based on sample size
    sample_size = len(events)
    if sample_size < 10:
        confidence *= 0.7  # Lower confidence with fewer samples
    elif sample_size < 20:
        confidence *= 0.85
    
    return {
        "type": profile_type,
        "confidence": round(confidence, 2),
        "features": features
    }


def get_intervention_recommendation(profile_type: str) -> str:
    """Get intervention recommendation based on cognitive profile."""
    interventions = {
        "struggling": "Concept review, simpler problems, spaced repetition",
        "fast_careless": "Slow practice, reflection prompts, penalty for speed",
        "slow_accurate": "Timed drills, pattern recognition training",
        "balanced": "Standard practice, gradual difficulty increase"
    }
    return interventions.get(profile_type, "Standard practice")
