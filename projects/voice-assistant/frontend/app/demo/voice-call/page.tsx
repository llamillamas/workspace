'use client';

/**
 * Voice Call Demo Page
 * Full-featured demo of the browser-based voice call handler.
 */

import React from 'react';
import { VoiceCallDemo } from '@/components/VoiceCallDemo';
import { Headphones, Zap, Lock } from 'lucide-react';

export default function VoiceCallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Call Handler</h1>
          <p className="text-gray-600">
            Real-time voice conversations with AI transcription, lead scoring, and offline TTS
          </p>
        </div>
      </div>
      
      {/* Features highlight */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Headphones className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Deepgram Nova-3 STT</h3>
              <p className="text-sm text-gray-600">Fast, accurate speech-to-text transcription</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Live Lead Scoring</h3>
              <p className="text-sm text-gray-600">Real-time score updates based on conversation context</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Claude AI Responses</h3>
              <p className="text-sm text-gray-600">Contextual lead qualification powered by Claude Sonnet</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main demo component */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <VoiceCallDemo />
      </div>
      
      {/* Instructions */}
      <div className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 1: Start the Call</h3>
              <p className="text-gray-700 mb-2">
                Click the "Start Call" button to begin. Your browser will request microphone access.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Important:</strong> Allow microphone access for the call to work.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 2: Speak Naturally</h3>
              <p className="text-gray-700 mb-2">
                Once the call is active, speak into your microphone. Your speech will be transcribed in real-time.
              </p>
              <p className="text-sm text-gray-600">
                The AI will respond with contextual questions and suggestions.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 3: Watch the Lead Score</h3>
              <p className="text-gray-700 mb-2">
                As you talk, the lead score updates in real-time based on your conversation.
              </p>
              <p className="text-sm text-gray-600">
                COLD (0-40), WARM (40-70), or HOT (70-100).
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Step 4: End and Review</h3>
              <p className="text-gray-700 mb-2">
                Click "End Call" to finish. Your full transcript and final score are saved.
              </p>
              <p className="text-sm text-gray-600">
                Export the transcript for later review.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Specifications */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 mb-2">Backend</h4>
              <ul className="text-gray-700 space-y-1">
                <li>• FastAPI WebSocket server</li>
                <li>• Deepgram Nova-3 STT</li>
                <li>• Deepgram Aura TTS</li>
                <li>• Claude Sonnet AI + lead scoring</li>
              </ul>
            </div>
            
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 mb-2">Frontend</h4>
              <ul className="text-gray-700 space-y-1">
                <li>• Next.js 15 + React 19</li>
                <li>• TypeScript strict mode</li>
                <li>• Zustand state management</li>
                <li>• Web Audio API for recording</li>
              </ul>
            </div>
            
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 mb-2">Performance Targets</h4>
              <ul className="text-gray-700 space-y-1">
                <li>• STT latency: &lt;500ms</li>
                <li>• TTS latency: &lt;500ms</li>
                <li>• Claude response: &lt;2s</li>
                <li>• Total round-trip: &lt;3s</li>
              </ul>
            </div>
            
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 mb-2">Browser Support</h4>
              <ul className="text-gray-700 space-y-1">
                <li>• Chrome/Chromium (recommended)</li>
                <li>• Firefox with MediaRecorder</li>
                <li>• Safari 14.1+ (WebRTC support)</li>
                <li>• Requires HTTPS or localhost</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
