const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const suratMasukController = require('../controllers/suratMasukController');
const authMiddleware = require('../middleware/authMiddleware');

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// =================================================
// ROUTES SURAT MASUK
// =================================================

// ===== CREATE SURAT MASUK (UPLOAD PDF) =====
router.post(
  '/',
  authMiddleware,
  upload.single('file_surat'), // ⚠️ HARUS sama dengan frontend
  suratMasukController.createSuratMasuk
);

// ===== GET SEMUA SURAT MASUK (BISA SEARCH) =====
router.get(
  '/',
  authMiddleware,
  suratMasukController.getSuratMasuk
);

// ===== GET DETAIL SURAT =====
router.get(
  '/:id',
  authMiddleware,
  suratMasukController.getDetailSurat
);

// ===== UPDATE SURAT (BISA UPDATE FILE JUGA) =====
router.put(
  '/:id',
  authMiddleware,
  upload.single('file_surat'), // opsional kalau mau update file
  suratMasukController.updateSurat
);

// ===== DELETE SURAT =====
router.delete(
  '/:id',
  authMiddleware,
  suratMasukController.deleteSurat
);

module.exports = router;
