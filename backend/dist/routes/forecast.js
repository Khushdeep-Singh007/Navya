"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const engineClient_1 = require("../services/engineClient");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
/**
 * GET /api/forecast
 * Retrieves forward 24-72h predicted solar, wind, and per-tier demand curves from the engine
 */
router.get('/', async (req, res, next) => {
    try {
        const horizonHours = parseInt(req.query.horizon || req.query.horizon_hours || '24', 10);
        const communityId = req.query.community_id || 'com-offgrid-01';
        const forecast = await engineClient_1.engineClient.getForecast(communityId, horizonHours);
        res.status(200).json(forecast);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
