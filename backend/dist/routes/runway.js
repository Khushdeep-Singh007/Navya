"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const engineClient_1 = require("../services/engineClient");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
/**
 * GET /api/runway
 * Returns the forward fuel-runway forecast (days of diesel remaining & per-day projected burn rate)
 */
router.get('/', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        const runway = await engineClient_1.engineClient.getRunway(communityId);
        res.status(200).json(runway);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
