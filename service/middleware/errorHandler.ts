import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';


export const errorHandler = (
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  logger.error('💥 Unhandled error', { 
    error: error.message,
    stack: error.stack,
    path: req.path
  });
  
  res.status(error.statusCode || 500).json({
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  });
};