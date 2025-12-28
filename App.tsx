import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ExperienceEditor } from './components/ExperienceEditor';
import { ProfileEditor } from './components/ProfileEditor';
import { ResumeRenderer } from './components/ResumeRenderer';
import { Settings } from './components/Settings';
import { Button } from './components/UI';
import { AppState, INITIAL_RESUME, LoadingState, ResumeData, SupportedLanguage, EducationItem } from './types';
import { ArrowRight, Printer, RefreshCw, CheckCircle, Edit2, X, Sparkles, Shield, Cpu, MousePointer2 } from 'lucide-react';
import { translations } from './utils/translations';
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from './services/deepseekService';

const App = () => {
  const [state, setState] = useState<AppState>({
    view: 'home',
    resumeData: INITIAL_RESUME,
    jobDescription: '',
    targetLanguage: 'zh', // Default UI Language
    apiKey: localStorage.getItem('DEEPSEEK_API_KEY') || process.env.DEEPSEEK_API_KEY || '',
    apiBaseUrl: localStorage.getItem('DEEPSEEK_API_BASE_URL') || '',
    // Initialize with Defaults
    model: DEFAULT_MODEL,
    customPrompt: DEFAULT_SYSTEM_PROMPT,
    loading: LoadingState.IDLE,
    loadingMessage: '',
    isPreviewEditable: false
  });

  const t = translations[state.targetLanguage];

  // Persist API Key & Base URL
  useEffect(() => {
    if (state.apiKey) localStorage.setItem('DEEPSEEK_API_KEY', state.apiKey);
    if (state.apiBaseUrl !== null) localStorage.setItem('DEEPSEEK_API_BASE_URL', state.apiBaseUrl);
  }, [state.apiKey, state.apiBaseUrl]);

  const updateResumeData = (newData: Partial<ResumeData>) => {
    setState(prev => ({
      ...prev,
      resumeData: { ...prev.resumeData, ...newData }
    }));
  };

  // Change UI Language ONLY, do not touch data language
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setState(prev => ({
      ...prev,
      targetLanguage: lang,
    }));
  };

  const renderContent = () => {
    switch (state.view) {
      case 'home':
        return (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700 space-y-20 lg:space-y-32">
            
            {/* --- Hero Section --- */}
            <div className="flex flex-col lg:flex-row items-center gap-16 pt-10">
              {/* Left Text */}
              <div className="flex-1 text-center lg:text-left space-y-8 z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider border border-indigo-100 shadow-sm animate-in slide-in-from-bottom-2 duration-700 delay-100">
                   <Sparkles className="w-3 h-3" /> {t.home.badge}
                 </div>
                 <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-800 to-gray-400 pb-2 leading-[0.9] lg:leading-[0.9]">
                   {t.home.title}
                 </h1>
                 <p className="text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                   {t.home.subtitle}
                 </p>
                 <div className="flex justify-center lg:justify-start pt-4">
                   <Button onClick={() => setState(s => ({ ...s, view: 'profile' }))} className="h-14 px-10 text-lg rounded-full shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-1">
                     {t.home.cta} <ArrowRight className="ml-2 w-5 h-5" />
                   </Button>
                 </div>
              </div>

              {/* Right Visual - Tilted Resume Card */}
              <div className="flex-1 relative w-full flex justify-center lg:justify-end perspective-1000 group">
                 {/* Decorative Glow */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-200 via-purple-100 to-blue-100 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                 
                 {/* The Resume Card */}
                 <div 
                   className="relative bg-white rounded shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transform transition-all duration-700 ease-out rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 hover:scale-[1.02] border-[6px] border-white/60 backdrop-blur-xl origin-center"
                   style={{ width: '300px', height: '420px', overflow: 'hidden' }}
                 >
                    {/* Scaled down preview - non interactive here */}
                    <div className="w-[210mm] h-[297mm] origin-top-left transform scale-[0.38] pointer-events-none bg-white">
                       <ResumeRenderer data={state.resumeData} /> 
                    </div>
                    {/* Overlay gradient for depth */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
                 </div>
              </div>
            </div>

            {/* --- Features Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Cpu, title: t.home.features.ai.title, desc: t.home.features.ai.desc, color: "text-purple-600 bg-purple-50" },
                { icon: Shield, title: t.home.features.privacy.title, desc: t.home.features.privacy.desc, color: "text-green-600 bg-green-50" },
                { icon: MousePointer2, title: t.home.features.edit.title, desc: t.home.features.edit.desc, color: "text-blue-600 bg-blue-50" },
              ].map((feat, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${feat.color} group-hover:scale-110 transition-transform duration-300`}>
                      <feat.icon className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                   <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

          </div>
        );

      case 'profile':
        // TAB 2: PROFILE & SKILLS (Static Data)
        return (
          <div className="max-w-6xl mx-auto pb-20">
            <ProfileEditor 
              resumeData={state.resumeData}
              onUpdate={updateResumeData}
              language={state.targetLanguage}
            />
          </div>
        );

      case 'editor':
        // TAB 3: DATA & AGENT (PARSER)
        return (
          <div className="max-w-5xl mx-auto pb-20">
             <ExperienceEditor 
              resumeData={state.resumeData}
              onUpdate={updateResumeData}
              apiKey={state.apiKey}
              apiBaseUrl={state.apiBaseUrl}
              model={state.model}
              systemPrompt={state.customPrompt}
              setLoading={(loading, msg) => setState(s => ({ ...s, loading, loadingMessage: msg }))}
              loadingState={state.loading}
              jobDescription={state.jobDescription}
              setJobDescription={(jd) => setState(s => ({ ...s, jobDescription: jd }))}
              language={state.targetLanguage}
            />
          </div>
        );

      case 'templates':
        // TAB 4: TEMPLATES
        return (
          <div className="max-w-6xl mx-auto pb-20">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.templates.title}</h2>
               <p className="text-gray-500">{t.templates.subtitle}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { id: 'glacial', label: t.templates.glacial, color: 'bg-indigo-50 border-l-[60px] border-white' },
                  { id: 'compact', label: t.templates.compact, color: 'bg-slate-50 border-t-[80px] border-slate-200' },
                  { id: 'centric', label: t.templates.centric, color: 'bg-white border-[20px] border-gray-100' },
                  { id: 'modern', label: t.templates.modern, color: 'bg-white' },
                  { id: 'classic', label: t.templates.classic, color: 'bg-[#fdfbf7]' },
                  { id: 'minimalist', label: t.templates.minimalist, color: 'bg-gray-50' },
                  { id: 'creative', label: t.templates.creative, color: 'bg-slate-900' },
                  { id: 'executive', label: t.templates.executive, color: 'bg-white border-4 border-double' },
                  { id: 'academic', label: t.templates.academic, color: 'bg-white border-t-8 border-gray-800' },
                  { id: 'bold', label: t.templates.bold, color: 'bg-teal-50' },
                  { id: 'tech', label: t.templates.tech, color: 'bg-slate-50 font-mono text-xs' },
                  { id: 'elegant', label: t.templates.elegant, color: 'bg-[#fffaf0] font-serif' },
                  { id: 'swiss', label: t.templates.swiss, color: 'bg-white border-l-[16px] border-red-600' },
                ].map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    onClick={() => updateResumeData({ template: tmpl.id as any })}
                    className={`relative cursor-pointer group rounded-2xl border-4 transition-all duration-300 overflow-hidden ${state.resumeData.template === tmpl.id ? 'border-apple-500 shadow-2xl scale-105' : 'border-transparent hover:border-gray-200'}`}
                  >
                     <div className={`h-96 w-full ${tmpl.color} overflow-hidden pointer-events-none`}>
                        {/* Mini Preview Mockup */}
                        <div className="w-full h-full opacity-70 transform scale-50 origin-top-left" style={{ width: '200%', height: '200%'}}>
                          <ResumeRenderer data={{...state.resumeData, template: tmpl.id as any}} />
                        </div>
                     </div>
                     <div className="absolute bottom-0 inset-x-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">{tmpl.label}</span>
                        {state.resumeData.template === tmpl.id && <CheckCircle className="w-5 h-5 text-apple-500" />}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )

      case 'preview':
        // TAB 5: PREVIEW
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl sticky top-4 z-10 shadow-float border border-white/20 gap-4">
              <div className="flex items-center gap-2">
                 <Button variant="ghost" onClick={() => setState(s => ({ ...s, view: 'templates' }))}>
                  &larr; {t.preview.back}
                 </Button>
                 <span className="text-sm font-semibold text-gray-500 hidden md:block">| {t.preview.title}</span>
              </div>
              <div className="flex gap-3">
                <Button 
                   variant={state.isPreviewEditable ? 'primary' : 'secondary'}
                   onClick={() => setState(s => ({ ...s, isPreviewEditable: !s.isPreviewEditable }))}
                   icon={state.isPreviewEditable ? <X className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>}
                >
                   {state.isPreviewEditable ? 'Finish Editing' : 'Edit Online'}
                </Button>

                <Button variant="secondary" icon={<RefreshCw className="w-4 h-4"/>} onClick={() => window.location.reload()}>
                  {t.preview.reset}
                </Button>
                <Button icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                  {t.preview.export}
                </Button>
              </div>
            </div>
            
            {state.isPreviewEditable && (
              <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl text-center text-sm font-medium border border-yellow-200 animate-in slide-in-from-top-2">
                ✏️ Edit Mode Active: Click on any text in the resume to edit it directly.
              </div>
            )}

            <div className="py-8 flex justify-center bg-gray-100 rounded-3xl min-h-screen">
               <ResumeRenderer 
                  data={state.resumeData} 
                  isEditable={state.isPreviewEditable}
                  onUpdate={updateResumeData}
               />
            </div>
          </div>
        );

      case 'settings':
        return (
          <Settings 
            apiKey={state.apiKey} 
            setApiKey={(key) => setState(s => ({ ...s, apiKey: key }))} 
            apiBaseUrl={state.apiBaseUrl}
            setApiBaseUrl={(url) => setState(s => ({ ...s, apiBaseUrl: url }))}
            model={state.model}
            setModel={(model) => setState(s => ({ ...s, model }))}
            prompt={state.customPrompt}
            setPrompt={(prompt) => setState(s => ({ ...s, customPrompt: prompt }))}
            language={state.targetLanguage}
          />
        );
    }
  };

  return (
    <Layout 
      currentView={state.view} 
      onChangeView={(view) => setState(s => ({ ...s, view }))}
      language={state.targetLanguage}
      onLanguageChange={handleLanguageChange}
    >
      {state.loading !== LoadingState.IDLE && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-gray-800 animate-pulse">{state.loadingMessage}</p>
        </div>
      )}
      
      {renderContent()}
    </Layout>
  );
};

export default App;
