from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_groq import ChatGroq


def Agent(transcript):
    def get_weather(city: str) -> str:
        """Get weather for a given city."""
        return f"It's always sunny in {city}!"

    load_dotenv()
    groq_model = ChatGroq(model="qwen/qwen3.8-27b", temperature=0.2)
    agent = create_agent(
        model=groq_model,
        tools=[get_weather],
        system_prompt="""You are an AI medical scribe and clinical assistant. 
Analyze the doctor-patient conversation transcript and return a JSON object with this exact structure:
{
  "transcript": "The provided transcript string",
  "subjective": "Subjective notes here",
  "assessment": "Assessment notes here",
  "plan": "Plan notes here",
  "drug_recommendation": {
    "drug_name": "Recommended medication name or empty string if none",
    "dose_and_frequency": "Specific dosage and schedule or empty string",
    "reasoning": "Clinical justification based on symptoms and PrimeKG guidelines"
  }
}
Return only valid JSON. What folows will be the transcript""",
    )

    result = agent.invoke({"messages": [{"role": "user", "content": transcript}]})
    print("llm putput")
    return result["messages"][-1].content_blocks
