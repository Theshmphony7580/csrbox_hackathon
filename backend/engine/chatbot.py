def generate_chat_response(message: str, context: dict):
    msg = message.lower()

    cognitive = context.get("cognitive_profile")
    energy = context.get("energy")

    # Simple intent detection
    if "energy" in msg:
        if not energy:
            return "You haven't logged your energy yet. Try logging sleep and tiredness."
        return (
            f"Your current energy level is {energy['energy_level']} "
            f"with a score of {energy['energy_score']}. "
            "I recommend revision or light study."
        )

    if "cognitive" in msg or "learning style" in msg:
        if not cognitive:
            return "You don't have a cognitive profile yet. Take a cognitive assessment."
        return (
            f"Your learning style is **{cognitive['type']}** "
            f"with confidence {int(cognitive['confidence'] * 100)}%."
        )

    if "study" in msg or "plan" in msg:
        return "I can help you generate a study plan based on your energy and cognition."

    if "hello" in msg or "hi" in msg:
        return "Hey 👋 I'm your study assistant. Ask me about energy, cognition, or plans."

    return "I'm still learning. Try asking about energy, cognitive profile, or study plans."
