"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
    password: zod_1.z.string().min(1, 'Password is required')
});
/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', (0, validate_1.validateBody)(RegisterSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            throw new errors_1.ConflictError('A user with this email already exists');
        }
        const passwordHash = await (0, User_1.hashPassword)(password);
        const user = await User_1.User.create({
            email: normalizedEmail,
            passwordHash
        });
        logger_1.logger.info(`New user registered: ${user.email}`);
        res.status(201).json({
            user: {
                id: user._id.toString(),
                email: user.email
            }
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /auth/login
 * Authenticate user and issue JWT token
 */
router.post('/login', (0, validate_1.validateBody)(LoginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            email: user.email
        }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        logger_1.logger.info(`User authenticated: ${user.email}`);
        res.status(200).json({
            token,
            user: {
                id: user._id.toString(),
                email: user.email
            }
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /auth/me
 * Retrieve the current logged-in user (requires JWT)
 */
router.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.user?.userId);
        if (!user) {
            throw new errors_1.NotFoundError('User profile not found');
        }
        res.status(200).json({
            user: {
                id: user._id.toString(),
                email: user.email
            }
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
