'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';

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

export default function VoiceAssistantSettingsPage() {
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/voice-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (updatedConfig: Partial<VoiceConfig>) => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const response = await fetch('/api/voice-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setSaveStatus('success');
        setSaveMessage('Configuration saved successfully!');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setSaveMessage('Failed to save configuration');
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(`Error: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load configuration. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

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
    </div>
    </ProtectedLayout>
  );
}
