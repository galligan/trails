export class TrailsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TrailsError';
  }
}

export class TrailsValidationError extends TrailsError {
  constructor(message: string, public errors: Record<string, any>) {
    super(message);
    this.name = 'TrailsValidationError';
  }
}

export class TrailsDbError extends TrailsError {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'TrailsDbError';
  }
}