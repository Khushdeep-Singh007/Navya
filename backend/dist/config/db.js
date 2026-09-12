"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
async function connectDB(uri) {
    const mongoUri = uri || env_1.env.MONGODB_URI;
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(mongoUri);
        logger_1.logger.info(`Connected to MongoDB: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB', error);
        // In test or standalone dev, allow graceful continuation or throw
        if (env_1.env.NODE_ENV !== 'test') {
            throw error;
        }
    }
}
async function disconnectDB() {
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('Disconnected from MongoDB');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB', error);
    }
}
