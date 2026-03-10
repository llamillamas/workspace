'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { apiClient } from '@/lib/api-client';

import BusinessInfoTab from '@/components/settings/BusinessInfoTab';
import VoiceSettingsTab from '@/components/settings/VoiceSettingsTab';
import TonalityTab from '@/components/settings/TonalityTab';
import LeadQualificationTab from '@/components/settings/LeadQualificationTab';
import KnowledgeBaseTab from '@/components/settings/KnowledgeBaseTab';
import SystemPromptTab from '@/components/settings/SystemPromptTab';
import TestTab from '@/components/settings/TestTab';

interface VoiceConfig {
  id: string;
  company_name: string;
  website_url: string;
  industry: string;
  description: string;
  target_customer: string;
  main_products: string;
  unique_value_prop: string;
  competitors: string;
  voice_engine: string;
  voice_name: string;
  voice_speed: number;
  voice_pitch: number;
  voice_volume: number;
  tonality: string;
  personality_description: string;
  opening_statement: string;
  objection_handling: string;
  allow_escalation: boolean;
  escalation_trigger_keywords: string[];
  max_response_length: string;
  topics_to_avoid: string[];
  fallback_response: string;
  qualification_focus: string;
  info_to_collect: string[];
  auto_escalate_on_hot: boolean;
  hot_lead_actions: string[];
}

const defaultConfig: VoiceConfig = {
  id: '',
  company_name: '',
  website_url: '',
  industry: '',
  description: '',
  target_customer: '',
  main_products: '',
  unique_value_prop: '',
  competitors: '',
  voice_engine: 'deepgram',
  voice_name: 'aura-asteria-en',
  voice_speed: 1.0,
  voice_pitch: 1.0,
  voice_volume: 1.0,
  tonality: 'professional',
  personality_description: '',
  opening_statement: 'Hello! How can I help you today?',
  objection_handling: '',
  allow_escalation: true,
  escalation_trigger_keywords: [],
  max_response_length: 'medium',
  topics_to_avoid: [],
  fallback_response: "I'm not sure about that. Can you tell me more?",
  qualification_focus: 'general',
  info_to_collect: [],
  auto_escalate_on_hot: false,
  hot_lead_actions: [],
};

export default function VoiceAssistantSettingsPage() {
  const [config, setConfig] = useState<VoiceConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await apiClient.get('/voice-config');
      if (response.data) {
        setConfig({ ...defaultConfig, ...response.data });
      }
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (updatedConfig: Partial<VoiceConfig>) => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const response = await apiClient.post('/voice-config', updatedConfig);
      if (response.data) {
        setConfig({ ...defaultConfig, ...response.data });
        setSaveStatus('success');
        setSaveMessage('Configuration saved successfully!');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to save configuration. The backend may not support this endpoint yet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Voice Assistant Configuration</h1>
          <p className="text-gray-600">Customize your voice assistant's business information, voice, tonality, and behavior.</p>
        </div>

        {saveStatus === 'success' && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{saveMessage}</AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <p className="text-gray-500">Loading configuration...</p>
          </div>
        ) : (
          <Tabs defaultValue="business-info" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="business-info">Business</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="tonality">Tonality</TabsTrigger>
              <TabsTrigger value="qualification">Qualification</TabsTrigger>
              <TabsTrigger value="knowledge-base">Knowledge</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="business-info">
              <BusinessInfoTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="voice">
              <VoiceSettingsTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="tonality">
              <TonalityTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="qualification">
              <LeadQualificationTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="knowledge-base">
              <KnowledgeBaseTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="prompts">
              <SystemPromptTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>

            <TabsContent value="test">
              <TestTab config={config} onSave={handleSaveConfig} isSaving={saving} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedLayout>
  );
}
