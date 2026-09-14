const express = require('express');
const router = express.Router();
const multer = require('multer');

const suratMasukController = require('../controllers/suratMasukController');
const authMiddleware = require('../middleware/authMiddleware');

// ================= MULTER CONFIG (MEMORY STORAGE) =================
// Menggunakan memoryStorage agar file dibaca sebagai buffer untuk dikirim ke Google Drive
const upload = multer({ storage: multer.memoryStorage() });

// =================================================
// ROUTES SURAT MASUK
// =================================================

// ===== CREATE SURAT MASUK (UPLOAD PDF KE GOOGLE DRIVE) =====
router.post(
  '/',
  authMiddleware,
  upload.single('file_surat'), 
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

// ===== UPDATE SURAT (BISA UPDATE FILE JUGA KE GOOGLE DRIVE) =====
router.put(
  '/:id',
  authMiddleware,
  upload.single('file_surat'), 
  suratMasukController.updateSurat
);

// ===== DELETE SURAT =====
router.delete(
  '/:id',
  authMiddleware,
  suratMasukController.deleteSurat
);

module.exports = router;