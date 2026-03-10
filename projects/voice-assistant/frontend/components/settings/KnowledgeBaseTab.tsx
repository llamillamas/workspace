'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, FileText, Link as LinkIcon, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';

interface KnowledgeBaseItem {
  id: string;
  title: string;
  type: string;
  url?: string;
  created_at: string;
}

interface KnowledgeBaseTabProps {
  config: any;
  onSave: (data: any) => Promise<void>;
  isSaving?: boolean;
}

export default function KnowledgeBaseTab({ config, onSave, isSaving }: KnowledgeBaseTabProps) {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [stats, setStats] = useState({ total_items: 0, total_size_mb: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      const response = await apiClient.get('/voice-config/knowledge-base');
      if (response.data) {
        setItems(response.data.items || []);
        setStats(response.data.stats || { total_items: 0, total_size_mb: 0 });
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/voice-config/knowledge-base/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        await loadKnowledgeBase();
      }
    } catch (error: any) {
      setError(error?.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    setAddingUrl(true);
    setError('');

    try {
      await apiClient.post('/voice-config/knowledge-base/url', { url: urlInput });
      setUrlInput('');
      await loadKnowledgeBase();
    } catch (error: any) {
      setError(error?.response?.data?.detail || 'Failed to add URL');
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/voice-config/knowledge-base/${id}`);
      await loadKnowledgeBase();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>Upload documents or website content to provide context to your AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Drag and drop a file or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, DOCX, TXT, MD (max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Add Website URL</label>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                disabled={addingUrl}
              />
              <Button onClick={handleAddUrl} disabled={addingUrl || !urlInput.trim()}>
                {addingUrl ? 'Adding...' : 'Add'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Will automatically scrape and extract content</p>
          </div>
        </div>

        {stats.total_items > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Knowledge Base Size:</span>
              <span className="font-medium">{stats.total_items} items</span>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-3">Knowledge Base Items</label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.type === 'url' ? (
                      <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {item.type} {item.created_at && `• ${formatDate(item.created_at)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave({})} disabled={isSaving}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
