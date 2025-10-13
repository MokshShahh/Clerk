"use client"
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Particles from '@/components/custom/Particles';

type AppPhase = 'welcome' | 'transition' | 'active';

export default function Assistant() {
  const [phase, setPhase] = useState<AppPhase>('welcome');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [playableAudioUrl, setPlayableAudioUrl] = useState<string | null>(null); 
  const [transcript, setTranscript] = useState<string>("")


useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [audioBlob]);


  const { particleCount, speed } = useMemo(() => {
    switch (phase) {
      case 'welcome':
        return { particleCount: 300, speed: 0.1 }; 
      case 'transition':
        return { particleCount: 600, speed: 3.5 }; 
      case 'active':
        return { particleCount: 300, speed: 0.05 }; 
      default:
        return { particleCount: 300, speed: 0.1 };
    }
  }, [phase]);
  

  const handleStartSession = useCallback(() => {
    setPhase('transition');
    
    setTimeout(() => {
      setPhase('active');
    }, 1500); 
  }, []);

const handleStartRecording = useCallback(async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
        console.error("MediaRecorder or MediaDevices API not supported.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        audioChunksRef.current = [];
        setAudioBlob(null);
        
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);      
        if(audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
        }
        
        audioUrlRef.current = url;
        setPlayableAudioUrl(url);

        stream.getTracks().forEach(track => track.stop()); 
        audioStreamRef.current = null;
        uploadAudio(finalBlob); 
        console.log('Final Audio Blob created. URL ready for playback.');
    };
        
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        console.log('Recording started after permission granted.');

    } catch (error) {
        console.error('Microphone access denied or error occurred:', error);
        setIsRecording(false);
    }
    
  }, []);


async function uploadAudio(audioFile: Blob){
    const formData = new FormData();
    formData.append('audio_file', audioFile, 'consultation_audio.webm');

    try {
        const response = await fetch('http://0.0.0.0:8000/api/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Transcription Result:', result);
        setTranscript(result.data.transcript)
        
        
    } catch (error) {
        console.error('Error uploading audio for transcription:', error);
    } finally { 
    }
};

  

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }    
    setIsRecording(false);
    console.log('Recording stopped. Waiting for final audio blob...');
  }, []);



  
  let buttonContent;
  let buttonHandler;

  function handleDownload(){
    if (playableAudioUrl) {
      const a = document.createElement('a');
      a.href = playableAudioUrl;
      a.download = `clerk-consult.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };


  if (phase === 'welcome') {
    buttonContent = 'Start Session';
    buttonHandler = handleStartSession;
  } else if (phase === 'active') {
    if (!isRecording) {
      buttonContent = 'Start Recording';
      buttonHandler = handleStartRecording;
    } else {
      buttonContent = 'Stop Recording';
      buttonHandler = handleStopRecording;
    }
  } else {
    buttonContent = 'Jumping to Consult...';
    buttonHandler = () => {}; 
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
        <div className='absolute inset-0 z-[-10] w-full h-full transition-all duration-3000 ease-in-out'>
            <Particles
                className="pointer-events-auto" 
                particleColors={['#ffffff', '#ffffff']}
                particleCount={particleCount} 
                particleSpread={5}
                speed={speed} 
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={true}
                disableRotation={false}
            />
        </div>
        
        <div className='h-screen flex flex-col justify-center items-center text-white'>
          <Button 
            onClick={buttonHandler} 
            disabled={phase === 'transition'}
            className="text-lg px-8 py-6 rounded-xl transition duration-300 ease-in-out hover:scale-[1.05]"
          >
            {buttonContent}
          </Button>
          
          {phase === 'transition' && (
            <p className="mt-4 text-xl text-gray-300 animate-pulse">Engaging speech to text model</p>
          )}
              {playableAudioUrl && phase === 'active' && (
        <div className="mt-8 p-4 bg-gray-800/80 rounded-xl shadow-lg">
            <h3 className="text-sm font-semibold mb-2 text-gray-400">Review Recording</h3>
            <audio src={playableAudioUrl} controls className="w-80" />
            <Button
            onClick={handleDownload}
        >
            Download Recording (.wav)
        </Button>
        <div>
            {transcript}
        </div>
        </div>
    )}
        </div>
    </div>
  );
}
