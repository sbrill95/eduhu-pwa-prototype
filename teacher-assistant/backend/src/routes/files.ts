import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { handleUpload, validateFile } from '../services/fileService';
import { logError, logInfo } from '../config/logger';

const router = express.Router();

// Configure multer with file size limits and memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Ensure UTF-8 encoding for filename
    if (file.originalname) {
      try {
        // Normalize filename to handle German umlauts properly
        file.originalname = file.originalname.normalize('NFC');

        // Log filename for debugging
        logInfo('Processing file with filename', {
          original: file.originalname,
          hasUmlauts: /[äöüÄÖÜßÀ-ÿ]/.test(file.originalname),
          byteLength: Buffer.byteLength(file.originalname, 'utf8'),
          charLength: file.originalname.length,
        });
      } catch (error) {
        logError('Error normalizing filename', error as Error);
        cb(null, false);
        return;
      }
    }

    // Basic file type validation at multer level
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false); // Reject file without error (validation handled later)
    }
  },
});

// Middleware wrapper function
function handleFileUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: 'File too large',
          user_message: 'Die Datei ist zu groß. Maximale Größe: 10MB.',
        });
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          error: 'Too many files',
          user_message: 'Nur eine Datei gleichzeitig erlaubt.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'File upload error',
        user_message: 'Fehler beim Hochladen der Datei.',
      });
      return;
    }
    next();
  });
}

// Main upload handler
async function processFileUpload(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      logError(
        'File upload failed: No file provided',
        new Error('No file uploaded')
      );
      res.status(400).json({
        success: false,
        error: 'No file uploaded.',
        user_message:
          'Keine Datei hochgeladen. Bitte wählen Sie eine Datei aus.',
      });
      return;
    }

    // Enhanced file validation
    const validationError = validateFile(req.file);
    if (validationError) {
      logError(
        `File validation failed: ${validationError}`,
        new Error(validationError)
      );
      res.status(400).json({
        success: false,
        error: validationError,
        user_message: validationError,
      });
      return;
    }

    logInfo(
      `Processing file upload: ${req.file.originalname} (${req.file.size} bytes)`
    );

    const file = await handleUpload(req.file);

    logInfo(`File uploaded successfully: ${file.id}`);
    res.status(200).json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename, // OpenAI filename (may be modified)
        originalFilename: file.originalFilename || req.file.originalname, // Preserve German umlauts
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logError(
      `File upload error: ${errorMessage}`,
      error instanceof Error ? error : new Error(String(error))
    );

    // Check for specific OpenAI errors
    if (errorMessage.includes('exceeds the maximum allowed size')) {
      res.status(400).json({
        success: false,
        error: 'File size exceeds OpenAI limits',
        user_message:
          'Die Datei ist zu groß für den Upload. Maximale Größe: 10MB.',
      });
      return;
    }

    if (errorMessage.includes('unsupported file type')) {
      res.status(400).json({
        success: false,
        error: 'Unsupported file type',
        user_message:
          'Dateityp nicht unterstützt. Erlaubt: JPG, PNG, GIF, PDF, DOCX, DOC, TXT.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error uploading file.',
      user_message:
        'Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.',
    });
  }
}

router.post('/upload', handleFileUpload, processFileUpload);

export default router;
