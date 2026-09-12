"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const engineClient_1 = require("../services/engineClient");
const orchestrator_1 = require("../services/orchestrator");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
/**
 * GET /api/ladder
 * Returns the current Shortfall Response Ladder status, active stage (0-4), actions, and affected tiers
 */
router.get('/', async (req, res, next) => {
    try {
        const latestLadder = orchestrator_1.orchestrator.getLatestLadder();
        const latestState = orchestrator_1.orchestrator.getLatestState();
        if (latestLadder) {
            return res.status(200).json(latestLadder);
        }
        // Otherwise request fresh evaluation from engineClient
        const currentStage = latestState?.shortfall_stage ?? 0;
        const ladder = await engineClient_1.engineClient.evaluateLadder({
            current_state: latestState || undefined,
            target_stage: currentStage
        });
        res.status(200).json(ladder);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/ladder/recalculate
 * Forces a re-evaluation of the shortfall ladder with a specific target stage
 */
router.post('/recalculate', async (req, res, next) => {
    try {
        const { target_stage } = req.body;
        const state = orchestrator_1.orchestrator.getLatestState();
        const forecast = await engineClient_1.engineClient.getForecast();
        const ladder = await engineClient_1.engineClient.evaluateLadder({
            current_state: state || undefined,
            forecast,
            target_stage: target_stage ?? 1
        });
        res.status(200).json(ladder);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
