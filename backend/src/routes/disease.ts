/**
 * @fileoverview Disease Intelligence Routes - API endpoints for crop disease classification & feedback
 * @module src/routes/disease
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../middleware/auth';
import { AppError, ValidationError, AuthenticationError } from '../utils/errors';
import * as diseaseService from '../services/disease/diseaseService';
import {
  predictionFeedbackSchema,
  expertVerificationSchema
} from '../utils/disease-validators';

const router = Router();

// Configure multer memory storage for handling file uploads (Max 10MB leaf image)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Validate mime types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only JPEG, PNG, and WebP leaf images are allowed'));
    }
  }
});

/* ==========================================================================
   DISEASE INTELLIGENCE ROUTE HANDLERS
   ========================================================================== */

/**
 * POST /api/disease/predict
 * Upload a leaf image, call ML service, and record disease prediction in database
 */
router.post(
  '/predict',
  authMiddleware,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      if (!req.file) {
        throw new ValidationError('A leaf image file upload is required');
      }

      const cropTypeHint = req.body.crop_type || undefined;

      const prediction = await diseaseService.predictDisease(
        req.auth.userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        cropTypeHint
      );

      res.status(201).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/disease/history
 * Fetch authenticated user's prediction history logs
 */
router.get(
  '/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const history = await diseaseService.getPredictionHistory(req.auth.userId, limit, offset);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/disease/predictions/:id
 * Retrieve details of a single disease prediction with references
 */
router.get(
  '/predictions/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const prediction = await diseaseService.getPredictionById(
        req.params.id,
        req.auth.userId,
        req.auth.role
      );

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/disease/feedback
 * Submit user correctness feedback for a prediction
 */
router.post(
  '/feedback',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = predictionFeedbackSchema.parse(req.body);

      const feedback = await diseaseService.submitFeedback(req.auth.userId, input);

      res.status(201).json({
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/disease/predictions/:id/verify
 * Verify/correct a prediction (Expert or Admin only)
 */
router.put(
  '/predictions/:id/verify',
  authMiddleware,
  requireRole('expert', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = expertVerificationSchema.parse(req.body);

      const verified = await diseaseService.verifyPrediction(
        req.auth.userId,
        req.params.id,
        input
      );

      res.status(200).json({
        success: true,
        data: verified,
        message: 'Prediction verification updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/disease/retrain
 * Triggers retraining pipeline on FastAPI ML service (Expert or Admin only)
 */
router.post(
  '/retrain',
  authMiddleware,
  requireRole('expert', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      
      const epochs = req.body.epochs ? Number(req.body.epochs) : undefined;
      const batchSize = req.body.batch_size ? Number(req.body.batch_size) : undefined;
      const learningRate = req.body.learning_rate ? Number(req.body.learning_rate) : undefined;

      const runStatus = await diseaseService.triggerModelRetraining(epochs, batchSize, learningRate);

      res.status(200).json({
        success: true,
        data: runStatus,
        message: 'Model retraining triggered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ==========================================================================
   ERROR LOGGER FOR ROUTER
   ========================================================================== */
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  if (error.name === 'ZodError') {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).errors,
      },
    });
    return;
  }

  if (error.message.includes('MulterError')) {
    res.status(400).json({
      error: {
        message: 'File upload error',
        code: 'UPLOAD_ERROR',
        details: error.message,
      },
    });
    return;
  }

  console.error('Disease routes error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
