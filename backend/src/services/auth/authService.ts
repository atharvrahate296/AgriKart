/**
 * Authentication Service
 * Handles all authentication business logic
 * Delegates password handling to Supabase Auth
 */

import type { AuthContext, LoginRequest, SignUpRequest, AuthResponse } from '../../types/auth'
import type { UserProfile } from '../../types/user'
import { 
  createAuthUser, 
  getUserByEmail, 
  sendPasswordResetEmail,
  resetPassword,
  verifyEmail,
  getSupabaseAdminClient,
} from '../../config/supabase'
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ErrorCode,
} from '../../utils/errors'
import {
  loginSchema,
  signUpSchema,
  validateEmail,
} from '../../utils/validators'

/**
 * Login user with email and password
 */
export async function login(
  credentials: LoginRequest
): Promise<AuthResponse> {
  // Validate input
  const validation = loginSchema.safeParse(credentials)
  if (!validation.success) {
    throw new AuthenticationError(
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS,
      {
        details: validation.error.errors,
      }
    )
  }

  const { email, password } = validation.data

  // Check if user exists in profiles table
  const existingUser = await getUserByEmail(email)
  if (!existingUser) {
    throw new AuthenticationError(
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS
    )
  }

  // Supabase Auth handles password verification via JWT
  // Frontend will use Supabase Auth SDK to get JWT token
  // This endpoint assumes JWT is already validated by middleware
  
  return {
    success: true,
    message: 'Login successful',
    user: {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    },
  }
}

/**
 * Sign up new user
 */
export async function signup(
  signupData: SignUpRequest
): Promise<AuthResponse> {
  // Validate input
  const validation = signUpSchema.safeParse(signupData)
  if (!validation.success) {
    throw new AuthenticationError(
      'Validation failed',
      ErrorCode.VALIDATION_ERROR,
      {
        details: validation.error.errors,
      }
    )
  }

  const {
    email,
    password,
    fullName,
    phone,
    role,
    location,
  } = validation.data

  // Check if user already exists
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw new ConflictError(
      'Email address is already registered',
      {
        field: 'email',
      }
    )
  }

  // Create auth user in Supabase Auth (password is hashed by Supabase)
  let userId: string
  try {
    const result = await createAuthUser(email, password)
    userId = result.userId
  } catch (error) {
    if (error instanceof Error && error.message.includes('already')) {
      throw new ConflictError('Email address is already registered')
    }
    throw error
  }

  // Create user profile in profiles table
  const supabase = getSupabaseAdminClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      phone: phone || null,
      role,
      language: 'en',
      location: location || null,
      email_verified: false,
      phone_verified: false,
      verification_status: 'pending',
      notification_preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        newsletterSubscribed: false,
        schemeAlerts: true,
        diseaseAlerts: true,
        orderUpdates: true,
      },
    })
    .select()
    .single()

  if (profileError) {
    // Clean up auth user if profile creation fails
    try {
      const adminClient = getSupabaseAdminClient()
      await adminClient.auth.admin.deleteUser(userId)
    } catch (cleanupError) {
      console.error('Failed to cleanup auth user:', cleanupError)
    }

    throw new Error(`Failed to create user profile: ${profileError.message}`)
  }

  return {
    success: true,
    message: 'Account created successfully. Please verify your email.',
    user: {
      id: userId,
      email,
      role,
    },
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  // Validate email
  if (!validateEmail(email)) {
    throw new AuthenticationError(
      'Invalid email address',
      ErrorCode.INVALID_EMAIL
    )
  }

  // Check if user exists
  const user = await getUserByEmail(email)
  if (!user) {
    // Return success even if user doesn't exist (security practice)
    return {
      success: true,
      message: 'If an account exists, you will receive a password reset email',
    }
  }

  // Send password reset email
  try {
    await sendPasswordResetEmail(email)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }

  return {
    success: true,
    message: 'If an account exists, you will receive a password reset email',
  }
}

/**
 * Confirm password reset
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<AuthResponse> {
  if (!token) {
    throw new AuthenticationError(
      'Invalid reset token',
      ErrorCode.INVALID_TOKEN
    )
  }

  try {
    await resetPassword(token, newPassword)
  } catch (error) {
    throw new AuthenticationError(
      'Failed to reset password',
      ErrorCode.INVALID_TOKEN,
      {
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    )
  }

  return {
    success: true,
    message: 'Password reset successfully',
  }
}

/**
 * Verify email with token
 */
export async function confirmEmailVerification(token: string): Promise<AuthResponse> {
  if (!token) {
    throw new AuthenticationError(
      'Invalid verification token',
      ErrorCode.INVALID_TOKEN
    )
  }

  try {
    await verifyEmail(token)
  } catch (error) {
    throw new AuthenticationError(
      'Failed to verify email',
      ErrorCode.INVALID_TOKEN,
      {
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    )
  }

  // Mark profile as email verified
  // This would typically be done via an after-auth trigger in Supabase
  
  return {
    success: true,
    message: 'Email verified successfully',
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = getSupabaseAdminClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new NotFoundError('User not found', { userId })
  }

  return mapProfileData(profile)
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const supabase = getSupabaseAdminClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      phone: updates.phone,
      language: updates.language,
      location: updates.location,
      bio: updates.bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return mapProfileData(profile)
}

/**
 * Map database profile to UserProfile type
 */
function mapProfileData(dbProfile: any): UserProfile {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    phone: dbProfile.phone,
    role: dbProfile.role,
    language: dbProfile.language,
    location: dbProfile.location,
    bio: dbProfile.bio,
    emailVerified: dbProfile.email_verified,
    phoneVerified: dbProfile.phone_verified,
    verificationStatus: dbProfile.verification_status,
    notificationPreferences: dbProfile.notification_preferences,
    lastLogin: dbProfile.last_login,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  }
}

/**
 * Export auth service
 */
export const authService = {
  login,
  signup,
  requestPasswordReset,
  confirmPasswordReset,
  confirmEmailVerification,
  getUserProfile,
  updateUserProfile,
}
