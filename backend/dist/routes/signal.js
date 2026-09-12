"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const engineClient_1 = require("../services/engineClient");
const orchestrator_1 = require("../services/orchestrator");
const SignalState_1 = require("../models/SignalState");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * GET /signal
 *
 * CRITICAL REQUIREMENT:
 * This endpoint MUST be unauthenticated.
 * It is dedicated to low-power Community Display Kiosks (/community-display route)
 * and must be fast, cache-friendly, and fault-tolerant.
 */
router.get('/', async (req, res, _next) => {
    // Set cache headers for resilient kiosk polling (5 seconds cache)
    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');
    try {
        // 1. Try to fetch the latest state from the in-memory orchestrator
        const latestState = orchestrator_1.orchestrator.getLatestState();
        if (latestState?.signal) {
            return res.status(200).json({
                color: latestState.signal.color,
                message: latestState.signal.message,
                updated_at: latestState.signal.updated_at
            });
        }
        // 2. Direct fetch from engineClient
        const signal = await engineClient_1.engineClient.getSignal();
        return res.status(200).json({
            color: signal.color,
            message: signal.message,
            updated_at: signal.updated_at
        });
    }
    catch (err) {
        logger_1.logger.warn('Failed live engine signal fetch, falling back to database cached signal', err);
        try {
            // 3. Graceful degradation: read latest persisted signal from MongoDB
            const cached = await SignalState_1.SignalStateModel.findOne().sort({ timestamp: -1 });
            if (cached) {
                return res.status(200).json({
                    color: cached.color,
                    message: cached.message,
                    updated_at: cached.timestamp.toISOString()
                });
            }
        }
        catch {
            // Fallback silently if db is down
        }
        // 4. Safe default fail-safe
        return res.status(200).json({
            color: 'GREEN',
            message: 'Grid operating autonomously. Signal cache fallback active.',
            updated_at: new Date().toISOString()
        });
    }
});
exports.default = router;
