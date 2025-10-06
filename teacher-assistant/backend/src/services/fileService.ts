
import { openaiClient } from '../config/openai';
import { toFile } from 'openai';
import { logError, logInfo } from '../config/logger';

export const validateFile = (file: Express.Multer.File): string | null => {
  // File type validation
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return `Dateityp nicht unterstützt. Erlaubt: JPG, PNG, GIF, PDF, DOCX, DOC, TXT. Erhalten: ${file.mimetype}`;
  }

  // File size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return `Datei ist zu groß. Maximum: ${(maxSize / 1024 / 1024).toFixed(0)}MB, erhalten: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  }

  // Enhanced filename validation with German umlaut support
  if (!file.originalname || file.originalname.trim().length === 0) {
    return 'Dateiname ist ungültig.';
  }

  // Normalize filename to handle German umlauts consistently
  const normalizedFilename = file.originalname.normalize('NFC');

  // Check filename length (both character and byte length for UTF-8)
  if (normalizedFilename.length > 255) {
    return 'Dateiname ist zu lang (max. 255 Zeichen).';
  }

  if (Buffer.byteLength(normalizedFilename, 'utf8') > 1024) {
    return 'Dateiname ist zu lang (max. 1024 Bytes).';
  }

  // Enhanced filename pattern validation supporting German characters
  const validFilenamePattern = /^[a-zA-Z0-9äöüÄÖÜßÀ-ÿ\s._\-()[\]{}]+$/;
  if (!validFilenamePattern.test(normalizedFilename)) {
    return 'Dateiname enthält ungültige Zeichen. Erlaubt: Buchstaben (inkl. Umlaute), Zahlen, Leerzeichen, ._-()[]{}.';
  }

  // Check for dangerous file extensions (security check with German locale support)
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  const fileExtension = normalizedFilename.toLowerCase().split('.').pop();
  if (fileExtension && dangerousExtensions.includes(`.${fileExtension}`)) {
    return 'Dateityp aus Sicherheitsgründen nicht erlaubt.';
  }

  // Check for invalid filename patterns
  const invalidPatterns = [
    /^\.+$/, // Only dots
    /^CON$|^PRN$|^AUX$|^NUL$|^COM[1-9]$|^LPT[1-9]$/i, // Windows reserved names
    /[\x00-\x1f\x7f]/, // Control characters
    /[<>:"|?*]/ // Windows invalid characters
  ];

  if (invalidPatterns.some(pattern => pattern.test(normalizedFilename))) {
    return 'Dateiname enthält ungültige oder reservierte Zeichen.';
  }

  logInfo('File validation successful', {
    filename: normalizedFilename,
    hasUmlauts: /[äöüÄÖÜßÀ-ÿ]/.test(normalizedFilename),
    byteLength: Buffer.byteLength(normalizedFilename, 'utf8'),
    charLength: normalizedFilename.length
  });

  return null; // No validation errors
};

export const handleUpload = async (file: Express.Multer.File) => {
  try {
    // Normalize filename for consistent UTF-8 handling
    const normalizedFilename = file.originalname.normalize('NFC');

    logInfo(`Uploading file to OpenAI with German umlaut support`, {
      originalFilename: file.originalname,
      normalizedFilename: normalizedFilename,
      hasUmlauts: /[äöüÄÖÜßÀ-ÿ]/.test(normalizedFilename),
      fileSize: file.size,
      byteLength: Buffer.byteLength(normalizedFilename, 'utf8')
    });

    // Create OpenAI file with proper UTF-8 filename handling
    const uploadedFile = await openaiClient.files.create({
      file: await toFile(file.buffer, normalizedFilename),
      purpose: 'assistants',
    });

    logInfo(`File uploaded to OpenAI successfully with German umlauts`, {
      fileId: uploadedFile.id,
      openaiFilename: uploadedFile.filename,
      originalFilename: normalizedFilename,
      status: uploadedFile.status
    });

    return {
      id: uploadedFile.id,
      filename: uploadedFile.filename, // OpenAI may modify filename
      originalFilename: normalizedFilename, // Preserve original for UI
      bytes: uploadedFile.bytes,
      purpose: uploadedFile.purpose,
      status: uploadedFile.status
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(`Error uploading file to OpenAI: ${errorMessage}`, error instanceof Error ? error : new Error(String(error)));

    // Enhanced error handling for filename encoding issues
    if (errorMessage.includes('filename') || errorMessage.includes('encoding')) {
      throw new Error('Filename encoding error - German umlauts may not be supported by OpenAI');
    }

    // Re-throw with more specific error message
    if (errorMessage.includes('exceeds the maximum allowed size')) {
      throw new Error('File size exceeds OpenAI limits');
    }

    if (errorMessage.includes('invalid file type') || errorMessage.includes('unsupported file type')) {
      throw new Error('Unsupported file type for OpenAI');
    }

    throw new Error(`Error uploading file to OpenAI: ${errorMessage}`);
  }
};
