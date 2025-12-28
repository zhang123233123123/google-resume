export enum LoadingState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  OPTIMIZING = 'OPTIMIZING',
  TAILORING = 'TAILORING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export type SupportedLanguage = 'en' | 'fr' | 'pt' | 'ar' | 'zh';

export type TemplateId = 'modern' | 'classic' | 'minimalist' | 'creative' | 'executive' | 'academic' | 'bold' | 'tech' | 'elegant' | 'swiss' | 'glacial' | 'compact' | 'centric';

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string; // Original text
  highlights: string[]; // AI optimized bullet points
  location?: string;
  tags?: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  summary: string;
  location: string;
  linkedin?: string;
  website?: string;
  avatar?: string; // Base64 string
}

export interface ResumeData {
  language: SupportedLanguage;
  template: TemplateId;
  profile: ResumeProfile;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string[];
}

export interface AppState {
  view: 'home' | 'profile' | 'editor' | 'templates' | 'preview' | 'settings';
  resumeData: ResumeData;
  jobDescription: string;
  targetLanguage: SupportedLanguage;
  apiKey: string;
  apiBaseUrl: string;
  
  // AI Config
  model: string;
  customPrompt: string;
  
  loading: LoadingState;
  loadingMessage: string;
  
  // UI State
  isPreviewEditable: boolean;
}

// Initial Data
export const INITIAL_RESUME: ResumeData = {
  language: 'zh',
  template: 'modern',
  profile: {
    name: "Dr. Alex Doe",
    email: "alex.doe@example.com",
    phone: "+1 (555) 012-3456",
    location: "San Francisco, CA",
    summary: "Senior Software Engineer with 8+ years of experience in full-stack development. Proven track record of leading teams and delivering scalable solutions.",
    // Default placeholder avatar (Simple geometric person)
    avatar: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSI1MCIgZmlsbD0iIzMzNDE1NSIvPjxwYXRoIGQ9Ik0xMDAgMTMwYy01MCAwLTgwIDMwLTgwIDcwaDE2MGMwLTQwLTMwLTcwLTgwLTcweiIgZmlsbD0iIzMzNDE1NSIvPjwvc3ZnPg=="
  },
  education: [
    { id: '1', school: "Stanford University", degree: "Ph.D. Computer Science (AI & ML)", year: "2019" },
    { id: '2', school: "University of Technology", degree: "B.S. Computer Science", year: "2015" }
  ],
  experience: [],
  skills: ["React", "TypeScript", "Node.js", "System Design", "Cloud Architecture"]
};
