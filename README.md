# Clerk: The AI Agent for Doctors

An intelligent AI agent designed to eliminate administrative burden for medical professionals by transcribing conversations, drafting notes, and managing patient follow-ups on oral command.

## The Challenge

Doctors dedicate excessive time to administrative tasks like **manual prescription writing** (a pain point for over $62\%$ of those surveyed), updating patient records, and managing follow-up communications. Clerk's goal is to offload these high-volume, low-value activities so physicians can dedicate $100\%$ of their focus to patient care.

## The Solution: Clerk

**Clerk** acts as a real-time, digital scribe powered by conversational AI. It automates documentation and patient management immediately, using only voice commands and natural conversation during a consultation.

## Core Features

* **Real-Time Scribing:** Automatically transcribes doctor-patient conversations and medical dictation.

* **Clinical Decision Support:** Integrates with the **PrimeKG API** (a Harvard project knowledge graph) to provide relevant drug interaction and clinical context to aid the doctor's prescription decisions.

* **Oral Command & Drafting:** Generates notes, examination findings, and initial prescription drafts from voice input.

* **Instant Record Access:** Rapidly retrieves complete patient history and records via voice command.

* **Automated Follow-Ups:** Schedules and sends appointment reminders and post-care instructions to patients.

## Technology Stack

* **Frontend:** **Next.js** 

* **Backend API:** **FastAPI** 

* **AI/Orchestration:** **LangChain** and **Gemini API** to manage complex conversational chains, integrate with external knowledge bases like **PrimeKG**, and generate structured output (for notes and prescriptions).

* **Database:** **PostgreSQL** 

* **Speech-to-Text:** (High-accuracy $\text{STT}$ Service) to ensure reliable conversion of medical terminology and local languages.

## ONGOING
