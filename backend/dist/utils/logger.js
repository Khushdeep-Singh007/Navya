"use strict";
/**
 * Safe Structured Logger
 * Ensures secrets, tokens, passwords, and API keys are never leaked to logs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'authorization', 'apiKey', 'jwt_secret', 'secret'];
function sanitize(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(sanitize);
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
            clean[k] = '[REDACTED]';
        }
        else if (typeof v === 'object') {
            clean[k] = sanitize(v);
        }
        else {
            clean[k] = v;
        }
    }
    return clean;
}
exports.logger = {
    info: (message, meta) => {
        const timestamp = new Date().toISOString();
        if (meta) {
            console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(sanitize(meta)));
        }
        else {
            console.log(`[${timestamp}] [INFO] ${message}`);
        }
    },
    warn: (message, meta) => {
        const timestamp = new Date().toISOString();
        if (meta) {
            console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(sanitize(meta)));
        }
        else {
            console.warn(`[${timestamp}] [WARN] ${message}`);
        }
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        const cleanErr = error instanceof Error ? { message: error.message, stack: error.stack } : sanitize(error);
        console.error(`[${timestamp}] [ERROR] ${message}`, cleanErr);
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            if (meta) {
                console.debug(`[${timestamp}] [DEBUG] ${message}`, JSON.stringify(sanitize(meta)));
            }
            else {
                console.debug(`[${timestamp}] [DEBUG] ${message}`);
            }
        }
    }
};
