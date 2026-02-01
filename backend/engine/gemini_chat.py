import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-flash")

def generate_gemini_response(message: str, context: dict):
    try:
        response = model.generate_content(
            f"""
You are a helpful study assistant.

Context:
Cognitive profile: {context.get("cognitive_profile")}
Energy: {context.get("energy")}

User: {message}
"""
        )

        if not response or not response.candidates:
            return "I couldn't generate a response. Please try again."

        return response.text

    except Exception as e:
        print("❌ Gemini error:", e)
        return "AI service is temporarily unavailable."
