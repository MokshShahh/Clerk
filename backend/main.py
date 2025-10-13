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
    allow_methods=["*"],
    allow_headers=["*"],
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
    
    return {
        "transcript": transcript,
        "draft_notes": draft_notes
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
