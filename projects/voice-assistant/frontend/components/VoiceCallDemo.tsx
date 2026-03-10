'use client';

/**
 * VoiceCallDemo - Voice call interface with VAD (Voice Activity Detection).
 * Waits for user to finish speaking before sending audio to backend.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCallStore, Message } from '@/lib/webrtc/state';
import { generateCallId, requestMicrophone, playAudio, formatDuration } from '@/lib/webrtc/audio';
import { ScoreGauge } from './ScoreGauge';
import { TranscriptDisplay } from './TranscriptDisplay';
import { Mic, MicOff, Phone, PhoneOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function getWsUrl(): string {
  const envWs = process.env.NEXT_PUBLIC_WS_URL;
  if (envWs) return envWs;
  const base = BACKEND_URL;
  if (base.startsWith('https://')) return base.replace('https://', 'wss://');
  if (base.startsWith('http://')) return base.replace('http://', 'ws://');
  return 'ws://localhost:8000';
}
const WS_URL = getWsUrl();

// VAD settings
const SILENCE_THRESHOLD = 0.015; // Audio energy below this = silence
const SILENCE_DURATION_MS = 1200; // Wait 1.2s of silence before sending
const MIN_SPEECH_DURATION_MS = 300; // Minimum speech duration to consider valid

export function VoiceCallDemo() {
  const store = useCallStore();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechStartTimeRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isPlayingResponseRef = useRef<boolean>(false);

  // Timer for call duration
  useEffect(() => {
    if (!store.callActive) return;

    durationIntervalRef.current = setInterval(() => {
      store.incrementDuration();
    }, 1000);

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [store.callActive]);

  const handleStartCall = async () => {
    setError(null);
    setIsInitializing(true);

    try {
      const callId = generateCallId();
      store.startCall(callId);

      const mediaStream = await requestMicrophone();
      mediaStreamRef.current = mediaStream;

      // Audio context for VAD analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      // MediaRecorder for proper webm/opus encoding
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // WebSocket
      const wsUrl = `${WS_URL}/api/voice/ws/call/${callId}`;
      const websocket = new WebSocket(wsUrl);
      websocket.binaryType = 'arraybuffer';
      websocketRef.current = websocket;

      websocket.onopen = () => {
        setIsInitializing(false);
        mediaRecorder.start(250); // Collect chunks every 250ms
        startVAD();
        toast.success('Call started. Speak clearly, I\'ll wait for you to finish.');
      };

      websocket.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const message = JSON.parse(event.data);
          await handleWebSocketMessage(message);
        } else if (event.data instanceof ArrayBuffer) {
          setIsProcessing(false);
          isPlayingResponseRef.current = true;
          const audioBlob = new Blob([event.data], { type: 'audio/mp3' });
          try {
            await playAudio(audioBlob);
          } catch (e) {
            console.error('Failed to play audio:', e);
          }
          isPlayingResponseRef.current = false;
        }
      };

      websocket.onerror = () => {
        setError('Connection error. Please try again.');
        handleEndCall();
      };

      websocket.onclose = () => {};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      setError(message);
      setIsInitializing(false);
      store.endCall();
      toast.error(message);
    }
  };

  const startVAD = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS energy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      const now = Date.now();
      const isSpeechDetected = rms > SILENCE_THRESHOLD;

      if (isSpeechDetected) {
        if (!speechStartTimeRef.current) {
          speechStartTimeRef.current = now;
        }
        lastSpeechTimeRef.current = now;
        setIsSpeaking(true);
      } else {
        // Check if we've been silent long enough after speech
        const silenceDuration = now - lastSpeechTimeRef.current;
        const speechDuration = speechStartTimeRef.current
          ? lastSpeechTimeRef.current - speechStartTimeRef.current
          : 0;

        if (
          speechStartTimeRef.current &&
          silenceDuration >= SILENCE_DURATION_MS &&
          speechDuration >= MIN_SPEECH_DURATION_MS &&
          !isProcessing &&
          !isPlayingResponseRef.current
        ) {
          // User finished speaking - send audio
          sendAudioChunks();
          speechStartTimeRef.current = null;
          setIsSpeaking(false);
        } else if (silenceDuration > 200) {
          setIsSpeaking(false);
        }
      }
    }, 50); // Check every 50ms
  };

  const sendAudioChunks = useCallback(() => {
    const ws = websocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (audioChunksRef.current.length === 0) return;

    // Combine all collected chunks into one blob
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    // Send as binary
    audioBlob.arrayBuffer().then((buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(buffer);
        setIsProcessing(true);
      }
    });
  }, []);

  const handleWebSocketMessage = async (message: any) => {
    try {
      if (message.type === 'transcript_update') {
        const { transcript, lead_score } = message.data;

        if (transcript && Array.isArray(transcript)) {
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

        if (lead_score) {
          store.updateLeadScore(lead_score);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  };

  const handleEndCall = () => {
    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    audioChunksRef.current = [];
    speechStartTimeRef.current = null;
    store.endCall();
    setError(null);
    setIsSpeaking(false);
    setIsProcessing(false);
    toast.success('Call ended');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Controls and score */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Status</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${store.callActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}
                  />
                  <span className="text-sm text-gray-600">
                    {store.callActive ? 'ACTIVE' : 'IDLE'}
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

              {/* Call ID */}
              {store.callId && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-600 break-all font-mono">{store.callId}</p>
                </div>
              )}

              {/* Buttons */}
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

              {/* Listening/Speaking indicator */}
              {store.callActive && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    isProcessing
                      ? 'bg-yellow-50 border border-yellow-200'
                      : isSpeaking
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Mic
                    className={`w-4 h-4 ${
                      isProcessing
                        ? 'text-yellow-600'
                        : isSpeaking
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isProcessing
                        ? 'text-yellow-700'
                        : isSpeaking
                        ? 'text-green-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {isProcessing
                      ? 'Thinking...'
                      : isSpeaking
                      ? 'Hearing you...'
                      : 'Listening... (speak when ready)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lead score */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Score</h3>
            <ScoreGauge score={store.leadScore.final_score} matchedRules={store.leadScore.matched_rules} />
          </div>
        </div>

        {/* Right column: Transcript */}
        <div className="lg:col-span-2 flex flex-col min-h-96">
          <TranscriptDisplay messages={store.transcript} isLoading={isProcessing} />
        </div>
      </div>
    </div>
  );
}
