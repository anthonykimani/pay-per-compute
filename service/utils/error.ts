// /types/common.ts
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(config: { status: number; code: string; message: string; details?: unknown }) {
    super(config.message);
    this.name = 'ApiError';
    this.status = config.status;
    this.code = config.code;
    this.details = config.details;
    
    // ✅ Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Your existing error classes...
export class PaymentError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 402, code: string = 'PAYMENT_ERROR') {
    super(message);
    this.name = 'PaymentError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class SessionError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'SESSION_ERROR') {
    super(message);
    this.name = 'SessionError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AssetError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 404, code: string = 'ASSET_ERROR') {
    super(message);
    this.name = 'AssetError';
    this.statusCode = statusCode;
    this.code = code;
  }
}