import React, { useState, useRef } from 'react';
import { UploadCloud, Wand2, Trash2, Plus, Target, Sparkles, Edit3, Save, XCircle, AlertTriangle, FileType, FileText, File as FileIcon } from 'lucide-react';
import { ExperienceItem, LoadingState, ResumeData, SupportedLanguage } from '../types';
import { Button, Card, TextArea, Input } from './UI';
import { parseMasterProfile, tailorResumeToJob, optimizeSingleExperience } from '../services/geminiService';
import { translations } from '../utils/translations';

interface ExperienceEditorProps {
  resumeData: ResumeData;
  onUpdate: (data: Partial<ResumeData>) => void;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  systemPrompt: string;
  setLoading: (state: LoadingState, msg: string) => void;
  loadingState: LoadingState;
  jobDescription: string;
  setJobDescription: (jd: string) => void;
  language: SupportedLanguage;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ 
  resumeData, onUpdate, apiKey, apiBaseUrl, model, systemPrompt,
  setLoading, loadingState, jobDescription, setJobDescription, language
}) => {
  const t = translations[language];
  const [rawText, setRawText] = useState('');
  
  const [fileData, setFileData] = useState<{ mimeType: string; data: string } | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'import' | 'agent' | 'list'>('import');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExperienceItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- IMPROVED FILE HANDLER ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setFileData(null);
    setRawText('');

    // 1. Text Types
    const textTypes = [
      'text/plain', 'application/json', 'text/markdown', 'text/csv', 'text/html'
    ];
    
    // 2. Binary Types supported by Gemini 2.5 inlineData
    const supportedBinaryTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/heic',
      'image/heif'
    ];

    // 3. Logic
    const isText = textTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    const isSupportedBinary = supportedBinaryTypes.includes(file.type);
    const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.type.includes('wordprocessingml');

    if (isDocx) {
      setErrorMsg("Word documents (.docx) cannot be analyzed directly. Please 'Save as PDF' and upload the PDF.");
      return;
    }

    if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') setRawText(content);
      };
      reader.readAsText(file);
    } else if (isSupportedBinary) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        setFileData({
          mimeType: file.type,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg(`Unsupported file type: ${file.type}. Please use PDF, Images, or Text.`);
    }
    
    event.target.value = '';
  };

  const clearFile = () => {
    setFileData(null);
    setFileName('');
    setRawText('');
    setErrorMsg(null);
  };

  // --- ACTIONS ---

  const handleParse = async () => {
    if (!rawText.trim() && !fileData) return;
    if (!apiKey) { alert("Please configure API Key in Settings."); return; }
    
    setLoading(LoadingState.PARSING, t.common.loading);
    setErrorMsg(null);

    try {
      // Use configured Model and Prompt
      const parsed = await parseMasterProfile(
        fileData ? "" : rawText, 
        apiKey,
        fileData || undefined,
        apiBaseUrl,
        model,
        systemPrompt
      );

      onUpdate({
        ...parsed,
        experience: [...resumeData.experience, ...(parsed.experience || [])],
        skills: [...new Set([...resumeData.skills, ...(parsed.skills || [])])],
        education: [...resumeData.education, ...(parsed.education || [])],
        profile: { ...resumeData.profile, ...parsed.profile }
      });
      
      setActiveTab('list');
      clearFile();
      setLoading(LoadingState.SUCCESS, t.common.success);
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Failed to connect to AI.";
      if (msg.includes('MIME type')) {
         setErrorMsg("The AI rejected this file type. Please try uploading a PDF or Image.");
      } else {
         setErrorMsg(msg);
      }
      setLoading(LoadingState.ERROR, t.common.error);
    } finally {
      setTimeout(() => setLoading(LoadingState.IDLE, ""), 2000);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription.trim()) { alert("Please paste a Job Description."); return; }
    if (!apiKey) { alert("Configure API Key in Settings."); return; }

    setLoading(LoadingState.TAILORING, `${t.common.loading} (Agent Working)`);
    try {
      const tailored = await tailorResumeToJob(
        resumeData, 
        jobDescription, 
        language, 
        apiKey, 
        apiBaseUrl,
        model
      );
      onUpdate(tailored);
      setActiveTab('list');
      setLoading(LoadingState.SUCCESS, t.common.success);
    } catch (error) {
      setLoading(LoadingState.ERROR, t.common.error);
    } finally {
      setTimeout(() => setLoading(LoadingState.IDLE, ""), 2000);
    }
  };

  const handleOptimizeSingle = async (id: string) => {
    if (!apiKey) return;
    const item = resumeData.experience.find(e => e.id === id);
    if (!item) return;

    setLoading(LoadingState.OPTIMIZING, t.common.loading);
    try {
      const optimized = await optimizeSingleExperience(
        item, apiKey, apiBaseUrl, model
      );
      onUpdate({
        experience: resumeData.experience.map(e => e.id === id ? optimized : e)
      });
      setLoading(LoadingState.SUCCESS, t.common.success);
    } catch (e) {
      setLoading(LoadingState.ERROR, t.common.error);
    } finally {
      setTimeout(() => setLoading(LoadingState.IDLE, ""), 1500);
    }
  };

  // --- CRUD HELPERS ---
  const startEditing = (item: ExperienceItem) => { setEditingId(item.id); setEditForm({ ...item }); };
  const saveEditing = () => { if (editForm) { onUpdate({ experience: resumeData.experience.map(e => e.id === editForm.id ? editForm : e) }); setEditingId(null); setEditForm(null); }};
  const updateEditForm = (field: keyof ExperienceItem, value: any) => { if (editForm) setEditForm({ ...editForm, [field]: value }); };
  const handleDelete = (id: string) => { onUpdate({ experience: resumeData.experience.filter(e => e.id !== id) }); };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      
      {/* Header & iOS Style Tabs */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">{t.editor.title}</h2>
          <p className="text-gray-500 mt-2 text-lg font-light">{t.editor.subtitle}</p>
        </div>
        
        {/* Segmented Control */}
        <div className="p-1.5 bg-gray-100 rounded-2xl border border-gray-200 flex shrink-0">
          {[
            { id: 'import', label: t.editor.tabs.import, icon: UploadCloud },
            { id: 'agent', label: t.editor.tabs.agent, icon: Target },
            { id: 'list', label: t.editor.tabs.list, icon: Sparkles }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-md' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} strokeWidth={2.5} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="relative min-h-[500px]">
        
        {/* 1. IMPORT TAB (The "Scanner") */}
        {activeTab === 'import' && (
          <div className="animate-in zoom-in-95 duration-500">
            <Card className="min-h-[500px] flex flex-col items-center justify-center bg-white shadow-2xl relative">
              <div className="w-full max-w-2xl space-y-8 text-center z-10 relative">
                
                {/* Hero Icon */}
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Resume</h3>
                  <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                    PDF or Image recommended. 
                    <br/><span className="text-xs text-gray-400">(DOCX not supported - please save as PDF)</span>
                  </p>
                </div>
                
                {/* Upload Area */}
                <div className="relative w-full group/drop">
                  {fileData || rawText ? (
                    <div className="p-1 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 max-w-md mx-auto">
                       <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                            <FileIcon className="w-6 h-6" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">{fileName || "Raw Text Input"}</div>
                            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Ready
                            </div>
                          </div>
                          <button onClick={clearFile} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="relative">
                       <TextArea 
                        value={rawText}
                        onChange={(e) => { setRawText(e.target.value); setFileData(null); }}
                        placeholder="Paste text directly, or upload a PDF..."
                        className="min-h-[160px] bg-gray-50 border-gray-100 text-base pb-16 pt-6 px-6 text-center placeholder:text-gray-300"
                      />
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                         <div className="relative overflow-hidden rounded-full shadow-lg">
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                              accept=".pdf, .txt, .md, .json, .png, .jpg, .jpeg, .webp, .heic"
                              onChange={handleFileUpload}
                            />
                            <Button 
                                variant="primary"
                                className="pointer-events-none relative z-10 px-6 py-2 bg-black text-white"
                                icon={<FileText className="w-4 h-4"/>}
                             >
                                {t.editor.buttons.upload}
                             </Button>
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3 text-left max-w-lg mx-auto">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                )}
                
                <div className="pt-6">
                  <Button 
                    onClick={handleParse} 
                    disabled={(!rawText && !fileData) || loadingState !== LoadingState.IDLE}
                    isLoading={loadingState === LoadingState.PARSING}
                    className="h-12 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/30"
                    icon={<Wand2 className="w-5 h-5"/>}
                  >
                    {t.editor.buttons.parse}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 2. AGENT TAILOR TAB */}
        {activeTab === 'agent' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-right-8 duration-500">
            <Card className="md:col-span-2 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                   <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{t.editor.jdTitle}</h3>
              </div>
              <TextArea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t.editor.jdPlaceholder}
                className="min-h-[350px] font-mono text-sm leading-relaxed"
              />
            </Card>

            <div className="space-y-6">
               <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                 <Sparkles className="w-8 h-8 mb-4 text-yellow-300" />
                 <h4 className="font-bold text-xl mb-2">AI Agent Strategy</h4>
                 <p className="text-indigo-100 text-sm mb-8 leading-relaxed">
                   The agent will analyze the JD keywords and rewrite your experience to match using <b>{model}</b>.
                 </p>
                 
                 <Button 
                  onClick={handleTailor}
                  disabled={!jobDescription || loadingState !== LoadingState.IDLE}
                  isLoading={loadingState === LoadingState.TAILORING}
                  className="w-full h-12 bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg font-bold"
                >
                  {t.editor.buttons.tailor}
                </Button>
               </div>
            </div>
          </div>
        )}

        {/* 3. LIST/EDIT TAB */}
        {activeTab === 'list' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-2xl font-bold text-gray-900">Experience Items</h3>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{resumeData.experience.length} Entries</span>
            </div>

            {resumeData.experience.length === 0 ? (
              <div className="text-center py-24 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No experience data yet. Go to "Import" to start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {resumeData.experience.map((item) => (
                  <Card key={item.id} className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${editingId === item.id ? 'ring-2 ring-indigo-500 bg-white' : 'hover:bg-gray-50'}`}>
                    {editingId === item.id && editForm ? (
                      /* EDIT MODE */
                      <div className="space-y-6 p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="Company" value={editForm.company} onChange={e => updateEditForm('company', e.target.value)} />
                          <Input label="Role" value={editForm.role} onChange={e => updateEditForm('role', e.target.value)} />
                          <Input label="Start Date" value={editForm.startDate} onChange={e => updateEditForm('startDate', e.target.value)} />
                          <Input label="End Date" value={editForm.endDate} onChange={e => updateEditForm('endDate', e.target.value)} />
                        </div>
                        <TextArea 
                          label="Highlights (AI Optimized)" 
                          value={editForm.highlights.join('\n')} 
                          onChange={e => updateEditForm('highlights', e.target.value.split('\n'))}
                          rows={6}
                          className="font-mono text-sm"
                        />
                         <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                            <Button variant="ghost" onClick={() => setEditingId(null)}>{t.common.cancel}</Button>
                            <Button onClick={saveEditing} icon={<Save className="w-4 h-4"/>} className="bg-indigo-600 text-white">{t.common.save}</Button>
                         </div>
                      </div>
                    ) : (
                      /* VIEW MODE */
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/4 space-y-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-400">
                             <FileType className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 leading-tight">{item.company}</h3>
                          <p className="text-indigo-600 font-semibold">{item.role}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 inline-block px-2 py-1 rounded">
                            {item.startDate} — {item.endDate}
                          </p>
                        </div>

                        <div className="flex-1 space-y-4 pt-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          <div className="space-y-3">
                            {item.highlights.map((point, i) => (
                              <div key={i} className="flex items-start text-sm text-gray-600 leading-relaxed group/line hover:text-gray-900 transition-colors">
                                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mt-2 mx-3 shrink-0 group-hover/line:bg-indigo-500 transition-colors" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-row lg:flex-col gap-3 justify-start lg:justify-center lg:border-l border-gray-100 lg:pl-6 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="secondary" 
                              className="lg:w-full h-9 text-xs justify-start px-3" 
                              icon={<Edit3 className="w-3.5 h-3.5"/>}
                              onClick={() => startEditing(item)}
                            >
                              {t.common.edit}
                            </Button>
                           <Button 
                              variant="ghost" 
                              className="lg:w-full h-9 text-xs justify-start px-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" 
                              icon={<Wand2 className="w-3.5 h-3.5"/>}
                              onClick={() => handleOptimizeSingle(item.id)}
                              isLoading={loadingState === LoadingState.OPTIMIZING}
                            >
                              {t.common.polish}
                            </Button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex justify-center lg:mt-auto"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-center pt-10 pb-10">
              <Button 
                variant="secondary" 
                icon={<Plus className="w-5 h-5" />} 
                onClick={() => setActiveTab('import')}
                className="px-8 py-3 rounded-full text-base shadow-lg hover:shadow-xl transition-shadow bg-white border-0"
              >
                 {t.editor.buttons.add}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};