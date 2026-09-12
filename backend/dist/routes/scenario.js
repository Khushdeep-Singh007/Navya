"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const engineClient_1 = require("../services/engineClient");
const Scenario_1 = require("../models/Scenario");
const liveState_1 = require("../sockets/liveState");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const ScenarioInjectSchema = zod_1.z.object({
    scenario_type: zod_1.z.enum(['CLOUD_COVER', 'WIND_DROP', 'BATTERY_FAULT', 'DEMAND_SURGE', 'DIESEL_PRICE_SPIKE', 'CUSTOM']),
    name: zod_1.z.string().min(1, 'Scenario name is required'),
    parameters: zod_1.z.record(zod_1.z.any()).optional().default({}),
    duration_hours: zod_1.z.number().positive().optional().default(6),
    community_id: zod_1.z.string().optional().default('com-offgrid-01')
});
/**
 * POST /api/scenario
 * Injects a What-If disruption event into the engine simulator & triggers automatic re-optimization
 */
router.post('/', (0, validate_1.validateBody)(ScenarioInjectSchema), async (req, res, next) => {
    try {
        const payload = req.body;
        // 1. Delegate event injection to the Python engine
        const scenarioResult = await engineClient_1.engineClient.injectEvent(payload);
        // 2. Persist scenario in MongoDB
        const scenarioRecord = await Scenario_1.Scenario.create({
            scenarioId: scenarioResult.scenario_id || `scen_${Date.now()}`,
            scenarioType: payload.scenario_type,
            name: payload.name,
            parameters: payload.parameters,
            status: 'APPLIED',
            communityId: payload.community_id || 'com-offgrid-01',
            impactMetrics: {
                costDeltaUsd: scenarioResult.cost_delta_usd ?? 0,
                co2DeltaKg: scenarioResult.co2_delta_kg ?? 0,
                reliabilityDeltaPct: 0
            }
        });
        // 3. Broadcast real-time what-if event & updated state to all connected clients
        liveState_1.liveStateBroadcaster.emitScenario(scenarioResult);
        liveState_1.liveStateBroadcaster.emitLiveState(scenarioResult.updated_state);
        if (scenarioResult.reoptimized_dispatch) {
            liveState_1.liveStateBroadcaster.emitOptimization(scenarioResult.reoptimized_dispatch);
        }
        if (scenarioResult.ladder_response) {
            liveState_1.liveStateBroadcaster.emitLadderUpdate(scenarioResult.ladder_response);
        }
        liveState_1.liveStateBroadcaster.emitSignal(scenarioResult.updated_state.signal);
        res.status(200).json({
            scenario: scenarioRecord,
            result: scenarioResult
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/scenario/list
 * Returns list of historical and preset scenarios
 */
router.get('/list', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        const scenarios = await Scenario_1.Scenario.find({ communityId }).sort({ timestamp: -1 }).limit(20);
        const presets = [
            { type: 'SUNNY_DAY', name: 'Sunny High Solar Day', description: 'Peak 120 kW solar irradiance with low wind' },
            { type: 'CLOUD_COVER', name: 'Sudden Cloud Cover', description: '85% solar irradiance drop within 15 minutes' },
            { type: 'WIND_DROP', name: 'Sudden Wind Drop', description: 'Wind collapses from 11 m/s to 1.5 m/s' },
            { type: 'BATTERY_FAULT', name: 'Battery Storage Fault', description: 'BMS fault isolates battery; grid requires instant diesel support' },
            { type: 'DEMAND_SURGE', name: 'Evening Community Peak Surge', description: 'Simultaneous EV charging + residential pump load surge +40 kW' },
            { type: 'DIESEL_PRICE_SPIKE', name: 'Diesel Price Surge (+50%)', description: 'Fuel cost increases from $1.45 to $2.18 per liter' }
        ];
        res.status(200).json({
            history: scenarios,
            presets
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/scenario/compare
 * Executes side-by-side strategy benchmark: AI-Optimal vs Diesel-First vs Renewable-First
 */
router.post('/compare', async (req, res, next) => {
    try {
        const { current_state, forecast } = req.body;
        const comparison = await engineClient_1.engineClient.comparePlans({ current_state, forecast });
        res.status(200).json(comparison);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
