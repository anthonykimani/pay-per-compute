import { ApiError } from '../types/common';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function parseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (isApiError(error)) {
    return new AppError(error.message, error.code, error.status, error.details);
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    'message' in error
  );
}

export function handlePaymentError(error: AppError): string {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS':
      return 'Insufficient funds in your wallet';
    case 'INVALID_SIGNATURE':
      return 'Invalid payment signature. Please try again';
    case 'PAYMENT_EXPIRED':
      return 'Payment request expired. Please initiate a new payment';
    case 'ASSET_UNAVAILABLE':
      return 'This asset is no longer available';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many payment attempts. Please wait a moment';
    case 'WALLET_ERROR':
      return 'Wallet connection error. Please reconnect';
    case 'SIGNING_ERROR':
      return 'Failed to sign payment message';
    case 'NO_PAYMENT_REQUIREMENT':
      return 'No payment requirement found';
    default:
      return error.message || 'Payment failed. Please try again';
  }
}