// ─── Axon Protocol SDK Exceptions ───

/**
 * Base error class for all Axon Protocol errors.
 * Every error includes the HTTP status code and server detail message.
 */
export class AxonError extends Error {
  public readonly statusCode: number;
  public readonly detail: string;

  constructor(statusCode: number, detail: string) {
    super(`[Axon ${statusCode}] ${detail}`);
    this.name = 'AxonError';
    this.statusCode = statusCode;
    this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype); // preserve instanceof
  }
}

/** 401 — Invalid or missing API key. */
export class AuthenticationError extends AxonError {
  constructor(detail = 'Invalid or missing API key') {
    super(401, detail);
    this.name = 'AuthenticationError';
  }
}

/** 404 — Resource not found (agent, memory, receipt, etc.). */
export class NotFoundError extends AxonError {
  constructor(detail = 'Resource not found') {
    super(404, detail);
    this.name = 'NotFoundError';
  }
}

/** 409 — Conflict, e.g. lock already held by another agent. */
export class ConflictError extends AxonError {
  constructor(detail = 'Resource conflict') {
    super(409, detail);
    this.name = 'ConflictError';
  }
}

/** 422 — Validation error from the server. */
export class ValidationError extends AxonError {
  constructor(detail = 'Validation error') {
    super(422, detail);
    this.name = 'ValidationError';
  }
}

/** 5xx — Server-side error. */
export class ServerError extends AxonError {
  constructor(statusCode: number, detail = 'Internal server error') {
    super(statusCode, detail);
    this.name = 'ServerError';
  }
}
