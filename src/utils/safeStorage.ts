import { ResumeVersion, StructuredResume } from '../types/resume';
import { DEFAULT_STRUCTURED_RESUME } from '../data/defaultResume';

/**
 * Safely read and parse JSON from localStorage with fallback on corruption.
 */
export function safeReadStorageJson<T>(
  key: string,
  fallback: T,
  validator?: (val: unknown) => val is T
): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validator && !validator(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
    return fallback;
  }
}

export function safeWriteStorageJson(key: string, value: unknown): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a potentially partial or malformed StructuredResume so UI renderers never crash on missing nested fields.
 */
export function normalizeStructuredResume(
  input: Partial<StructuredResume> | null | undefined,
  fallback: StructuredResume = DEFAULT_STRUCTURED_RESUME
): StructuredResume {
  const safe = input && typeof input === 'object' ? input : {};
  const contact = safe.contact && typeof safe.contact === 'object' ? safe.contact : ({} as Partial<StructuredResume['contact']>);

  return {
    name: typeof safe.name === 'string' && safe.name.trim() ? safe.name.trim() : fallback.name,
    targetRoleHeadline:
      typeof safe.targetRoleHeadline === 'string'
        ? safe.targetRoleHeadline
        : fallback.targetRoleHeadline,
    templateId: typeof safe.templateId === 'string' && safe.templateId ? safe.templateId : fallback.templateId,
    language: safe.language || fallback.language || 'en',
    contact: {
      location: typeof contact.location === 'string' ? contact.location : '',
      phone: typeof contact.phone === 'string' ? contact.phone : '',
      email: typeof contact.email === 'string' ? contact.email : '',
      linkedin: typeof contact.linkedin === 'string' ? contact.linkedin : '',
      github: typeof contact.github === 'string' ? contact.github : '',
      portfolio: typeof contact.portfolio === 'string' ? contact.portfolio : undefined,
      website: typeof contact.website === 'string' ? contact.website : undefined,
    },
    summary: typeof safe.summary === 'string' ? safe.summary : fallback.summary,
    experience: Array.isArray(safe.experience)
      ? safe.experience
          .filter((e) => e && typeof e === 'object')
          .map((e, idx) => ({
            id: typeof e.id === 'string' && e.id ? e.id : `exp-${idx + 1}`,
            role: typeof e.role === 'string' ? e.role : 'Role',
            company: typeof e.company === 'string' ? e.company : '',
            location: typeof e.location === 'string' ? e.location : undefined,
            employmentType: typeof e.employmentType === 'string' ? e.employmentType : undefined,
            startDate: typeof e.startDate === 'string' ? e.startDate : '',
            endDate: typeof e.endDate === 'string' ? e.endDate : '',
            bullets: Array.isArray(e.bullets)
              ? e.bullets.filter((b): b is string => typeof b === 'string')
              : [],
          }))
      : fallback.experience,
    education: Array.isArray(safe.education)
      ? safe.education
          .filter((e) => e && typeof e === 'object')
          .map((e, idx) => ({
            id: typeof e.id === 'string' && e.id ? e.id : `edu-${idx + 1}`,
            degree: typeof e.degree === 'string' ? e.degree : '',
            institution: typeof e.institution === 'string' ? e.institution : '',
            specialization: typeof e.specialization === 'string' ? e.specialization : undefined,
            duration: typeof e.duration === 'string' ? e.duration : '',
            details: typeof e.details === 'string' ? e.details : '',
          }))
      : fallback.education,
    projects: Array.isArray(safe.projects)
      ? safe.projects
          .filter((p) => p && typeof p === 'object')
          .map((p, idx) => ({
            id: typeof p.id === 'string' && p.id ? p.id : `proj-${idx + 1}`,
            title: typeof p.title === 'string' ? p.title : '',
            linkText: typeof p.linkText === 'string' ? p.linkText : undefined,
            linkUrl: typeof p.linkUrl === 'string' ? p.linkUrl : undefined,
            subtitle: typeof p.subtitle === 'string' ? p.subtitle : '',
            technologies: typeof p.technologies === 'string' ? p.technologies : undefined,
            bullets: Array.isArray(p.bullets)
              ? p.bullets.filter((b): b is string => typeof b === 'string')
              : [],
          }))
      : fallback.projects,
    skills: Array.isArray(safe.skills)
      ? safe.skills
          .filter((s) => s && typeof s === 'object')
          .map((s, idx) => ({
            id: typeof s.id === 'string' && s.id ? s.id : `skill-${idx + 1}`,
            category: typeof s.category === 'string' ? s.category : 'Skills',
            items: Array.isArray(s.items)
              ? s.items.filter((it): it is string => typeof it === 'string')
              : [],
          }))
      : fallback.skills,
    certifications: Array.isArray(safe.certifications)
      ? safe.certifications
          .filter((c) => c && typeof c === 'object')
          .map((c, idx) => ({
            id: typeof c.id === 'string' && c.id ? c.id : `cert-${idx + 1}`,
            category: typeof c.category === 'string' ? c.category : 'Certifications',
            items: Array.isArray(c.items)
              ? c.items.filter((it): it is string => typeof it === 'string')
              : [],
            date: typeof c.date === 'string' ? c.date : undefined,
            url: typeof c.url === 'string' ? c.url : undefined,
          }))
      : fallback.certifications,
    customSections: Array.isArray(safe.customSections) ? safe.customSections : undefined,
  };
}

/**
 * Deduplicates resume versions by ID, keeping the most recently updated copy.
 */
export function deduplicateResumeVersions(list: ResumeVersion[]): ResumeVersion[] {
  const byId = new Map<string, ResumeVersion>();
  for (const item of list) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) continue;
    const normalized: ResumeVersion = {
      ...item,
      structuredData: normalizeStructuredResume(item.structuredData),
      originalStructuredData: normalizeStructuredResume(
        item.originalStructuredData || item.structuredData
      ),
      diffItems: Array.isArray(item.diffItems) ? item.diffItems : [],
      snapshots: Array.isArray(item.snapshots) ? item.snapshots : [],
    };
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, normalized);
    } else {
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      const incomingTime = new Date(normalized.updatedAt || 0).getTime();
      if (incomingTime >= existingTime) {
        byId.set(item.id, normalized);
      }
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}
