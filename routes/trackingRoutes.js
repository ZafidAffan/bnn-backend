const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get(
  '/',
  authMiddleware,
  trackingController.getAllTracking
);

router.get(
  '/surat/:id_surat',
  authMiddleware,
  trackingController.getTrackingBySurat
);

module.exports = router;
