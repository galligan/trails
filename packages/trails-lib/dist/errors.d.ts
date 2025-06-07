export declare class TrailsError extends Error {
    cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export declare class TrailsValidationError extends TrailsError {
    errors: Record<string, any>;
    constructor(message: string, errors: Record<string, any>);
}
export declare class TrailsDbError extends TrailsError {
    operation: string;
    constructor(message: string, operation: string);
}
