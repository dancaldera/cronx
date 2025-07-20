import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db, users, insertUserSchema, updateUserSchema } from '@cronx/database';
import { eq, and } from 'drizzle-orm';
import { generateTokens, verifyToken, AuthRequest } from '../middleware/auth';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-controller' },
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
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
    const passwordHash = await bcrypt.hash(validatedData.passwordHash, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        ...validatedData,
        passwordHash,
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