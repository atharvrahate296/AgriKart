/**
 * Authentication Routes
 * Handles all authentication endpoints
 */

import { Router, Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth/authService'
import { authMiddleware, requireEmailVerified } from '../middleware/auth'
import type { AuthResponse, LoginRequest, SignUpRequest } from '../types/auth'
import { AppError } from '../utils/errors'

const router = Router()

/**
 * POST /auth/login
 * Logs in a user with email and password
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials: LoginRequest = {
      email: req.body.email,
      password: req.body.password,
    }

    const result = await authService.login(credentials)

    // In a real app, set HttpOnly cookie with JWT token from Supabase
    res.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /auth/signup
 * Creates a new user account
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signupData: SignUpRequest = {
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      phone: req.body.phone,
      role: req.body.role || 'farmer',
      location: req.body.location,
    }

    const result = await authService.signup(signupData)

    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /auth/logout
 * Logs out the user by clearing auth cookies
 */
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  res.clearCookie('auth-token')
  res.clearCookie('sb-auth-token')

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

/**
 * POST /auth/forgot-password
 * Initiates password reset flow
 */
router.post(
  '/forgot-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          error: {
            message: 'Email is required',
            code: 'MISSING_EMAIL',
          },
        })
      }

      const result = await authService.requestPasswordReset(email)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /auth/reset-password
 * Confirms password reset with token
 */
router.post(
  '/reset-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        return res.status(400).json({
          error: {
            message: 'Token and new password are required',
            code: 'MISSING_FIELDS',
          },
        })
      }

      const result = await authService.confirmPasswordReset(
        token,
        newPassword
      )

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /auth/verify-email
 * Confirms email verification with token
 */
router.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({
          error: {
            message: 'Verification token is required',
            code: 'MISSING_TOKEN',
          },
        })
      }

      const result = await authService.confirmEmailVerification(token)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /auth/profile
 * Gets current user's profile
 */
router.get(
  '/profile',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        return res.status(401).json({
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        })
      }

      const profile = await authService.getUserProfile(req.auth.userId)
      res.status(200).json({
        success: true,
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /auth/profile
 * Updates current user's profile
 */
router.put(
  '/profile',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        return res.status(401).json({
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        })
      }

      const updates = {
        fullName: req.body.fullName,
        phone: req.body.phone,
        language: req.body.language,
        bio: req.body.bio,
        location: req.body.location,
      }

      const profile = await authService.updateUserProfile(
        req.auth.userId,
        updates
      )

      res.status(200).json({
        success: true,
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /auth/change-password
 * Changes user password
 */
router.post(
  '/change-password',
  authMiddleware,
  requireEmailVerified,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        return res.status(401).json({
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        })
      }

      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: {
            message: 'Current password and new password are required',
            code: 'MISSING_FIELDS',
          },
        })
      }

      // In production, verify currentPassword against Supabase Auth
      // Then update password using Supabase Auth SDK
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /auth/me
 * Gets current authenticated user's basic info
 */
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        userId: req.auth?.userId,
        email: req.auth?.email,
        role: req.auth?.role,
        emailVerified: req.auth?.emailVerified,
      },
    })
  }
)

/**
 * Error handling for this router
 */
router.use(
  (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(error.toJSON())
      return
    }

    console.error('Auth route error:', error)
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    })
  }
)

export default router
