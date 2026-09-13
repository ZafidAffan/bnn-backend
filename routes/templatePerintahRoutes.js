const express = require('express');
const router = express.Router();

const templateController = require('../controllers/templatePerintahController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/template-perintah
router.get(
  '/',
  authMiddleware,
  templateController.getTemplatePerintah
);

module.exports = router;
