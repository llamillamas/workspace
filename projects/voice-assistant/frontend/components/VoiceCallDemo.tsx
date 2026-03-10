'use client';

/**
 * VoiceCallDemo - Voice call interface with VAD (Voice Activity Detection).
 * Includes mic volume gauge for debugging audio input.
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
const SILENCE_DURATION_MS = 1200;
const MIN_SPEECH_DURATION_MS = 300;
const MAX_SPEECH_DURATION_MS = 10000; // Force send after 10s of continuous speech
const NOISE_CALIBRATION_MS = 1500; // Calibrate ambient noise for 1.5s
const SPEECH_MULTIPLIER = 3.0; // Speech must be 3x ambient noise

export function VoiceCallDemo() {
  const store = useCallStore();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [debugInfo, setDebugInfo] = useState('Idle');

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
  const isProcessingRef = useRef<boolean>(false);
  const chunkCountRef = useRef<number>(0);
  const noiseFloorRef = useRef<number>(0.08); // Default noise floor, will calibrate
  const noiseCalibrationSamples = useRef<number[]>([]);
  const vadStartTimeRef = useRef<number>(0);

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
    setDebugInfo('Starting call...');

    try {
      const callId = generateCallId();
      store.startCall(callId);

      const mediaStream = await requestMicrophone();
      mediaStreamRef.current = mediaStream;
      setDebugInfo('Mic acquired');

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
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      console.log('[VoiceCall] Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          chunkCountRef.current++;
        }
      };

      // WebSocket
      const wsUrl = `${WS_URL}/api/voice/ws/call/${callId}`;
      console.log('[VoiceCall] Connecting to:', wsUrl);
      const websocket = new WebSocket(wsUrl);
      websocket.binaryType = 'arraybuffer';
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('[VoiceCall] WebSocket connected');
        setIsInitializing(false);
        setDebugInfo('Connected - speak now');
        mediaRecorder.start(250);
        startVAD();
        toast.success('Call started. Speak clearly.');
      };

      websocket.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const message = JSON.parse(event.data);
          console.log('[VoiceCall] Message received:', message.type);
          await handleWebSocketMessage(message);
        } else if (event.data instanceof ArrayBuffer) {
          console.log('[VoiceCall] Audio response received:', event.data.byteLength, 'bytes');
          setIsProcessing(false);
          isProcessingRef.current = false;
          setDebugInfo('Playing response...');
          isPlayingResponseRef.current = true;
          const audioBlob = new Blob([event.data], { type: 'audio/mp3' });
          try {
            await playAudio(audioBlob);
          } catch (e) {
            console.error('[VoiceCall] Failed to play audio:', e);
          }
          isPlayingResponseRef.current = false;
          setDebugInfo('Listening...');
        }
      };

      websocket.onerror = (e) => {
        console.error('[VoiceCall] WebSocket error:', e);
        setError('Connection error. Please try again.');
        handleEndCall();
      };

      websocket.onclose = (e) => {
        console.log('[VoiceCall] WebSocket closed:', e.code, e.reason);
      };
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
    vadStartTimeRef.current = Date.now();
    noiseCalibrationSamples.current = [];
    noiseFloorRef.current = 0.08; // Reset default

    console.log('[VAD] Starting with calibration phase...');
    setDebugInfo('Calibrating mic noise floor...');

    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS energy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Update volume meter
      setMicVolume(Math.min(1, rms * 5));

      const now = Date.now();
      const elapsed = now - vadStartTimeRef.current;

      // Phase 1: Calibrate ambient noise (first 1.5 seconds)
      if (elapsed < NOISE_CALIBRATION_MS) {
        noiseCalibrationSamples.current.push(rms);
        const progress = Math.round((elapsed / NOISE_CALIBRATION_MS) * 100);
        setDebugInfo(`Calibrating... ${progress}% (RMS: ${rms.toFixed(4)})`);
        return;
      }

      // Finalize calibration on first frame after calibration period
      if (noiseCalibrationSamples.current.length > 0) {
        const samples = noiseCalibrationSamples.current;
        const avgNoise = samples.reduce((a, b) => a + b, 0) / samples.length;
        noiseFloorRef.current = Math.max(0.01, avgNoise * SPEECH_MULTIPLIER);
        console.log(`[VAD] Noise floor calibrated: avg=${avgNoise.toFixed(4)}, threshold=${noiseFloorRef.current.toFixed(4)} (${samples.length} samples)`);
        setDebugInfo(`Ready - threshold: ${noiseFloorRef.current.toFixed(3)} (noise: ${avgNoise.toFixed(3)})`);
        noiseCalibrationSamples.current = []; // Clear to mark calibration done
      }

      const threshold = noiseFloorRef.current;
      const isSpeechDetected = rms > threshold;

      if (isSpeechDetected) {
        if (!speechStartTimeRef.current) {
          speechStartTimeRef.current = now;
          console.log(`[VAD] Speech started (RMS: ${rms.toFixed(4)} > ${threshold.toFixed(4)})`);
        }
        lastSpeechTimeRef.current = now;
        setIsSpeaking(true);

        // Force send after MAX_SPEECH_DURATION if still talking
        const speechDuration = now - speechStartTimeRef.current;
        if (
          speechDuration >= MAX_SPEECH_DURATION_MS &&
          !isProcessingRef.current &&
          !isPlayingResponseRef.current
        ) {
          console.log(`[VAD] Max speech duration (${MAX_SPEECH_DURATION_MS}ms) - force sending`);
          setDebugInfo('Max duration - sending...');
          sendAudio();
          speechStartTimeRef.current = now; // Reset for next segment
          setIsSpeaking(false);
        } else {
          setDebugInfo(`Speaking... ${(speechDuration / 1000).toFixed(1)}s (RMS: ${rms.toFixed(3)})`);
        }
      } else {
        const silenceDuration = now - lastSpeechTimeRef.current;
        const speechDuration = speechStartTimeRef.current
          ? lastSpeechTimeRef.current - speechStartTimeRef.current
          : 0;

        if (
          speechStartTimeRef.current &&
          silenceDuration >= SILENCE_DURATION_MS &&
          speechDuration >= MIN_SPEECH_DURATION_MS &&
          !isProcessingRef.current &&
          !isPlayingResponseRef.current
        ) {
          console.log(`[VAD] Silence after ${speechDuration}ms speech. Sending ${audioChunksRef.current.length} chunks...`);
          setDebugInfo(`Sending (${speechDuration}ms speech)...`);
          sendAudio();
          speechStartTimeRef.current = null;
          setIsSpeaking(false);
        } else if (silenceDuration > 200) {
          setIsSpeaking(false);
          if (!isProcessingRef.current) {
            setDebugInfo(`Listening... (RMS: ${rms.toFixed(3)} / thresh: ${threshold.toFixed(3)})`);
          }
        }
      }
    }, 50);
  };

  const sendAudio = () => {
    const ws = websocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceCall] WebSocket not open, cannot send');
      return;
    }
    if (audioChunksRef.current.length === 0) {
      console.warn('[VoiceCall] No audio chunks to send');
      return;
    }

    const chunks = audioChunksRef.current.slice();
    audioChunksRef.current = [];
    chunkCountRef.current = 0;

    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
    console.log(`[VoiceCall] Sending audio blob: ${audioBlob.size} bytes (${chunks.length} chunks)`);

    setIsProcessing(true);
    isProcessingRef.current = true;
    setDebugInfo('Processing your speech...');

    audioBlob.arrayBuffer().then((buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(buffer);
        console.log(`[VoiceCall] Sent ${buffer.byteLength} bytes to server`);
      } else {
        console.warn('[VoiceCall] WebSocket closed before send');
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    });
  };

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
      } else if (message.type === 'error') {
        console.error('[VoiceCall] Server error:', message.data?.message);
        setDebugInfo(`Error: ${message.data?.message}`);
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    } catch (err) {
      console.error('[VoiceCall] Error handling message:', err);
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
    chunkCountRef.current = 0;
    store.endCall();
    setError(null);
    setIsSpeaking(false);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setMicVolume(0);
    setDebugInfo('Idle');
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

              {/* Mic Volume Gauge */}
              {store.callActive && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium text-sm">Mic Input</span>
                    <span className="text-xs text-gray-500">{Math.round(micVolume * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        micVolume > 0.6 ? 'bg-red-500' : micVolume > 0.3 ? 'bg-green-500' : micVolume > 0.05 ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.max(2, micVolume * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Silent</span>
                    <span>|</span>
                    <span>Loud</span>
                  </div>
                </div>
              )}

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

              {/* Status indicator */}
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

              {/* Debug info */}
              {store.callActive && (
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 font-mono">{debugInfo}</p>
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
