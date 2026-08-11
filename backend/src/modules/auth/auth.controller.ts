import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { config } from '../../config/env';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: '24h',
  });

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: tokenPayload,
    },
    message: 'Login successful',
  });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: user,
    message: 'User profile retrieved',
  });
}
