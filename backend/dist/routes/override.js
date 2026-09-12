"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const orchestrator_1 = require("../services/orchestrator");
const OverrideEvent_1 = require("../models/OverrideEvent");
const liveState_1 = require("../sockets/liveState");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const OverrideSchema = zod_1.z.object({
    force_diesel_on: zod_1.z.boolean().optional(),
    force_diesel_off: zod_1.z.boolean().optional(),
    min_battery_reserve_pct: zod_1.z.number().min(10).max(90).optional(),
    diesel_manual_kw: zod_1.z.number().min(0).max(150).optional(),
    shed_tier4: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().min(3, 'A clear operational reason is required for manual override'),
    community_id: zod_1.z.string().optional().default('com-offgrid-01')
});
/**
 * POST /api/override
 * Applies a manual override to the microgrid dispatch
 */
router.post('/', (0, validate_1.validateBody)(OverrideSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const communityId = body.community_id || 'com-offgrid-01';
        const previousState = orchestrator_1.orchestrator.getLatestState() || {};
        const overrideSettings = {
            force_diesel_on: body.force_diesel_on,
            force_diesel_off: body.force_diesel_off,
            min_battery_reserve_pct: body.min_battery_reserve_pct,
            diesel_manual_kw: body.diesel_manual_kw,
            shed_tier4: body.shed_tier4,
            reason: body.reason
        };
        // Set override in the orchestrator
        orchestrator_1.orchestrator.setOverride(overrideSettings);
        // Quantify operational impact
        let costDelta = 0;
        let co2Delta = 0;
        let explanation = 'Override active.';
        if (body.force_diesel_on) {
            costDelta = 32.40;
            co2Delta = 21.60;
            explanation = `Forcing diesel generator increases operating cost by ~$${costDelta.toFixed(2)} and emissions by ${co2Delta.toFixed(1)} kg CO2 per hour.`;
        }
        else if (body.force_diesel_off) {
            costDelta = -15.0;
            co2Delta = -10.0;
            explanation = 'Forcing diesel OFF eliminates fuel consumption, but increases risk of unserved load if battery depletes.';
        }
        // Persist Override Event
        const overrideRecord = await OverrideEvent_1.OverrideEvent.create({
            overrideId: `ovr_${Date.now()}`,
            operatorId: req.user?.userId || 'usr_operator',
            operatorEmail: req.user?.email || 'operator@gridpilot.org',
            communityId,
            previousState,
            overrideSettings,
            reason: body.reason,
            quantifiedImpact: {
                costDeltaUsd: costDelta,
                co2DeltaKg: co2Delta,
                reliabilityDeltaPct: 0,
                explanation
            },
            status: 'ACTIVE'
        });
        // Trigger orchestrator tick to re-evaluate with override
        const tickResult = await orchestrator_1.orchestrator.tick();
        // Emit override update
        liveState_1.liveStateBroadcaster.emitOverride({
            override: overrideRecord,
            active: true,
            settings: overrideSettings,
            impact: overrideRecord.quantifiedImpact
        });
        res.status(200).json({
            message: 'Manual override applied successfully',
            override: overrideRecord,
            quantified_impact: overrideRecord.quantifiedImpact,
            updated_state: tickResult.state
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * DELETE /api/override/clear
 * Clears manual override and returns system to autonomous Autopilot optimization
 */
router.delete('/clear', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        orchestrator_1.orchestrator.setOverride(null);
        await OverrideEvent_1.OverrideEvent.updateMany({ communityId, status: 'ACTIVE' }, { $set: { status: 'CLEARED' } });
        const tickResult = await orchestrator_1.orchestrator.tick();
        liveState_1.liveStateBroadcaster.emitOverride({
            active: false,
            message: 'Autonomous Autopilot Mode Restored'
        });
        res.status(200).json({
            message: 'Manual override cleared. GridPilot Autopilot resumed.',
            updated_state: tickResult.state
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/override/history
 * Returns historical manual overrides
 */
router.get('/history', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        const overrides = await OverrideEvent_1.OverrideEvent.find({ communityId }).sort({ timestamp: -1 }).limit(20);
        res.status(200).json({
            active_override: orchestrator_1.orchestrator.getActiveOverride(),
            history: overrides
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
