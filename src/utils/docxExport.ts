import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { StructuredResume, SupportedLanguage } from '../types/resume';
import { RESUME_SECTION_LABELS } from '../i18n/translations';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    border: {
      bottom: {
        color: '1E2B3E',
        space: 2,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 21,
        color: '1E2B3E',
        font: 'Calibri',
      }),
    ],
  });
}

export function buildResumeDocxDocument(
  data: StructuredResume,
  fallbackLang: SupportedLanguage = 'en'
): Document {
  const lang = data.language || fallbackLang;
  const labels = RESUME_SECTION_LABELS[lang] || RESUME_SECTION_LABELS.en;

  const contactParts = [
    data.contact.location,
    data.contact.phone,
    data.contact.email,
    data.contact.linkedin,
    data.contact.github,
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: (data.name || 'Candidate Name').toUpperCase(),
          bold: true,
          size: 32,
          color: '1E2B3E',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: data.targetRoleHeadline || '',
          bold: true,
          size: 22,
          color: '1D5A3A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: contactParts.join('  |  '),
          size: 18,
          color: '475569',
          font: 'Calibri',
        }),
      ],
    }),
  ];

  // Summary
  if (data.summary && data.summary.trim()) {
    children.push(createSectionHeading(labels.summary));
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: data.summary.trim(),
            size: 20,
            color: '1F2937',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    children.push(createSectionHeading(labels.experience));
    for (const exp of data.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 90, after: 30 },
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 21,
              color: '111827',
              font: 'Calibri',
            }),
            new TextRun({
              text: `  |  ${exp.company}`,
              italics: true,
              size: 20,
              color: '374151',
              font: 'Calibri',
            }),
            new TextRun({
              text: `    (${exp.startDate} – ${exp.endDate})`,
              size: 19,
              color: '6B7280',
              font: 'Calibri',
            }),
          ],
        })
      );

      for (const bullet of exp.bullets || []) {
        if (!bullet.trim()) continue;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: bullet.trim(),
                size: 19,
                color: '1F2937',
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    }
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    children.push(createSectionHeading(labels.projects));
    for (const proj of data.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 30 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: 20,
              color: '111827',
              font: 'Calibri',
            }),
            ...(proj.subtitle
              ? [
                  new TextRun({
                    text: `  (${proj.subtitle})`,
                    size: 19,
                    color: '6B7280',
                    font: 'Calibri',
                  }),
                ]
              : []),
          ],
        })
      );

      for (const bullet of proj.bullets || []) {
        if (!bullet.trim()) continue;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: bullet.trim(),
                size: 19,
                color: '1F2937',
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    }
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    children.push(createSectionHeading(labels.skills));
    for (const skill of data.skills) {
      if (!skill.items || skill.items.length === 0) continue;
      children.push(
        new Paragraph({
          spacing: { after: 45 },
          children: [
            new TextRun({
              text: `${skill.category}: `,
              bold: true,
              size: 19,
              color: '111827',
              font: 'Calibri',
            }),
            new TextRun({
              text: skill.items.join(', '),
              size: 19,
              color: '374151',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    children.push(createSectionHeading(labels.education));
    for (const edu of data.education) {
      children.push(
        new Paragraph({
          spacing: { after: 45 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 20,
              color: '111827',
              font: 'Calibri',
            }),
            new TextRun({
              text: ` — ${edu.institution}`,
              italics: true,
              size: 19,
              color: '374151',
              font: 'Calibri',
            }),
            new TextRun({
              text: `  (${edu.duration}${edu.details ? ` | ${edu.details}` : ''})`,
              size: 19,
              color: '6B7280',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    children.push(createSectionHeading(labels.certifications));
    for (const cert of data.certifications) {
      if (!cert.items || cert.items.length === 0) continue;
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${cert.category}: `,
              bold: true,
              size: 19,
              color: '111827',
              font: 'Calibri',
            }),
            new TextRun({
              text: cert.items.join(' | '),
              size: 19,
              color: '374151',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });
}

export async function generateResumeDocxBytes(
  data: StructuredResume,
  fallbackLang: SupportedLanguage = 'en'
): Promise<Uint8Array> {
  const doc = buildResumeDocxDocument(data, fallbackLang);
  const blob = await Packer.toBlob(doc);
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function exportResumeToDocx(
  data: StructuredResume,
  fileName: string = 'Resume_Optimized.docx',
  fallbackLang: SupportedLanguage = 'en'
): Promise<boolean> {
  const bytes = await generateResumeDocxBytes(data, fallbackLang);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  triggerBlobDownload(blob, fileName.endsWith('.docx') ? fileName : `${fileName}.docx`);
  return true;
}

export async function exportCoverLetterToDocx(
  coverLetterText: string,
  candidateName: string,
  targetRole: string,
  companyName: string
): Promise<boolean> {
  const paragraphs = coverLetterText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: candidateName || 'Candidate',
                bold: true,
                size: 28,
                color: '1E2B3E',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            border: {
              bottom: {
                color: 'CBD5E1',
                space: 4,
                style: BorderStyle.SINGLE,
                size: 4,
              },
            },
            children: [
              new TextRun({
                text: `Application for ${targetRole}${companyName ? ` at ${companyName}` : ''}`,
                size: 20,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
          }),
          ...paragraphs.map(
            (text) =>
              new Paragraph({
                spacing: { after: 160 },
                children: [
                  new TextRun({
                    text,
                    size: 22,
                    color: '1F2937',
                    font: 'Calibri',
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (candidateName || 'Cover_Letter').replace(/\s+/g, '_');
  const safeCompany = (companyName || 'Role').replace(/\s+/g, '_');
  triggerBlobDownload(blob, `${safeName}_${safeCompany}_Cover_Letter.docx`);
  return true;
}
