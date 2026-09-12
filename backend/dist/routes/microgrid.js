"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const engineClient_1 = require("../services/engineClient");
const orchestrator_1 = require("../services/orchestrator");
const Community_1 = require("../models/Community");
const router = (0, express_1.Router)();
// Guard all microgrid routes with JWT auth
router.use(auth_1.requireAuth);
/**
 * GET /api/microgrid/state
 * Returns current live digital-twin state (solar, wind, battery, diesel, demand, shortfall stage)
 */
router.get('/state', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        // Prioritize orchestrator cached state or fetch fresh from engineClient
        let state = orchestrator_1.orchestrator.getLatestState();
        if (!state || state.community_id !== communityId) {
            state = await engineClient_1.engineClient.getLiveState(communityId);
        }
        res.status(200).json(state);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/microgrid/community
 * Returns community profile, targets, and locations
 */
router.get('/community', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        let community = await Community_1.Community.findOne({ communityId });
        if (!community) {
            // Seed default community if not exists
            community = await Community_1.Community.create({
                communityId,
                name: 'Kipawa Eco-Community Microgrid',
                location: {
                    latitude: -1.2921,
                    longitude: 36.8219,
                    region: 'East Rift Valley Off-Grid Corridor',
                    timezone: 'UTC+3'
                },
                demandProfileType: 'RURAL_COMMUNITY_MIXED',
                reliabilityTargets: {
                    minUptimePct: 99.8,
                    maxOutageHoursYear: 18
                }
            });
        }
        res.status(200).json(community);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/microgrid/assets
 * Returns configuration of Solar, Wind, Battery, and Diesel physical assets
 */
router.get('/assets', async (req, res, next) => {
    try {
        const communityId = req.query.community_id || 'com-offgrid-01';
        let community = await Community_1.Community.findOne({ communityId });
        if (!community) {
            community = await Community_1.Community.create({ communityId, name: 'Kipawa Eco-Community Microgrid' });
        }
        res.status(200).json(community.energyAssets);
    }
    catch (err) {
        next(err);
    }
});
/**
 * PUT /api/microgrid/parameters
 * Updates dynamic community parameters (e.g. diesel fuel price, battery reserve constraints)
 */
router.put('/parameters', async (req, res, next) => {
    try {
        const communityId = req.body.community_id || 'com-offgrid-01';
        const { energyAssets, reliabilityTargets } = req.body;
        const updated = await Community_1.Community.findOneAndUpdate({ communityId }, {
            $set: {
                ...(energyAssets ? { energyAssets } : {}),
                ...(reliabilityTargets ? { reliabilityTargets } : {})
            }
        }, { new: true, upsert: true });
        res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
