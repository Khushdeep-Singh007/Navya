"use strict";
/**
 * GridPilot Custom Error Hierarchy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMUnavailableError = exports.EngineResponseError = exports.EngineTimeoutError = exports.EngineUnavailableError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    errorCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class EngineUnavailableError extends AppError {
    constructor(message = 'Optimization/simulation engine is currently unreachable') {
        super(message, 503, 'ENGINE_UNAVAILABLE');
    }
}
exports.EngineUnavailableError = EngineUnavailableError;
class EngineTimeoutError extends AppError {
    constructor(message = 'Optimization engine timed out while solving dispatch') {
        super(message, 504, 'ENGINE_TIMEOUT');
    }
}
exports.EngineTimeoutError = EngineTimeoutError;
class EngineResponseError extends AppError {
    constructor(message = 'Optimization engine returned an invalid response', details) {
        super(message, 502, 'ENGINE_BAD_GATEWAY', details);
    }
}
exports.EngineResponseError = EngineResponseError;
class LLMUnavailableError extends AppError {
    constructor(message = 'LLM explanation service is currently unavailable') {
        super(message, 503, 'LLM_UNAVAILABLE');
    }
}
exports.LLMUnavailableError = LLMUnavailableError;
