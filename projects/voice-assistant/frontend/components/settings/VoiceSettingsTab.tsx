'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Volume2, Play, Loader } from 'lucide-react';

interface VoiceSettingsTabProps {
  config: any;
  onSave: (data: any) => Promise<void>;
  isSaving?: boolean;
}

// Real Deepgram STT models
const STT_MODELS = [
  { id: 'nova-3', name: 'Nova-3 (Latest, Best Accuracy)', description: '53% WER reduction, sub-300ms latency' },
  { id: 'nova-2', name: 'Nova-2', description: 'Previous flagship, broad language support' },
  { id: 'nova-2-conversationalai', name: 'Nova-2 Conversational AI', description: 'Optimized for voice agents' },
  { id: 'nova-2-phonecall', name: 'Nova-2 Phone Call', description: 'Optimized for phone audio' },
  { id: 'enhanced', name: 'Enhanced', description: 'Mid-tier accuracy' },
  { id: 'base', name: 'Base', description: 'Lowest cost' },
];

// Deepgram STT languages
const STT_LANGUAGES = [
  { code: 'multi', name: 'Multilingual (auto-detect)' },
  { code: 'en', name: 'English' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'es', name: 'Spanish' },
  { code: 'es-419', name: 'Spanish (Latin America)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
];

// Deepgram Aura-2 TTS voices (latest generation)
const TTS_VOICES = [
  // English Female
  { id: 'aura-2-asteria-en', name: 'Asteria', gender: 'Female', lang: 'English' },
  { id: 'aura-2-luna-en', name: 'Luna', gender: 'Female', lang: 'English' },
  { id: 'aura-2-athena-en', name: 'Athena', gender: 'Female', lang: 'English' },
  { id: 'aura-2-hera-en', name: 'Hera', gender: 'Female', lang: 'English' },
  { id: 'aura-2-thalia-en', name: 'Thalia', gender: 'Female', lang: 'English' },
  { id: 'aura-2-aurora-en', name: 'Aurora', gender: 'Female', lang: 'English' },
  { id: 'aura-2-iris-en', name: 'Iris', gender: 'Female', lang: 'English' },
  { id: 'aura-2-selene-en', name: 'Selene', gender: 'Female', lang: 'English' },
  // English Male
  { id: 'aura-2-orion-en', name: 'Orion', gender: 'Male', lang: 'English' },
  { id: 'aura-2-arcas-en', name: 'Arcas', gender: 'Male', lang: 'English' },
  { id: 'aura-2-orpheus-en', name: 'Orpheus', gender: 'Male', lang: 'English' },
  { id: 'aura-2-zeus-en', name: 'Zeus', gender: 'Male', lang: 'English' },
  { id: 'aura-2-apollo-en', name: 'Apollo', gender: 'Male', lang: 'English' },
  { id: 'aura-2-atlas-en', name: 'Atlas', gender: 'Male', lang: 'English' },
  { id: 'aura-2-hermes-en', name: 'Hermes', gender: 'Male', lang: 'English' },
  { id: 'aura-2-mars-en', name: 'Mars', gender: 'Male', lang: 'English' },
  // Spanish
  { id: 'aura-2-estrella-es', name: 'Estrella', gender: 'Female', lang: 'Spanish' },
  { id: 'aura-2-celeste-es', name: 'Celeste', gender: 'Female', lang: 'Spanish' },
  { id: 'aura-2-nestor-es', name: 'Nestor', gender: 'Male', lang: 'Spanish' },
  { id: 'aura-2-sirio-es', name: 'Sirio', gender: 'Male', lang: 'Spanish' },
  // French
  { id: 'aura-2-agathe-fr', name: 'Agathe', gender: 'Female', lang: 'French' },
  { id: 'aura-2-hector-fr', name: 'Hector', gender: 'Male', lang: 'French' },
  // German
  { id: 'aura-2-elara-de', name: 'Elara', gender: 'Female', lang: 'German' },
  { id: 'aura-2-julius-de', name: 'Julius', gender: 'Male', lang: 'German' },
  // Italian
  { id: 'aura-2-melia-it', name: 'Melia', gender: 'Female', lang: 'Italian' },
  { id: 'aura-2-elio-it', name: 'Elio', gender: 'Male', lang: 'Italian' },
  // Japanese
  { id: 'aura-2-uzume-ja', name: 'Uzume', gender: 'Female', lang: 'Japanese' },
  { id: 'aura-2-ebisu-ja', name: 'Ebisu', gender: 'Male', lang: 'Japanese' },
  // Dutch
  { id: 'aura-2-beatrix-nl', name: 'Beatrix', gender: 'Female', lang: 'Dutch' },
  { id: 'aura-2-sander-nl', name: 'Sander', gender: 'Male', lang: 'Dutch' },
  // Legacy Aura 1 (English only)
  { id: 'aura-asteria-en', name: 'Asteria (v1)', gender: 'Female', lang: 'English (Legacy)' },
  { id: 'aura-orion-en', name: 'Orion (v1)', gender: 'Male', lang: 'English (Legacy)' },
];

const TTS_ENCODINGS = [
  { id: 'mp3', name: 'MP3', description: 'Compressed, good for streaming' },
  { id: 'linear16', name: 'Linear16 (WAV)', description: 'Uncompressed, highest quality' },
  { id: 'opus', name: 'Opus', description: 'Efficient compression' },
  { id: 'flac', name: 'FLAC', description: 'Lossless compression' },
  { id: 'aac', name: 'AAC', description: 'Good compression, wide support' },
  { id: 'mulaw', name: 'Mu-law', description: 'Telephony standard' },
];

const SAMPLE_RATES = [
  { id: '8000', name: '8,000 Hz (Telephony)' },
  { id: '16000', name: '16,000 Hz (Speech)' },
  { id: '24000', name: '24,000 Hz (Default)' },
  { id: '32000', name: '32,000 Hz' },
  { id: '48000', name: '48,000 Hz (High Quality)' },
];

export default function VoiceSettingsTab({ config, onSave, isSaving }: VoiceSettingsTabProps) {
  const [formData, setFormData] = useState({
    voice_engine: 'deepgram',
    stt_model: config.stt_model || 'nova-3',
    stt_language: config.stt_language || 'en',
    tts_voice: config.voice_name || 'aura-2-asteria-en',
    tts_encoding: config.tts_encoding || 'mp3',
    tts_sample_rate: config.tts_sample_rate || '24000',
    smart_format: config.smart_format !== false,
    punctuate: config.punctuate !== false,
  });

  const [testingVoice, setTestingVoice] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState<string>('all');

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredVoices = TTS_VOICES.filter((v) => {
    if (voiceFilter === 'all') return true;
    if (voiceFilter === 'female') return v.gender === 'Female';
    if (voiceFilter === 'male') return v.gender === 'Male';
    return v.lang.toLowerCase().includes(voiceFilter.toLowerCase());
  });

  const selectedVoice = TTS_VOICES.find((v) => v.id === formData.tts_voice);

  const handleTestVoice = async () => {
    setTestingVoice(true);
    try {
      // Use Web Speech API as a quick local test
      const utterance = new SpeechSynthesisUtterance(
        'Hello! This is a test of the voice assistant. How can I help you today?'
      );
      speechSynthesis.speak(utterance);
      utterance.onend = () => setTestingVoice(false);
    } catch {
      setTestingVoice(false);
    }
  };

  const handleSave = async () => {
    await onSave({
      voice_engine: 'deepgram',
      voice_name: formData.tts_voice,
      stt_model: formData.stt_model,
      stt_language: formData.stt_language,
      tts_encoding: formData.tts_encoding,
      tts_sample_rate: formData.tts_sample_rate,
      smart_format: formData.smart_format,
      punctuate: formData.punctuate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Settings</CardTitle>
        <CardDescription>Configure Deepgram STT and TTS for your voice assistant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* STT Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Speech-to-Text (STT)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">STT Model</label>
              <Select value={formData.stt_model} onValueChange={(v) => handleChange('stt_model', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STT_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {STT_MODELS.find((m) => m.id === formData.stt_model)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <Select value={formData.stt_language} onValueChange={(v) => handleChange('stt_language', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STT_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smart_format}
                onChange={(e) => handleChange('smart_format', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Smart Formatting</span>
              <span className="text-xs text-gray-500">(numbers, dates, currencies)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.punctuate}
                onChange={(e) => handleChange('punctuate', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Punctuation</span>
            </label>
          </div>
        </div>

        {/* TTS Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Text-to-Speech (TTS)</h3>

          {/* Voice filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'female', 'male', 'English', 'Spanish', 'French', 'German'].map((f) => (
              <button
                key={f}
                onClick={() => setVoiceFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  voiceFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Voice</label>
              <Select value={formData.tts_voice} onValueChange={(v) => handleChange('tts_voice', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.gender}, {v.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedVoice.gender} voice - {selectedVoice.lang}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Audio Encoding</label>
              <Select value={formData.tts_encoding} onValueChange={(v) => handleChange('tts_encoding', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TTS_ENCODINGS.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {TTS_ENCODINGS.find((e) => e.id === formData.tts_encoding)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sample Rate</label>
              <Select
                value={formData.tts_sample_rate}
                onValueChange={(v) => handleChange('tts_sample_rate', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_RATES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Test */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Test Voice</h4>
          <p className="text-sm text-gray-600 mb-3">
            Preview a sample phrase using the browser's built-in speech synthesis.
            The actual Deepgram voice will sound different and better in production.
          </p>
          <Button onClick={handleTestVoice} disabled={testingVoice} variant="secondary" size="sm">
            {testingVoice ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Playing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Voice (Browser Preview)
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Voice Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
