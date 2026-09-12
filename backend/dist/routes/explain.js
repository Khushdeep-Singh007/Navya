"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const llmClient_1 = require("../services/llmClient");
const orchestrator_1 = require("../services/orchestrator");
const OptimizationRun_1 = require("../models/OptimizationRun");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const ExplainSchema = zod_1.z.object({
    query: zod_1.z.string().optional().default('Explain the current optimization rationale and dispatch decision.'),
    run_id: zod_1.z.string().optional(),
    community_id: zod_1.z.string().optional().default('com-offgrid-01')
});
/**
 * POST /api/explain
 *
 * CRITICAL RULE:
 * The LLM is ONLY an explanation layer.
 * It is supplied with the exact optimizer output, reason codes, and constraints.
 * It is never permitted to invent numbers or compute alternative dispatch values.
 */
router.post('/', (0, validate_1.validateBody)(ExplainSchema), async (req, res, next) => {
    try {
        const { query, run_id, community_id } = req.body;
        let currentState = orchestrator_1.orchestrator.getLatestState();
        let dispatchPlan = orchestrator_1.orchestrator.getLatestDispatch();
        let shortfallStage = currentState?.shortfall_stage;
        let reasonCodes = dispatchPlan?.reason_codes || [];
        let metrics = dispatchPlan?.metrics || {};
        // If a specific historical run_id was provided, look it up in MongoDB
        if (run_id) {
            const historicalRun = await OptimizationRun_1.OptimizationRun.findOne({ runId: run_id });
            if (historicalRun) {
                dispatchPlan = historicalRun.dispatchPlan;
                shortfallStage = historicalRun.shortfallStage;
                reasonCodes = historicalRun.reasonCodes || [];
                metrics = historicalRun.objectiveBreakdown || {};
            }
        }
        const explanationResult = await llmClient_1.llmClient.explainDecision({
            query,
            currentState: currentState || undefined,
            dispatchPlan: dispatchPlan || undefined,
            shortfallStage,
            reasonCodes,
            metrics
        });
        res.status(200).json(explanationResult);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
