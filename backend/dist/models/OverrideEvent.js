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
exports.OverrideEvent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OverrideEventSchema = new mongoose_1.Schema({
    overrideId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    operatorId: {
        type: String,
        required: true,
        index: true
    },
    operatorEmail: {
        type: String
    },
    communityId: {
        type: String,
        default: 'com-offgrid-01',
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    previousState: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    overrideSettings: {
        forceDieselOn: { type: Boolean },
        forceDieselOff: { type: Boolean },
        minBatteryReservePct: { type: Number },
        dieselManualKw: { type: Number },
        shedTier4: { type: Boolean },
        reason: { type: String, required: true }
    },
    reason: {
        type: String,
        required: true
    },
    quantifiedImpact: {
        costDeltaUsd: { type: Number, default: 0 },
        co2DeltaKg: { type: Number, default: 0 },
        reliabilityDeltaPct: { type: Number, default: 0 },
        explanation: { type: String }
    },
    optimizationRunId: {
        type: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CLEARED'],
        default: 'ACTIVE'
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
exports.OverrideEvent = mongoose_1.default.model('OverrideEvent', OverrideEventSchema);
