const express = require('express');
const router = express.Router();

// ================= CONTROLLER =================
const disposisiController = require('../controllers/disposisiController');

// ================= MIDDLEWARE =================
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * =========================
 * MASTER DATA
 * =========================
 */
router.get('/divisi', authMiddleware, disposisiController.getDivisi);
router.get('/divisi/:id_divisi/subdivisi', authMiddleware, disposisiController.getSubDivisiByDivisi);

/**
 * =========================
 * DISPOSISI
 * =========================
 */


router.get('/divisi/:id_divisi', authMiddleware, disposisiController.getDisposisiByDivisi);

// Hanya untuk role 'umum'
router.get('/', authMiddleware, roleMiddleware('umum'), disposisiController.getAllDisposisiUmum);

// Tambah disposisi
router.post('/kepala', authMiddleware, roleMiddleware('kepala'), disposisiController.tambahDisposisiKepala);
router.post('/umum', authMiddleware, roleMiddleware('umum'), disposisiController.tambahDisposisiUmum);

// Konfirmasi disposisi
router.put('/:id_disposisi/konfirmasi-umum', authMiddleware, roleMiddleware('umum'), disposisiController.konfirmasiDisposisiUmum);
router.put('/:id_disposisi/konfirmasi-divisi', authMiddleware, roleMiddleware('divisi'), disposisiController.konfirmasiDisposisiDivisi);

// Update status disposisi opsional
router.put('/:id_disposisi/status', authMiddleware, disposisiController.updateStatusDisposisi);

// Kirim ke sub divisi
router.post('/:id_disposisi/subdivisi', authMiddleware, roleMiddleware('divisi'), disposisiController.kirimKeSubDivisi);

module.exports = router;
