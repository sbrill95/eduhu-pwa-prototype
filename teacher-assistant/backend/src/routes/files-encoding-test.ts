import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logInfo, logError } from '../config/logger';

const router = express.Router();

// Test endpoint to check filename encoding
router.get('/test-encoding', (req: Request, res: Response) => {
  try {
    const testFilenames = [
      'Übungsblatt_Mathematik.txt',
      'Prüfung_März_2024.txt',
      'Lösung_für_Aufgabe.txt',
      'test_äöüß.txt',
    ];

    const testResults = testFilenames.map((filename) => {
      return {
        original: filename,
        encoded: encodeURIComponent(filename),
        buffer: Buffer.from(filename, 'utf8'),
        bufferString: Buffer.from(filename, 'utf8').toString('utf8'),
        normalizedNFC: filename.normalize('NFC'),
        normalizedNFD: filename.normalize('NFD'),
        length: filename.length,
        byteLength: Buffer.byteLength(filename, 'utf8'),
      };
    });

    logInfo('Filename encoding test results', { testResults });

    res.json({
      success: true,
      message: 'Filename encoding test completed',
      results: testResults,
    });
  } catch (error) {
    logError('Filename encoding test failed', error as Error);
    res.status(500).json({
      success: false,
      error: 'Encoding test failed',
    });
  }
});

// Test multer with UTF-8 filenames
const testUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }, // 1MB for test
  fileFilter: (req, file, cb) => {
    logInfo('Multer fileFilter called', {
      originalname: file.originalname,
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      encoding: file.encoding,
      originalNameBuffer: Buffer.from(file.originalname || '', 'utf8'),
      originalNameLength: file.originalname?.length || 0,
      originalNameByteLength: Buffer.byteLength(
        file.originalname || '',
        'utf8'
      ),
    });
    cb(null, true);
  },
});

router.post(
  '/test-upload',
  testUpload.single('file'),
  (req: Request, res: Response): void => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      const fileInfo = {
        originalname: req.file.originalname,
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        encoding: req.file.encoding,
        size: req.file.size,
        buffer: req.file.buffer,
        // UTF-8 analysis
        originalNameBuffer: Buffer.from(req.file.originalname, 'utf8'),
        originalNameAsString: Buffer.from(
          req.file.originalname,
          'utf8'
        ).toString('utf8'),
        normalizedNFC: req.file.originalname.normalize('NFC'),
        normalizedNFD: req.file.originalname.normalize('NFD'),
        hasUmlauts: /[äöüÄÖÜß]/.test(req.file.originalname),
        unicodeLength: req.file.originalname.length,
        byteLength: Buffer.byteLength(req.file.originalname, 'utf8'),
      };

      logInfo('File upload test completed', fileInfo);

      res.json({
        success: true,
        message: 'File upload test successful',
        fileInfo,
      });
    } catch (error) {
      logError('File upload test failed', error as Error);
      res.status(500).json({
        success: false,
        error: 'Upload test failed',
      });
    }
  }
);

// Test OpenAI toFile with German filenames
router.post('/test-openai-file', (req: Request, res: Response): void => {
  try {
    const { filename } = req.body;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'Filename required',
      });
      return;
    }

    // Create test content
    const testContent = `Test content for file: ${filename}\nWith German umlauts: äöüÄÖÜß`;
    const buffer = Buffer.from(testContent, 'utf8');

    // Test different ways to handle the filename
    const tests = {
      originalFilename: filename,
      encodedFilename: encodeURIComponent(filename),
      normalizedNFC: filename.normalize('NFC'),
      normalizedNFD: filename.normalize('NFD'),
      bufferToString: Buffer.from(filename, 'utf8').toString('utf8'),
      hasUmlauts: /[äöüÄÖÜß]/.test(filename),
      contentBuffer: buffer,
      contentString: testContent,
    };

    logInfo('OpenAI filename test', tests);

    res.json({
      success: true,
      message: 'OpenAI filename test completed',
      tests,
    });
  } catch (error) {
    logError('OpenAI filename test failed', error as Error);
    res.status(500).json({
      success: false,
      error: 'OpenAI test failed',
    });
  }
});

export default router;
