"use strict";
/**
 * GridPilot Orchestrator Service
 *
 * Operational coordination layer in Node.js:
 * 1. Obtains current system state & forecast from Python engine
 * 2. Compares available renewable supply against demand
 * 3. Chooses Normal Path vs Shortfall Response Ladder
 * 4. Dispatches to engineClient
 * 5. Persists state & runs into MongoDB
 * 6. Pushes live updates to connected Socket.IO clients
 *
 * NOTE: The orchestrator does NOT do LP/MILP math. It coordinates data flow.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrator = exports.OrchestratorService = void 0;
const engineClient_1 = require("./engineClient");
const OptimizationRun_1 = require("../models/OptimizationRun");
const Community_1 = require("../models/Community");
const SignalState_1 = require("../models/SignalState");
const liveState_1 = require("../sockets/liveState");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const types_1 = require("../types");
class OrchestratorService {
    timer = null;
    isTicking = false;
    currentCommunityId = 'com-offgrid-01';
    activeOverride = null;
    latestState = null;
    latestDispatch = null;
    latestLadder = null;
    constructor() {
        logger_1.logger.info('OrchestratorService initialized');
    }
    /**
     * Start periodic orchestrator loop
     */
    start(intervalMs = env_1.env.ORCHESTRATOR_TICK_MS) {
        if (this.timer)
            return;
        logger_1.logger.info(`Starting Orchestrator loop (tick interval: ${intervalMs}ms)`);
        // Run initial tick immediately
        this.tick().catch((err) => logger_1.logger.error('Error on initial orchestrator tick', err));
        this.timer = setInterval(() => {
            this.tick().catch((err) => logger_1.logger.error('Error on scheduled orchestrator tick', err));
        }, intervalMs);
    }
    /**
     * Stop periodic orchestrator loop
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            logger_1.logger.info('Stopped Orchestrator loop');
        }
    }
    /**
     * Set or update active manual override
     */
    setOverride(override) {
        this.activeOverride = override;
        logger_1.logger.info(`Manual override updated in Orchestrator: ${override ? override.reason : 'CLEARED'}`);
    }
    getActiveOverride() {
        return this.activeOverride;
    }
    getLatestState() {
        return this.latestState;
    }
    getLatestDispatch() {
        return this.latestDispatch;
    }
    getLatestLadder() {
        return this.latestLadder;
    }
    /**
     * Single Orchestrator Cycle Execution
     */
    async tick() {
        if (this.isTicking) {
            logger_1.logger.debug('Orchestrator tick already in progress, skipping frame');
            return {
                state: this.latestState,
                dispatch: this.latestDispatch
            };
        }
        this.isTicking = true;
        try {
            // 1. Obtain live system state from engine
            const state = await engineClient_1.engineClient.getLiveState(this.currentCommunityId);
            // Apply active manual override constraints to state if present
            if (this.activeOverride) {
                if (this.activeOverride.force_diesel_on) {
                    state.diesel.status = 'RUNNING';
                    state.generation.diesel_kw = this.activeOverride.diesel_manual_kw || state.diesel.optimal_sweet_spot_kw || 80.0;
                }
                else if (this.activeOverride.force_diesel_off) {
                    state.diesel.status = 'OFF';
                    state.generation.diesel_kw = 0;
                }
            }
            // 2. Obtain forward forecast
            const forecast = await engineClient_1.engineClient.getForecast(this.currentCommunityId, 24);
            // 3. Check supply vs demand to determine Normal vs Shortfall Path
            const renewableSupply = state.generation.solar_kw + state.generation.wind_kw;
            const totalDemand = state.demand.total_kw;
            const batteryAvailable = Math.max(0, (state.battery.soc_pct - state.battery.min_soc_pct) / 100) * state.battery.capacity_kwh;
            const netInstantaneous = renewableSupply - totalDemand;
            let dispatchResult;
            let ladderResult;
            // Escalation Evaluation Logic
            if (netInstantaneous >= 0 && batteryAvailable > 20) {
                // --- NORMAL PATH ---
                state.shortfall_stage = types_1.ShortfallStage.STAGE_0_EARLY_WARNING;
                dispatchResult = await engineClient_1.engineClient.optimize({
                    current_state: state,
                    forecast,
                    horizon_hours: 24,
                    trigger_reason: this.activeOverride ? 'MANUAL_OVERRIDE_ACTIVE' : 'NORMAL_TICK_OPTIMIZATION'
                });
            }
            else {
                // --- SHORTFALL ESCALATION PATH ---
                let targetStage = types_1.ShortfallStage.STAGE_0_EARLY_WARNING;
                if (batteryAvailable > 30) {
                    targetStage = types_1.ShortfallStage.STAGE_1_PREEMPTIVE_PRECHARGE;
                }
                else if (batteryAvailable > 15) {
                    targetStage = types_1.ShortfallStage.STAGE_2_DEFERRABLE_RESCHEDULE;
                }
                else if (state.diesel.fuel_remaining_liters > 50) {
                    targetStage = types_1.ShortfallStage.STAGE_3_EFFICIENT_DIESEL;
                }
                else {
                    targetStage = types_1.ShortfallStage.STAGE_4_FAIR_LOAD_SHEDDING;
                }
                ladderResult = await engineClient_1.engineClient.evaluateLadder({
                    current_state: state,
                    forecast,
                    target_stage: targetStage
                });
                state.shortfall_stage = ladderResult.active_stage;
                dispatchResult = ladderResult.dispatch;
            }
            this.latestState = state;
            this.latestDispatch = dispatchResult;
            this.latestLadder = ladderResult || null;
            // 4. Asynchronously Persist into MongoDB
            await this.persistTickData(state, dispatchResult, ladderResult);
            // 5. Emit live updates via Socket.IO
            liveState_1.liveStateBroadcaster.emitLiveState(state);
            liveState_1.liveStateBroadcaster.emitOptimization(dispatchResult);
            if (ladderResult) {
                liveState_1.liveStateBroadcaster.emitLadderUpdate(ladderResult);
            }
            liveState_1.liveStateBroadcaster.emitSignal(state.signal);
            return { state, dispatch: dispatchResult, ladder: ladderResult };
        }
        catch (error) {
            logger_1.logger.error('Failed executing orchestrator tick', error);
            throw error;
        }
        finally {
            this.isTicking = false;
        }
    }
    /**
     * Persists snapshot data into MongoDB collections
     */
    async persistTickData(state, dispatch, ladder) {
        try {
            // 1. Record Optimization Run
            await OptimizationRun_1.OptimizationRun.create({
                runId: `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date(),
                communityId: state.community_id,
                triggerReason: this.activeOverride ? 'OVERRIDE_EVALUATION' : (ladder ? `SHORTFALL_STAGE_${ladder.active_stage}` : 'AUTOPILOT_NORMAL'),
                horizonHours: dispatch.horizon_hours || 24,
                inputSnapshot: {
                    weather: state.weather,
                    battery: state.battery,
                    diesel: state.diesel,
                    demand: state.demand
                },
                dispatchPlan: dispatch,
                objectiveBreakdown: {
                    totalCostUsd: dispatch.metrics?.total_cost_usd ?? 0,
                    totalCo2Kg: dispatch.metrics?.total_co2_kg ?? 0,
                    renewableSharePct: dispatch.metrics?.renewable_share_pct ?? 100,
                    dieselLitersUsed: dispatch.metrics?.diesel_liters_used ?? 0,
                    reliabilityScorePct: dispatch.metrics?.reliability_score_pct ?? 100
                },
                shortfallStage: state.shortfall_stage,
                reasonCodes: dispatch.reason_codes || [],
                executedBy: this.activeOverride ? 'OPERATOR_OVERRIDE' : 'AUTOPILOT'
            });
            // 2. Update Community Operational Snapshot
            await Community_1.Community.findOneAndUpdate({ communityId: state.community_id }, {
                $set: {
                    currentOperationalState: state,
                    name: state.name
                }
            }, { upsert: true });
            // 3. Record Signal State History
            await SignalState_1.SignalStateModel.create({
                communityId: state.community_id,
                color: state.signal.color,
                message: state.signal.message,
                shortfallStage: state.shortfall_stage,
                timestamp: new Date()
            });
        }
        catch (err) {
            // Log persistence error without crashing the running live loop
            logger_1.logger.warn('Failed saving tick data to MongoDB (may be operating offline/in-memory)', err);
        }
    }
}
exports.OrchestratorService = OrchestratorService;
exports.orchestrator = new OrchestratorService();
