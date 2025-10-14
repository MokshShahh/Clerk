import os
import uvicorn
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

import assemblyai as aai
aai.settings.api_key = os.environ.get("ASSEMBLY_AI_API_KEY")

app = FastAPI()

origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=[""],
)

async def process_audio_file(audio_data: bytes):    
    try:
        audio_file = BytesIO(audio_data)
        
        config = aai.TranscriptionConfig(language_code="en_us")
        transcriber = aai.Transcriber()
        
        transcript_obj = transcriber.transcribe(audio_file, config=config)
        
        if transcript_obj.status == aai.TranscriptStatus.error:
            raise Exception(f"AssemblyAI Transcription Error: {transcript_obj.error}")

        transcript = transcript_obj.text if transcript_obj.text else "Transcription failed to produce text."
        
    except Exception as e:
        print(f"AssemblyAI Error: {e}")
        transcript = "Error during transcription. Please check API key and network."

    draft_notes = f"Chief Complaint: {transcript[:min(len(transcript), 40)]}...\nDiagnosis: Pending.\nPrescription Draft: Amlodipine (PrimeKG check required)."
    print(draft_notes)
    return {
        "transcript": transcript,
        "draft_note": """
                    <article class="bg-slate-800 text-gray-100 rounded-xl shadow-2xl max-w-3xl mx-auto">

<section aria-labelledby="subjective-heading" class="pb-6 border-b border-gray-700">
<h2 id="subjective-heading" class="text-2xl font-bold text-teal-400 mb-4 tracking-wide">Subjective (S)</h2>
<div class="text-base text-gray-200 pl-5 border-l-4 border-teal-500">
<p>Patient presents with chief complaints of new-onset headaches, nausea, cold-like symptoms, generalized tiredness, and significant myalgia (muscle aches) over the past 48 hours. Denies fever or shortness of breath.</p>
</div>
</section>


<section aria-labelledby="assessment-heading" class="pb-6 border-b border-gray-700">
<h2 id="assessment-heading" class="text-2xl font-bold text-teal-400 mb-4 tracking-wide">Assessment (A)</h2>
<div class="text-base text-gray-200 pl-5 border-l-4 border-teal-500">
<p>Based on reported symptoms (Headache, Nausea, Fatigue), the clinical presentation is highly consistent with an acute Viral Syndrome or Common Cold. Symptoms are self-limiting but warrant supportive care.</p>
</div>
</section>


<section aria-labelledby="plan-heading">
<h2 id="plan-heading" class="text-2xl font-bold text-teal-400 mb-4 tracking-wide">Plan (P)</h2>
<div class="text-base text-gray-200 pl-5 border-l-4 border-teal-500">
<p>Supportive care advised. Patient should monitor temperature and return if symptoms worsen, respiratory distress develops, or fever persists beyond 72 hours. Education provided on hydration and rest.</p>
</div>
</section>

</article>
                        """,
        "drug_recommendation": {
            "drug_name": "Acetaminophen (Paracetamol)",
            "dose_and_frequency": "500 mg, every 4-6 hours as needed.",
            "reasoning": "The patient's primary complaints are mild to moderate myalgia (muscle pain) and headache, which are non-specific pain symptoms of the likely Viral Syndrome. Acetaminophen is recommended as a first-line, over-the-counter analgesic and antipyretic to manage these symptoms and reduce any potential low-grade fever, while having a good safety profile for short-term use."
            }
    }


@app.post("/api/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    if audio_file.content_type not in ["audio/webm", "audio/ogg", "audio/wav"]:
        raise HTTPException(status_code=400, detail="Invalid audio file format.")
    
    try:
        audio_data = await audio_file.read()       
        result = await process_audio_file(audio_data)     
        return {
            "status": "success",
            "message": "Transcription and analysis complete.",
            "data": result
        }
    except Exception as e:
        print(f"Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during transcription.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
