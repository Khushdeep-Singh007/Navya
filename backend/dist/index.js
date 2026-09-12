"use strict";
/**
 * GridPilot Backend Entrypoint (Node.js + Express + TypeScript)
 * Member B - API Gateway, Orchestrator, Auth, Persistence, and Real-Time Push.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
exports.startServer = startServer;
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const liveState_1 = require("./sockets/liveState");
const orchestrator_1 = require("./services/orchestrator");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const signal_1 = __importDefault(require("./routes/signal"));
const microgrid_1 = __importDefault(require("./routes/microgrid"));
const forecast_1 = __importDefault(require("./routes/forecast"));
const optimize_1 = __importDefault(require("./routes/optimize"));
const scenario_1 = __importDefault(require("./routes/scenario"));
const override_1 = __importDefault(require("./routes/override"));
const explain_1 = __importDefault(require("./routes/explain"));
const ladder_1 = __importDefault(require("./routes/ladder"));
const runway_1 = __importDefault(require("./routes/runway"));
exports.app = (0, express_1.default)();
exports.server = http_1.default.createServer(exports.app);
// 1. Security & Core Middleware
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
exports.app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
exports.app.use(express_1.default.json({ limit: '5mb' }));
// Request logging middleware
exports.app.use((req, _res, next) => {
    if (req.originalUrl !== '/health' && req.originalUrl !== '/signal') {
        logger_1.logger.debug(`${req.method} ${req.originalUrl}`);
    }
    next();
});
// 2. Health & Diagnostic Endpoint
exports.app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'gridpilot-backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        mock_engine_active: env_1.env.USE_MOCK_ENGINE,
        environment: env_1.env.NODE_ENV
    });
});
// 3. Public Routes (No Authentication Required)
exports.app.use('/auth', auth_1.default);
exports.app.use('/signal', signal_1.default);
// 4. Protected Microgrid API Routes
exports.app.use('/api/microgrid', microgrid_1.default);
exports.app.use('/api/forecast', forecast_1.default);
exports.app.use('/api/optimize', optimize_1.default);
exports.app.use('/api/scenario', scenario_1.default);
exports.app.use('/api/override', override_1.default);
exports.app.use('/api/explain', explain_1.default);
exports.app.use('/api/ladder', ladder_1.default);
exports.app.use('/api/runway', runway_1.default);
// 5. 404 Route Handler
exports.app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route not found: ${req.method} ${req.originalUrl}`
        }
    });
});
// 6. Centralized Error Handler Middleware
exports.app.use(errorHandler_1.errorHandler);
// 7. Server Initialization
async function startServer() {
    // Initialize Socket.IO
    liveState_1.liveStateBroadcaster.init(exports.server);
    // Connect Database (Atlas / Local)
    if (process.env.NODE_ENV !== 'test') {
        await (0, db_1.connectDB)();
    }
    // Start Autonomous Orchestrator Loop if enabled
    if (env_1.env.ORCHESTRATOR_AUTO_START && process.env.NODE_ENV !== 'test') {
        orchestrator_1.orchestrator.start(env_1.env.ORCHESTRATOR_TICK_MS);
    }
    const port = env_1.env.PORT;
    return new Promise((resolve) => {
        exports.server.listen(port, () => {
            logger_1.logger.info(`=======================================================`);
            logger_1.logger.info(`  GRIDPILOT BACKEND (MEMBER B) READY`);
            logger_1.logger.info(`  REST API listening on: http://localhost:${port}`);
            logger_1.logger.info(`  WebSocket ready on:   ws://localhost:${port}`);
            logger_1.logger.info(`  Public Signal:        http://localhost:${port}/signal`);
            logger_1.logger.info(`  Mock Engine Mode:     ${env_1.env.USE_MOCK_ENGINE ? 'ENABLED' : 'DISABLED'}`);
            logger_1.logger.info(`=======================================================`);
            resolve(exports.server);
        });
    });
}
// Auto-start when run directly
if (require.main === module) {
    startServer().catch((err) => {
        logger_1.logger.error('Fatal failure starting GridPilot Backend', err);
        process.exit(1);
    });
}
