import React from 'react';
import { Key, ShieldCheck, Globe, AlertCircle, Cpu, MessageSquare } from 'lucide-react';
import { Card, Button, Input, TextArea } from './UI';
import { translations } from '../utils/translations';
import { SupportedLanguage } from '../types';

interface SettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  model: string;
  setModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  language: SupportedLanguage;
}

export const Settings: React.FC<SettingsProps> = ({ 
  apiKey, setApiKey, 
  apiBaseUrl, setApiBaseUrl,
  model, setModel,
  prompt, setPrompt,
  language 
}) => {
  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.settings.title}</h2>
        <p className="text-gray-500 mt-1">Configure your AI connection and behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Key Section */}
        <Card className="md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900">Gemini API Key</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your key is stored locally in your browser.
                </p>
              </div>
              <Input 
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs tracking-wider"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>Stored securely in localStorage</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Model Section */}
        <Card>
          <div className="flex items-start gap-4 h-full">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
               <div>
                <h3 className="font-bold text-gray-900">{t.settings.model}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.settings.modelDesc}</p>
              </div>
              <Input 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="font-mono text-xs font-bold text-purple-700"
              />
            </div>
          </div>
        </Card>

         {/* Base URL Section (For Proxy) */}
        <Card>
          <div className="flex items-start gap-4 h-full">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900">Base URL</h3>
                <p className="text-xs text-gray-500 mt-1">Optional proxy address.</p>
              </div>
              <Input 
                type="text"
                placeholder="https://generativelanguage.googleapis.com"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="font-mono text-xs text-blue-600"
              />
            </div>
          </div>
        </Card>

         {/* System Prompt Section */}
        <Card className="md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900">{t.settings.prompt}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t.settings.promptDesc}
                </p>
              </div>
              <TextArea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="font-mono text-xs leading-relaxed bg-gray-50"
              />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="text-center text-xs text-gray-300">
        ResumeAI Pro v1.1.0
      </div>
    </div>
  );
};