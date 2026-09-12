"use strict";
/**
 * Zod Request Validation Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const issues = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                throw new errors_1.ValidationError('Request body validation failed', issues);
            }
            next(err);
        }
    };
}
function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const issues = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                throw new errors_1.ValidationError('Query parameter validation failed', issues);
            }
            next(err);
        }
    };
}
