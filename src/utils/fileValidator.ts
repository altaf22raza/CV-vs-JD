/**
 * Client-side file validation, magic-byte inspection, safe text extraction,
 * and XSS/control-character sanitization for uploaded CVs and Job Descriptions.
 */

import {
  MAX_DOCUMENT_BYTES,
  MAX_EXTRACTED_TEXT_CHARS,
  extractTextFromDocxBuffer,
  inspectAndExtractPdfBuffer,
  sanitizeDocumentText,
} from './documentExtractors';

export const MAX_UPLOAD_BYTES = MAX_DOCUMENT_BYTES; // 5 MB strict ceiling
export const MAX_EXTRACTED_CHARS = MAX_EXTRACTED_TEXT_CHARS;

const ALLOWED_EXTENSIONS = new Set(['txt', 'md', 'tex', 'pdf', 'docx']);

const ALLOWED_MIME_TYPES = new Set([
  '',
  'text/plain',
  'text/markdown',
  'text/x-tex',
  'application/x-tex',
  'application/x-latex',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // Some OSes send generic octet-stream for .tex/.md
]);

export interface ValidatedFileResult {
  valid: boolean;
  error?: string;
  extractedText?: string;
  fileType?: 'txt' | 'md' | 'tex' | 'pdf' | 'docx';
}

/**
 * Strips potentially dangerous HTML/script payloads, null bytes, and control chars.
 */
export function sanitizeExtractedText(raw: string): string {
  return sanitizeDocumentText(raw);
}

function hasDisallowedExecutableSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 2) return false;
  // Windows PE / DOS MZ executable
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) return true;
  // ELF Linux binary
  if (bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
    return true;
  }
  // Mach-O / Java class
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0xca && bytes[1] === 0xfe && bytes[2] === 0xba && bytes[3] === 0xbe) ||
      (bytes[0] === 0xcf && bytes[1] === 0xfa && bytes[2] === 0xed && bytes[3] === 0xfe))
  ) {
    return true;
  }
  // Shebang script #!/
  if (bytes[0] === 0x23 && bytes[1] === 0x21) return true;
  return false;
}

export async function validateAndExtractDocumentFile(file: File): Promise<ValidatedFileResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 5 MB security limit.`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file type ".${ext || 'unknown'}". Allowed formats: PDF, DOCX, TXT, MD, and TEX.`,
    };
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `File MIME type "${file.type}" is not permitted.`,
    };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (hasDisallowedExecutableSignature(bytes)) {
    return {
      valid: false,
      error: 'Security check failed: executable or script binaries are not allowed.',
    };
  }

  if (ext === 'pdf') {
    const header = new TextDecoder('latin1').decode(bytes.subarray(0, 5));
    if (header !== '%PDF-') {
      return {
        valid: false,
        error: 'Invalid PDF file signature. Please upload a valid PDF or paste your resume text.',
      };
    }
    const { text: extracted } = await inspectAndExtractPdfBuffer(bytes);
    if (extracted.length < 30) {
      return {
        valid: false,
        error:
          'This PDF appears to be scanned/image-only or uses unsupported custom font encodings. Please paste your resume text in the "Paste Resume Text" tab or upload a DOCX/TXT file.',
      };
    }
    return { valid: true, extractedText: extracted, fileType: 'pdf' };
  }

  if (ext === 'docx') {
    // ZIP magic bytes: PK\x03\x04
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
      return {
        valid: false,
        error: 'Invalid DOCX archive signature. Please upload a valid .docx file.',
      };
    }
    try {
      const extracted = await extractTextFromDocxBuffer(bytes);
      if (extracted.length < 20) {
        return {
          valid: false,
          error: 'Could not extract readable text from this DOCX file. Try pasting your resume text instead.',
        };
      }
      return { valid: true, extractedText: extracted, fileType: 'docx' };
    } catch (err: any) {
      return {
        valid: false,
        error: err?.message || 'Failed to parse DOCX safely.',
      };
    }
  }

  // Plain text formats (.txt, .md, .tex)
  // Reject files containing embedded NUL bytes (binary disguised as text)
  const sampleLen = Math.min(bytes.length, 4096);
  for (let i = 0; i < sampleLen; i++) {
    if (bytes[i] === 0) {
      return {
        valid: false,
        error: 'Binary data detected in text file. Please upload a valid UTF-8 document.',
      };
    }
  }

  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const sanitized = sanitizeExtractedText(rawText);
  if (!sanitized) {
    return {
      valid: false,
      error: 'No readable text content remained after sanitization.',
    };
  }

  return {
    valid: true,
    extractedText: sanitized,
    fileType: ext as 'txt' | 'md' | 'tex',
  };
}
