import React from 'react';
import { Layout as LayoutIcon, Settings, FileOutput, Languages, LayoutTemplate, FileText, ChevronRight, Globe, UserCircle } from 'lucide-react';
import { AppState, SupportedLanguage } from '../types';
import { translations } from '../utils/translations';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppState['view'];
  onChangeView: (view: AppState['view']) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文 (简体)'
};

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, language, onLanguageChange }) => {
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.nav.dashboard, icon: LayoutIcon },
    { id: 'profile', label: t.nav.profile, icon: UserCircle },
    { id: 'editor', label: t.nav.data, icon: FileText },
    { id: 'templates', label: t.nav.templates, icon: LayoutTemplate },
    { id: 'preview', label: t.nav.preview, icon: FileOutput },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex font-sans selection:bg-indigo-500/30 selection:text-indigo-900 overflow-hidden relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Premium Background Effects --- */}
      <div className="fixed inset-0 z-[-1] bg-[#fbfbfd]">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* Sidebar - Sticky Glass */}
      <aside className={`w-20 lg:w-72 fixed h-screen z-50 flex flex-col ${language === 'ar' ? 'border-l left-auto right-0' : 'border-r left-0'} border-white/50 bg-white/60 backdrop-blur-xl transition-all duration-300 shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)]`}>
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-gray-900/20 ring-1 ring-white/50">
            R
          </div>
          <div className="mx-4 flex-col hidden lg:flex">
             <span className="font-bold text-lg tracking-tight text-gray-900">Resume<span className="text-indigo-500">AI</span></span>
             <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Pro Builder</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                currentView === item.id 
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              <item.icon className={`w-5 h-5 relative z-10 ${currentView === item.id ? 'text-white' : 'group-hover:text-indigo-600'} transition-colors`} />
              <span className={`mx-3 font-medium text-sm hidden lg:block relative z-10 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{item.label}</span>
              
              {currentView === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-100 z-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Improved Language Selector */}
        <div className="p-4 border-t border-gray-100/50 bg-white/30 backdrop-blur-sm">
           <div className="relative group">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center text-gray-600">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                     <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Language</span>
                     <span className="text-xs font-semibold text-gray-700">{LANGUAGE_LABELS[language]}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 hidden lg:block rotate-90" />
              </div>
              
              {/* Invisible Select Overlay for Interaction */}
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${language === 'ar' ? 'mr-20 lg:mr-72' : 'ml-20 lg:ml-72'} relative min-h-screen overflow-x-hidden overflow-y-auto`}>
        <div className="max-w-7xl mx-auto p-6 lg:p-12 pb-32">
          {children}
        </div>
      </main>
    </div>
  );
};