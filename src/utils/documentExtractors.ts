/**
 * Shared binary text-extraction utilities for PDF and DOCX documents.
 * Runs in both Browser (File uploads) and Node.js (automated document validation tests)
 * using Web standard TextDecoder / DecompressionStream APIs.
 */

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_XML_UNCOMPRESSED_BYTES = 5 * 1024 * 1024;
export const MAX_EXTRACTED_TEXT_CHARS = 80_000;

export interface PdfInspectionResult {
  text: string;
  fontObjectCount: number;
  imageObjectCount: number;
  pageCount: number;
}

export function sanitizeDocumentText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\u0000/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\r\n/g, '\n')
    .slice(0, MAX_EXTRACTED_TEXT_CHARS)
    .trim();
}

function decodePdfLiteralString(inner: string): string {
  // Handle octal escapes like \050 or \225
  let out = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = inner[i + 1];
    if (next === undefined) break;
    if (next === 'n') {
      out += '\n';
      i++;
    } else if (next === 'r') {
      out += ' ';
      i++;
    } else if (next === 't') {
      out += ' ';
      i++;
    } else if (next === 'b' || next === 'f') {
      i++;
    } else if (next === '(' || next === ')' || next === '\\') {
      out += next;
      i++;
    } else if (next === '\r' || next === '\n') {
      if (next === '\r' && inner[i + 2] === '\n') i++;
      i++;
    } else if (/[0-7]/.test(next)) {
      const octMatch = inner.slice(i + 1, i + 4).match(/^[0-7]{1,3}/);
      if (octMatch) {
        const code = parseInt(octMatch[0], 8);
        if (code >= 32 && code <= 255) {
          out += String.fromCharCode(code);
        }
        i += octMatch[0].length;
      }
    } else {
      out += next;
      i++;
    }
  }
  return out;
}

function extractTextOperatorsFromContentStream(streamText: string): string[] {
  const tokens: string[] = [];
  // Match BT ... ET text blocks when present, otherwise inspect whole stream
  const blocks = streamText.match(/\bBT\b[\s\S]*?\bET\b/g) || [streamText];

  for (const block of blocks) {
    // Match TJ arrays [(...) -15 (...)] TJ or single literal (...) Tj
    const opRegex = /\[((?:[^[\]]|\([^)]*\))*)\]\s*TJ|\(((?:\\.|[^()\\])*)\)\s*(?:Tj|'|")/g;
    let m: RegExpExecArray | null;
    while ((m = opRegex.exec(block)) !== null) {
      if (m[1] !== undefined) {
        // TJ array
        const innerLitRegex = /\(((?:\\.|[^()\\])*)\)/g;
        let lm: RegExpExecArray | null;
        let combined = '';
        while ((lm = innerLitRegex.exec(m[1])) !== null) {
          combined += decodePdfLiteralString(lm[1]);
        }
        if (combined.trim()) {
          tokens.push(combined);
        }
      } else if (m[2] !== undefined) {
        const decoded = decodePdfLiteralString(m[2]);
        if (decoded.trim()) {
          tokens.push(decoded);
        }
      }
    }
  }

  // Fallback for uncompressed streams where Tj/TJ regex matched nothing
  if (tokens.length === 0) {
    const literalRegex = /\(((?:\\.|[^()\\]){2,})\)/g;
    let lm: RegExpExecArray | null;
    while ((lm = literalRegex.exec(streamText)) !== null) {
      const cleaned = decodePdfLiteralString(lm[1]);
      const printableCount = (cleaned.match(/[a-zA-Z0-9\s.,;:/\-+@()&%$]/g) || []).length;
      if (cleaned.length >= 2 && printableCount / cleaned.length >= 0.75) {
        tokens.push(cleaned);
      }
      if (tokens.length > 8000) break;
    }
  }

  return tokens;
}

async function decompressStreamBytes(
  slice: Uint8Array,
  format: 'deflate' | 'deflate-raw'
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const ds = new DecompressionStream(format);
    const copy = new Uint8Array(slice.byteLength);
    copy.set(slice);
    const stream = new Blob([copy]).stream().pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    if (buf.byteLength > MAX_XML_UNCOMPRESSED_BYTES) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/**
 * Inspects a PDF binary buffer, decompresses any /FlateDecode content streams,
 * counts font and image XObjects, and extracts human-readable text in reading order.
 */
export async function inspectAndExtractPdfBuffer(
  bytes: Uint8Array
): Promise<PdfInspectionResult> {
  const latin1 = new TextDecoder('latin1');
  const raw = latin1.decode(bytes);

  const fontObjectCount = (raw.match(/\/Type\s*\/Font\b/g) || []).length;
  const imageObjectCount = (raw.match(/\/Subtype\s*\/Image\b/g) || []).length;
  const pageCount = Math.max(1, (raw.match(/\/Type\s*\/Page\b(?!s)/g) || []).length);

  const extractedLines: string[] = [];

  // Iterate over PDF stream ... endstream blocks
  let searchPos = 0;
  while (searchPos < raw.length) {
    const streamIdx = raw.indexOf('stream', searchPos);
    if (streamIdx === -1) break;

    // Locate dictionary immediately preceding stream
    const dictStart = Math.max(0, streamIdx - 512);
    const precedingDict = raw.slice(dictStart, streamIdx);
    const isFlate = /\/FlateDecode\b/.test(precedingDict);

    let dataStart = streamIdx + 6;
    if (raw[dataStart] === '\r' && raw[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (raw[dataStart] === '\n' || raw[dataStart] === '\r') {
      dataStart += 1;
    } else {
      // False positive occurrence of "stream" inside another token
      searchPos = streamIdx + 6;
      continue;
    }

    const endStreamIdx = raw.indexOf('endstream', dataStart);
    if (endStreamIdx === -1) break;

    let dataEnd = endStreamIdx;
    if (raw[dataEnd - 1] === '\n') dataEnd--;
    if (raw[dataEnd - 1] === '\r') dataEnd--;

    if (dataEnd > dataStart) {
      const slice = bytes.subarray(dataStart, dataEnd);
      let decodedStream = '';

      if (isFlate) {
        const inflated =
          (await decompressStreamBytes(slice, 'deflate')) ||
          (await decompressStreamBytes(slice, 'deflate-raw'));
        if (inflated) {
          decodedStream = latin1.decode(inflated);
        }
      } else {
        decodedStream = raw.slice(dataStart, dataEnd);
      }

      if (decodedStream && (decodedStream.includes('Tj') || decodedStream.includes('TJ') || decodedStream.includes('BT'))) {
        const streamTokens = extractTextOperatorsFromContentStream(decodedStream);
        extractedLines.push(...streamTokens);
      }
    }

    searchPos = endStreamIdx + 9;
  }

  // Fallback for minimalist PDFs without standard stream dicts
  if (extractedLines.length === 0) {
    extractedLines.push(...extractTextOperatorsFromContentStream(raw));
  }

  const joined = extractedLines.join('\n').replace(/[ \t]{2,}/g, ' ');
  return {
    text: sanitizeDocumentText(joined),
    fontObjectCount,
    imageObjectCount,
    pageCount,
  };
}

export async function extractTextFromPdfBuffer(bytes: Uint8Array): Promise<string> {
  const result = await inspectAndExtractPdfBuffer(bytes);
  return result.text;
}

function parseWordprocessingXml(xmlText: string): string {
  const withBreaks = xmlText
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, ' ');

  const unescaped = withBreaks
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return sanitizeDocumentText(
    unescaped
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * Finds the End of Central Directory record and extracts compressed entries cleanly,
 * handling both standard ZIP local headers and data-descriptor (bit 3) ZIP archives.
 */
export async function extractTextFromDocxBuffer(bytes: Uint8Array): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textDecoder = new TextDecoder('utf-8', { fatal: false });

  // 1. Prefer Central Directory lookup via End of Central Directory (0x06054b50)
  const minEocdOffset = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minEocdOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const centralDirSize = view.getUint32(eocdOffset + 12, true);
    const centralDirOffset = view.getUint32(eocdOffset + 16, true);
    let cdPos = centralDirOffset;
    const cdEnd = Math.min(bytes.length, centralDirOffset + centralDirSize);

    while (cdPos + 46 <= cdEnd) {
      if (view.getUint32(cdPos, true) !== 0x02014b50) break;
      const compressionMethod = view.getUint16(cdPos + 10, true);
      const compressedSize = view.getUint32(cdPos + 20, true);
      const uncompressedSize = view.getUint32(cdPos + 24, true);
      const nameLen = view.getUint16(cdPos + 28, true);
      const extraLen = view.getUint16(cdPos + 30, true);
      const commentLen = view.getUint16(cdPos + 32, true);
      const localHeaderOffset = view.getUint32(cdPos + 42, true);

      const entryName = textDecoder.decode(bytes.subarray(cdPos + 46, cdPos + 46 + nameLen));
      if (entryName === 'word/document.xml') {
        if (compressedSize > MAX_DOCUMENT_BYTES || uncompressedSize > MAX_XML_UNCOMPRESSED_BYTES) {
          throw new Error('Document archive exceeds safe decompression limits.');
        }
        if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
          throw new Error('Malformed DOCX local file header.');
        }
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const dataEnd = Math.min(bytes.length, dataStart + compressedSize);
        const slice = bytes.subarray(dataStart, dataEnd);

        if (compressionMethod === 0) {
          return parseWordprocessingXml(textDecoder.decode(slice));
        }
        if (compressionMethod === 8) {
          const xmlBytes = await decompressStreamBytes(slice, 'deflate-raw');
          if (!xmlBytes) {
            throw new Error('DOCX XML decompression failed or exceeded safe size limits.');
          }
          return parseWordprocessingXml(textDecoder.decode(xmlBytes));
        }
        throw new Error('Unsupported DOCX compression method.');
      }

      cdPos += 46 + nameLen + extraLen + commentLen;
    }
  }

  // 2. Fallback: walk Local File Headers sequentially
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    const flags = view.getUint16(offset + 6, true);
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLen + extraLen;
    if (dataStart > bytes.length) break;

    const fileName = textDecoder.decode(bytes.subarray(nameStart, nameStart + fileNameLen));

    if (compressedSize > MAX_DOCUMENT_BYTES || uncompressedSize > MAX_XML_UNCOMPRESSED_BYTES) {
      throw new Error('Document archive exceeds safe decompression limits.');
    }

    const dataEnd =
      compressedSize > 0 ? Math.min(bytes.length, dataStart + compressedSize) : bytes.length;

    if (fileName === 'word/document.xml') {
      const slice = bytes.subarray(dataStart, dataEnd);
      if (compressionMethod === 0) {
        return parseWordprocessingXml(textDecoder.decode(slice));
      }
      if (compressionMethod === 8) {
        const xmlBytes = await decompressStreamBytes(slice, 'deflate-raw');
        if (!xmlBytes) {
          throw new Error('DOCX XML decompression failed or exceeded safe size limits.');
        }
        return parseWordprocessingXml(textDecoder.decode(xmlBytes));
      }
      throw new Error('Unsupported DOCX compression method.');
    }

    if ((flags & 0x08) !== 0 && compressedSize === 0) {
      break;
    }
    offset = dataEnd;
  }

  return '';
}
