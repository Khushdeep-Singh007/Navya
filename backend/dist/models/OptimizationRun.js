"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationRun = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OptimizationRunSchema = new mongoose_1.Schema({
    runId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    communityId: {
        type: String,
        default: 'com-offgrid-01',
        index: true
    },
    scenarioId: {
        type: String,
        index: true
    },
    triggerReason: {
        type: String,
        default: 'ORCHESTRATOR_TICK'
    },
    horizonHours: {
        type: Number,
        default: 24
    },
    inputSnapshot: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    forecastSnapshot: {
        type: mongoose_1.Schema.Types.Mixed
    },
    dispatchPlan: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    objectiveBreakdown: {
        totalCostUsd: { type: Number, default: 0 },
        totalCo2Kg: { type: Number, default: 0 },
        renewableSharePct: { type: Number, default: 100 },
        dieselLitersUsed: { type: Number, default: 0 },
        reliabilityScorePct: { type: Number, default: 100 },
        unservedEnergyPenalty: { type: Number, default: 0 },
        degradationPenalty: { type: Number, default: 0 }
    },
    shortfallStage: {
        type: Number,
        default: 0
    },
    reasonCodes: {
        type: [String],
        default: []
    },
    executedBy: {
        type: String,
        default: 'AUTOPILOT'
    }
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.__v;
            ret.id = ret._id ? ret._id.toString() : undefined;
            delete ret._id;
            return ret;
        }
    }
});
// Compound index for querying recent runs by community
OptimizationRunSchema.index({ communityId: 1, timestamp: -1 });
exports.OptimizationRun = mongoose_1.default.model('OptimizationRun', OptimizationRunSchema);
