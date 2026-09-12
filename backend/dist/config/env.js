"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file from backend root or process.cwd()
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
dotenv_1.default.config(); // fallback
exports.env = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gridpilot',
    JWT_SECRET: process.env.JWT_SECRET || 'gridpilot_dev_jwt_secret_change_in_production_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    ENGINE_BASE_URL: process.env.ENGINE_BASE_URL || 'http://localhost:8000',
    USE_MOCK_ENGINE: process.env.USE_MOCK_ENGINE === 'true' || process.env.NODE_ENV === 'test',
    ORCHESTRATOR_TICK_MS: parseInt(process.env.ORCHESTRATOR_TICK_MS || '5000', 10),
    ORCHESTRATOR_AUTO_START: process.env.ORCHESTRATOR_AUTO_START !== 'false',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    LLM_PROVIDER: process.env.LLM_PROVIDER || 'claude',
    LLM_API_KEY: process.env.LLM_API_KEY || ''
};
