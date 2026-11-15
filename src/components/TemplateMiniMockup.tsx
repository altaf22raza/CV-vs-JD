import React from 'react';

interface TemplateMiniMockupProps {
  templateId: string;
  accentColor: string;
}

/**
 * Realistic miniature A4 document preview using crisp micro-typography
 * so every template card reflects real document structure rather than abstract gray bars.
 */
export const TemplateMiniMockup: React.FC<TemplateMiniMockupProps> = ({
  templateId,
  accentColor,
}) => {
  // 1. TECHNICAL / IT: Two-column split sidebar
  if (templateId === 'template-technical') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col text-[4.5px] leading-[1.35] text-slate-700 select-none"
        aria-hidden="true"
      >
        <div className="px-2 pt-2 pb-1 border-b border-slate-200 flex items-baseline justify-between">
          <span className="text-[6.2px] font-bold tracking-tight" style={{ color: accentColor }}>
            ALEX MORGAN
          </span>
          <span className="text-[3.8px] text-slate-400">Staff Engineer</span>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[38%] bg-teal-50/60 border-r border-teal-100 p-1.5 space-y-1.5">
            <div>
              <div className="text-[4.2px] font-bold uppercase text-teal-800 mb-0.5">Contact</div>
              <div className="text-[3.7px] text-slate-600 truncate">alex@cloud.dev</div>
              <div className="text-[3.7px] text-slate-500">San Francisco</div>
            </div>
            <div>
              <div className="text-[4.2px] font-bold uppercase text-teal-800 mb-0.5">Stack</div>
              <div className="text-[3.7px] text-slate-600">TypeScript, Go</div>
              <div className="text-[3.7px] text-slate-600">AWS, Kubernetes</div>
              <div className="text-[3.7px] text-slate-600">PostgreSQL</div>
            </div>
            <div>
              <div className="text-[4.2px] font-bold uppercase text-teal-800 mb-0.5">Education</div>
              <div className="text-[3.7px] text-slate-600">B.S. Comp Sci</div>
            </div>
          </div>
          <div className="w-[62%] p-1.5 space-y-1.5">
            <div>
              <div className="text-[4.5px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-0.5 mb-0.5">
                Summary
              </div>
              <p className="text-[3.8px] text-slate-500 line-clamp-2">
                Distributed systems engineer scaling low-latency telemetry APIs.
              </p>
            </div>
            <div>
              <div className="text-[4.5px] font-bold uppercase text-teal-800 border-b border-teal-100 pb-0.5 mb-0.5">
                Experience
              </div>
              <div className="font-semibold text-slate-800 text-[4px]">Senior SWE · Nexus</div>
              <p className="text-[3.7px] text-slate-500">• Cut API p99 latency 38% across cluster.</p>
              <p className="text-[3.7px] text-slate-500">• Built CI/CD deploy pipelines.</p>
            </div>
            <div>
              <div className="text-[4.5px] font-bold uppercase text-teal-800 border-b border-teal-100 pb-0.5 mb-0.5">
                Projects
              </div>
              <p className="text-[3.7px] text-slate-500">• Open-source observability SDK.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. EXECUTIVE / SENIOR LEADERSHIP: Dark Header Banner
  if (templateId === 'template-executive') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col text-[4.5px] leading-[1.35] text-slate-700 select-none"
        aria-hidden="true"
      >
        <div className="bg-[#1E293B] px-2.5 py-2 text-white">
          <div className="text-[6.5px] font-bold tracking-tight">JORDAN HAYES</div>
          <div className="text-[4.3px] text-slate-300 font-medium">VP of Product &amp; Strategy</div>
          <div className="text-[3.5px] text-slate-400 mt-0.5">Seattle · jordan@exec.io</div>
        </div>
        <div className="p-2 space-y-1.5 flex-1">
          <div className="grid grid-cols-3 gap-1 bg-slate-50 border border-slate-200 rounded-[3px] p-1 text-center text-[3.5px] font-semibold text-slate-700">
            <span>P&amp;L Scope</span>
            <span>M&amp;A Integration</span>
            <span>Org Scaling</span>
          </div>
          <div>
            <div className="text-[4.5px] font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-0.5">
              Executive Brief
            </div>
            <p className="text-[3.8px] text-slate-500 line-clamp-2">
              Scaled enterprise SaaS portfolio from $18M to $94M ARR across 4 product lines.
            </p>
          </div>
          <div>
            <div className="text-[4.5px] font-bold uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-0.5">
              Leadership History
            </div>
            <div className="flex justify-between font-semibold text-[4px] text-slate-800">
              <span>VP Product · Acme</span>
              <span className="text-slate-400">2021–Pres</span>
            </div>
            <p className="text-[3.7px] text-slate-500">• Led 45-person PM &amp; Design org.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. DATA ANALYST: KPI Ribbon + Analytics Matrix
  if (templateId === 'template-data') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col p-2 justify-between text-[4.5px] leading-[1.35] text-slate-700 select-none"
        aria-hidden="true"
      >
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between border-b border-indigo-200 pb-1">
            <span className="text-[6.2px] font-bold text-indigo-700">PRIYA NAIR</span>
            <span className="text-[3.8px] text-slate-500">Data Analyst</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[3px] p-0.5 text-center">
              <div className="text-[5px] font-bold text-indigo-700">+22%</div>
              <div className="text-[3.2px] text-slate-500">Retention</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-[3px] p-0.5 text-center">
              <div className="text-[5px] font-bold text-indigo-700">SQL</div>
              <div className="text-[3.2px] text-slate-500">BigQuery</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-[3px] p-0.5 text-center">
              <div className="text-[5px] font-bold text-indigo-700">14</div>
              <div className="text-[3.2px] text-slate-500">A/B Tests</div>
            </div>
          </div>
          <div>
            <div className="text-[4.5px] font-bold uppercase text-indigo-700 border-b border-indigo-100 pb-0.5 mb-0.5">
              Experience
            </div>
            <div className="font-semibold text-[4px] text-slate-800">Senior BI Analyst</div>
            <p className="text-[3.7px] text-slate-500">• Automated Looker revenue cohorts.</p>
            <p className="text-[3.7px] text-slate-500">• Modeled funnel attribution in dbt.</p>
          </div>
        </div>
        <div className="pt-1 border-t border-slate-100">
          <div className="text-[4.2px] font-bold uppercase text-indigo-700">Tools</div>
          <div className="text-[3.7px] text-slate-600">Python, SQL, Tableau, Amplitude</div>
        </div>
      </div>
    );
  }

  // 4. FRESHER / ENTRY LEVEL: Education & Capstones First
  if (templateId === 'template-fresher') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col p-2 justify-between text-[4.5px] leading-[1.35] text-slate-700 select-none"
        aria-hidden="true"
      >
        <div className="space-y-1.5">
          <div className="border-b border-sky-200 pb-1">
            <div className="text-[6.2px] font-bold text-sky-800">ROHAN PATEL</div>
            <div className="text-[3.8px] text-slate-500">CS Graduate · Product Analyst Intern</div>
          </div>
          <div className="bg-sky-50/70 border border-sky-200 rounded-[3px] p-1">
            <div className="flex justify-between font-bold text-[4.1px] text-sky-900">
              <span>Education · B.Tech CS</span>
              <span>3.9 GPA</span>
            </div>
            <div className="text-[3.6px] text-slate-600">Algorithms, DBMS, Statistics</div>
          </div>
          <div>
            <div className="text-[4.5px] font-bold uppercase text-sky-800 border-b border-sky-100 pb-0.5 mb-0.5">
              Capstone Projects
            </div>
            <div className="font-semibold text-[4px] text-slate-800">Churn Predictor App</div>
            <p className="text-[3.7px] text-slate-500">• Built Python API + SQL dashboard.</p>
          </div>
        </div>
        <div>
          <div className="text-[4.2px] font-bold uppercase text-sky-800">Internships &amp; Skills</div>
          <div className="text-[3.7px] text-slate-600">SQL, Python, React, Figma</div>
        </div>
      </div>
    );
  }

  // 5. MODERN MINIMAL: Left Accent Bar & Clean Hierarchy
  if (templateId === 'template-modern') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex text-[4.5px] leading-[1.35] text-slate-700 select-none"
        aria-hidden="true"
      >
        <div className="w-1.5 shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="flex-1 p-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div>
              <div className="text-[6.2px] font-bold text-blue-700">MAYA CHEN</div>
              <div className="text-[4px] text-slate-600 font-medium">Growth Product Manager</div>
              <div className="text-[3.5px] text-slate-400">NYC · maya@product.co</div>
            </div>
            <div className="pl-1 border-l-2 border-blue-500">
              <div className="text-[4.3px] font-bold uppercase text-slate-800">Summary</div>
              <p className="text-[3.7px] text-slate-500 line-clamp-2">
                Consumer growth specialist driving onboarding conversion &amp; retention.
              </p>
            </div>
            <div className="pl-1 border-l-2 border-blue-500">
              <div className="text-[4.3px] font-bold uppercase text-slate-800">Experience</div>
              <div className="font-semibold text-[3.9px] text-slate-800">PM · FinFlow</div>
              <p className="text-[3.6px] text-slate-500">• +18% activation via A/B tests.</p>
            </div>
          </div>
          <div className="text-[3.6px] text-slate-600 pt-1 border-t border-slate-100">
            Mixpanel · Figma · SQL · Growth
          </div>
        </div>
      </div>
    );
  }

  // 6. PROFESSIONAL / CORPORATE: Centered Classic Serif
  if (templateId === 'template-corporate') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col p-2 justify-between text-[4.5px] leading-[1.35] text-slate-800 font-serif select-none"
        aria-hidden="true"
      >
        <div className="space-y-1.5">
          <div className="text-center border-b-2 border-slate-800 pb-1">
            <div className="text-[6.2px] font-bold tracking-wide text-slate-900">CLAIRE BENNETT</div>
            <div className="text-[3.9px] text-slate-600">Strategy &amp; Corporate Finance</div>
            <div className="text-[3.4px] text-slate-400">Chicago · claire@firm.com</div>
          </div>
          <div>
            <div className="text-center text-[4.3px] font-bold uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-0.5">
              Summary
            </div>
            <p className="text-[3.7px] text-slate-600 line-clamp-2">
              Advisory leader structuring capital strategy &amp; operational turnarounds.
            </p>
          </div>
          <div>
            <div className="text-center text-[4.3px] font-bold uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-0.5">
              Experience
            </div>
            <div className="flex justify-between font-semibold text-[3.9px]">
              <span>Engagement Manager</span>
              <span>2020–25</span>
            </div>
            <p className="text-[3.6px] text-slate-600">• Delivered $40M cost optimization.</p>
          </div>
        </div>
        <div className="text-center text-[3.6px] text-slate-500 border-t border-slate-200 pt-0.5">
          MBA, Wharton · CFA Charterholder
        </div>
      </div>
    );
  }

  // 7. ATS-FRIENDLY ULTRA: Pure Linear Monochrome
  if (templateId === 'template-ats') {
    return (
      <div
        className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col p-2 justify-between text-[4.4px] leading-[1.35] text-black select-none"
        aria-hidden="true"
      >
        <div className="space-y-1.5">
          <div className="border-b border-black pb-1">
            <div className="text-[6.2px] font-bold tracking-tight">SAMUEL CARTER</div>
            <div className="text-[3.9px] font-semibold">Technical Program Manager</div>
            <div className="text-[3.5px] text-slate-600">sam@domain.com | (555) 210-8941</div>
          </div>
          <div>
            <div className="text-[4.4px] font-bold uppercase border-b border-black pb-0.5 mb-0.5">
              Professional Summary
            </div>
            <p className="text-[3.7px] text-slate-700 line-clamp-2">
              100% linear single-column structure with standard section labels.
            </p>
          </div>
          <div>
            <div className="text-[4.4px] font-bold uppercase border-b border-black pb-0.5 mb-0.5">
              Work Experience
            </div>
            <div className="font-bold text-[3.9px]">Lead TPM · Enterprise Cloud</div>
            <p className="text-[3.7px] text-slate-700">• Delivered SOC2 compliance rollout.</p>
            <p className="text-[3.7px] text-slate-700">• Managed cross-org API SLAs.</p>
          </div>
        </div>
        <div>
          <div className="text-[4.4px] font-bold uppercase border-b border-black pb-0.5 mb-0.5">
            Skills
          </div>
          <div className="text-[3.7px] text-slate-700">Jira, SQL, Agile, Cloud Security</div>
        </div>
      </div>
    );
  }

  // 8. PRODUCT MANAGEMENT (Default)
  return (
    <div
      className="w-32 h-40 bg-white rounded-[6px] shadow-xs border border-[#E5EAF0] overflow-hidden flex flex-col p-2 justify-between text-[4.5px] leading-[1.35] text-slate-700 select-none"
      aria-hidden="true"
    >
      <div className="space-y-1.5">
        <div className="text-center border-b pb-1" style={{ borderBottomColor: accentColor }}>
          <div className="text-[6.2px] font-bold tracking-tight" style={{ color: accentColor }}>
            ALEX MORGAN
          </div>
          <div className="text-[4px] font-semibold text-slate-700">Product Manager · AI &amp; SaaS</div>
          <div className="text-[3.5px] text-slate-400">SF, CA · alex@example.com</div>
        </div>
        <div>
          <div
            className="text-[4.4px] font-bold uppercase border-b pb-0.5 mb-0.5"
            style={{ color: accentColor, borderBottomColor: accentColor }}
          >
            Summary
          </div>
          <p className="text-[3.7px] text-slate-600 line-clamp-2">
            PM shipping 0-to-1 AI workflows, telemetry funnels, and 15k+ MAU platforms.
          </p>
        </div>
        <div>
          <div
            className="text-[4.4px] font-bold uppercase border-b pb-0.5 mb-0.5"
            style={{ color: accentColor, borderBottomColor: accentColor }}
          >
            Experience
          </div>
          <div className="flex justify-between font-semibold text-[3.9px] text-slate-800">
            <span>PM · Nexus Cloud</span>
            <span className="text-slate-400">2023–Pres</span>
          </div>
          <p className="text-[3.6px] text-slate-600">• +31% trial conversion via A/B tests.</p>
        </div>
      </div>
      <div className="pt-1 border-t border-slate-100">
        <div className="text-[4.3px] font-bold uppercase" style={{ color: accentColor }}>
          Skills
        </div>
        <div className="text-[3.6px] text-slate-600">SQL, Python, PRDs, Experimentation</div>
      </div>
    </div>
  );
};
