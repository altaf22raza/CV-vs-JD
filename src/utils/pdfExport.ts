import { jsPDF } from 'jspdf';
import type { StructuredResume, SupportedLanguage } from '../types/resume';
import { RESUME_SECTION_LABELS } from '../i18n/translations';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_X_MM = 16;
const MARGIN_TOP_MM = 15;
const MARGIN_BOTTOM_MM = 15;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_X_MM * 2;

const COLOR_NAVY: [number, number, number] = [23, 59, 101];
const COLOR_DARK: [number, number, number] = [24, 34, 48];
const COLOR_MUTED: [number, number, number] = [82, 96, 114];
const COLOR_RULE: [number, number, number] = [210, 218, 228];

/**
 * Normalizes typography for standard WinAnsi/Helvetica PDF text streams so punctuation
 * (en-dash, em-dash, curly quotes, bullet dots, arrows) renders cleanly and extracts reliably.
 */
function normalizePdfText(value: string): string {
  return (value || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u25CF\u25AA]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTemplateFontFamily(templateId?: string): 'helvetica' | 'times' {
  if (templateId === 'template-corporate') {
    return 'times';
  }
  return 'helvetica';
}

/**
 * Builds a true vector, text-based, single-column linear-order PDF document directly
 * from StructuredResume (zero raster screenshots/html2canvas, 100% selectable text).
 */
export function buildVectorResumePdf(
  data: StructuredResume,
  fallbackLang: SupportedLanguage = 'en'
): jsPDF {
  const lang = data.language || fallbackLang;
  const labels = RESUME_SECTION_LABELS[lang] || RESUME_SECTION_LABELS.en;
  const fontFamily = getTemplateFontFamily(data.templateId);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: normalizePdfText(`${data.name || 'Candidate'} - ${data.targetRoleHeadline || 'Resume'}`),
    subject: 'ATS-Friendly Text-Based Resume',
    creator: 'CV-JD Resume Optimizer',
  });

  let y = MARGIN_TOP_MM;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > PAGE_HEIGHT_MM - MARGIN_BOTTOM_MM) {
      doc.addPage();
      y = MARGIN_TOP_MM;
    }
  };

  const drawWrappedLines = (
    text: string,
    options: {
      x?: number;
      maxWidth?: number;
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: [number, number, number];
      lineHeight?: number;
    } = {}
  ) => {
    const clean = normalizePdfText(text);
    if (!clean) return;
    const x = options.x ?? MARGIN_X_MM;
    const maxWidth = options.maxWidth ?? CONTENT_WIDTH_MM;
    const fontSize = options.fontSize ?? 9.5;
    const fontStyle = options.fontStyle ?? 'normal';
    const color = options.color ?? COLOR_DARK;
    const lineHeight = options.lineHeight ?? fontSize * 0.44;

    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(clean, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight + 0.8);
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(11);
    y += 2.6;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(normalizePdfText(title).toUpperCase(), MARGIN_X_MM, y);
    y += 1.6;
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X_MM, y, PAGE_WIDTH_MM - MARGIN_X_MM, y);
    y += 4.0;
  };

  const drawBullet = (text: string) => {
    const clean = normalizePdfText(text);
    if (!clean) return;
    const bulletIndent = 4.2;
    const fontSize = 9.2;
    const lineHeight = 4.1;

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);

    const lines = doc.splitTextToSize(clean, CONTENT_WIDTH_MM - bulletIndent) as string[];
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lineHeight + 0.6);
      if (i === 0) {
        doc.text('-', MARGIN_X_MM + 1.1, y);
      }
      doc.text(lines[i], MARGIN_X_MM + bulletIndent, y);
      y += lineHeight;
    }
    y += 0.5;
  };

  // Header: Name, Headline, Contact
  drawWrappedLines(data.name || 'Candidate Name', {
    fontSize: 17,
    fontStyle: 'bold',
    color: COLOR_NAVY,
    lineHeight: 6.5,
  });

  if (data.targetRoleHeadline?.trim()) {
    drawWrappedLines(data.targetRoleHeadline, {
      fontSize: 10.5,
      fontStyle: 'bold',
      color: COLOR_DARK,
      lineHeight: 4.8,
    });
  }

  const contactParts = [
    data.contact?.location,
    data.contact?.phone,
    data.contact?.email,
    data.contact?.linkedin,
    data.contact?.github,
    data.contact?.portfolio,
    data.contact?.website,
  ]
    .map((p) => normalizePdfText(p || ''))
    .filter(Boolean);

  if (contactParts.length > 0) {
    drawWrappedLines(contactParts.join(' | '), {
      fontSize: 8.6,
      fontStyle: 'normal',
      color: COLOR_MUTED,
      lineHeight: 4.0,
    });
  }

  y += 1.5;

  const renderSummary = () => {
    if (!data.summary?.trim()) return;
    drawSectionHeading(labels.summary);
    drawWrappedLines(data.summary, {
      fontSize: 9.3,
      color: COLOR_DARK,
      lineHeight: 4.2,
    });
  };

  const renderExperience = () => {
    if (!data.experience?.length) return;
    drawSectionHeading(labels.experience);
    for (const exp of data.experience) {
      ensureSpace(10);
      const headerLeft = normalizePdfText(
        `${exp.role || ''}${exp.company ? ` | ${exp.company}` : ''}${exp.location ? ` (${exp.location})` : ''}`
      );
      const dateStr = normalizePdfText(`${exp.startDate || ''} - ${exp.endDate || ''}`);

      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9.8);
      doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      const dateWidth = dateStr ? doc.getTextWidth(dateStr) + 4 : 0;
      const leftLines = doc.splitTextToSize(headerLeft, CONTENT_WIDTH_MM - dateWidth) as string[];

      for (let i = 0; i < leftLines.length; i++) {
        ensureSpace(4.5);
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9.8);
        doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
        doc.text(leftLines[i], MARGIN_X_MM, y);
        if (i === 0 && dateStr) {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(8.8);
          doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
          doc.text(dateStr, PAGE_WIDTH_MM - MARGIN_X_MM, y, { align: 'right' });
        }
        y += 4.3;
      }

      for (const bullet of exp.bullets || []) {
        drawBullet(bullet);
      }
      y += 1.2;
    }
  };

  const renderProjects = () => {
    if (!data.projects?.length) return;
    drawSectionHeading(labels.projects);
    for (const proj of data.projects) {
      ensureSpace(9);
      const projHeader = normalizePdfText(
        `${proj.title || ''}${proj.subtitle ? ` | ${proj.subtitle}` : ''}${proj.technologies ? ` [${proj.technologies}]` : ''}`
      );
      drawWrappedLines(projHeader, {
        fontSize: 9.6,
        fontStyle: 'bold',
        color: COLOR_DARK,
        lineHeight: 4.3,
      });
      for (const bullet of proj.bullets || []) {
        drawBullet(bullet);
      }
      y += 1.0;
    }
  };

  const renderSkills = () => {
    const validSkills = (data.skills || []).filter((s) => s.items?.length > 0);
    if (!validSkills.length) return;
    drawSectionHeading(labels.skills);
    for (const skill of validSkills) {
      const catText = normalizePdfText(`${skill.category}: `);
      const itemsText = normalizePdfText(skill.items.join(', '));
      drawWrappedLines(`${catText}${itemsText}`, {
        fontSize: 9.2,
        fontStyle: 'normal',
        color: COLOR_DARK,
        lineHeight: 4.1,
      });
      y += 0.4;
    }
  };

  const renderEducation = () => {
    if (!data.education?.length) return;
    drawSectionHeading(labels.education);
    for (const edu of data.education) {
      ensureSpace(7);
      const line = normalizePdfText(
        `${edu.degree || ''}${edu.specialization ? ` (${edu.specialization})` : ''} - ${edu.institution || ''}`
      );
      const rightInfo = normalizePdfText(
        `${edu.duration || ''}${edu.details ? ` | ${edu.details}` : ''}`
      );
      drawWrappedLines(rightInfo ? `${line} (${rightInfo})` : line, {
        fontSize: 9.3,
        fontStyle: 'normal',
        color: COLOR_DARK,
        lineHeight: 4.2,
      });
      y += 0.5;
    }
  };

  const renderCertifications = () => {
    const validCerts = (data.certifications || []).filter((c) => c.items?.length > 0);
    if (!validCerts.length) return;
    drawSectionHeading(labels.certifications);
    for (const cert of validCerts) {
      const text = normalizePdfText(
        `${cert.category ? `${cert.category}: ` : ''}${cert.items.join(' | ')}`
      );
      drawWrappedLines(text, {
        fontSize: 9.1,
        color: COLOR_DARK,
        lineHeight: 4.1,
      });
      y += 0.4;
    }
  };

  const renderCustomSections = () => {
    for (const custom of data.customSections || []) {
      if (!custom.content?.trim()) continue;
      drawSectionHeading(custom.title || 'Additional Information');
      drawWrappedLines(custom.content, {
        fontSize: 9.2,
        color: COLOR_DARK,
        lineHeight: 4.2,
      });
    }
  };

  // Fresher template orders Education right after Summary; all others prioritize Experience linearly
  if (data.templateId === 'template-fresher') {
    renderSummary();
    renderEducation();
    renderProjects();
    renderExperience();
    renderSkills();
    renderCertifications();
    renderCustomSections();
  } else {
    renderSummary();
    renderExperience();
    renderProjects();
    renderSkills();
    renderEducation();
    renderCertifications();
    renderCustomSections();
  }

  return doc;
}

/**
 * Generates raw bytes of the text-based vector PDF (usable in both browser and Node tests).
 */
export function generateResumePdfBytes(
  data: StructuredResume,
  fallbackLang: SupportedLanguage = 'en'
): Uint8Array {
  const doc = buildVectorResumePdf(data, fallbackLang);
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Downloads a true text-based ATS-readable PDF directly from structured resume data.
 */
export async function exportResumeToPdf(
  data: StructuredResume,
  fileName: string = 'Resume_Optimized.pdf',
  fallbackLang: SupportedLanguage = 'en'
): Promise<boolean> {
  try {
    const doc = buildVectorResumePdf(data, fallbackLang);
    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    doc.save(safeName);
    return true;
  } catch (error) {
    console.error('Failed to export text-based PDF:', error);
    return false;
  }
}

/**
 * Opens the browser print-to-PDF workflow targeting the formatted A4 resume layout
 * styled cleanly via @media print rules in index.css.
 */
export function printResumeToPdf(): void {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
}

export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
