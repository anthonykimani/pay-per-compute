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