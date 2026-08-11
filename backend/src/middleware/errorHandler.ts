import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        field: e.path.join('.').replace(/^(body|query|params)\./, ''),
        message: e.message,
      })),
    });
  }

  // Handle JWT Auth Errors
  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
  }

  // Handle Prisma Database Connection Errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      success: false,
      error: 'Database connection error: Unable to connect to PostgreSQL. Please check DATABASE_URL in backend/.env',
    });
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: Record to update/delete not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'The requested record was not found in database',
      });
    }

    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) || [];
      return res.status(400).json({
        success: false,
        error: `Unique constraint failed on field(s): ${fields.join(', ')}`,
      });
    }
  }

  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode === 200 ? 500 : statusCode).json({
    success: false,
    error: message,
  });
}
