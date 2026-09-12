"use strict";
/**
 * GridPilot Real-Time WebSocket Channel (Socket.IO)
 * Pushes live digital-twin state ticks, optimization runs, ladder stage changes, and what-if triggers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveStateBroadcaster = exports.LiveStateBroadcaster = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class LiveStateBroadcaster {
    io = null;
    init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: '*', // Allow frontend dev server and community kiosk clients
                methods: ['GET', 'POST']
            }
        });
        // Optional Socket.IO authentication middleware
        this.io.use((socket, next) => {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
                    socket.user = decoded;
                }
                catch (err) {
                    logger_1.logger.debug('Socket connection with invalid token; allowing as guest/kiosk viewer');
                }
            }
            next();
        });
        this.io.on('connection', (socket) => {
            const user = socket.user;
            logger_1.logger.info(`WebSocket client connected [ID: ${socket.id}] ${user ? `(User: ${user.email})` : '(Anonymous/Kiosk)'}`);
            socket.on('disconnect', (reason) => {
                logger_1.logger.info(`WebSocket client disconnected [ID: ${socket.id}, Reason: ${reason}]`);
            });
            // Handle ping
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: new Date().toISOString() });
            });
        });
        logger_1.logger.info('Socket.IO real-time server initialized');
        return this.io;
    }
    emitLiveState(state) {
        if (!this.io)
            return;
        this.io.emit('live_state_update', state);
    }
    emitOptimization(dispatch) {
        if (!this.io)
            return;
        this.io.emit('optimization_update', dispatch);
    }
    emitLadderUpdate(ladder) {
        if (!this.io)
            return;
        this.io.emit('ladder_stage_changed', ladder);
    }
    emitSignal(signal) {
        if (!this.io)
            return;
        this.io.emit('signal_update', signal);
    }
    emitScenario(result) {
        if (!this.io)
            return;
        this.io.emit('scenario_injected', result);
    }
    emitOverride(overrideData) {
        if (!this.io)
            return;
        this.io.emit('override_changed', overrideData);
    }
    getIO() {
        return this.io;
    }
}
exports.LiveStateBroadcaster = LiveStateBroadcaster;
exports.liveStateBroadcaster = new LiveStateBroadcaster();
