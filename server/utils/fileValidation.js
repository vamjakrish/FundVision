const path = require('path');

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates file buffer against magic numbers / file signatures.
 * @param {Buffer} buffer
 * @returns {string|null} Detected MIME type or null if unrecognized
 */
const detectMimeTypeFromBuffer = (buffer) => {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

/**
 * Sanitizes a filename to prevent path traversal and special character exploits.
 * @param {string} originalName
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (originalName) => {
  if (!originalName || typeof originalName !== 'string') return 'document';
  // Strip null bytes and directory traversal
  const baseName = path.basename(originalName).replace(/\0/g, '');
  const ext = path.extname(baseName).toLowerCase();
  const nameWithoutExt = path.basename(baseName, ext);
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  return `${sanitized || 'doc'}${ext}`;
};

/**
 * Validates an uploaded proof file for size, extension, MIME, and signature.
 * @param {Object} file Express/Multer file object with buffer
 * @returns {{ valid: boolean, error?: string, detectedMime?: string, sanitizedName?: string }}
 */
const validateProofFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  if (!fileSize || fileSize === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds the 15MB limit (${(fileSize / (1024 * 1024)).toFixed(2)}MB).` };
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file extension "${ext}". Allowed: PDF, JPG, PNG, WEBP.` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: `Unsupported MIME type "${file.mimetype}". Allowed: application/pdf, image/jpeg, image/png, image/webp.` };
  }

  if (file.buffer) {
    const detectedMime = detectMimeTypeFromBuffer(file.buffer);
    if (!detectedMime) {
      return { valid: false, error: 'File content signature does not match any allowed file types (magic number verification failed).' };
    }

    // Verify consistency between header MIME and actual signature
    const isJpegMatch = (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') && detectedMime === 'image/jpeg';
    const isPdfMatch = file.mimetype === 'application/pdf' && detectedMime === 'application/pdf';
    const isPngMatch = file.mimetype === 'image/png' && detectedMime === 'image/png';
    const isWebpMatch = file.mimetype === 'image/webp' && detectedMime === 'image/webp';

    if (!isJpegMatch && !isPdfMatch && !isPngMatch && !isWebpMatch) {
      return { valid: false, error: 'File signature does not match the declared MIME type (MIME spoofing detected).' };
    }

    return {
      valid: true,
      detectedMime,
      sanitizedName: sanitizeFilename(file.originalname)
    };
  }

  return {
    valid: true,
    detectedMime: file.mimetype,
    sanitizedName: sanitizeFilename(file.originalname)
  };
};

module.exports = {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  detectMimeTypeFromBuffer,
  sanitizeFilename,
  validateProofFile
};
