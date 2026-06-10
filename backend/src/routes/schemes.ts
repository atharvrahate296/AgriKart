/**
 * @fileoverview Government Schemes Routes - API endpoints for agricultural schemes, eligibility checks, applications, and review updates
 * @module src/routes/schemes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import { AppError, ValidationError, AuthenticationError } from '../utils/errors';
import * as schemeService from '../services/schemes/schemeService';
import {
  validateEligibilityQuery,
  validateApplyScheme,
  validateUpdateApplicationStatus
} from '../utils/scheme-validators';

const router = Router();

/**
 * GET /api/schemes
 * Browse government schemes with state or active state filtering
 */
router.get(
  '/',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = req.query.state as string | undefined;
      const crop = req.query.crop as string | undefined;
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const { schemes, count } = await schemeService.listSchemes({
        state,
        crop,
        role,
        isActive,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: schemes,
        count
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/schemes/eligibility
 * Evaluate eligibility based on profile (if logged in) and request body overrides
 */
router.post(
  '/eligibility',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate inputs
      const criteria = validateEligibilityQuery(req.body);
      const userId = req.auth?.userId;

      const eligibilityList = await schemeService.checkEligibility(userId, criteria);

      res.status(200).json({
        success: true,
        data: eligibilityList,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/schemes/alerts/deadlines
 * Get deadline warning alerts for schemes eligible but not yet applied
 */
router.get(
  '/alerts/deadlines',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      
      const alerts = await schemeService.getDeadlineAlerts(req.auth.userId);

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/schemes/:id/apply
 * Apply to a government scheme
 */
router.post(
  '/:id/apply',
  authMiddleware,
  requireRole('farmer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateApplyScheme(req.body);

      const application = await schemeService.applyForScheme(
        req.auth.userId,
        req.params.id,
        input
      );

      res.status(201).json({
        success: true,
        data: application,
        message: 'Scheme application submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/schemes/applications
 * Fetch applications lists (Farmers see their own; Experts/Admins see all)
 */
router.get(
  '/applications',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const status = req.query.status as any;
      const schemeId = req.query.schemeId as string | undefined;
      const farmerId = req.query.farmerId as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const { applications, count } = await schemeService.getApplications(
        req.auth.userId,
        req.auth.role,
        {
          status,
          schemeId,
          farmerId,
          limit,
          offset
        }
      );

      res.status(200).json({
        success: true,
        data: applications,
        count
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/schemes/applications/:id
 * Retrieve details of a single scheme application
 */
router.get(
  '/applications/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const application = await schemeService.getApplicationById(
        req.params.id,
        req.auth.userId,
        req.auth.role
      );

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/schemes/applications/:id/status
 * Update review status of a scheme application (Expert/Admin only)
 */
router.put(
  '/applications/:id/status',
  authMiddleware,
  requireRole('expert', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateUpdateApplicationStatus(req.body);

      const updated = await schemeService.updateApplicationStatus(
        req.auth.userId,
        req.params.id,
        input
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Scheme application status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/schemes/:id
 * Retrieve details of a single government scheme
 */
router.get(
  '/:id',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scheme = await schemeService.getSchemeById(req.params.id);
      res.status(200).json({
        success: true,
        data: scheme
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

  console.error('Government Schemes routes error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
