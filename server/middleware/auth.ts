import { Request, Response, NextFunction } from 'express';
import prisma from '../db.ts';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Bypass authentication: Ensure a default user exists
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@admin.com',
          name: 'Admin',
          password: 'bypass_password'
        }
      });
    }

    req.user = { userId: defaultUser.id, email: defaultUser.email };
    next();
  } catch (error) {
    console.error('Error bypassing auth:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
