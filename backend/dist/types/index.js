"use strict";
/**
 * GridPilot Backend Internal Types
 * Aligned with shared/schemas/types.ts and contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortfallStage = exports.LoadTier = void 0;
var LoadTier;
(function (LoadTier) {
    LoadTier[LoadTier["TIER_1_CRITICAL"] = 1] = "TIER_1_CRITICAL";
    LoadTier[LoadTier["TIER_2_IMPORTANT"] = 2] = "TIER_2_IMPORTANT";
    LoadTier[LoadTier["TIER_3_STANDARD"] = 3] = "TIER_3_STANDARD";
    LoadTier[LoadTier["TIER_4_FLEXIBLE"] = 4] = "TIER_4_FLEXIBLE"; // EV charging, agricultural milling, non-urgent heavy tasks
})(LoadTier || (exports.LoadTier = LoadTier = {}));
var ShortfallStage;
(function (ShortfallStage) {
    ShortfallStage[ShortfallStage["STAGE_0_EARLY_WARNING"] = 0] = "STAGE_0_EARLY_WARNING";
    ShortfallStage[ShortfallStage["STAGE_1_PREEMPTIVE_PRECHARGE"] = 1] = "STAGE_1_PREEMPTIVE_PRECHARGE";
    ShortfallStage[ShortfallStage["STAGE_2_DEFERRABLE_RESCHEDULE"] = 2] = "STAGE_2_DEFERRABLE_RESCHEDULE";
    ShortfallStage[ShortfallStage["STAGE_3_EFFICIENT_DIESEL"] = 3] = "STAGE_3_EFFICIENT_DIESEL";
    ShortfallStage[ShortfallStage["STAGE_4_FAIR_LOAD_SHEDDING"] = 4] = "STAGE_4_FAIR_LOAD_SHEDDING";
})(ShortfallStage || (exports.ShortfallStage = ShortfallStage = {}));
