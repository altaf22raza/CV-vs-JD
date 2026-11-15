import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface StagedProgressProps {
  stages: string[];
  statusText?: string;
}

const StagedProgressBanner: React.FC<StagedProgressProps> = ({ stages, statusText }) => {
  const [activeStage, setActiveStage] = useState<number>(0);

  useEffect(() => {
    setActiveStage(0);
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [stages.length, statusText]);

  const progressPct = Math.round(((activeStage + 1) / stages.length) * 100);

  return (
    <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Loader2 className="w-4 h-4 text-[#3978B8] animate-spin shrink-0" />
          <span className="text-xs font-semibold text-[#173B65] truncate">
            {statusText || stages[activeStage]}
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold text-slate-500 shrink-0 tabular-nums">
          Step {activeStage + 1}/{stages.length}
        </span>
      </div>

      {/* Subtle flat progress track */}
      <div className="w-full h-1.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3978B8] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Meaningful stage steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        {stages.map((label, idx) => {
          const isDone = idx < activeStage;
          const isCurrent = idx === activeStage;
          return (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-[8px] border ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-medium'
                  : isCurrent
                    ? 'bg-[#F7F9FC] border-[#3978B8]/50 text-[#173B65] font-semibold'
                    : 'bg-white border-[#E5EAF0] text-slate-400'
              }`}
            >
              {isDone ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isCurrent ? 'bg-[#3978B8] animate-pulse' : 'bg-slate-300'
                  }`}
                />
              )}
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AnalysisReportSkeleton: React.FC<{ statusText?: string }> = ({ statusText }) => {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Analyzing job compatibility">
      <StagedProgressBanner
        statusText={statusText}
        stages={[
          '1. Parsing JD requirements',
          '2. Matching resume text',
          '3. Auditing formatting',
          '4. Building evidence report',
        ]}
      />

      {/* Overall Score & Methodology Card Skeleton */}
      <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-3 w-40 rounded-[6px] skeleton-block" />
          <div className="h-8 w-24 rounded-[8px] skeleton-block" />
          <div className="h-3 w-64 rounded-[6px] skeleton-block" />
        </div>
        <div className="w-full md:max-w-md bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] p-3.5 space-y-2">
          <div className="h-3 w-44 rounded-[6px] skeleton-block" />
          <div className="h-2.5 w-full rounded-[6px] skeleton-block" />
          <div className="h-2.5 w-4/5 rounded-[6px] skeleton-block" />
        </div>
      </div>

      {/* 6-Metric Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-28 rounded-[6px] skeleton-block" />
              <div className="h-4 w-14 rounded-[6px] skeleton-block" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-[6px] skeleton-block" />
              <div className="h-2.5 w-5/6 rounded-[6px] skeleton-block" />
            </div>
          </div>
        ))}
      </div>

      {/* Matched / Missing Keywords Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map((col) => (
          <div key={col} className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-3">
            <div className="h-3.5 w-48 rounded-[6px] skeleton-block" />
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} className="flex items-center justify-between gap-3 py-1">
                  <div className="h-3 w-36 rounded-[6px] skeleton-block" />
                  <div className="h-3 w-16 rounded-[6px] skeleton-block" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OptimizationDiffSkeleton: React.FC<{ statusText?: string }> = ({ statusText }) => {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Generating optimized resume">
      <StagedProgressBanner
        statusText={statusText}
        stages={[
          '1. Extracting priority terms',
          '2. Tailoring summary & roles',
          '3. Preparing side-by-side diffs',
          '4. Validating factual integrity',
        ]}
      />

      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-2.5">
            <div className="h-3 w-28 rounded-[6px] skeleton-block" />
            <div className="h-2.5 w-full rounded-[6px] skeleton-block" />
            <div className="h-2.5 w-11/12 rounded-[6px] skeleton-block" />
            <div className="h-2.5 w-3/4 rounded-[6px] skeleton-block" />
          </div>
          <div className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-32 rounded-[6px] skeleton-block" />
              <div className="flex gap-1.5">
                <div className="h-6 w-16 rounded-[8px] skeleton-block" />
                <div className="h-6 w-16 rounded-[8px] skeleton-block" />
              </div>
            </div>
            <div className="h-2.5 w-full rounded-[6px] skeleton-block" />
            <div className="h-2.5 w-10/12 rounded-[6px] skeleton-block" />
            <div className="h-2.5 w-2/3 rounded-[6px] skeleton-block" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DocumentTextSkeleton: React.FC<{ lines?: number; statusText?: string }> = ({
  lines = 9,
  statusText,
}) => {
  return (
    <div className="space-y-4" aria-busy="true">
      {statusText && (
        <StagedProgressBanner
          statusText={statusText}
          stages={[
            '1. Reading resume history',
            '2. Aligning target role themes',
            '3. Drafting structured output',
            '4. Finalizing formatting',
          ]}
        />
      )}
      <div className="border border-[#E5EAF0] rounded-[12px] bg-[#F7F9FC] p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-56 rounded-[6px] skeleton-block" />
          <div className="h-7 w-28 rounded-[8px] skeleton-block" />
        </div>
        <div className="bg-white border border-[#E5EAF0] rounded-[10px] p-5 space-y-3">
          {Array.from({ length: lines }).map((_, idx) => (
            <div
              key={idx}
              className="h-3 rounded-[6px] skeleton-block"
              style={{ width: idx % 4 === 3 ? '68%' : idx % 3 === 1 ? '92%' : '100%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardListSkeleton: React.FC<{ cards?: number; statusText?: string }> = ({
  cards = 3,
  statusText,
}) => {
  return (
    <div className="space-y-3" aria-busy="true">
      {statusText && (
        <StagedProgressBanner
          statusText={statusText}
          stages={[
            '1. Inspecting JD context',
            '2. Anchoring resume evidence',
            '3. Generating structured items',
            '4. Running schema validation',
          ]}
        />
      )}
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="bg-white border border-[#E5EAF0] rounded-[12px] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 rounded-[6px] skeleton-block" />
              <div className="h-4 w-3/4 rounded-[6px] skeleton-block" />
            </div>
            <div className="h-7 w-24 rounded-[8px] skeleton-block shrink-0" />
          </div>
          <div className="h-3 w-11/12 rounded-[6px] skeleton-block" />
          <div className="h-3 w-4/5 rounded-[6px] skeleton-block" />
        </div>
      ))}
    </div>
  );
};
