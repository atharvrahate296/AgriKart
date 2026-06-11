/* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
/**
 * @fileoverview AI Assistant Chat Routes - Endpoints for managing user sessions and sending queries.
 * @module src/routes/chat
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthenticationError, AppError } from '../utils/errors';
import * as chatService from '../services/chat/chatService';
import {
  validateCreateChatSession,
  validateSendMessage
} from '../utils/chat-validators';

const router = Router();

// Apply auth middleware to protect all chat routes
router.use(authMiddleware);

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
router.post(
  '/sessions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateCreateChatSession(req.body);

      const session = await chatService.createSession(req.auth.userId, input);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Chat session created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/chat/sessions
 * Retrieve all active chat sessions of the current user
 */
router.get(
  '/sessions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const sessions = await chatService.listSessions(req.auth.userId);

      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/chat/sessions/:id/messages
 * Fetch the messages history in a session
 */
router.get(
  '/sessions/:id/messages',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const messages = await chatService.getMessages(req.params.id, req.auth.userId);

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/chat/sessions/:id/message
 * Send a chat query and retrieve the AI assistant's reply
 */
router.post(
  '/sessions/:id/message',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');
      const input = validateSendMessage(req.body);

      const reply = await chatService.sendMessage(
        req.auth.userId,
        req.params.id,
        input.message
      );

      res.status(200).json({
        success: true,
        data: reply
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/chat/sessions/:id
 * Archive a chat session (set active flag to false)
 */
router.delete(
  '/sessions/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new AuthenticationError('Authentication required');

      const archived = await chatService.archiveSession(req.params.id, req.auth.userId);

      res.status(200).json({
        success: true,
        data: archived,
        message: 'Chat session archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ==========================================================================
   ERROR LOGGER FOR CHAT ROUTER
   ========================================================================== */
router.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
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

  console.error('Chat routes error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
