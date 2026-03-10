'use client';

import React from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { VoiceCallDemo } from '@/components/VoiceCallDemo';
import { Headphones, Zap, Brain } from 'lucide-react';

export default function VoiceCallsPage() {
  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Voice Calls</h1>
          <p className="text-gray-600 mt-1">
            Real-time voice conversations with AI-powered transcription and lead scoring
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Headphones className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Deepgram STT</h3>
              <p className="text-sm text-gray-600">Nova-3 speech-to-text transcription</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Claude AI</h3>
              <p className="text-sm text-gray-600">Intelligent responses via Claude Sonnet</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Live Lead Scoring</h3>
              <p className="text-sm text-gray-600">Real-time score updates during conversation</p>
            </div>
          </div>
        </div>

        {/* Voice call demo */}
        <VoiceCallDemo />
      </div>
    </ProtectedLayout>
  );
}
