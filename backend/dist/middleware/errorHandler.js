"use strict";
/**
 * Centralized Error Handling Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
function errorHandler(err, req, res, _next) {
    const isProd = env_1.env.NODE_ENV === 'production';
    if (err instanceof errors_1.AppError) {
        logger_1.logger.warn(`AppError [${err.errorCode}]: ${err.message} on ${req.method} ${req.originalUrl}`);
        res.status(err.statusCode).json({
            error: {
                code: err.errorCode,
                message: err.message,
                details: err.details || null
            }
        });
        return;
    }
    // Handle unexpected errors safely
    logger_1.logger.error(`Unhandled Internal Error on ${req.method} ${req.originalUrl}`, err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: isProd ? 'An unexpected internal server error occurred.' : err.message,
            stack: isProd ? undefined : err.stack
        }
    });
}
