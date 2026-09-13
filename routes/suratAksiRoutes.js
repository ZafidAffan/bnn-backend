const express = require('express');
const router = express.Router();

const suratAksiController = require('../controllers/suratAksiController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ================= TERIMA SURAT =================
router.put(
  '/:id/terima',
  authMiddleware,
  roleMiddleware('umum'),
  suratAksiController.terimaSurat
);

// ================= KIRIM KE KEPALA =================
router.put(
  '/:id/kirim-ke-kepala',
  authMiddleware,
  roleMiddleware('umum'),
  suratAksiController.kirimKeKepala
);

module.exports = router;
