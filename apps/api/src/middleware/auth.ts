import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, users } from '@cronx/database';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export const generateTokens = (user: { id: string; email: string; username: string }) => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Access token required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

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
        error: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

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

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
};