const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour le tableau de bord et les rapports (Module 6)
router.get('/personal', authenticate, dashboardController.getPersonalDashboard);

router.get('/projects/:project_id', authenticate, dashboardController.getProjectDashboard);

router.get('/campaigns/:campaign_id', authenticate, dashboardController.getCampaignDashboard);

router.get('/history', authenticate, dashboardController.getActionHistory);

router.get('/campaigns/:campaign_id/report', authenticate, dashboardController.generateCampaignReport);

module.exports = router;
