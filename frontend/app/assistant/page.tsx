"use client"
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Mic, Square, FileText, Pill, Volume2 } from 'lucide-react';
import Particles from '@/components/custom/Particles';

type AppPhase = 'welcome' | 'transition' | 'active';
interface DrugRecommendation {
    drug_name: string;
    dose_and_frequency: string;
    reasoning: string;
}

interface ProcessedOutput {
    transcript: string;
    draft_note: string;
    drug_recommendation: DrugRecommendation;
}

export default function Assistant() {
  const [phase, setPhase] = useState<AppPhase>('welcome');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [playableAudioUrl, setPlayableAudioUrl] = useState<string | null>(null); 
const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null);

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
        console.log('Result:', result);
        setProcessedOutput(result.data)
        
        
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
    <div className="">
        <div className='absolute inset-0 z-[-10] w-full h-screen transition-all duration-3000 ease-in-out'>
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
        
        <div className='w-screen h-screen flex flex-col justify-center items-center text-white'>
            
          {phase === 'transition' && (
            <p className="mt-4 text-xl text-gray-300 animate-pulse">Engaging speech to text model</p>
          )}
                {playableAudioUrl && phase === 'active' && (
            <div className="pt-16 w-full max-w-7xl roundex-xl">
              <Card className="bg-[#1c1c1c] opacity-80 border-gray-800 shadow-2xl">
                <CardHeader className="border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold text-white">Consultation Results</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">Review your medical consultation analysis</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <Volume2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <Card className="bg-[#252525] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <audio 
                          src={playableAudioUrl} 
                          controls 
                          className="flex-grow w-full sm:w-auto rounded-lg"
                        />
                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          className="border-gray-700 hover:bg-gray-800 hover:text-white w-full sm:w-auto"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Recording
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 bg-[#252525] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Raw Transcript
                        </CardTitle>
                      </CardHeader>
                      <Separator className="bg-gray-800" />
                      <CardContent className="pt-4">
                        <ScrollArea className="h-72 pr-4">
                          {processedOutput?.transcript ? (
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {processedOutput.transcript}
                            </p>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-3"></div>
                              <p className="text-sm text-gray-500 italic">Processing transcription...</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 bg-[#252525] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Draft Clinical Note
                        </CardTitle>
                        <CardDescription className="text-gray-500">LLM Generated Documentation</CardDescription>
                      </CardHeader>
                      <Separator className="bg-gray-800" />
                      <CardContent className="">
                        <ScrollArea className="h-72 pr-4">
                          {processedOutput?.draft_note ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <div 
                                className="text-sm text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                  __html: processedOutput.draft_note
                                }} 
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-3"></div>
                              <p className="text-sm text-gray-500 italic">Generating clinical note...</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {processedOutput?.drug_recommendation && (
                    <Card className="bg-gradient-to-br from-[#252525] to-[#2a2a2a] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Pill className="w-6 h-6 text-green-400" />
                          Drug Recommendation
                        </CardTitle>
                      </CardHeader>
                      <Separator className="bg-gray-800" />
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Medication</p>
                            <p className="text-2xl font-bold text-white">
                              {processedOutput.drug_recommendation.drug_name}
                            </p>
                            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                              {processedOutput.drug_recommendation.dose_and_frequency}
                            </Badge>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Clinical Reasoning</p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {processedOutput.drug_recommendation.reasoning}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )} 
          <Button 
            onClick={buttonHandler} 
            disabled={phase === 'transition'}
            className="text-lg mt-6 px-8 py-6 rounded-xl transition duration-300 ease-in-out hover:scale-[1.05]"
          >
            {buttonContent}
          </Button> 
        </div>
    </div>
  );
}
