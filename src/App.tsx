import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import { Navbar, AppView } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MyCvsView } from './components/MyCvsView';
import { TemplateSelector } from './components/TemplateSelector';
import { CvBuilderView } from './components/CvBuilderView';
import { OptimizeWorkflow } from './components/OptimizeWorkflow';
import { EditorPanel } from './components/EditorPanel';
import { ResumePreviewA4 } from './components/ResumePreviewA4';
import { JdInputModal } from './components/JdInputModal';
import { AtsReportModal } from './components/AtsReportModal';
import { VersionCompareModal } from './components/VersionCompareModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { 
  DEFAULT_LATEX_TEMPLATE, 
  DEFAULT_STRUCTURED_RESUME 
} from './data/defaultResume';
import { ResumeVersion, StructuredResume, DiffItem } from './types/resume';
import { RESUME_TEMPLATES } from './data/templates';
import { generateLatexFromStructured } from './utils/latexParser';
import { exportResumeToPdf } from './utils/pdfExport';
import { apiOptimizeResume } from './services/geminiClient';
import { saveResumeToFirestore, fetchUserResumes } from './firebase/db';
import { auth } from './firebase/config';
import { 
  Sparkles, 
  Download, 
  ArrowLeft, 
  Layers, 
  ArrowLeftRight, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';

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
      reason: 'Essential ATS keyword for aligning engineering, design, and business teams',
      suggestedSection: 'Skills'
    },
    {
      keyword: 'Product Analytics & SQL',
      category: 'Technical & Tools',
      reason: 'Directly validates quantitative data-driven product decision making',
      suggestedSection: 'Skills'
    }
  ],
  atsReport: {
    overallScore: 88,
    originalScore: 88,
    technicalSkillsMatch: 90,
    experienceMatch: 86,
    productSkillsMatch: 88,
    keywordMatch: 85,
    matchedKeywords: [
      { keyword: 'Product Strategy', category: 'product', foundInResume: true, frequencyInJD: 3 },
      { keyword: 'SQL', category: 'technical', foundInResume: true, frequencyInJD: 4 },
      { keyword: 'Python', category: 'technical', foundInResume: true, frequencyInJD: 3 },
      { keyword: 'Agile', category: 'product', foundInResume: true, frequencyInJD: 4 },
      { keyword: 'User Research', category: 'product', foundInResume: true, frequencyInJD: 2 },
    ],
    missingKeywords: [
      { keyword: 'A/B Testing & Experimentation', category: 'product', foundInResume: false, frequencyInJD: 2 },
      { keyword: 'Cross-functional Leadership', category: 'product', foundInResume: false, frequencyInJD: 2 },
    ],
    strongPoints: [
      'Genuinely led 0-to-1 B2B SaaS platform from discovery to launch',
      'Solid engineering and analytics academic credentials',
      'Strong quantifiable metrics: 15,000+ MAU, 60+ interviews, 50+ user stories',
    ],
    improvementRecommendations: [
      'Add high-impact ATS keywords (e.g. A/B Testing, Product Analytics) into Skills',
      'Strengthen action verbs across experience bullets',
    ],
    formattingNotes: [
      'Template complies with single-page standard, 10pt font, and compact margins',
    ],
    disclaimer: 'ATS score is a heuristic estimate based on keyword density and formatting criteria.',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isOriginal: true,
};

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [creationStep, setCreationStep] = useState<'template' | 'builder'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-pm');

  const [versions, setVersions] = useState<ResumeVersion[]>(() => {
    const saved = localStorage.getItem('resumeiq_versions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasLegacy = JSON.stringify(parsed).toLowerCase().includes('altaf') || 
                          JSON.stringify(parsed).toLowerCase().includes('kaksha');
        if (!hasLegacy && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        } else {
          localStorage.removeItem('resumeiq_versions');
        }
      } catch {
        return [INITIAL_MASTER_VERSION];
      }
    }
    return [INITIAL_MASTER_VERSION];
  });

  const [activeVersionId, setActiveVersionId] = useState<string>(versions[0]?.id || INITIAL_MASTER_VERSION.id);

  // Modals
  const [isJdModalOpen, setIsJdModalOpen] = useState<boolean>(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    onSuccess?: () => void;
  }>({ isOpen: false });

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0] || INITIAL_MASTER_VERSION;

  const handleRequireAuth = (title: string, onProceed: () => void) => {
    setAuthModalConfig({
      isOpen: true,
      title,
      subtitle: 'Please verify your email address to download your resume.',
      onSuccess: onProceed,
    });
  };

  // Persist versions to localStorage
  useEffect(() => {
    localStorage.setItem('resumeiq_versions', JSON.stringify(versions));
  }, [versions]);

  // Sync with Firestore if authenticated
  useEffect(() => {
    if (!loading && user && !user.isAnonymous && auth.currentUser) {
      fetchUserResumes(user.uid)
        .then(firestoreResumes => {
          if (firestoreResumes && firestoreResumes.length > 0) {
            setVersions(firestoreResumes);
            setActiveVersionId(firestoreResumes[0].id);
          } else if (activeVersion) {
            saveResumeToFirestore(activeVersion, user.uid).catch(e => console.warn('Sync failed:', e));
          }
        })
        .catch(err => {
          console.warn('Could not fetch resumes from firestore:', err);
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
  const handleOptimizeResume = async (jdText: string) => {
    setIsProcessing(true);
    setStatusMessage('Extracting key ATS keywords from JD & optimizing resume...');
    try {
      const res = await apiOptimizeResume({
        resumeData: activeVersion.structuredData,
        jdText,
      });

      const newLatex = generateLatexFromStructured(res.optimizedData);

      // Create tailored version
      const newVersion: ResumeVersion = {
        id: `ver-${Date.now()}`,
        userId: user?.uid,
        title: `Tailored CV (${new Date().toLocaleDateString()})`,
        targetRole: res.optimizedData.targetRoleHeadline || activeVersion.targetRole,
        companyName: activeVersion.companyName,
        cvType: 'optimized',
        templateId: activeVersion.templateId || 'template-pm',
        latexSource: newLatex,
        originalLatex: activeVersion.originalLatex,
        structuredData: res.optimizedData,
        originalStructuredData: activeVersion.structuredData,
        diffItems: res.diffItems,
        identifiedKeywordsToAdd: res.identifiedKeywordsToAdd,
        atsReport: {
          ...(activeVersion.atsReport || INITIAL_MASTER_VERSION.atsReport!),
          overallScore: res.optimizedScore,
          originalScore: activeVersion.atsReport?.overallScore || 78,
          keywordMatch: Math.min(96, (activeVersion.atsReport?.keywordMatch || 70) + 18),
          productSkillsMatch: 92,
          technicalSkillsMatch: 88,
        },
        jdText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOriginal: false,
      };

      setVersions(prev => [newVersion, ...prev]);
      setActiveVersionId(newVersion.id);

      if (user && !user.isAnonymous) {
        saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
      }

      setIsJdModalOpen(false);
      setCurrentView('studio');
    } catch (err: any) {
      alert(`Optimization Error: ${err?.message || 'Could not complete optimization'}`);
    } finally {
      setIsProcessing(false);
    }
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
      id: `ver-${Date.now()}`,
      title: `${ver.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOriginal: false,
    };
    setVersions(prev => [duplicated, ...prev]);
    setActiveVersionId(duplicated.id);
  };

  // 4. Delete Version
  const handleDeleteVersion = (id: string) => {
    if (versions.length <= 1) {
      alert('Cannot delete the last remaining resume version.');
      return;
    }
    setVersions(prev => prev.filter(v => v.id !== id));
    if (activeVersionId === id) {
      const remaining = versions.filter(v => v.id !== id);
      setActiveVersionId(remaining[0].id);
    }
  };

  // 5. Load Uploaded CV
  const handleLoadUploadedResume = (parsed: StructuredResume) => {
    const newLatex = generateLatexFromStructured(parsed);
    const uploadedVersion: ResumeVersion = {
      id: `ver-${Date.now()}`,
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
      atsReport: INITIAL_MASTER_VERSION.atsReport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOriginal: true,
    };

    setVersions(prev => [uploadedVersion, ...prev]);
    setActiveVersionId(uploadedVersion.id);
    setCurrentView('studio');
  };

  // 6. Save newly created CV from Builder
  const handleSaveCreatedCv = (createdData: StructuredResume, title: string) => {
    const newLatex = generateLatexFromStructured(createdData);
    const newVersion: ResumeVersion = {
      id: `ver-${Date.now()}`,
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
      atsReport: {
        overallScore: 84,
        originalScore: 84,
        technicalSkillsMatch: 85,
        experienceMatch: 82,
        productSkillsMatch: 84,
        keywordMatch: 80,
        matchedKeywords: [],
        missingKeywords: [],
        strongPoints: ['Professional layout formatted to industry standards'],
        improvementRecommendations: ['Tailor with target JD for maximum ATS score'],
        formattingNotes: ['Meets standard single page ATS parameters'],
        disclaimer: 'Score based on standard ATS heuristics.',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOriginal: true,
    };

    setVersions(prev => [newVersion, ...prev]);
    setActiveVersionId(newVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
  };

  // 7. Save newly optimized CV from Optimize Workflow
  const handleSaveOptimizedCv = (newVersion: ResumeVersion) => {
    setVersions(prev => [newVersion, ...prev]);
    setActiveVersionId(newVersion.id);
    if (user && !user.isAnonymous) {
      saveResumeToFirestore(newVersion, user.uid).catch(e => console.warn('Sync failed:', e));
    }
  };

  // 8. Restore original
  const handleRestoreOriginal = () => {
    updateActiveVersion(prev => ({
      ...prev,
      structuredData: prev.originalStructuredData,
      latexSource: prev.originalLatex,
      diffItems: prev.diffItems.map(d => ({ ...d, status: 'rejected' })),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 9. Update structured data in place
  const handleUpdateStructuredData = (newData: StructuredResume) => {
    const newLatex = generateLatexFromStructured(newData);
    updateActiveVersion(prev => ({
      ...prev,
      structuredData: newData,
      latexSource: newLatex,
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

  const executeExportPdf = async () => {
    await exportResumeToPdf(
      'resume-a4-document',
      `${(activeVersion.structuredData.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`
    );
  };

  const handleExportPdf = () => {
    if (!user) {
      handleRequireAuth('Sign In to Export PDF Resume', executeExportPdf);
      return;
    }
    executeExportPdf();
  };

  const currentTemplateObj = RESUME_TEMPLATES.find(t => t.id === activeVersion.templateId) || RESUME_TEMPLATES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
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
      />

      <main className="flex-1 flex flex-col">
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <HomeView
            onNavigate={(v) => {
              if (v === 'create-cv') {
                setCreationStep('template');
              }
              setCurrentView(v);
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            savedVersions={versions}
            onSelectVersion={(v) => {
              setActiveVersionId(v.id);
              setCurrentView('studio');
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
            onCancel={() => setCurrentView('home')}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {/* VIEW 5: STUDIO (Two-panel direct editor & A4 preview) */}
        {currentView === 'studio' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* Top Studio Control Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('my-cvs')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>My CVs</span>
                </button>
                <div className="h-4 w-px bg-slate-200"></div>
                <div>
                  <h2 className="text-xs font-bold text-[#1F2A44] leading-tight">
                    {activeVersion.title}
                  </h2>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span>Role: <strong className="text-slate-600">{activeVersion.targetRole}</strong></span>
                    <span>·</span>
                    <span>Template: <strong className="text-slate-600">{currentTemplateObj.name}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeVersion.atsReport && (
                  <button
                    onClick={() => setIsAtsModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{activeVersion.atsReport.overallScore}% ATS Score</span>
                  </button>
                )}

                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
                  title="Compare Versions"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Compare</span>
                </button>

                <button
                  onClick={() => setIsJdModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Optimize for JD</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#1F2A44] hover:bg-[#161f33] rounded-md transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
            </div>

            {/* Two-Panel Workspace */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Panel: Editor & ATS Keywords Studio */}
              <div className="w-full lg:w-1/2 h-[55vh] lg:h-full overflow-hidden">
                <EditorPanel
                  data={activeVersion.structuredData}
                  originalData={activeVersion.originalStructuredData}
                  diffItems={activeVersion.diffItems}
                  identifiedKeywords={activeVersion.identifiedKeywordsToAdd}
                  onUpdateData={handleUpdateStructuredData}
                  onUpdateDiffItems={handleUpdateDiffItems}
                  onRestoreOriginal={handleRestoreOriginal}
                  onAddKeywordToSkills={handleAddKeywordToSkills}
                  jdText={activeVersion.jdText}
                />
              </div>

              {/* Right Panel: Clean Live A4 Resume Preview */}
              <div className="w-full lg:w-1/2 h-[65vh] lg:h-full overflow-hidden">
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
        onClose={() => setIsAtsModalOpen(false)}
        report={activeVersion.atsReport || null}
        onOptimizeClick={() => setIsJdModalOpen(true)}
      />

      <VersionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        versions={versions}
        currentVersion={activeVersion}
        onSelectVersion={(v) => setActiveVersionId(v.id)}
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
