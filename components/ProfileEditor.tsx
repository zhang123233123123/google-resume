import React, { useRef, useState } from 'react';
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
  const cropImageRef = useRef<HTMLImageElement>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropDragOffset, setCropDragOffset] = useState({ x: 0, y: 0 });
  const [cropImageSize, setCropImageSize] = useState<{ width: number; height: number } | null>(null);

  const CROP_SIZE = 240;

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
        setCropSrc(reader.result as string);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setCropImageSize(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const clampOffset = (offset: { x: number; y: number }, zoom = cropZoom) => {
    if (!cropImageSize) return offset;
    const baseScale = Math.max(CROP_SIZE / cropImageSize.width, CROP_SIZE / cropImageSize.height);
    const scale = baseScale * zoom;
    const displayWidth = cropImageSize.width * scale;
    const displayHeight = cropImageSize.height * scale;
    const maxX = Math.max(0, (displayWidth - CROP_SIZE) / 2);
    const maxY = Math.max(0, (displayHeight - CROP_SIZE) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y))
    };
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropImageSize) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropDragStart({ x: event.clientX, y: event.clientY });
    setCropDragOffset(cropOffset);
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropDragStart) return;
    const nextOffset = {
      x: cropDragOffset.x + (event.clientX - cropDragStart.x),
      y: cropDragOffset.y + (event.clientY - cropDragStart.y)
    };
    setCropOffset(clampOffset(nextOffset));
  };

  const handleCropPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (cropDragStart) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setCropDragStart(null);
  };

  const handleCropZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = Number(event.target.value);
    setCropZoom(nextZoom);
    setCropOffset((prev) => clampOffset(prev, nextZoom));
  };

  const handleCropCancel = () => {
    setCropSrc(null);
  };

  const handleCropReset = () => {
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const handleCropApply = () => {
    if (!cropSrc || !cropImageSize || !cropImageRef.current) {
      setCropSrc(null);
      return;
    }

    const baseScale = Math.max(CROP_SIZE / cropImageSize.width, CROP_SIZE / cropImageSize.height);
    const scale = baseScale * cropZoom;
    const displayWidth = cropImageSize.width * scale;
    const displayHeight = cropImageSize.height * scale;
    const imageLeft = CROP_SIZE / 2 - displayWidth / 2 + cropOffset.x;
    const imageTop = CROP_SIZE / 2 - displayHeight / 2 + cropOffset.y;
    const cropX = (0 - imageLeft) / scale;
    const cropY = (0 - imageTop) / scale;
    const cropW = CROP_SIZE / scale;
    const cropH = CROP_SIZE / scale;
    const safeX = Math.max(0, Math.min(cropX, cropImageSize.width - cropW));
    const safeY = Math.max(0, Math.min(cropY, cropImageSize.height - cropH));

    const canvas = document.createElement('canvas');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      cropImageRef.current,
      safeX,
      safeY,
      cropW,
      cropH,
      0,
      0,
      outputSize,
      outputSize
    );

    updateProfile('avatar', canvas.toDataURL('image/png'));
    setCropSrc(null);
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

      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.profile.cropTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.profile.cropHint}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="relative rounded-2xl bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerLeave={handleCropPointerUp}
              >
                <img
                  ref={cropImageRef}
                  src={cropSrc}
                  alt="Crop"
                  draggable={false}
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    setCropImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                    setCropOffset({ x: 0, y: 0 });
                  }}
                  className="absolute select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                    width: cropImageSize
                      ? cropImageSize.width * Math.max(CROP_SIZE / cropImageSize.width, CROP_SIZE / cropImageSize.height) * cropZoom
                      : 'auto',
                    height: cropImageSize
                      ? cropImageSize.height * Math.max(CROP_SIZE / cropImageSize.width, CROP_SIZE / cropImageSize.height) * cropZoom
                      : 'auto'
                  }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.profile.cropZoom}</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={cropZoom}
                onChange={handleCropZoomChange}
                className="w-full accent-gray-900"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <Button variant="ghost" onClick={handleCropCancel}>{t.common.cancel}</Button>
              <Button variant="secondary" onClick={handleCropReset}>{t.preview.reset}</Button>
              <Button onClick={handleCropApply}>{t.common.save}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
