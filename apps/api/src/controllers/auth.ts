import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, users, insertUserSchema, updateUserSchema } from '../database';
import { eq, and, gt } from 'drizzle-orm';
import { generateTokens, verifyToken, AuthRequest } from '../middleware/auth';
import winston from 'winston';
import { z } from 'zod';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-controller' },
});

// Schema for registration that accepts password instead of passwordHash
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).default('system'),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('MM/dd/yyyy'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  language: z.string().default('en'),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ 
        error: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if username is taken
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, validatedData.username))
      .limit(1);

    if (existingUsername.length > 0) {
      res.status(400).json({ 
        error: 'Username already taken',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        themePreference: validatedData.themePreference,
        timezone: validatedData.timezone,
        dateFormat: validatedData.dateFormat,
        timeFormat: validatedData.timeFormat,
        language: validatedData.language,
        emailNotifications: validatedData.emailNotifications,
        pushNotifications: validatedData.pushNotifications,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      });

    // Generate tokens
    const tokens = generateTokens({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    logger.info('User registered successfully', { userId: newUser.id, email: newUser.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
      tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ 
        error: 'Invalid input data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Registration failed',
        timestamp: new Date().toISOString()
      });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ 
        error: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update last active
    await db
      .update(users)
      .set({ 
        lastActive: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Return user data without password
    const { passwordHash, deletedAt, ...safeUser } = user;

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({ 
      error: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ 
        error: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Verify user still exists and is active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ 
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.json({
      success: true,
      tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(401).json({ 
      error: 'Invalid refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ 
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Return user data without password
    const { passwordHash, deletedAt, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get profile failed:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      timestamp: new Date().toISOString()
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const validatedData = updateUserSchema.parse(req.body);

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ 
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Return user data without password
    const { passwordHash, deletedAt, ...safeUser } = updatedUser;

    logger.info('User profile updated', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Update profile failed:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ 
        error: 'Invalid input data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update profile',
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Schema for password reset request
const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Schema for password reset confirmation
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = requestPasswordResetSchema.parse(req.body);

    // Find user by email
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.isActive, true)
      ))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // TODO: In production, send email with reset link
    // For now, just log the token (remove this in production)
    logger.info('Password reset token generated', { 
      userId: user.id, 
      email: user.email,
      resetToken, // Remove this in production
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      // TODO: Remove this in production - only for development testing
      resetToken,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Password reset request failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Password reset request failed',
        timestamp: new Date().toISOString()
      });
    }
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Find user with valid reset token
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        resetPasswordToken: users.resetPasswordToken,
        resetPasswordExpires: users.resetPasswordExpires,
      })
      .from(users)
      .where(and(
        eq(users.resetPasswordToken, token),
        gt(users.resetPasswordExpires, new Date()),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      res.status(400).json({
        error: 'Invalid or expired reset token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    logger.info('Password reset successful', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Password has been reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Password reset failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid input data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Password reset failed',
        timestamp: new Date().toISOString()
      });
    }
  }
};