export class TrailsError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'TrailsError';
    }
}
export class TrailsValidationError extends TrailsError {
    errors;
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'TrailsValidationError';
    }
}
export class TrailsDbError extends TrailsError {
    operation;
    constructor(message, operation) {
        super(message);
        this.operation = operation;
        this.name = 'TrailsDbError';
    }
}
