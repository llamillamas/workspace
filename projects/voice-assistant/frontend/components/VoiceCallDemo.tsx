'use client';

/**
 * VoiceCallDemo - Main React component for voice call interface.
 * Handles microphone access, WebSocket communication, audio playback.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCallStore, Message } from '@/lib/webrtc/state';
import { generateCallId, requestMicrophone, playAudio, formatDuration } from '@/lib/webrtc/audio';
import { ScoreGauge } from './ScoreGauge';
import { TranscriptDisplay } from './TranscriptDisplay';
import { Mic, MicOff, Phone, PhoneOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Derive WebSocket URL from backend URL (http→ws, https→wss)
function getWsUrl(): string {
  const envWs = process.env.NEXT_PUBLIC_WS_URL;
  if (envWs) return envWs;
  const base = BACKEND_URL;
  if (base.startsWith('https://')) return base.replace('https://', 'wss://');
  if (base.startsWith('http://')) return base.replace('http://', 'ws://');
  return 'ws://localhost:8000';
}
const WS_URL = getWsUrl();

export function VoiceCallDemo() {
  const store = useCallStore();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer for call duration
  useEffect(() => {
    if (!store.callActive) return;
    
    durationIntervalRef.current = setInterval(() => {
      store.incrementDuration();
    }, 1000);
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [store.callActive]);
  
  const handleStartCall = async () => {
    setError(null);
    setIsInitializing(true);
    
    try {
      // Generate call ID
      const callId = generateCallId();
      store.startCall(callId);
      
      // Request microphone access
      const mediaStream = await requestMicrophone();
      mediaStreamRef.current = mediaStream;
      
      // Create audio context for real-time processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Setup media recorder
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Setup WebSocket connection
      const wsUrl = `${WS_URL}/api/voice/ws/call/${callId}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const websocket = new WebSocket(wsUrl);
      websocket.binaryType = 'arraybuffer';
      websocketRef.current = websocket;
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsInitializing(false);
        
        // Start recording and sending audio chunks every 500ms
        mediaRecorder.start();
        startAudioProcessing(mediaStream, callId);
        
        toast.success('Call started. Please speak clearly.');
      };
      
      websocket.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          // JSON message
          const message = JSON.parse(event.data);
          await handleWebSocketMessage(message);
        } else if (event.data instanceof ArrayBuffer) {
          // Binary audio response
          setIsProcessing(false);
          const audioBlob = new Blob([event.data], { type: 'audio/mp3' });
          await playAudio(audioBlob).catch((e) => console.error('Failed to play audio:', e));
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        handleEndCall();
      };
      
      websocket.onclose = () => {
        console.log('WebSocket closed');
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      setError(message);
      setIsInitializing(false);
      store.endCall();
      toast.error(message);
    }
  };
  
  const startAudioProcessing = (mediaStream: MediaStream, callId: string) => {
    const audioContext = audioContextRef.current!;
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    // Use ScriptProcessorNode to capture audio in chunks
    const processor = audioContext.createScriptProcessor(
      4096, // buffer size (0.256 seconds at 16kHz)
      1,    // input channels
      1     // output channels
    );
    processorRef.current = processor;
    
    let audioBuffer: Float32Array[] = [];
    let chunkCounter = 0;
    
    processor.onaudioprocess = (event) => {
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      
      const inputData = event.inputBuffer.getChannelData(0);
      audioBuffer.push(new Float32Array(inputData));
      chunkCounter++;
      
      // Send audio chunk every ~2 frames (500ms at 4096 buffer size)
      if (chunkCounter % 2 === 0) {
        // Convert Float32 to WAV format
        const wav = convertAudioToWav(audioBuffer);
        websocketRef.current.send(wav);
        audioBuffer = [];
        setIsProcessing(true);
      }
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
  };
  
  const convertAudioToWav = (audioChunks: Float32Array[]): ArrayBuffer => {
    // Combine all chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedData = new Float32Array(totalLength);
    let offset = 0;
    
    for (const chunk of audioChunks) {
      combinedData.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert Float32 to Int16
    const sampleRate = audioContextRef.current?.sampleRate || 16000;
    const int16Data = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      int16Data[i] = combinedData[i] < 0
        ? combinedData[i] * 0x8000
        : combinedData[i] * 0x7fff;
    }
    
    // Create WAV header
    const header = new ArrayBuffer(44);
    const headerView = new DataView(header);
    
    // RIFF header
    headerView.setUint32(0, 0x46464952, true); // "RIFF"
    headerView.setUint32(4, 36 + totalLength * 2, true);
    headerView.setUint32(8, 0x45564157, true); // "WAVE"
    
    // fmt sub-chunk
    headerView.setUint32(12, 0x20746d66, true); // "fmt "
    headerView.setUint32(16, 16, true); // Subchunk1Size
    headerView.setUint16(20, 1, true); // AudioFormat (PCM)
    headerView.setUint16(22, 1, true); // NumChannels
    headerView.setUint32(24, sampleRate, true); // SampleRate
    headerView.setUint32(28, sampleRate * 2, true); // ByteRate
    headerView.setUint16(32, 2, true); // BlockAlign
    headerView.setUint16(34, 16, true); // BitsPerSample
    
    // data sub-chunk
    headerView.setUint32(36, 0x61746164, true); // "data"
    headerView.setUint32(40, totalLength * 2, true);
    
    // Combine header and audio data
    const wav = new ArrayBuffer(44 + totalLength * 2);
    new Uint8Array(wav).set(new Uint8Array(header));
    new Int16Array(wav, 44).set(int16Data);
    
    return wav;
  };
  
  const handleWebSocketMessage = async (message: any) => {
    try {
      if (message.type === 'transcript_update') {
        const { user_message, assistant_message, transcript, lead_score } = message.data;
        
        // Update store with new transcript
        if (transcript && Array.isArray(transcript)) {
          // Clear and rebuild (to avoid duplicates)
          store.reset();
          store.startCall(store.callId!);
          
          for (const msg of transcript) {
            store.addMessage({
              role: msg.role,
              text: msg.text,
              timestamp: msg.timestamp,
            });
          }
        }
        
        // Update lead score
        if (lead_score) {
          store.updateLeadScore(lead_score);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  };
  
  const handleEndCall = () => {
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    // Cleanup audio context
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    store.endCall();
    setError(null);
    toast.success('Call ended');
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Controls and score */}
        <div className="lg:col-span-1 space-y-6">
          {/* Call controls */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Status</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${store.callActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}
                  />
                  <span className="text-sm text-gray-600">
                    {store.callActive ? '🔴 ACTIVE' : '⚪ IDLE'}
                  </span>
                </div>
              </div>
              
              {/* Duration */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Duration</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatDuration(store.duration)}
                </span>
              </div>
              
              {/* Call ID (debug) */}
              {store.callId && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-600 break-all font-mono">
                    {store.callId}
                  </p>
                </div>
              )}
              
              {/* Control buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleStartCall}
                  disabled={store.callActive || isInitializing}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    store.callActive || isInitializing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {isInitializing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Start Call
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleEndCall}
                  disabled={!store.callActive}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    !store.callActive
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                  }`}
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              </div>
              
              {/* Listening indicator */}
              {store.callActive && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Mic className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {isProcessing ? 'Processing...' : 'Listening...'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Lead score gauge */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Score</h3>
            <ScoreGauge
              score={store.leadScore.final_score}
              matchedRules={store.leadScore.matched_rules}
            />
          </div>
        </div>
        
        {/* Right column: Transcript */}
        <div className="lg:col-span-2 flex flex-col min-h-96">
          <TranscriptDisplay
            messages={store.transcript}
            isLoading={isProcessing}
          />
        </div>
      </div>
      
      {/* Debug info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
          <p className="text-xs font-mono text-gray-700 mb-2">Debug Info:</p>
          <p className="text-xs text-gray-600">
            Messages: {store.transcript.length} | Score: {store.leadScore.final_score}/100 | Duration: {store.duration}s
          </p>
        </div>
      )}
    </div>
  );
}
