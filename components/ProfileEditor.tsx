import React, { useRef } from 'react';
import { Card, Input, TextArea, Button } from './UI';
import { ResumeData, SupportedLanguage, EducationItem } from '../types';
import { translations } from '../utils/translations';
import { Plus, Trash2, Camera, Upload, GraduationCap } from 'lucide-react';

interface ProfileEditorProps {
  resumeData: ResumeData;
  onUpdate: (data: Partial<ResumeData>) => void;
  language: SupportedLanguage;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ resumeData, onUpdate, language }) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = (field: keyof ResumeData['profile'], value: string) => {
    onUpdate({
      profile: { ...resumeData.profile, [field]: value }
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Education Helpers
  const addEducation = () => {
    const newEdu: EducationItem = { id: crypto.randomUUID(), school: 'New University', degree: 'Degree', year: '2025' };
    onUpdate({ education: [newEdu, ...resumeData.education] }); // Add to top
  };
  const updateEducation = (id: string, field: keyof EducationItem, value: string) => {
    const updated = resumeData.education.map(e => e.id === id ? { ...e, [field]: value } : e);
    onUpdate({ education: updated });
  };
  const removeEducation = (id: string) => {
    onUpdate({ education: resumeData.education.filter(e => e.id !== id) });
  };

  // Skill Helpers
  const updateSkills = (val: string) => {
    onUpdate({ skills: val.split(',').map(s => s.trim()).filter(Boolean) });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.profile.title}</h2>
        <p className="text-gray-500 mt-1">{t.profile.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: AVATAR & PERSONAL DETAILS */}
        <div className="space-y-8">
            <Card>
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  {t.profile.personal}
                </h3>
                
                {/* Avatar Upload */}
                <div className="flex justify-center mb-8">
                  <div 
                    className="relative group w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden border-4 border-white shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                     {resumeData.profile.avatar ? (
                       <img src={resumeData.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <Camera className="w-8 h-8 text-gray-400" />
                     )}
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                     </div>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleAvatarUpload}
                     />
                  </div>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Name" 
                    value={resumeData.profile.name} 
                    onChange={e => updateProfile('name', e.target.value)} 
                  />
                  <Input 
                    label="Email" 
                    value={resumeData.profile.email} 
                    onChange={e => updateProfile('email', e.target.value)} 
                  />
                  <Input 
                    label="Phone" 
                    value={resumeData.profile.phone} 
                    onChange={e => updateProfile('phone', e.target.value)} 
                  />
                  <Input 
                    label="Location" 
                    value={resumeData.profile.location} 
                    onChange={e => updateProfile('location', e.target.value)} 
                  />
                  <div>
                    <TextArea 
                      label="Professional Summary / Self Evaluation" 
                      rows={6}
                      value={resumeData.profile.summary} 
                      onChange={e => updateProfile('summary', e.target.value)} 
                    />
                  </div>
                </div>
            </Card>
        </div>

        {/* RIGHT COLUMN: EDUCATION & SKILLS */}
        <div className="space-y-8">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">{t.profile.education}</h3>
                </div>
                
                <div className="space-y-4">
                    {resumeData.education.map(edu => (
                        <div key={edu.id} className="p-4 bg-gray-50 rounded-xl relative group border border-gray-100 transition-all hover:shadow-md">
                          <div className="grid grid-cols-1 gap-3">
                              <input 
                              className="bg-transparent font-bold text-gray-900 text-sm outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 -mx-1" 
                              value={edu.school} 
                              placeholder="University / School"
                              onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} 
                              />
                              <input 
                                  className="bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 -mx-1" 
                                  value={edu.degree} 
                                  placeholder="Degree (e.g. Ph.D, B.S.)"
                                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} 
                              />
                              <input 
                                  className="bg-transparent text-xs text-gray-400 outline-none placeholder:text-gray-300 font-mono focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 -mx-1" 
                                  value={edu.year} 
                                  placeholder="Year"
                                  onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} 
                              />
                          </div>
                          <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    ))}
                    
                    <Button 
                      variant="secondary" 
                      className="w-full border-dashed border-2 py-3 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50" 
                      onClick={addEducation}
                      icon={<Plus className="w-4 h-4"/>}
                    >
                      Add Education
                    </Button>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-gray-900 mb-4">{t.profile.skills}</h3>
                <TextArea 
                label="Comma separated list"
                value={resumeData.skills.join(', ')}
                onChange={(e) => updateSkills(e.target.value)}
                rows={6}
                className="bg-gray-50 border-gray-100"
                />
            </Card>
        </div>
      </div>
    </div>
  );
};