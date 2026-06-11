/**
 * @fileoverview Agri News & Alerts Routes - API endpoints for articles, Location & Crop alerts.
 * @module src/routes/news
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import { AppError, ValidationError, AuthenticationError, NotFoundError } from '../utils/errors';
import * as newsService from '../services/news/newsService';
import {
  validateCreateArticle,
  validateUpdateArticle,
  validateArticleFilters,
  validateCreateAlert,
  validateUpdateAlert,
  validateAlertFilters
} from '../utils/news-validators';

const router = Router();

/**
 * GET /api/news/articles
 * Browse news articles with filters (category, state, crop, tags, search)
 */
router.get(
  '/articles',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = validateArticleFilters(req.query);

      // Farmers and public guests can ONLY view published articles.
      // Admin, experts, and vendors can view drafts from editorial tooling.
      if (!req.auth || !['expert', 'admin', 'vendor'].includes(req.auth.role)) {
        filters.isPublished = true;
      }

      const { articles, count } = await newsService.listArticles(filters);

      res.status(200).json({
        success: true,
        data: articles,
        count
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/news/articles/:idOrSlug
 * Retrieve details of a single news article (ID or Slug), atomically incrementing views
 */
router.get(
  '/articles/:idOrSlug',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const article = await newsService.getArticleByIdOrSlug(req.params.idOrSlug);

      // If article is unpublished/draft, check if authorized
      if (!article.isPublished) {
        if (!req.auth || !['expert', 'admin'].includes(req.auth.role)) {
          throw new NotFoundError(`Article not found: ${req.params.idOrSlug}`);
        }
      }

      res.status(200).json({
        success: true,
        data: article
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/news/articles
 * Create a new article (Admin/Expert/Vendor only)
 */
router.post(
  '/articles',
  authMiddleware,
  requireRole('expert', 'admin', 'vendor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateCreateArticle(req.body);

      const article = await newsService.createArticle(req.auth.userId, input);

      res.status(201).json({
        success: true,
        data: article,
        message: 'Article created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/news/articles/:id
 * Modifies an existing article (Admin/Expert/Vendor only)
 */
router.put(
  '/articles/:id',
  authMiddleware,
  requireRole('expert', 'admin', 'vendor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateUpdateArticle(req.body);

      const updated = await newsService.updateArticle(req.params.id, input);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Article updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/news/alerts
 * Browse active alerts (personalizes by state/district/crops if logged in)
 */
router.get(
  '/alerts',
  optionalAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = validateAlertFilters(req.query);
      const userId = req.auth?.userId;

      // Farmers and public guests can ONLY view active alerts.
      // Admin and experts can view all (active and inactive).
      if (!req.auth || !['expert', 'admin'].includes(req.auth.role)) {
        filters.isActive = true;
      }

      const { alerts, count } = await newsService.listAlerts(filters, userId);

      res.status(200).json({
        success: true,
        data: alerts,
        count
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/news/alerts
 * Create a new warning alert (Admin/Expert only)
 */
router.post(
  '/alerts',
  authMiddleware,
  requireRole('expert', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateCreateAlert(req.body);

      const alert = await newsService.createAlert(input);

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Alert created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/news/alerts/:id
 * Modifies an existing alert (Admin/Expert only)
 */
router.put(
  '/alerts/:id',
  authMiddleware,
  requireRole('expert', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateUpdateAlert(req.body);

      const updated = await newsService.updateAlert(req.params.id, input);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Alert updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ==========================================================================
   ERROR LOGGER FOR NEWS ROUTER
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

  console.error('Agri News routes error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
