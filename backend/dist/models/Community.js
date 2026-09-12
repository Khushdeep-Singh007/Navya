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
exports.Community = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CommunitySchema = new mongoose_1.Schema({
    communityId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        latitude: { type: Number, default: -1.2921 },
        longitude: { type: Number, default: 36.8219 },
        region: { type: String, default: 'Off-Grid Eco District' },
        timezone: { type: String, default: 'UTC+3' }
    },
    demandProfileType: {
        type: String,
        default: 'RURAL_COMMUNITY_MIXED'
    },
    reliabilityTargets: {
        minUptimePct: { type: Number, default: 99.5 },
        maxOutageHoursYear: { type: Number, default: 24 }
    },
    energyAssets: {
        solar: {
            capacityKw: { type: Number, default: 120.0 },
            efficiencyPct: { type: Number, default: 21.5 },
            inverterCapacityKw: { type: Number, default: 100.0 }
        },
        wind: {
            capacityKw: { type: Number, default: 60.0 },
            cutInSpeedMs: { type: Number, default: 3.0 },
            ratedSpeedMs: { type: Number, default: 11.0 }
        },
        battery: {
            capacityKwh: { type: Number, default: 250.0 },
            maxChargeKw: { type: Number, default: 50.0 },
            maxDischargeKw: { type: Number, default: 60.0 },
            minSocPct: { type: Number, default: 20.0 },
            maxSocPct: { type: Number, default: 95.0 },
            roundTripEfficiencyPct: { type: Number, default: 92.0 }
        },
        diesel: {
            ratedKw: { type: Number, default: 100.0 },
            minLoadKw: { type: Number, default: 25.0 },
            sweetSpotKw: { type: Number, default: 80.0 },
            tankCapacityL: { type: Number, default: 1000.0 },
            fuelConsumptionLPerKwh: { type: Number, default: 0.27 },
            fuelPricePerLiter: { type: Number, default: 1.45 }
        }
    },
    currentOperationalState: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
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
exports.Community = mongoose_1.default.model('Community', CommunitySchema);
