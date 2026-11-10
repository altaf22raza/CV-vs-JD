import React, { useRef, useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Printer,
  FileCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  MapPin,
  BookOpen,
  Award,
  Code2
} from 'lucide-react';
import { StructuredResume } from '../types/resume';
import { RESUME_TEMPLATES } from '../data/templates';
import { exportResumeToPdf, downloadTextFile } from '../utils/pdfExport';
import { useAuth } from '../firebase/AuthContext';

interface ResumePreviewA4Props {
  data: StructuredResume;
  targetRole?: string;
  onRequireAuth?: (actionTitle: string, proceedCallback: () => void) => void;
}

export const ResumePreviewA4: React.FC<ResumePreviewA4Props> = ({
  data,
  targetRole = 'Product Manager',
  onRequireAuth
}) => {
  const { user } = useAuth();
  const viewportRef = useRef<HTMLDivElement>(null);
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  
  // Responsive default zoom: fit comfortably in split screen
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1400) {
      return 0.82;
    }
    return 0.95;
  });
  
  const [pageHeightPx, setPageHeightPx] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const A4_HEIGHT_PX = 1123; // Standard 96 DPI A4 height (297mm)

  // Find active template metadata
  const currentTemplate = RESUME_TEMPLATES.find(t => t.id === (data.templateId || 'template-pm')) || RESUME_TEMPLATES[0];
  const accentColor = currentTemplate.accentColor || '#1F2A44';

  // Monitor DOM height to detect page spill
  useEffect(() => {
    if (resumeContainerRef.current) {
      setPageHeightPx(resumeContainerRef.current.offsetHeight);
    }
  }, [data]);

  // Auto-fit zoom to available viewport width on initial load
  useEffect(() => {
    if (viewportRef.current) {
      const containerW = viewportRef.current.clientWidth;
      if (containerW > 200 && containerW < 850) {
        const optimalZoom = Math.min(0.95, Math.max(0.65, Number(((containerW - 40) / 794).toFixed(2))));
        setZoom(optimalZoom);
      }
    }
  }, []);

  const handleFitToWidth = () => {
    if (viewportRef.current) {
      const availableW = viewportRef.current.clientWidth - 40;
      const fitZoom = Math.min(1.2, Math.max(0.55, Number((availableW / 794).toFixed(2))));
      setZoom(fitZoom);
    } else {
      setZoom(0.85);
    }
  };

  const executeDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const cleanName = (data.name || 'Candidate').replace(/\s+/g, '_');
      const cleanRole = targetRole.replace(/[^a-zA-Z0-9]/g, '_');
      await exportResumeToPdf('resume-a4-document', `${cleanName}_${cleanRole}_Resume.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your PDF Resume', executeDownloadPdf);
      }
      return;
    }
    executeDownloadPdf();
  };

  const executeDownloadTxt = () => {
    const plainText = `${data.name}
${data.targetRoleHeadline}
${data.contact.location} | ${data.contact.phone} | ${data.contact.email} | ${data.contact.linkedin}

PROFESSIONAL SUMMARY
${data.summary}

EXPERIENCE
${data.experience.map(e => `${e.role} - ${e.company} (${e.startDate} - ${e.endDate})\n${e.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}

EDUCATION
${data.education.map(e => `${e.degree} - ${e.institution} (${e.duration}) ${e.details}`).join('\n')}

PROJECTS
${data.projects.map(p => `${p.title} (${p.subtitle})\n${p.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}

SKILLS
${data.skills.map(s => `${s.category}: ${s.items.join(', ')}`).join('\n')}

CERTIFICATIONS
${data.certifications.map(c => `${c.category}: ${c.items.join(' | ')}`).join('\n')}`;

    const cleanName = (data.name || 'Candidate').replace(/\s+/g, '_');
    downloadTextFile(plainText, `${cleanName}_Resume.txt`, 'text/plain');
  };

  const handleDownloadTxt = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Sign In to Download Your Resume in TXT', executeDownloadTxt);
      }
      return;
    }
    executeDownloadTxt();
  };

  const isOnePageFit = pageHeightPx <= A4_HEIGHT_PX + 25;

  // Distinct visual themes based on templateId
  const templateId = data.templateId || 'template-pm';
  const isCorporate = templateId === 'template-corporate';
  const isModern = templateId === 'template-modern';
  const isAts = templateId === 'template-ats';
  const isTechnical = templateId === 'template-technical';
  const isData = templateId === 'template-data';
  const isFresher = templateId === 'template-fresher';
  const isExecutive = templateId === 'template-executive';

  // Section Header Renderer
  const renderSectionHeading = (title: string, icon?: React.ReactNode) => {
    if (isModern) {
      return (
        <div 
          style={{ borderLeftColor: accentColor }}
          className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-slate-800 border-l-[3.5px] pl-2 mb-1.5 pb-0.5"
        >
          {icon}
          <span>{title}</span>
        </div>
      );
    }

    if (isCorporate) {
      return (
        <div className="text-center mb-1.5">
          <div className="inline-block text-[11px] font-bold uppercase tracking-widest text-slate-900 px-3 py-0.5 border-b border-slate-900">
            {title}
          </div>
        </div>
      );
    }

    if (isExecutive) {
      return (
        <div className="flex items-center justify-between text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
          <span>{title}</span>
        </div>
      );
    }

    if (isAts) {
      return (
        <div className="text-[11.5px] font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
          {title}
        </div>
      );
    }

    // Default / PM / Data / Fresher
    return (
      <div 
        style={{ 
          color: accentColor, 
          borderBottomColor: accentColor 
        }}
        className="flex items-center justify-between text-[11.5px] font-bold uppercase tracking-wide border-b-[0.8pt] pb-0.5 mb-1.5"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
      </div>
    );
  };

  const scaledWidth = Math.round(794 * zoom);
  const scaledHeight = pageHeightPx > 0 ? Math.round(pageHeightPx * zoom) : Math.round(A4_HEIGHT_PX * zoom);

  return (
    <div className="flex flex-col h-full bg-[#E2E8F0]/50 border-l border-slate-200">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        {/* Title & Template Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1F2A44] uppercase tracking-wide">
            Live Preview
          </span>
          <span className="text-[11px] text-slate-400">·</span>
          <span 
            style={{ color: accentColor }}
            className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 border border-slate-200"
          >
            {currentTemplate.name}
          </span>
        </div>

        {/* 1-Page Fit Status Meter */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs">
          {isOnePageFit ? (
            <div className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Strict 1-Page Fit ({Math.round((pageHeightPx / A4_HEIGHT_PX) * 100)}%)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Page Overflow ({Math.round((pageHeightPx / A4_HEIGHT_PX) * 100)}%)</span>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-slate-600">
          <button
            onClick={() => setZoom(prev => Math.max(0.55, Number((prev - 0.05).toFixed(2))))}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono tabular-nums px-1.5 font-medium text-slate-700 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(1.3, Number((prev + 0.05).toFixed(2))))}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToWidth}
            className="p-1 hover:bg-slate-100 rounded transition-colors ml-1 text-slate-700"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs disabled:opacity-50"
          >
            {!user ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Generating...' : user ? 'Download PDF' : 'Sign In to Download'}</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            title="Download Plain Text"
          >
            TXT
          </button>
        </div>
      </div>

      {/* Main Preview Viewport: overflow-auto with min-w-fit so it never clips left edge */}
      <div 
        ref={viewportRef}
        className="flex-1 overflow-auto bg-[#E2E8F0]/40 p-4 sm:p-6"
      >
        <div className="min-w-fit w-full flex flex-col items-center min-h-full">
          {/* Scaled Dimension Container: prevents negative coordinates and horizontal clip */}
          <div 
            style={{ 
              width: `${scaledWidth}px`,
              minHeight: `${scaledHeight}px`,
            }}
            className="shrink-0 mx-auto my-auto relative"
          >
            <div 
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top left',
                width: '794px',
              }}
              className="transition-transform duration-150"
            >
              {/* The True A4 Sheet container */}
              <div
                id="resume-a4-document"
                ref={resumeContainerRef}
                style={{
                  width: '794px', // 210mm at 96 DPI
                  minHeight: '1123px', // 297mm at 96 DPI
                  padding: isExecutive ? '0px 0px 32px 0px' : isTechnical ? '24px 32px' : isAts ? '32px 48px' : isModern ? '32px 44px' : '26px 44px',
                  fontFamily: isCorporate 
                    ? "'Merriweather', 'Georgia', serif" 
                    : isTechnical 
                    ? "'JetBrains Mono', 'Fira Code', 'Plus Jakarta Sans', monospace, sans-serif" 
                    : "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
                  color: '#222222',
                  backgroundColor: '#ffffff',
                  lineHeight: '1.25',
                }}
                className="bg-white shadow-xl border border-slate-300 relative print-only-page"
              >
                {/* Visual 1-Page Benchmark Marker */}
                <div 
                  style={{ top: '1123px' }}
                  className="absolute left-0 right-0 border-b-2 border-dashed border-red-300 pointer-events-none no-print opacity-60 flex justify-end pr-2"
                >
                  <span className="text-[10px] text-red-500 font-mono bg-red-50 px-1 rounded -translate-y-1/2">
                    Page 1 Boundary (A4)
                  </span>
                </div>

                {/* ============================================================== */}
                {/* TEMPLATE ARCHITECTURE 1: TWO-COLUMN SIDEBAR (TECHNICAL / IT)   */}
                {/* ============================================================== */}
                {isTechnical ? (
                  <div className="flex flex-col">
                    {/* Minimalist Tech Header with separate rows to avoid squeeze */}
                    <header className="border-b-2 border-teal-600 pb-2 mb-3">
                      <div className="flex justify-between items-baseline gap-4">
                        <h1 className="text-[22px] font-bold text-teal-800 tracking-tight uppercase font-mono">
                          {data.name || 'Candidate Name'}
                        </h1>
                        <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
                          {data.contact.location} {data.contact.email ? `· ${data.contact.email}` : ''}
                        </div>
                      </div>
                      <div className="text-[12px] font-bold text-slate-700 mt-0.5">
                        {data.targetRoleHeadline || targetRole}
                      </div>
                    </header>

                    {/* 2-Column Grid */}
                    <div className="grid grid-cols-12 gap-4">
                      {/* Left Column: Tech Stack, Education, Contact Links, Certs (4 of 12 cols) */}
                      <aside className="col-span-4 bg-teal-50/50 rounded-lg p-3 border border-teal-100/80 space-y-3 font-mono text-[9.5px]">
                        {/* Contact & Links */}
                        <div>
                          <div className="text-[10.5px] font-bold text-teal-900 uppercase border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-teal-700" />
                            <span>Connect</span>
                          </div>
                          <div className="space-y-1 text-slate-700 break-all">
                            {data.contact.phone && <div>📞 {data.contact.phone}</div>}
                            {data.contact.email && <div>✉️ {data.contact.email}</div>}
                            {data.contact.linkedin && <div>💼 {data.contact.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                            {data.contact.github && <div className="text-teal-800 font-bold">🐙 {data.contact.github.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                            {data.contact.website && <div>🌐 {data.contact.website.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                          </div>
                        </div>

                        {/* Technical Matrix */}
                        <div>
                          <div className="text-[10.5px] font-bold text-teal-900 uppercase border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-teal-700" />
                            <span>Tech Stack</span>
                          </div>
                          <div className="space-y-2">
                            {data.skills.map((skill) => (
                              <div key={skill.id} className="space-y-0.5">
                                <div className="text-[9.5px] font-bold text-slate-900">{skill.category}</div>
                                <div className="flex flex-wrap gap-1">
                                  {skill.items.map((it, idx) => (
                                    <span key={idx} className="bg-white text-teal-900 px-1.5 py-0.2 rounded border border-teal-200 text-[8.5px] font-mono">
                                      {it}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <div className="text-[10.5px] font-bold text-teal-900 uppercase border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-teal-700" />
                            <span>Education</span>
                          </div>
                          <div className="space-y-1.5">
                            {data.education.map((edu) => (
                              <div key={edu.id} className="text-[9px]">
                                <div className="font-bold text-slate-900">{edu.degree}</div>
                                <div className="text-slate-600">{edu.institution}</div>
                                <div className="text-teal-700 font-semibold">{edu.duration} {edu.details ? `· ${edu.details}` : ''}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Certifications */}
                        {data.certifications && data.certifications.length > 0 && (
                          <div>
                            <div className="text-[10.5px] font-bold text-teal-900 uppercase border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1">
                              <Award className="w-3 h-3 text-teal-700" />
                              <span>Credentials</span>
                            </div>
                            <div className="space-y-1 text-[9px] text-slate-700">
                              {data.certifications.map((c) => (
                                <div key={c.id}>
                                  <span className="font-semibold text-slate-900">{c.category}:</span> {c.items.join(' | ')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </aside>

                      {/* Right Column: Summary, Experience, Engineering Projects (8 of 12 cols) */}
                      <main className="col-span-8 space-y-3">
                        {/* Summary */}
                        {data.summary && (
                          <section>
                            <div className="text-[11px] font-bold text-teal-900 uppercase border-b border-teal-600 pb-0.5 mb-1 font-mono">
                              // Executive Engineering Summary
                            </div>
                            <p className="text-[9.8px] text-slate-800 leading-[1.3] text-justify font-sans">
                              {data.summary}
                            </p>
                          </section>
                        )}

                        {/* Work Experience */}
                        <section>
                          <div className="text-[11px] font-bold text-teal-900 uppercase border-b border-teal-600 pb-0.5 mb-1.5 font-mono">
                            // Work Experience
                          </div>
                          <div className="space-y-2">
                            {data.experience.map((exp) => (
                              <div key={exp.id} className="text-[9.8px]">
                                <div className="flex justify-between items-baseline font-mono">
                                  <div>
                                    <strong className="text-slate-900 font-bold text-[10.5px]">{exp.role}</strong>{' '}
                                    <span className="text-teal-800 font-semibold">@{exp.company}</span>
                                  </div>
                                  <div className="text-slate-500 text-[9px]">
                                    {exp.startDate} - {exp.endDate}
                                  </div>
                                </div>
                                <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.5px] leading-[1.28] font-sans">
                                  {exp.bullets.map((bullet, idx) => (
                                    <li key={idx} className="text-slate-800">
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Engineering Projects */}
                        {data.projects && data.projects.length > 0 && (
                          <section>
                            <div className="text-[11px] font-bold text-teal-900 uppercase border-b border-teal-600 pb-0.5 mb-1.5 font-mono">
                              // Technical Projects &amp; Repos
                            </div>
                            <div className="space-y-1.5">
                              {data.projects.map((proj) => (
                                <div key={proj.id} className="text-[9.8px]">
                                  <div className="flex justify-between items-baseline font-mono">
                                    <div>
                                      <strong className="text-slate-900 font-bold">{proj.title}</strong>{' '}
                                      {proj.linkUrl && (
                                        <span className="text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200 text-[8.5px]">
                                          {proj.linkText || 'Code'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 text-[9px]">{proj.subtitle}</div>
                                  </div>
                                  <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.5px] leading-[1.28] font-sans">
                                    {proj.bullets.map((bullet, idx) => (
                                      <li key={idx} className="text-slate-800">
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </main>
                    </div>
                  </div>
                ) : isExecutive ? (
                  /* ============================================================== */
                  /* TEMPLATE ARCHITECTURE 2: EXECUTIVE DARK BANNER                */
                  /* ============================================================== */
                  <div>
                    {/* Top Executive Slate Banner: Clean hierarchical stacking to prevent any collision */}
                    <header className="bg-[#1E293B] text-white px-8 py-5 mb-3 rounded-t-sm shadow-xs">
                      {/* Name */}
                      <h1 className="text-[23px] font-extrabold tracking-wider uppercase text-white leading-tight">
                        {data.name || 'Candidate Name'}
                      </h1>
                      
                      {/* Target Role Headline */}
                      <div className="text-[12px] font-bold text-amber-300 tracking-wide mt-1 leading-snug">
                        {data.targetRoleHeadline || targetRole}
                      </div>

                      {/* Dedicated Contact Bar */}
                      <div className="text-[10px] text-slate-300 flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2.5 pt-2 border-t border-slate-700/80">
                        {data.contact.location && <span>{data.contact.location}</span>}
                        {data.contact.phone && (
                          <>
                            <span className="text-slate-500">·</span>
                            <span>{data.contact.phone}</span>
                          </>
                        )}
                        {data.contact.email && (
                          <>
                            <span className="text-slate-500">·</span>
                            <a href={`mailto:${data.contact.email}`} className="text-slate-200 hover:underline">
                              {data.contact.email}
                            </a>
                          </>
                        )}
                        {data.contact.linkedin && (
                          <>
                            <span className="text-slate-500">·</span>
                            <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="text-amber-200 hover:underline">
                              {data.contact.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </>
                        )}
                        {data.contact.github && (
                          <>
                            <span className="text-slate-500">·</span>
                            <a href={data.contact.github} target="_blank" rel="noreferrer" className="text-slate-200 hover:underline">
                              {data.contact.github.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </>
                        )}
                      </div>
                    </header>

                    <div className="px-8 space-y-2.5">
                      {/* 3-Column Core Executive Competencies */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-md p-2 text-center text-slate-800">
                        <div className="border-r border-slate-200 px-1">
                          <div className="text-[10px] font-bold uppercase leading-tight">Product Vision &amp; Strategy</div>
                          <div className="text-[8.5px] text-slate-500 mt-0.5 leading-tight">0→1 SaaS Platform Launches</div>
                        </div>
                        <div className="border-r border-slate-200 px-1">
                          <div className="text-[10px] font-bold uppercase leading-tight">Cross-Functional Leadership</div>
                          <div className="text-[8.5px] text-slate-500 mt-0.5 leading-tight">Engineering, Design, &amp; Business Alignment</div>
                        </div>
                        <div className="px-1">
                          <div className="text-[10px] font-bold uppercase leading-tight">Enterprise Scale &amp; Growth</div>
                          <div className="text-[8.5px] text-slate-500 mt-0.5 leading-tight">15,000+ MAU &amp; Telemetry Roadmaps</div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      {data.summary && (
                        <section className="bg-slate-50/70 p-2.5 rounded border border-slate-200">
                          <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">
                            Executive Summary
                          </div>
                          <p className="text-[9.8px] text-slate-800 leading-[1.3] text-justify">
                            {data.summary}
                          </p>
                        </section>
                      )}

                      {/* Leadership Experience */}
                      <section>
                        {renderSectionHeading('Executive & Professional Experience')}
                        <div className="space-y-2 mt-1">
                          {data.experience.map((exp) => (
                            <div key={exp.id} className="text-[10px]">
                              <div className="flex justify-between items-baseline">
                                <div>
                                  <strong className="text-slate-900 font-bold text-[10.5px]">{exp.role}</strong>{' '}
                                  <span className="italic text-slate-700 font-medium">| {exp.company}</span>
                                </div>
                                <div className="text-slate-500 font-medium text-[9.5px]">
                                  {exp.startDate} - {exp.endDate}
                                </div>
                              </div>
                              <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.8px] leading-[1.28]">
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx} className="text-slate-800">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Strategic Projects */}
                      {data.projects && data.projects.length > 0 && (
                        <section>
                          {renderSectionHeading('Key Strategic Initiatives & Projects')}
                          <div className="space-y-1.5 mt-1">
                            {data.projects.map((proj) => (
                              <div key={proj.id} className="text-[10px]">
                                <div className="flex justify-between items-baseline">
                                  <div>
                                    <strong className="text-slate-900 font-bold">{proj.title}</strong>{' '}
                                    <span className="text-slate-600">({proj.subtitle})</span>
                                  </div>
                                </div>
                                <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.8px] leading-[1.28]">
                                  {proj.bullets.map((bullet, idx) => (
                                    <li key={idx} className="text-slate-800">{bullet}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Education & Credentials */}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <section>
                          {renderSectionHeading('Education')}
                          <div className="space-y-1 text-[9.5px]">
                            {data.education.map((edu) => (
                              <div key={edu.id}>
                                <div className="font-bold text-slate-900">{edu.degree}</div>
                                <div className="text-slate-600">{edu.institution} ({edu.duration})</div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          {renderSectionHeading('Core Competencies & Skills')}
                          <div className="space-y-0.5 text-[9.5px]">
                            {data.skills.slice(0, 2).map((skill) => (
                              <div key={skill.id}>
                                <span className="font-bold text-slate-900">{skill.category}:</span>{' '}
                                <span className="text-slate-700">{skill.items.slice(0, 5).join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================== */
                  /* STANDARD ARCHITECTURES (PM, CORPORATE, MODERN, DATA, FRESHER, ATS) */
                  /* ============================================================== */
                  <div>
                    {/* 1. Header: Name & Contact */}
                    <header className={`${isModern ? 'text-left pb-2' : 'text-center pb-2'}`}>
                      {/* Left accent bar on Modern Minimal */}
                      {isModern && (
                        <div style={{ backgroundColor: accentColor }} className="w-12 h-1 rounded mb-2"></div>
                      )}

                      <h1 
                        style={{ color: accentColor }}
                        className={`text-[21px] font-bold tracking-tight uppercase ${isCorporate ? 'tracking-wider' : ''}`}
                      >
                        {data.name || 'Candidate Name'}
                      </h1>
                      <div className={`text-[12px] font-bold mt-0.5 ${isModern ? 'text-blue-700 font-semibold' : 'text-[#222222]'}`}>
                        {data.targetRoleHeadline || targetRole}
                      </div>
                      <div className={`text-[10px] text-[#333333] mt-1 flex items-center flex-wrap gap-x-2 gap-y-0.5 ${isModern ? 'justify-start' : 'justify-center'}`}>
                        {data.contact.location && <span>{data.contact.location}</span>}
                        {data.contact.phone && (
                          <>
                            <span className="text-slate-400">|</span>
                            <a href={`tel:${data.contact.phone.replace(/\s+/g, '')}`} className="hover:underline" style={{ color: accentColor }}>
                              {data.contact.phone}
                            </a>
                          </>
                        )}
                        {data.contact.email && (
                          <>
                            <span className="text-slate-400">|</span>
                            <a href={`mailto:${data.contact.email}`} className="hover:underline" style={{ color: accentColor }}>
                              {data.contact.email}
                            </a>
                          </>
                        )}
                        {data.contact.linkedin && (
                          <>
                            <span className="text-slate-400">|</span>
                            <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: accentColor }}>
                              {data.contact.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </>
                        )}
                        {data.contact.github && (
                          <>
                            <span className="text-slate-400">|</span>
                            <a href={data.contact.github} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: accentColor }}>
                              {data.contact.github.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </>
                        )}
                      </div>
                    </header>

                    {/* Header Divider */}
                    {isCorporate ? (
                      <div className="w-full border-t border-b border-slate-900 py-[1px] my-2"></div>
                    ) : isModern ? (
                      <div className="w-full border-b border-slate-200 my-2"></div>
                    ) : (
                      <div style={{ backgroundColor: accentColor }} className="w-full h-[0.8pt] mb-2.5"></div>
                    )}

                    {/* DATA ANALYST: 3-Metric Impact Banner */}
                    {isData && (
                      <div className="grid grid-cols-3 gap-2 bg-indigo-50/70 border border-indigo-200 rounded p-1.5 mb-2.5 text-center">
                        <div>
                          <div className="text-[11px] font-bold text-indigo-900 font-mono">15TB+ Telemetry</div>
                          <div className="text-[8.5px] text-indigo-700">Pipelines &amp; Event Logs</div>
                        </div>
                        <div className="border-x border-indigo-200">
                          <div className="text-[11px] font-bold text-indigo-900 font-mono">35% Friction Drop</div>
                          <div className="text-[8.5px] text-indigo-700">Automated Analytics Ops</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-indigo-900 font-mono">40+ BI Dashboards</div>
                          <div className="text-[8.5px] text-indigo-700">Cohort &amp; Retention Models</div>
                        </div>
                      </div>
                    )}

                    {/* Professional Summary */}
                    {data.summary && (
                      <section className="mb-2.5">
                        {renderSectionHeading('Professional Summary')}
                        <p className="text-[10px] text-[#222222] leading-[1.3] text-justify">
                          {data.summary}
                        </p>
                      </section>
                    )}

                    {/* Helper section order: If Fresher, Education & Projects FIRST! */}
                    {(() => {
                      const experienceBlock = (
                        <section className="mb-2.5">
                          {renderSectionHeading(isFresher ? 'Internships & Leadership Experience' : 'Professional Experience')}
                          <div className="space-y-2">
                            {data.experience.map((exp) => (
                              <div key={exp.id} className="text-[10px]">
                                <div className="flex justify-between items-baseline leading-tight">
                                  <div>
                                    <strong className="text-[#111111] font-bold">{exp.role}</strong>{' '}
                                    <span className="italic text-[#333333] font-medium">{exp.company}</span>
                                  </div>
                                  <div className="text-[#444444] font-normal text-right shrink-0">
                                    {exp.startDate}--{exp.endDate}
                                  </div>
                                </div>
                                <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.8px] leading-[1.28]">
                                  {exp.bullets.map((bullet, idx) => (
                                    <li key={idx} className="text-[#222222]">
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </section>
                      );

                      const educationBlock = (
                        <section className="mb-2.5">
                          {renderSectionHeading('Education')}
                          {isFresher ? (
                            <div className="bg-sky-50/70 border border-sky-200 rounded p-2 space-y-1.5">
                              {data.education.map((edu) => (
                                <div key={edu.id} className="flex justify-between items-center text-[10px]">
                                  <div>
                                    <strong className="text-sky-900 font-bold text-[10.5px]">{edu.degree}</strong>
                                    <div className="text-slate-700 italic">{edu.institution}</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                                      {edu.details || 'Honors'}
                                    </span>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{edu.duration}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {data.education.map((edu) => (
                                <div key={edu.id} className="flex justify-between items-baseline text-[10px] leading-tight">
                                  <div>
                                    <strong className="text-[#111111] font-bold">{edu.degree}</strong>{' '}
                                    <span className="italic text-[#333333]">{edu.institution}</span>
                                  </div>
                                  <div className="text-[#444444] text-right shrink-0">
                                    {edu.duration} {edu.details ? `| ${edu.details}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );

                      const projectsBlock = (
                        <section className="mb-2.5">
                          {renderSectionHeading(isFresher ? 'Capstone & Academic Projects' : 'Key Projects & Initiatives')}
                          <div className="space-y-1.5">
                            {data.projects.map((proj) => (
                              <div key={proj.id} className="text-[10px]">
                                <div className="flex justify-between items-baseline leading-tight">
                                  <div>
                                    <strong className="text-[#111111] font-bold">{proj.title}</strong>{' '}
                                    {proj.linkUrl && (
                                      <a
                                        href={proj.linkUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: accentColor }}
                                        className="italic hover:underline inline-flex items-center gap-0.5"
                                      >
                                        <span>{proj.linkText || 'Link'}</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="text-[#444444] text-right shrink-0">
                                    {proj.subtitle}
                                  </div>
                                </div>
                                <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[9.8px] leading-[1.28]">
                                  {proj.bullets.map((bullet, idx) => (
                                    <li key={idx} className="text-[#222222]">
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </section>
                      );

                      // Order selection based on template
                      if (isFresher) {
                        return (
                          <>
                            {educationBlock}
                            {projectsBlock}
                            {experienceBlock}
                          </>
                        );
                      }

                      return (
                        <>
                          {experienceBlock}
                          {educationBlock}
                          {projectsBlock}
                        </>
                      );
                    })()}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                      <section className="mb-2">
                        {renderSectionHeading('Skills & Competencies')}
                        {isModern ? (
                          <div className="space-y-1 text-[9.5px]">
                            {data.skills.map((skill) => (
                              <div key={skill.id} className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 shrink-0 min-w-[130px]">{skill.category}:</span>
                                <div className="flex flex-wrap gap-1">
                                  {skill.items.map((it, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-900 px-2 py-0.2 rounded-full font-medium text-[8.5px] border border-blue-200">
                                      {it}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="list-disc pl-3.5 space-y-0.5 text-[9.8px] leading-[1.28]">
                            {data.skills.map((skill) => (
                              <li key={skill.id} className="text-[#222222]">
                                <strong className="font-bold">{skill.category}:</strong>{' '}
                                <span>{skill.items.join(', ')}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}

                    {/* Certifications */}
                    {data.certifications && data.certifications.length > 0 && (
                      <section className="mb-2">
                        {renderSectionHeading('Certifications & Credentials')}
                        <div className="space-y-0.5 text-[9.5px] leading-[1.28]">
                          {data.certifications.map((cert) => (
                            <div key={cert.id} className="text-[#222222]">
                              <strong className="font-bold">{cert.category}:</strong>{' '}
                              <span>{cert.items.join(' | ')}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
