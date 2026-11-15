import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  FolderGit2, 
  Award, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Eye
} from 'lucide-react';
import { StructuredResume, ExperienceEntry, EducationEntry, ProjectEntry, SkillCategory, CustomSection } from '../types/resume';
import { ResumePreviewA4 } from './ResumePreviewA4';
import { RESUME_TEMPLATES } from '../data/templates';
import { exportResumeToPdf } from '../utils/pdfExport';
import { exportResumeToDocx } from '../utils/docxExport';
import { useAuth } from '../firebase/AuthContext';

interface CvBuilderViewProps {
  initialData: StructuredResume;
  templateId: string;
  onSaveCv: (data: StructuredResume, title: string) => void;
  onBackToTemplates: () => void;
  onRequireAuth?: (title: string, proceed: () => void) => void;
}

interface SectionTabConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTION_TABS: SectionTabConfig[] = [
  { 
    id: 'personal', 
    label: 'Personal Info', 
    shortLabel: 'Personal',
    icon: User,
    description: 'Recruiters and ATS parsers extract these contact details first. Ensure phone and email are accurate.'
  },
  { 
    id: 'summary', 
    label: 'Summary', 
    shortLabel: 'Summary',
    icon: FileText,
    description: 'Highlight your core domain expertise, years of experience, and quantifiable achievements in 3-4 impactful sentences.'
  },
  { 
    id: 'experience', 
    label: 'Experience', 
    shortLabel: 'Experience',
    icon: Briefcase,
    description: 'Describe your professional achievements with action verbs, quantifiable metrics, and high-impact bullets.'
  },
  { 
    id: 'education', 
    label: 'Education', 
    shortLabel: 'Education',
    icon: GraduationCap,
    description: 'List your university degrees, GPA/percentage honors, graduation dates, and academic institutions.'
  },
  { 
    id: 'skills', 
    label: 'Skills', 
    shortLabel: 'Skills',
    icon: Cpu,
    description: 'Categorize your technical proficiencies, frameworks, cloud platforms, and product competencies.'
  },
  { 
    id: 'projects', 
    label: 'Projects', 
    shortLabel: 'Projects',
    icon: FolderGit2,
    description: 'Showcase real-world software, open-source repositories, or business initiatives with measurable outcomes.'
  },
  { 
    id: 'certifications', 
    label: 'Certifications', 
    shortLabel: 'Certs',
    icon: Award,
    description: 'Industry-recognized credentials, AWS certifications, Scrum credentials, and specialized licenses.'
  },
  { 
    id: 'additional', 
    label: 'Custom Section', 
    shortLabel: 'Custom',
    icon: Plus,
    description: 'Add publications, patents, awards, volunteer leadership, languages, or personal interests.'
  },
];

export const CvBuilderView: React.FC<CvBuilderViewProps> = ({
  initialData,
  templateId,
  onSaveCv,
  onBackToTemplates,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<StructuredResume>({
    ...initialData,
    templateId: templateId || 'template-pm',
    customSections: initialData.customSections || [],
  });

  const [cvTitle, setCvTitle] = useState<string>(
    initialData.name ? `${initialData.name}'s Resume` : 'My Professional Resume'
  );

  const [activeSection, setActiveSection] = useState<string>('personal');
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  const currentTemplate = RESUME_TEMPLATES.find(t => t.id === data.templateId) || RESUME_TEMPLATES[0];

  const handleSave = () => {
    onSaveCv(data, cvTitle);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const executeDownload = async () => {
    await exportResumeToPdf(
      data,
      `${cvTitle.replace(/\s+/g, '_')}.pdf`,
      data.language || 'en'
    );
  };

  const handleDownloadPdf = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your Resume', executeDownload);
      }
      return;
    }
    executeDownload();
  };

  const executeDownloadDocx = async () => {
    await exportResumeToDocx(
      data,
      `${cvTitle.replace(/\s+/g, '_')}.docx`,
      data.language || 'en'
    );
  };

  const handleDownloadDocx = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your DOCX Resume', executeDownloadDocx);
      }
      return;
    }
    executeDownloadDocx();
  };

  // Section navigation helpers
  const currentSectionIndex = SECTION_TABS.findIndex(s => s.id === activeSection);
  const currentSection = SECTION_TABS[currentSectionIndex] || SECTION_TABS[0];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === SECTION_TABS.length - 1;
  const nextSection = !isLastSection ? SECTION_TABS[currentSectionIndex + 1] : null;
  const prevSection = !isFirstSection ? SECTION_TABS[currentSectionIndex - 1] : null;

  const handlePrevSection = () => {
    if (prevSection) {
      setActiveSection(prevSection.id);
    }
  };

  const handleSaveAndNext = () => {
    handleSave();
    if (nextSection) {
      setActiveSection(nextSection.id);
    } else {
      handleDownloadPdf();
    }
  };

  // Entry counters helper
  const getSectionBadge = (id: string) => {
    switch (id) {
      case 'experience': return data.experience.length;
      case 'education': return data.education.length;
      case 'skills': return data.skills.length;
      case 'projects': return data.projects.length;
      case 'certifications': return data.certifications.length;
      case 'additional': return (data.customSections || []).length;
      default: return null;
    }
  };

  // Form manipulation handlers
  const addExperience = () => {
    const newEntry: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      role: 'New Position',
      company: 'Company Name',
      startDate: '2023',
      endDate: 'Present',
      bullets: ['Spearheaded strategic initiatives resulting in measurable performance improvement.'],
    };
    setData({ ...data, experience: [newEntry, ...data.experience] });
  };

  const removeExperience = (id: string) => {
    setData({ ...data, experience: data.experience.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, val: any) => {
    setData({
      ...data,
      experience: data.experience.map(e => e.id === id ? { ...e, [field]: val } : e),
    });
  };

  const addEducation = () => {
    const newEntry: EducationEntry = {
      id: `edu-${Date.now()}`,
      degree: 'B.S. in Computer Science',
      institution: 'University Name',
      duration: '2019--2023',
      details: 'GPA: 3.8/4.0',
    };
    setData({ ...data, education: [...data.education, newEntry] });
  };

  const removeEducation = (id: string) => {
    setData({ ...data, education: data.education.filter(e => e.id !== id) });
  };

  const addProject = () => {
    const newEntry: ProjectEntry = {
      id: `proj-${Date.now()}`,
      title: 'New Project Title',
      subtitle: 'Technical Project | 2024',
      linkText: 'GitHub',
      linkUrl: '',
      bullets: ['Architected and delivered full-stack production application.'],
    };
    setData({ ...data, projects: [...data.projects, newEntry] });
  };

  const removeProject = (id: string) => {
    setData({ ...data, projects: data.projects.filter(p => p.id !== id) });
  };

  const addSkillCategory = () => {
    const newSkill: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'New Category',
      items: ['Skill 1', 'Skill 2'],
    };
    setData({ ...data, skills: [...data.skills, newSkill] });
  };

  const removeSkillCategory = (id: string) => {
    setData({ ...data, skills: data.skills.filter(s => s.id !== id) });
  };

  const addCustomSection = (title: string = 'Honors & Awards') => {
    const newSec: CustomSection = {
      id: `custom-${Date.now()}`,
      title,
      content: 'Details and achievements...',
    };
    setData({
      ...data,
      customSections: [...(data.customSections || []), newSec],
    });
  };

  const SectionIcon = currentSection.icon;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:overflow-hidden bg-[#F7F9FC] text-[#182230]">
      {/* Top Builder Control Header */}
      <div className="bg-white border-b border-[#E5EAF0] px-3 sm:px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToTemplates}
            className="btn-interactive min-h-[36px] p-1.5 hover:bg-[#F7F9FC] rounded-[8px] text-slate-600 hover:text-[#173B65] flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
            title="Change Template"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <div className="h-4 w-[1px] bg-[#E5EAF0] hidden sm:block"></div>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              type="text"
              value={cvTitle}
              onChange={(e) => setCvTitle(e.target.value)}
              className="text-xs sm:text-sm font-bold text-[#173B65] bg-transparent hover:bg-[#F7F9FC] focus:bg-white border border-transparent hover:border-[#E5EAF0] focus:border-[#3978B8] rounded-[8px] px-2 py-1 transition-colors outline-none w-full max-w-[220px] sm:max-w-[300px] truncate"
              title="Click to rename your CV"
            />
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <span>·</span>
              <span className="font-medium text-[#182230]">{currentTemplate.name}</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">
                {currentTemplate.parsingProfile}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Quick template switcher */}
          <select
            value={data.templateId}
            onChange={(e) => setData(prev => ({ ...prev, templateId: e.target.value }))}
            aria-label="Resume template"
            className="min-h-[36px] text-xs bg-white border border-[#E5EAF0] rounded-[10px] px-2.5 py-1.5 text-[#182230] font-semibold focus:outline-none focus:border-[#3978B8] flex-1 sm:flex-initial min-w-0 max-w-full"
          >
            {RESUME_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn-interactive min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#3978B8]" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            className="btn-interactive min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5 cursor-pointer"
            title="Download Word (.docx)"
          >
            <Download className="w-3.5 h-3.5 text-[#3978B8]" />
            <span>DOCX</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-interactive min-h-[36px] px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5 cursor-pointer"
          >
            {isSavedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavedNotice ? 'Saved!' : 'Save CV'}</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Pane Switcher (< lg) */}
      <div className="lg:hidden bg-[#F7F9FC] border-b border-[#E5EAF0] px-3 py-2 shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-[#E5EAF0] rounded-[10px]">
          <button
            type="button"
            onClick={() => setMobilePane('editor')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mobilePane === 'editor'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Form Sections</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('preview')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mobilePane === 'preview'
                ? 'bg-[#173B65] text-white'
                : 'text-slate-600 hover:text-[#173B65]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live A4 Preview</span>
          </button>
        </div>
      </div>

      {/* Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden">
        {/* LEFT SIDE: Dynamic Resume Form */}
        <div
          className={`w-full lg:w-1/2 lg:h-full bg-white lg:border-r border-[#E5EAF0] flex-col lg:overflow-hidden ${
            mobilePane === 'editor' ? 'flex flex-1 min-h-0' : 'hidden lg:flex'
          }`}
        >
          
          {/* Section Navigation Tabs */}
          <div 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex items-center gap-1 overflow-x-auto p-2 px-3 border-b border-[#E5EAF0] bg-[#F7F9FC] no-scrollbar text-xs shrink-0 [&::-webkit-scrollbar]:hidden"
          >
            {SECTION_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeSection === tab.id;
              const count = getSectionBadge(tab.id);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-3 py-1.5 rounded-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#173B65] text-white font-semibold'
                      : 'text-slate-600 hover:text-[#173B65] hover:bg-white'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#3978B8]'}`} />
                  <span>{tab.label}</span>
                  {count !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E5EAF0] text-[#173B65]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Content Area: Scrollable */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5">
            {/* Polished Section Header Banner */}
            <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E5EAF0]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[10px] bg-[#F7F9FC] text-[#3978B8] border border-[#E5EAF0]">
                  <SectionIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#173B65] leading-tight">
                    {currentSection.label}
                  </h2>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-normal max-w-lg">
                    {currentSection.description}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#173B65] bg-[#F7F9FC] border border-[#E5EAF0] px-2 py-0.5 rounded-[8px] font-mono shrink-0">
                Step {currentSectionIndex + 1} of {SECTION_TABS.length}
              </span>
            </div>

            {/* 1. PERSONAL INFO */}
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.name}
                        placeholder="e.g. Alex Morgan"
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Professional Headline</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.targetRoleHeadline}
                        placeholder="e.g. Product Manager | Cloud Platforms"
                        onChange={(e) => setData({ ...data, targetRoleHeadline: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={data.contact.email}
                        placeholder="alex.morgan@example.com"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, email: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.contact.phone}
                        placeholder="(555) 019-2834"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, phone: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Location / City</label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.contact.location}
                        placeholder="San Francisco, CA"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, location: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">LinkedIn Profile URL</label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.contact.linkedin}
                        placeholder="https://linkedin.com/in/alexmorgan"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, linkedin: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">GitHub / Portfolio URL</label>
                    <div className="relative">
                      <Github className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.contact.github}
                        placeholder="https://github.com/alexmorgan"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, github: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#182230] block mb-1.5">Personal Website</label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={data.contact.website || ''}
                        placeholder="https://yourportfolio.com"
                        onChange={(e) => setData({
                          ...data,
                          contact: { ...data.contact, website: e.target.value }
                        })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#E5EAF0] rounded-[10px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none transition-all text-[#182230] placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SUMMARY */}
            {activeSection === 'summary' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#182230] block">Executive / Professional Summary</label>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">{data.summary.length} characters</span>
                </div>
                <textarea
                  rows={8}
                  value={data.summary}
                  onChange={(e) => setData({ ...data, summary: e.target.value })}
                  placeholder="Introduce your core skills, years of experience, notable accomplishments, and career value proposition..."
                  className="w-full text-xs p-3.5 bg-white border border-[#E5EAF0] rounded-[12px] focus:ring-1 focus:ring-[#3978B8] focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230] placeholder:text-slate-400"
                />
                <div className="p-3.5 bg-[#F7F9FC] rounded-[10px] border border-[#E5EAF0] text-[11px] text-[#173B65] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#3978B8] shrink-0 mt-0.5" />
                  <p>
                    <strong>ATS Tip:</strong> Include industry keywords matching your target job titles (e.g., <em>0→1 SaaS Platform Launches, SQL Telemetry, Agile Delivery</em>) directly in your summary.
                  </p>
                </div>
              </div>
            )}

            {/* 3. EXPERIENCE */}
            {activeSection === 'experience' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#173B65]">Work History &amp; Roles</span>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn-interactive text-xs font-semibold text-[#173B65] hover:bg-[#173B65] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                {data.experience.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                    <p className="font-semibold text-[#173B65]">No work experience added yet</p>
                    <p>Click &ldquo;Add Position&rdquo; above to list your roles, internships, or leadership experience.</p>
                  </div>
                ) : (
                  data.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-3 bg-white hover:border-[#3978B8]/50 transition-colors">
                      <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2">
                        <span className="text-xs font-bold text-[#173B65] flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#F7F9FC] border border-[#E5EAF0] text-[#173B65] text-[10px] flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{exp.role || 'New Position'} at {exp.company || 'Company'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Job Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate}
                            placeholder="e.g. 2022"
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">End Date</label>
                          <input
                            type="text"
                            value={exp.endDate}
                            placeholder="e.g. Present"
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">Achievement Bullets</label>
                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-start">
                            <span className="text-slate-400 mt-2 select-none text-xs">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => {
                                const updatedBullets = [...exp.bullets];
                                updatedBullets[bIdx] = e.target.value;
                                updateExperience(exp.id, 'bullets', updatedBullets);
                              }}
                              className="flex-1 text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedBullets = exp.bullets.filter((_, i) => i !== bIdx);
                                updateExperience(exp.id, 'bullets', updatedBullets);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1.5 mt-1"
                              title="Delete bullet"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateExperience(exp.id, 'bullets', [...exp.bullets, ''])}
                          className="text-[11px] text-[#3978B8] hover:text-[#173B65] font-semibold flex items-center gap-1 mt-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet Point</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. EDUCATION */}
            {activeSection === 'education' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#173B65]">Degrees &amp; Qualifications</span>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="btn-interactive text-xs font-semibold text-[#173B65] hover:bg-[#173B65] hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Degree</span>
                  </button>
                </div>

                {data.education.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                    <p className="font-semibold text-[#173B65]">No education entries yet</p>
                    <p>Click &ldquo;Add Degree&rdquo; to include your university, degree, and graduation timeline.</p>
                  </div>
                ) : (
                  data.education.map((edu) => (
                    <div key={edu.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-3 bg-white">
                      <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2">
                        <span className="text-xs font-bold text-[#173B65] truncate">{edu.degree || 'Degree'}</span>
                        <button
                          type="button"
                          onClick={() => removeEducation(edu.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                          title="Remove Degree"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Degree &amp; Major</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = data.education.map(item => item.id === edu.id ? { ...item, degree: e.target.value } : item);
                              setData({ ...data, education: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">University / College</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const updated = data.education.map(item => item.id === edu.id ? { ...item, institution: e.target.value } : item);
                              setData({ ...data, education: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Years Attended</label>
                          <input
                            type="text"
                            value={edu.duration}
                            placeholder="e.g. 2018--2022"
                            onChange={(e) => {
                              const updated = data.education.map(item => item.id === edu.id ? { ...item, duration: e.target.value } : item);
                              setData({ ...data, education: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">GPA / Honors</label>
                          <input
                            type="text"
                            value={edu.details}
                            placeholder="e.g. GPA: 3.85/4.00"
                            onChange={(e) => {
                              const updated = data.education.map(item => item.id === edu.id ? { ...item, details: e.target.value } : item);
                              setData({ ...data, education: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. SKILLS */}
            {activeSection === 'skills' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#173B65]">Skill Categories &amp; Tools</span>
                  <button
                    type="button"
                    onClick={addSkillCategory}
                    className="btn-interactive text-xs font-semibold text-[#173B65] hover:bg-[#173B65] hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                {data.skills.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                    <p className="font-semibold text-[#173B65]">No skill categories added yet</p>
                    <p>Click &ldquo;Add Category&rdquo; to organize your technical tools and domain skills.</p>
                  </div>
                ) : (
                  data.skills.map((skill, idx) => (
                    <div key={skill.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-2.5 bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={skill.category}
                          onChange={(e) => {
                            const updated = [...data.skills];
                            updated[idx].category = e.target.value;
                            setData({ ...data, skills: updated });
                          }}
                          className="text-xs font-bold text-[#173B65] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] px-2.5 py-1.5 focus:bg-white focus:border-[#3978B8] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkillCategory(skill.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                          title="Remove Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={skill.items.join(', ')}
                        placeholder="Comma-separated items (e.g. Python, SQL, Tableau, Mixpanel)"
                        onChange={(e) => {
                          const updated = [...data.skills];
                          updated[idx].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setData({ ...data, skills: updated });
                        }}
                        className="w-full text-xs p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 6. PROJECTS */}
            {activeSection === 'projects' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#173B65]">Key Projects &amp; Repos</span>
                  <button
                    type="button"
                    onClick={addProject}
                    className="btn-interactive text-xs font-semibold text-[#173B65] hover:bg-[#173B65] hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#F7F9FC] border border-[#E5EAF0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {data.projects.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] space-y-2">
                    <p className="font-semibold text-[#173B65]">No projects added yet</p>
                    <p>Click &ldquo;Add Project&rdquo; to showcase products, technical builds, or case studies.</p>
                  </div>
                ) : (
                  data.projects.map((proj, idx) => (
                    <div key={proj.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-3 bg-white">
                      <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2">
                        <span className="text-xs font-bold text-[#173B65] truncate">{proj.title || 'Project'}</span>
                        <button
                          type="button"
                          onClick={() => removeProject(proj.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                          title="Remove Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Project Name</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[idx].title = e.target.value;
                              setData({ ...data, projects: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Subtitle / Timeline</label>
                          <input
                            type="text"
                            value={proj.subtitle}
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[idx].subtitle = e.target.value;
                              setData({ ...data, projects: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Repository / Live URL</label>
                          <input
                            type="text"
                            value={proj.linkUrl || ''}
                            placeholder="https://github.com/..."
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[idx].linkUrl = e.target.value;
                              setData({ ...data, projects: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Link Badge Label</label>
                          <input
                            type="text"
                            value={proj.linkText || 'GitHub'}
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[idx].linkText = e.target.value;
                              setData({ ...data, projects: updated });
                            }}
                            className="w-full text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none text-[#182230]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">Project Description Bullets</label>
                        {proj.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-start">
                            <span className="text-slate-400 mt-2 text-xs">•</span>
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => {
                                const updated = [...data.projects];
                                updated[idx].bullets[bIdx] = e.target.value;
                                setData({ ...data, projects: updated });
                              }}
                              className="flex-1 text-xs p-2 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...data.projects];
                            updated[idx].bullets.push('');
                            setData({ ...data, projects: updated });
                          }}
                          className="text-[11px] text-[#3978B8] hover:text-[#173B65] font-semibold flex items-center gap-1 mt-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Project Bullet</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 7. CERTIFICATIONS */}
            {activeSection === 'certifications' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#173B65] block">Licenses &amp; Certifications</span>
                {data.certifications.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
                    No certifications recorded in this template yet.
                  </div>
                ) : (
                  data.certifications.map((cert, idx) => (
                    <div key={cert.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-2 bg-white">
                      <span className="text-xs font-bold text-[#173B65] block">{cert.category}</span>
                      <textarea
                        rows={3}
                        value={cert.items.join(' | ')}
                        placeholder="Separated by | (e.g. AWS Certified Solutions Architect | Scrum Master Certified)"
                        onChange={(e) => {
                          const updated = [...data.certifications];
                          updated[idx].items = e.target.value.split('|').map(c => c.trim()).filter(Boolean);
                          setData({ ...data, certifications: updated });
                        }}
                        className="w-full text-xs p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 8. ADDITIONAL CUSTOM SECTIONS */}
            {activeSection === 'additional' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#173B65]">Custom Sections</span>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => addCustomSection('Awards & Honors')}
                      className="btn-interactive px-2.5 py-1 bg-[#F7F9FC] hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] rounded-[8px] text-[#173B65] font-semibold text-[11px] transition-colors"
                    >
                      + Awards
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomSection('Publications')}
                      className="btn-interactive px-2.5 py-1 bg-[#F7F9FC] hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] rounded-[8px] text-[#173B65] font-semibold text-[11px] transition-colors"
                    >
                      + Publications
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomSection('Languages')}
                      className="btn-interactive px-2.5 py-1 bg-[#F7F9FC] hover:bg-[#173B65] hover:text-white border border-[#E5EAF0] rounded-[8px] text-[#173B65] font-semibold text-[11px] transition-colors"
                    >
                      + Languages
                    </button>
                  </div>
                </div>

                {(data.customSections || []).length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC]">
                    No custom sections added yet. Click one of the buttons above to add Awards, Languages, or Publications.
                  </div>
                ) : (
                  (data.customSections || []).map((sec, idx) => (
                    <div key={sec.id} className="p-4 border border-[#E5EAF0] rounded-[12px] space-y-2.5 bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const updated = [...(data.customSections || [])];
                            updated[idx].title = e.target.value;
                            setData({ ...data, customSections: updated });
                          }}
                          className="text-xs font-bold text-[#173B65] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] px-2.5 py-1 focus:bg-white focus:border-[#3978B8] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(data.customSections || [])];
                            updated.splice(idx, 1);
                            setData({ ...data, customSections: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                          title="Delete Custom Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={sec.content}
                        onChange={(e) => {
                          const updated = [...(data.customSections || [])];
                          updated[idx].content = e.target.value;
                          setData({ ...data, customSections: updated });
                        }}
                        className="w-full text-xs p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] focus:bg-white focus:border-[#3978B8] focus:outline-none leading-relaxed text-[#182230]"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* In-Flow Section Action Bar */}
            <div className="pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F7F9FC] p-4 rounded-[12px] border border-[#E5EAF0]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isFirstSection && (
                  <button
                    type="button"
                    onClick={handlePrevSection}
                    className="btn-interactive flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-[#182230] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Previous: {prevSection?.shortLabel}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-interactive flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] flex items-center justify-center gap-1.5"
                  title="Save progress to your account"
                >
                  {isSavedNotice ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Save className="w-3.5 h-3.5 text-[#3978B8]" />}
                  <span>{isSavedNotice ? 'Saved!' : 'Save Progress'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="btn-interactive w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center justify-center gap-2"
              >
                {isLastSection ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save &amp; Finish CV</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Next: {nextSection?.shortLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sticky Bottom Form Action Bar */}
          <div className="p-3.5 px-4 sm:px-5 bg-white border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
            {/* Left: Previous Button & Step Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handlePrevSection}
                disabled={isFirstSection}
                className={`px-3 py-2 text-xs font-semibold rounded-[10px] flex items-center gap-1.5 transition-colors border ${
                  isFirstSection
                    ? 'bg-[#F7F9FC] border-[#E5EAF0] text-slate-300 cursor-not-allowed'
                    : 'bg-white border-[#E5EAF0] text-[#182230] hover:bg-[#F7F9FC]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="hidden sm:flex flex-col">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  Step {currentSectionIndex + 1} of {SECTION_TABS.length}
                </span>
                <span className="text-[11.5px] font-bold text-[#173B65]">
                  {currentSection.label}
                </span>
              </div>
            </div>

            {/* Center: Completion Progress Meter */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[#F7F9FC] rounded-full overflow-hidden border border-[#E5EAF0]">
                <div 
                  style={{ width: `${((currentSectionIndex + 1) / SECTION_TABS.length) * 100}%` }}
                  className="h-full bg-[#3978B8] transition-all duration-300 rounded-full"
                />
              </div>
              <span className="text-[10.5px] font-mono text-slate-500 font-semibold tabular-nums">
                {Math.round(((currentSectionIndex + 1) / SECTION_TABS.length) * 100)}%
              </span>
            </div>

            {/* Right: Save Progress & Save and Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="btn-interactive px-3 py-2 text-xs font-semibold text-[#182230] bg-[#F7F9FC] hover:bg-[#E5EAF0]/60 border border-[#E5EAF0] rounded-[10px] flex items-center gap-1.5"
                title="Save progress to your account"
              >
                {isSavedNotice ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Save className="w-3.5 h-3.5 text-[#3978B8]" />}
                <span>{isSavedNotice ? 'Saved!' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="btn-interactive px-4 py-2 text-xs font-bold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center gap-1.5"
              >
                {isLastSection ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save &amp; Finish CV</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Next: {nextSection?.shortLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Live A4 Resume Preview */}
        <div
          className={`w-full lg:w-1/2 lg:h-full lg:overflow-hidden ${
            mobilePane === 'preview' ? 'flex-1 min-h-[540px]' : 'hidden lg:block'
          }`}
        >
          <ResumePreviewA4
            data={data}
            targetRole={data.targetRoleHeadline}
            onRequireAuth={onRequireAuth}
          />
        </div>
      </div>
    </div>
  );
};
