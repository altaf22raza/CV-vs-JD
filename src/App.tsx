import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from './i18n/translations';
import { Navbar, AppView } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MyCvsView } from './components/MyCvsView';
import { TemplateSelector } from './components/TemplateSelector';
import { CvBuilderView } from './components/CvBuilderView';
import { OptimizeWorkflow } from './components/OptimizeWorkflow';
import { EditorPanel } from './components/EditorPanel';
import { ResumePreviewA4 } from './components/ResumePreviewA4';
import { CareerToolsView, CareerToolTab } from './components/CareerToolsView';
import { ApplicationTrackerView } from './components/ApplicationTrackerView';
import { JdInputModal } from './components/JdInputModal';
import { AtsReportModal } from './components/AtsReportModal';
import { VersionCompareModal } from './components/VersionCompareModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { SaveJdModal } from './components/SaveJdModal';
import { PrivacyControlsModal } from './components/PrivacyControlsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  DEFAULT_LATEX_TEMPLATE, 
  DEFAULT_STRUCTURED_RESUME,
  SAMPLE_JOB_DESCRIPTIONS
} from './data/defaultResume';
import {
  ResumeVersion,
  StructuredResume,
  DiffItem,
  SavedJobDescription,
  ResumeSnapshot,
  JobApplication,
  ApplicationStatus,
  SupportedLanguage,
} from './types/resume';
import { RESUME_TEMPLATES } from './data/templates';
import { generateLatexFromStructured } from './utils/latexParser';
import { exportResumeToPdf } from './utils/pdfExport';
import { exportResumeToDocx } from './utils/docxExport';
import { apiOptimizeResume } from './services/geminiClient';
import { generateDetailedDiffItems } from './utils/resumeDiff';
import {
  buildDeterministicAtsReport,
  type CandidateKeywordInput,
} from './utils/atsScoring';
import { generateId } from './utils/id';
import {
  deduplicateResumeVersions,
  safeReadStorageJson,
  safeWriteStorageJson,
} from './utils/safeStorage';
import {
  saveResumeToFirestore,
  fetchUserResumes,
  deleteResumeFromFirestore,
  saveApplicationToFirestore,
  fetchUserApplications,
  deleteApplicationFromFirestore,
  deleteAllUserCloudData,
  fetchUserRetentionPreference,
  saveUserRetentionPreference,
} from './firebase/db';
import { auth } from './firebase/config';
import { 
  Sparkles, 
  Download, 
  ArrowLeft, 
  ArrowLeftRight, 
  BarChart3,
  History,
  Briefcase,
  FileDown,
  Globe,
  AlertCircle,
  Shield,
  X,
  FileText,
  Eye
} from 'lucide-react';

const INITIAL_SAMPLE_JD = SAMPLE_JOB_DESCRIPTIONS[0].text;

const INITIAL_MASTER_ATS_REPORT = buildDeterministicAtsReport({
  jdText: INITIAL_SAMPLE_JD,
  resumeData: DEFAULT_STRUCTURED_RESUME,
  candidateKeywords: [
    { keyword: 'SQL', category: 'technical' },
    { keyword: 'Python', category: 'technical' },
    { keyword: 'Product Strategy', category: 'product' },
    { keyword: 'Agile', category: 'product' },
    { keyword: 'User Research', category: 'product' },
    { keyword: 'A/B Testing', category: 'product' },
    { keyword: 'Mixpanel', category: 'tool' },
    { keyword: 'Amplitude', category: 'tool' },
    { keyword: 'Telemetry', category: 'technical' },
    { keyword: 'Cross-functional', category: 'soft' },
  ],
  strongPoints: [
    '0-to-1 B2B SaaS platform lifecycle metrics documented (15,000+ MAU, 60+ user interviews)',
    'Clear SQL, Python, and Agile delivery history across experience and projects',
  ],
});

const INITIAL_MASTER_VERSION: ResumeVersion = {
  id: 'ver-master-001',
  title: 'Sample Resume Template',
  targetRole: 'Product Manager',
  companyName: 'Nexus Cloud Technologies',
  cvType: 'created',
  templateId: 'template-pm',
  latexSource: DEFAULT_LATEX_TEMPLATE,
  originalLatex: DEFAULT_LATEX_TEMPLATE,
  structuredData: DEFAULT_STRUCTURED_RESUME,
  originalStructuredData: DEFAULT_STRUCTURED_RESUME,
  diffItems: [],
  identifiedKeywordsToAdd: [
    {
      keyword: 'A/B Testing & Experimentation',
      category: 'Product Management',
      reason: 'Frequently requested in product manager JDs to evaluate hypothesis validation',
      suggestedSection: 'Skills'
    },
    {
      keyword: 'Cross-functional Leadership',
      category: 'Product Management',
      reason: 'Essential keyword for aligning engineering, design, and business teams',
      suggestedSection: 'Skills'
    },
    {
      keyword: 'Product Analytics & SQL',
      category: 'Technical & Tools',
      reason: 'Directly validates quantitative data-driven product decision making',
      suggestedSection: 'Skills'
    }
  ],
  jdText: INITIAL_SAMPLE_JD,
  atsReport: INITIAL_MASTER_ATS_REPORT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isOriginal: true,
};

function MainApp() {
  const { user, loading, sessionExpiredNotice, clearSessionExpiredNotice } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [studioMobilePane, setStudioMobilePane] = useState<'editor' | 'preview'>('editor');
  const [creationStep, setCreationStep] = useState<'template' | 'builder'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-pm');

  const [retentionDays, setRetentionDays] = useState<number>(() =>
    safeReadStorageJson<number>(
      'resumeiq_retention_days',
      0,
      (v): v is number => typeof v === 'number' && v >= 0 && v <= 3650
    )
  );

  const [versions, setVersions] = useState<ResumeVersion[]>(() => {
    const parsed = safeReadStorageJson<ResumeVersion[]>(
      'resumeiq_versions',
      [],
      (v): v is ResumeVersion[] => Array.isArray(v)
    );
    if (parsed.length > 0) {
      const hasLegacy =
        JSON.stringify(parsed).toLowerCase().includes('altaf') ||
        JSON.stringify(parsed).toLowerCase().includes('kaksha');
      if (!hasLegacy) {
        const deduped = deduplicateResumeVersions(parsed);
        if (deduped.length > 0) return deduped;
      } else {
        localStorage.removeItem('resumeiq_versions');
      }
    }
    return [INITIAL_MASTER_VERSION];
  });

  const [activeVersionId, setActiveVersionId] = useState<string>(versions[0]?.id || INITIAL_MASTER_VERSION.id);

  // Saved Job Descriptions state (persisted safely in localStorage)
  const [savedJds, setSavedJds] = useState<SavedJobDescription[]>(() => {
    const parsed = safeReadStorageJson<SavedJobDescription[]>(
      'resumeiq_saved_jds',
      [],
      (v): v is SavedJobDescription[] => Array.isArray(v)
    );
    if (parsed.length > 0) return parsed;
    const now = new Date().toISOString();
    return SAMPLE_JOB_DESCRIPTIONS.map((s) => ({
      id: s.id,
      role: s.role,
      company: s.company,
      industry: s.industry,
      text: s.text,
      createdAt: now,
      updatedAt: now,
      isSample: true,
    }));
  });

  const [selectedJdForOptimize, setSelectedJdForOptimize] = useState<SavedJobDescription | null>(null);
  const [reportVersionForModal, setReportVersionForModal] = useState<ResumeVersion | null>(null);
  const [isSaveJdModalOpen, setIsSaveJdModalOpen] = useState<boolean>(false);
  const [editingJd, setEditingJd] = useState<SavedJobDescription | null>(null);

  // Career Prep & Applications state
  const [careerToolTab, setCareerToolTab] = useState<CareerToolTab>('cover-letter');
  const [careerToolContext, setCareerToolContext] = useState<{
    role?: string;
    company?: string;
    jdText?: string;
    resumeVersionId?: string;
  } | null>(null);

  const [applications, setApplications] = useState<JobApplication[]>(() =>
    safeReadStorageJson<JobApplication[]>(
      'resumeiq_applications',
      [],
      (v): v is JobApplication[] => Array.isArray(v)
    )
  );

  // Modals
  const [isJdModalOpen, setIsJdModalOpen] = useState<boolean>(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyVersionId, setHistoryVersionId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    onSuccess?: () => void;
  }>({ isOpen: false });

  // Processing & inline error state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [appError, setAppError] = useState<string | null>(null);

  const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0] || INITIAL_MASTER_VERSION;
  const historyTargetVersion =
    (historyVersionId ? versions.find(v => v.id === historyVersionId) : null) || activeVersion;

  const handleRequireAuth = (title: string, onProceed: () => void, subtitle?: string) => {
    setAuthModalConfig({
      isOpen: true,
      title,
      subtitle: subtitle || 'Please sign in to access this feature.',
      onSuccess: onProceed,
    });
  };

  // Persist versions, saved JDs, applications, and retention policy safely
  useEffect(() => {
    safeWriteStorageJson('resumeiq_versions', versions);
  }, [versions]);

  useEffect(() => {
    safeWriteStorageJson('resumeiq_saved_jds', savedJds);
  }, [savedJds]);

  useEffect(() => {
    safeWriteStorageJson('resumeiq_applications', applications);
  }, [applications]);

  useEffect(() => {
    safeWriteStorageJson('resumeiq_retention_days', retentionDays);
    if (retentionDays > 0) {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      setVersions((prev) => {
        const filtered = prev.filter((v) => {
          if (v.isOriginal || v.id === INITIAL_MASTER_VERSION.id) return true;
          const updatedMs = new Date(v.updatedAt || v.createdAt).getTime();
          return Number.isNaN(updatedMs) || updatedMs >= cutoff;
        });
        return filtered.length === prev.length ? prev : filtered;
      });
    }
  }, [retentionDays]);

  const handleChangeRetentionDays = (days: number) => {
    setRetentionDays(days);
    if (user && !user.isAnonymous && auth.currentUser?.uid === user.uid) {
      saveUserRetentionPreference(user.uid, days).catch(() => {
        // non-fatal
      });
    }
  };

  const handleDeleteAllUserData = async () => {
    if (user && !user.isAnonymous && auth.currentUser?.uid === user.uid) {
      await deleteAllUserCloudData(user.uid);
    }
    try {
      localStorage.removeItem('resumeiq_versions');
      localStorage.removeItem('resumeiq_saved_jds');
      localStorage.removeItem('resumeiq_applications');
      localStorage.removeItem('resumeiq_retention_days');
    } catch {
      // ignore storage errors
    }
    setVersions([INITIAL_MASTER_VERSION]);
    setActiveVersionId(INITIAL_MASTER_VERSION.id);
    setSavedJds([]);
    setApplications([]);
    setRetentionDays(0);
    setCurrentView('home');
  };

  const handleSaveJd = (jdInput: { id?: string; role: string; company: string; industry?: string; text: string }) => {
    const now = new Date().toISOString();
    if (jdInput.id) {
      setSavedJds(prev => prev.map(item =>
        item.id === jdInput.id
          ? { ...item, role: jdInput.role, company: jdInput.company, industry: jdInput.industry, text: jdInput.text, updatedAt: now }
          : item
      ));
      return;
    }

    // Avoid adding exact duplicate JD text
    const cleanText = jdInput.text.trim();
    const existing = savedJds.find(item => item.text.trim() === cleanText);
    if (existing) {
      setSavedJds(prev => prev.map(item =>
        item.id === existing.id
          ? { ...item, role: jdInput.role || item.role, company: jdInput.company || item.company, updatedAt: now }
          : item
      ));
      return;
    }

    const newJd: SavedJobDescription = {
      id: generateId('jd'),
      userId: user?.uid,
      role: jdInput.role || 'Target Role',
      company: jdInput.company || 'Target Company',
      industry: jdInput.industry,
      text: cleanText,
      createdAt: now,
      updatedAt: now,
    };
    setSavedJds(prev => [newJd, ...prev]);
  };

  const handleDeleteJd = (id: string) => {
    setSavedJds(prev => prev.filter(item => item.id !== id));
  };

  // Sync with Firestore if authenticated via Firebase Auth (deduplicated merge)
  useEffect(() => {
    if (!loading && user && !user.isAnonymous && auth.currentUser?.uid === user.uid) {
      fetchUserRetentionPreference(user.uid)
        .then((pref) => {
          if (typeof pref === 'number') setRetentionDays(pref);
        })
        .catch(() => {});

      fetchUserResumes(user.uid)
        .then(firestoreResumes => {
          if (firestoreResumes && firestoreResumes.length > 0) {
            setVersions(prev => {
              const merged = deduplicateResumeVersions([...firestoreResumes, ...prev]);
              return merged.length > 0 ? merged : firestoreResumes;
            });
            setActiveVersionId(firestoreResumes[0].id);
          } else if (activeVersion) {
            saveResumeToFirestore(activeVersion, user.uid).catch(e => console.warn('Sync failed:', e));
          }
        })
        .catch(err => {
          console.warn('Could not fetch resumes from firestore:', err);
        });

      fetchUserApplications(user.uid)
        .then(firestoreApps => {
          if (firestoreApps && firestoreApps.length > 0) {
            setApplications(firestoreApps);
          }
        })
        .catch(err => {
          console.warn('Could not fetch applications from firestore:', err);
        });
    }
  }, [user, loading]);

  // Update active version helper
  const updateActiveVersion = (updater: (prev: ResumeVersion) => ResumeVersion) => {
    setVersions(prevList => {
      const updatedList = prevList.map(v => {
        if (v.id === activeVersion.id) {
          const nextVer = updater(v);
          if (user && !user.isAnonymous) {
            saveResumeToFirestore(nextVer, user.uid).catch(e => console.warn('Sync failed:', e));
          }
          return nextVer;
        }
        return v;
      });
      return updatedList;
    });
  };

  // 1. Identify Keywords & Optimize Resume
  const executeOptimizeResume = async (jdText: string) => {
    setIsProcessing(true);
    setStatusMessage('Extracting key ATS keywords from JD & optimizing resume...');
    try {
      const res = await apiOptimizeResume({
        resumeData: activeVersion.structuredData,
        jdText,
      });

      const baselineCopy: StructuredResume = JSON.parse(
        JSON.stringify(activeVersion.structuredData)
      );
      const baselineLatex = generateLatexFromStructured(baselineCopy);
      const detailedDiffs = generateDetailedDiffItems(
        activeVersion.structuredData,
        res.optimizedData,
        res.diffItems,
        res.identifiedKeywordsToAdd
      );

      const candidateKeywords: CandidateKeywordInput[] = (res.identifiedKeywordsToAdd || []).map(
        (k) => ({
          keyword: k.keyword,
          category: 'technical',
        })
      );
      const baselineEval = buildDeterministicAtsReport({
        jdText,
        resumeData: baselineCopy,
        candidateKeywords,
      });
      const currentReport = buildDeterministicAtsReport({
        jdText,
        resumeData: baselineCopy,
        candidateKeywords,
        baselineScore: baselineEval.overallScore,
        diffItems: detailedDiffs,
      });

      // Create tailored version starting from original baseline until user accepts suggestions
      const newVersion: ResumeVersion = {
        id: generateId('ver'),
        userId: user?.uid,
        title: `Tailored CV (${new Date().toLocaleDateString()})`,
        targetRole: res.optimizedData.targetRoleHeadline || activeVersion.targetRole,
        companyName: activeVersion.companyName,
        cvType: 'optimized',
        templateId: activeVersion.templateId || 'template-pm',
        latexSource: baselineLatex,
        originalLatex: activeVersion.originalLatex,
        structuredData: baselineCopy,
        originalStructuredData: activeVersion.structuredData,
        diffItems: detailedDiffs,
        identifiedKeywordsToAdd: res.identifiedKeywordsToAdd,
        atsReport: currentReport,
        jdText,
        snapshots: [
          {
            id: generateId('snap-init'),
            timestamp: new Date().toISOString(),
            label: 'Tailoring Baseline',
            note: `${detailedDiffs.length} AI optimization suggestions generated from ${activeVersion.title}.`,
            structuredData: JSON.parse(JSON.stringify(baselineCopy)),
            latexSource: baselineLatex,
            estimatedScore: currentReport.overallScore,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOriginal: false,
      };

      setVersions(prev => deduplicateResumeVersions([newVersion, ...prev]));
      setActiveVersionId(newVersion.id);

      if (user && !user.isAnonymous) {
        saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
      }

      setIsJdModalOpen(false);
      setCurrentView('studio');
      setIsCompareModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete optimization';
      setAppError(`Optimization Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizeResume = async (jdText: string) => {
    if (!user) {
      handleRequireAuth('Sign In to Optimize Resume with AI', () => {
        void executeOptimizeResume(jdText);
      });
      return;
    }
    await executeOptimizeResume(jdText);
  };

  // 2. Add an identified keyword to candidate skills
  const handleAddKeywordToSkills = (keyword: string, categoryHint: string = 'Product Management') => {
    updateActiveVersion(prev => {
      const skills = [...prev.structuredData.skills];
      let targetCat = skills.find(s => 
        s.category.toLowerCase().includes(categoryHint.toLowerCase()) ||
        categoryHint.toLowerCase().includes(s.category.toLowerCase())
      );
      if (!targetCat) {
        targetCat = skills[0];
      }

      if (targetCat && !targetCat.items.some(it => it.toLowerCase() === keyword.toLowerCase())) {
        targetCat.items = [keyword, ...targetCat.items];
      }

      const updatedData = { ...prev.structuredData, skills };
      const newLatex = generateLatexFromStructured(updatedData);
      return {
        ...prev,
        structuredData: updatedData,
        latexSource: newLatex,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 3. Duplicate Version
  const handleDuplicateVersion = (ver: ResumeVersion) => {
    const duplicated: ResumeVersion = {
      ...ver,
      id: generateId('ver'),
      title: `${ver.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOriginal: false,
    };
    setVersions(prev => deduplicateResumeVersions([duplicated, ...prev]));
    setActiveVersionId(duplicated.id);
  };

  // 4. Delete Version
  const handleDeleteVersion = (id: string) => {
    if (versions.length <= 1) {
      setAppError('Cannot delete the last remaining resume version.');
      return;
    }
    setVersions(prev => prev.filter(v => v.id !== id));
    if (activeVersionId === id) {
      const remaining = versions.filter(v => v.id !== id);
      setActiveVersionId(remaining[0].id);
    }
    if (user && !user.isAnonymous) {
      deleteResumeFromFirestore(id).catch(e => console.warn('Delete sync failed:', e));
    }
  };

  // 5. Load Uploaded CV
  const handleLoadUploadedResume = (parsed: StructuredResume) => {
    const newLatex = generateLatexFromStructured(parsed);
    const now = new Date().toISOString();
    const uploadedVersion: ResumeVersion = {
      id: generateId('ver'),
      userId: user?.uid,
      title: `Uploaded CV (${parsed.name || 'Candidate'})`,
      targetRole: parsed.targetRoleHeadline || 'Product Manager',
      companyName: '',
      cvType: 'uploaded',
      templateId: parsed.templateId || 'template-pm',
      latexSource: newLatex,
      originalLatex: newLatex,
      structuredData: parsed,
      originalStructuredData: parsed,
      diffItems: [],
      snapshots: [
        {
          id: generateId('snap-upload'),
          timestamp: now,
          label: 'Initial Import',
          note: 'Imported from uploaded resume document.',
          structuredData: JSON.parse(JSON.stringify(parsed)),
          latexSource: newLatex,
        },
      ],
      createdAt: now,
      updatedAt: now,
      isOriginal: true,
    };

    setVersions(prev => deduplicateResumeVersions([uploadedVersion, ...prev]));
    setActiveVersionId(uploadedVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(uploadedVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
    setCurrentView('studio');
  };

  // 6. Save newly created CV from Builder
  const handleSaveCreatedCv = (createdData: StructuredResume, title: string) => {
    const newLatex = generateLatexFromStructured(createdData);
    const newVersion: ResumeVersion = {
      id: generateId('ver'),
      userId: user?.uid,
      title: title || `${createdData.name || 'New'} CV`,
      targetRole: createdData.targetRoleHeadline || 'Professional',
      companyName: '',
      cvType: 'created',
      templateId: createdData.templateId || selectedTemplateId,
      latexSource: newLatex,
      originalLatex: newLatex,
      structuredData: createdData,
      originalStructuredData: createdData,
      diffItems: [],
      snapshots: [
        {
          id: generateId('snap-create'),
          timestamp: new Date().toISOString(),
          label: 'Initial Draft',
          note: 'Created using structured CV builder.',
          structuredData: JSON.parse(JSON.stringify(createdData)),
          latexSource: newLatex,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOriginal: true,
    };

    setVersions(prev => deduplicateResumeVersions([newVersion, ...prev]));
    setActiveVersionId(newVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
  };

  // 7. Save newly optimized CV from Optimize Workflow
  const handleSaveOptimizedCv = (newVersion: ResumeVersion) => {
    setVersions(prev => deduplicateResumeVersions([newVersion, ...prev]));
    setActiveVersionId(newVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
  };

  // 8. Restore original (preserving current live draft as a history checkpoint)
  const handleRestoreOriginal = () => {
    updateActiveVersion(prev => {
      const backupSnap: ResumeSnapshot = {
        id: generateId('snap-restore'),
        timestamp: new Date().toISOString(),
        label: 'Before Restore Original',
        note: 'Automatic checkpoint saved prior to resetting to baseline.',
        structuredData: JSON.parse(JSON.stringify(prev.structuredData)),
        latexSource: prev.latexSource,
        estimatedScore: prev.atsReport?.overallScore,
      };
      return {
        ...prev,
        structuredData: prev.originalStructuredData,
        latexSource: prev.originalLatex,
        diffItems: prev.diffItems.map(d => ({ ...d, status: 'rejected' })),
        snapshots: [backupSnap, ...(prev.snapshots || [])].slice(0, 15),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const recomputeVersionAtsReport = (
    ver: ResumeVersion,
    nextData: StructuredResume,
    nextDiffs: DiffItem[]
  ) => {
    if (!ver.jdText) return ver.atsReport;
    const candidates: CandidateKeywordInput[] = [
      ...(ver.atsReport?.matchedKeywords || []).map((k) => ({
        keyword: k.keyword,
        category: k.category,
      })),
      ...(ver.atsReport?.missingKeywords || []).map((k) => ({
        keyword: k.keyword,
        category: k.category,
      })),
      ...(ver.identifiedKeywordsToAdd || []).map((k) => ({
        keyword: k.keyword,
        category: 'technical' as const,
      })),
    ];
    return buildDeterministicAtsReport({
      jdText: ver.jdText,
      resumeData: nextData,
      candidateKeywords: candidates,
      aiExperienceScore: ver.atsReport?.experienceMatch,
      aiExperienceAssessment: ver.atsReport?.experienceAssessment,
      aiProjectScore: ver.atsReport?.projectRelevance,
      aiProjectAssessment: ver.atsReport?.projectAssessment,
      strongPoints: ver.atsReport?.strongPoints,
      improvementRecommendations: ver.atsReport?.improvementRecommendations,
      baselineScore: ver.atsReport?.originalScore ?? ver.atsReport?.overallScore,
      diffItems: nextDiffs,
    });
  };

  // 9. Update structured data in place
  const handleUpdateStructuredData = (newData: StructuredResume) => {
    const newLatex = generateLatexFromStructured(newData);
    updateActiveVersion(prev => ({
      ...prev,
      structuredData: newData,
      latexSource: newLatex,
      atsReport: recomputeVersionAtsReport(prev, newData, prev.diffItems),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 10. Update diff items
  const handleUpdateDiffItems = (newDiffs: DiffItem[]) => {
    updateActiveVersion(prev => ({
      ...prev,
      diffItems: newDiffs,
      updatedAt: new Date().toISOString(),
    }));
  };

  // 11. Atomically apply both structured data and diff statuses
  const handleApplyDataAndDiffs = (newData: StructuredResume, newDiffs: DiffItem[]) => {
    const newLatex = generateLatexFromStructured(newData);
    updateActiveVersion(prev => ({
      ...prev,
      structuredData: newData,
      latexSource: newLatex,
      diffItems: newDiffs,
      atsReport: recomputeVersionAtsReport(prev, newData, newDiffs),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 12. Update a specific version from VersionCompareModal
  const handleUpdateVersionDataAndDiffs = (
    versionId: string,
    nextData: StructuredResume,
    nextDiffs: DiffItem[]
  ) => {
    const newLatex = generateLatexFromStructured(nextData);
    setVersions(prevList =>
      prevList.map(v => {
        if (v.id !== versionId) return v;
        const updated: ResumeVersion = {
          ...v,
          structuredData: nextData,
          latexSource: newLatex,
          diffItems: nextDiffs,
          atsReport: recomputeVersionAtsReport(v, nextData, nextDiffs),
          updatedAt: new Date().toISOString(),
        };
        if (user && !user.isAnonymous) {
          saveResumeToFirestore(updated, user.uid).catch(e => console.warn('Sync failed:', e));
        }
        return updated;
      })
    );
  };

  // Snapshot Version History Handlers
  const handleCreateSnapshot = (label: string, note?: string) => {
    const targetId = historyTargetVersion.id;
    setVersions(prevList =>
      prevList.map(v => {
        if (v.id !== targetId) return v;
        const snap: ResumeSnapshot = {
          id: generateId('snap'),
          timestamp: new Date().toISOString(),
          label,
          note,
          structuredData: JSON.parse(JSON.stringify(v.structuredData)),
          latexSource: v.latexSource,
          estimatedScore: v.atsReport?.overallScore,
        };
        const updated: ResumeVersion = {
          ...v,
          snapshots: [snap, ...(v.snapshots || [])].slice(0, 15),
          updatedAt: new Date().toISOString(),
        };
        if (user && !user.isAnonymous) {
          saveResumeToFirestore(updated, user.uid).catch(e => console.warn('Sync failed:', e));
        }
        return updated;
      })
    );
  };

  const handleRestoreSnapshot = (snapshot: ResumeSnapshot) => {
    const targetId = historyTargetVersion.id;
    const restoredData: StructuredResume = JSON.parse(JSON.stringify(snapshot.structuredData));
    const restoredLatex = snapshot.latexSource || generateLatexFromStructured(restoredData);
    setVersions(prevList =>
      prevList.map(v => {
        if (v.id !== targetId) return v;
        const autoBackup: ResumeSnapshot = {
          id: generateId('snap-auto'),
          timestamp: new Date().toISOString(),
          label: `Auto-backup before restoring "${snapshot.label}"`,
          structuredData: JSON.parse(JSON.stringify(v.structuredData)),
          latexSource: v.latexSource,
          estimatedScore: v.atsReport?.overallScore,
        };
        const updated: ResumeVersion = {
          ...v,
          structuredData: restoredData,
          latexSource: restoredLatex,
          snapshots: [autoBackup, ...(v.snapshots || [])].slice(0, 15),
          updatedAt: new Date().toISOString(),
        };
        if (user && !user.isAnonymous) {
          saveResumeToFirestore(updated, user.uid).catch(e => console.warn('Sync failed:', e));
        }
        return updated;
      })
    );
  };

  // Save localized / translated resume as a new version and open in Studio
  const handleSaveTranslatedVersion = (
    sourceVersion: ResumeVersion,
    translatedData: StructuredResume,
    lang: SupportedLanguage
  ) => {
    const normalizedData: StructuredResume = {
      ...translatedData,
      language: lang,
      templateId: sourceVersion.templateId || translatedData.templateId,
    };
    const translatedLatex = generateLatexFromStructured(normalizedData);
    const now = new Date().toISOString();
    const newVersion: ResumeVersion = {
      id: generateId('ver-tr'),
      userId: user?.uid,
      title: `${sourceVersion.title} (${lang.toUpperCase()})`,
      targetRole: normalizedData.targetRoleHeadline || sourceVersion.targetRole,
      companyName: sourceVersion.companyName,
      cvType: 'created',
      templateId: normalizedData.templateId || 'template-pm',
      language: lang,
      latexSource: translatedLatex,
      originalLatex: translatedLatex,
      structuredData: normalizedData,
      originalStructuredData: normalizedData,
      diffItems: [],
      snapshots: [
        {
          id: generateId('snap-tr'),
          timestamp: now,
          label: `Localized to ${lang.toUpperCase()}`,
          note: `Translated from ${sourceVersion.title}.`,
          structuredData: JSON.parse(JSON.stringify(normalizedData)),
          latexSource: translatedLatex,
        },
      ],
      atsReport: sourceVersion.atsReport,
      jdText: sourceVersion.jdText,
      createdAt: now,
      updatedAt: now,
      isOriginal: false,
    };

    setVersions(prev => deduplicateResumeVersions([newVersion, ...prev]));
    setActiveVersionId(newVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
    setCurrentView('studio');
  };

  // Job Application Tracker Handlers
  const handleAddApplication = (appInput: Omit<JobApplication, 'id' | 'updatedAt'>) => {
    const newApp: JobApplication = {
      ...appInput,
      id: generateId('app'),
      userId: user?.uid,
      updatedAt: new Date().toISOString(),
    };
    setApplications(prev => [newApp, ...prev]);
    if (user && !user.isAnonymous) {
      saveApplicationToFirestore(newApp, user.uid).catch(e => console.warn('App sync failed:', e));
    }
  };

  const handleUpdateApplicationStatus = (id: string, status: ApplicationStatus) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id !== id) return app;
        const updated: JobApplication = {
          ...app,
          status,
          updatedAt: new Date().toISOString(),
        };
        if (user && !user.isAnonymous) {
          saveApplicationToFirestore(updated, user.uid).catch(e => console.warn('App sync failed:', e));
        }
        return updated;
      })
    );
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    if (user && !user.isAnonymous) {
      deleteApplicationFromFirestore(id).catch(e => console.warn('App delete sync failed:', e));
    }
  };

  const executeExportPdf = async () => {
    await exportResumeToPdf(
      activeVersion.structuredData,
      `${(activeVersion.structuredData.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`,
      activeVersion.language || language
    );
  };

  const handleExportPdf = () => {
    if (!user) {
      handleRequireAuth('Sign In to Export PDF Resume', executeExportPdf);
      return;
    }
    executeExportPdf();
  };

  const executeExportDocx = async () => {
    await exportResumeToDocx(
      activeVersion.structuredData,
      `${(activeVersion.structuredData.name || 'Resume').replace(/\s+/g, '_')}_Resume.docx`,
      activeVersion.language || language
    );
  };

  const handleExportDocx = () => {
    if (!user) {
      handleRequireAuth('Sign In to Export DOCX Resume', executeExportDocx);
      return;
    }
    executeExportDocx();
  };

  const currentTemplateObj = RESUME_TEMPLATES.find(t => t.id === activeVersion.templateId) || RESUME_TEMPLATES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#182230] overflow-x-hidden">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeVersion={activeVersion}
        versions={versions}
        onSelectVersion={(v) => setActiveVersionId(v.id)}
        onOpenAuthModal={() => {
          setAuthModalConfig({
            isOpen: true,
            title: 'Sign In / Sign Up with Email',
            subtitle: 'Securely manage and sync your CVs in your account.',
          });
        }}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
      />

      {sessionExpiredNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{sessionExpiredNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                clearSessionExpiredNotice();
                setIsAuthModalOpen(true);
              }}
              className="px-3 py-1 bg-[#173B65] text-white rounded-[8px] font-semibold hover:bg-[#122F52] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={clearSessionExpiredNotice}
              className="p-1 rounded-[8px] text-amber-700 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {appError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate font-medium">{appError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAppError(null)}
            className="p-1 rounded-[8px] text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors shrink-0"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {/* VIEW 1: HOME DASHBOARD */}
        {currentView === 'home' && (
          <HomeView
            onNavigate={(v) => {
              if (v === 'create-cv') {
                setCreationStep('template');
              }
              if (v === 'optimize-cv') {
                setSelectedJdForOptimize(null);
              }
              setCurrentView(v);
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            savedVersions={versions}
            activeVersion={activeVersion}
            onSelectVersion={(v) => {
              setActiveVersionId(v.id);
              setCurrentView('studio');
            }}
            onOptimizeVersion={(v) => {
              setActiveVersionId(v.id);
              setSelectedJdForOptimize(null);
              setCurrentView('optimize-cv');
            }}
            onViewReport={(v) => {
              setReportVersionForModal(v);
              setIsAtsModalOpen(true);
            }}
            savedJds={savedJds}
            onOptimizeWithJd={(jd) => {
              setSelectedJdForOptimize(jd);
              setCurrentView('optimize-cv');
            }}
            onOpenSaveJdModal={(jd) => {
              setEditingJd(jd || null);
              setIsSaveJdModalOpen(true);
            }}
            onDeleteJd={handleDeleteJd}
            onOpenAuthModal={() => {
              setAuthModalConfig({
                isOpen: true,
                title: 'Sign In / Sign Up with Email',
                subtitle: 'Securely manage and sync your CVs in your account.',
              });
            }}
          />
        )}

        {/* VIEW 2: MY CVS LIBRARY */}
        {currentView === 'my-cvs' && (
          <MyCvsView
            versions={versions}
            activeVersion={activeVersion}
            onSelectVersion={(v) => setActiveVersionId(v.id)}
            onEditVersion={(v) => {
              setActiveVersionId(v.id);
              setCurrentView('studio');
            }}
            onDuplicateVersion={handleDuplicateVersion}
            onDeleteVersion={handleDeleteVersion}
            onOptimizeVersion={(v) => {
              setActiveVersionId(v.id);
              setCurrentView('optimize-cv');
            }}
            onOpenHistory={(v) => {
              setHistoryVersionId(v.id);
              setIsHistoryModalOpen(true);
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenCreate={() => {
              setCreationStep('template');
              setCurrentView('create-cv');
            }}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {/* VIEW 3: CREATE CV (Template Selection -> Live Builder) */}
        {currentView === 'create-cv' && (
          creationStep === 'template' ? (
            <TemplateSelector
              onSelectTemplate={(tId) => {
                setSelectedTemplateId(tId);
                setCreationStep('builder');
              }}
              onCancel={() => setCurrentView('home')}
              selectedTemplateId={selectedTemplateId}
              previewData={activeVersion?.structuredData || DEFAULT_STRUCTURED_RESUME}
              versions={versions}
            />
          ) : (
            <CvBuilderView
              initialData={{
                ...DEFAULT_STRUCTURED_RESUME,
                templateId: selectedTemplateId,
              }}
              templateId={selectedTemplateId}
              onSaveCv={handleSaveCreatedCv}
              onBackToTemplates={() => setCreationStep('template')}
              onRequireAuth={handleRequireAuth}
            />
          )
        )}

        {/* VIEW 4: OPTIMIZE CV WORKFLOW */}
        {currentView === 'optimize-cv' && (
          <OptimizeWorkflow
            savedVersions={versions}
            onSaveOptimizedCv={handleSaveOptimizedCv}
            onCompareVersions={(_verA, _verB) => {
              setIsCompareModalOpen(true);
            }}
            onCancel={() => {
              setSelectedJdForOptimize(null);
              setCurrentView('home');
            }}
            onRequireAuth={handleRequireAuth}
            initialJd={selectedJdForOptimize}
            onSaveJd={handleSaveJd}
          />
        )}

        {/* VIEW 4B: CAREER PREP SUITE (Cover Letter, LinkedIn, Interview Prep, Localization) */}
        {currentView === 'career-tools' && (
          <CareerToolsView
            versions={versions}
            activeVersion={activeVersion}
            savedJds={savedJds}
            initialTab={careerToolTab}
            initialContext={careerToolContext}
            onSaveTranslatedVersion={handleSaveTranslatedVersion}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {/* VIEW 4C: APPLICATION TRACKING DASHBOARD */}
        {currentView === 'applications' && (
          <ApplicationTrackerView
            applications={applications}
            versions={versions}
            savedJds={savedJds}
            onAddApplication={handleAddApplication}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onOpenResumeInStudio={(resumeId) => {
              setActiveVersionId(resumeId);
              setCurrentView('studio');
            }}
            onLaunchCareerPrep={(tab, ctx) => {
              setCareerToolTab(tab);
              setCareerToolContext(ctx);
              setCurrentView('career-tools');
            }}
          />
        )}

        {/* VIEW 5: STUDIO (Two-panel direct editor & A4 preview) */}
        {currentView === 'studio' && (
          <div className="flex-1 flex flex-col min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
            {/* Top Studio Control Bar */}
            <div className="bg-white border-b border-[#E5EAF0] px-3 sm:px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setCurrentView('my-cvs')}
                  className="btn-interactive min-h-[36px] px-2 py-1.5 text-slate-600 hover:text-[#173B65] hover:bg-[#F7F9FC] rounded-[8px] transition-colors flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>My CVs</span>
                </button>
                <div className="h-4 w-px bg-[#E5EAF0] shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs font-bold text-[#173B65] leading-tight truncate">
                    {activeVersion.title}
                  </h2>
                  <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 truncate">
                    <span className="truncate">Role: <strong className="text-[#182230]">{activeVersion.targetRole}</strong></span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">Template: <strong className="text-[#182230]">{currentTemplateObj.name}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {activeVersion.atsReport && (
                  <button
                    type="button"
                    onClick={() => setIsAtsModalOpen(true)}
                    className="btn-interactive min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Alignment ({activeVersion.atsReport.overallScore}%)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="btn-interactive min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                  title="Before & After Comparison"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Before &amp; After</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHistoryVersionId(activeVersion.id);
                    setIsHistoryModalOpen(true);
                  }}
                  className="btn-interactive min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                  title="Version History & Checkpoints"
                >
                  <History className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>History</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCareerToolTab('cover-letter');
                    setCareerToolContext({
                      role: activeVersion.targetRole,
                      company: activeVersion.companyName,
                      jdText: activeVersion.jdText,
                      resumeVersionId: activeVersion.id,
                    });
                    setCurrentView('career-tools');
                  }}
                  className="btn-interactive min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                  title="Cover Letter, LinkedIn & Interview Prep"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>Career Prep</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsJdModalOpen(true)}
                  className="btn-interactive min-h-[36px] flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#3978B8] hover:bg-[#2E649B] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize for JD</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDocx}
                  className="btn-interactive min-h-[36px] flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#173B65] bg-white hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                  title="Download Word (.docx)"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#3978B8]" />
                  <span>DOCX</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="btn-interactive min-h-[36px] flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Mobile & Tablet Pane Switcher (< lg) */}
            <div className="lg:hidden bg-[#F7F9FC] border-b border-[#E5EAF0] px-3 py-2 shrink-0">
              <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-[#E5EAF0] rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setStudioMobilePane('editor')}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    studioMobilePane === 'editor'
                      ? 'bg-[#173B65] text-white'
                      : 'text-slate-600 hover:text-[#173B65]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMobilePane('preview')}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    studioMobilePane === 'preview'
                      ? 'bg-[#173B65] text-white'
                      : 'text-slate-600 hover:text-[#173B65]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live A4 Preview</span>
                </button>
              </div>
            </div>

            {/* Two-Panel Workspace */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden">
              {/* Left Panel: Editor & ATS Keywords Studio */}
              <div
                className={`w-full lg:w-1/2 lg:h-full lg:overflow-hidden ${
                  studioMobilePane === 'editor' ? 'flex-1 min-h-0' : 'hidden lg:block'
                }`}
              >
                <EditorPanel
                  data={activeVersion.structuredData}
                  originalData={activeVersion.originalStructuredData}
                  diffItems={activeVersion.diffItems}
                  identifiedKeywords={activeVersion.identifiedKeywordsToAdd}
                  onUpdateData={handleUpdateStructuredData}
                  onUpdateDiffItems={handleUpdateDiffItems}
                  onApplyDataAndDiffs={handleApplyDataAndDiffs}
                  onRestoreOriginal={handleRestoreOriginal}
                  onAddKeywordToSkills={handleAddKeywordToSkills}
                  onOpenBeforeAfterCompare={() => setIsCompareModalOpen(true)}
                  onRequireAuth={handleRequireAuth}
                  jdText={activeVersion.jdText}
                />
              </div>

              {/* Right Panel: Clean Live A4 Resume Preview */}
              <div
                className={`w-full lg:w-1/2 lg:h-full lg:overflow-hidden ${
                  studioMobilePane === 'preview' ? 'flex-1 min-h-[540px]' : 'hidden lg:block'
                }`}
              >
                <ResumePreviewA4
                  data={activeVersion.structuredData}
                  targetRole={activeVersion.targetRole}
                  onRequireAuth={handleRequireAuth}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <JdInputModal
        isOpen={isJdModalOpen}
        onClose={() => setIsJdModalOpen(false)}
        onOptimize={handleOptimizeResume}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
      />

      <AtsReportModal
        isOpen={isAtsModalOpen}
        onClose={() => {
          setIsAtsModalOpen(false);
          setReportVersionForModal(null);
        }}
        report={(reportVersionForModal || activeVersion).atsReport || null}
        version={reportVersionForModal || activeVersion}
        onOptimizeClick={() => {
          if (reportVersionForModal) {
            setActiveVersionId(reportVersionForModal.id);
          }
          setIsAtsModalOpen(false);
          setReportVersionForModal(null);
          setIsJdModalOpen(true);
        }}
      />

      <SaveJdModal
        isOpen={isSaveJdModalOpen}
        onClose={() => {
          setIsSaveJdModalOpen(false);
          setEditingJd(null);
        }}
        onSave={handleSaveJd}
        editingJd={editingJd}
      />

      <VersionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        versions={versions}
        currentVersion={activeVersion}
        onSelectVersion={(v) => setActiveVersionId(v.id)}
        onUpdateVersionDataAndDiffs={handleUpdateVersionDataAndDiffs}
      />

      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryVersionId(null);
        }}
        version={historyTargetVersion}
        onCreateSnapshot={handleCreateSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLoadResume={handleLoadUploadedResume}
      />

      <AuthModal
        isOpen={authModalConfig.isOpen || isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalConfig({ isOpen: false });
        }}
        title={authModalConfig.title}
        subtitle={authModalConfig.subtitle}
        onSuccess={authModalConfig.onSuccess}
      />

      <PrivacyControlsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        retentionDays={retentionDays}
        onChangeRetentionDays={handleChangeRetentionDays}
        resumeCount={versions.length}
        savedJdCount={savedJds.length}
        applicationCount={applications.length}
        isSignedIn={Boolean(user)}
        userEmail={user?.email}
        onDeleteAllData={handleDeleteAllUserData}
      />

      {currentView !== 'studio' && currentView !== 'optimize-cv' && (
        <footer className="border-t border-[#E5EAF0] bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
              <span className="font-bold text-[#173B65]">CV vs JD</span>
              <span aria-hidden="true">·</span>
              <span>Factual resume architecture, ATS inspection &amp; career prep workspace</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="inline-flex items-center gap-1 font-semibold text-[#173B65] hover:text-[#3978B8] transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>Privacy &amp; Data</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#3978B8]" />
              <span>{t.languageLabel}:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                aria-label={t.languageLabel}
                className="text-xs font-semibold text-[#173B65] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] px-2.5 py-1 focus:outline-none focus:border-[#3978B8]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.nativeLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <MainApp />
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
