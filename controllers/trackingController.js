const mysql = require('mysql2');

// ================= DATABASE =================
const db = require('../config/db');

// ================= GET ALL TRACKING =================
// GET /api/tracking
exports.getAllTracking = (req, res) => {
  const query = `
    SELECT 
      st.id_tracking,
      st.id_surat,
      sm.no_surat,
      sm.perihal,
      st.status,
      st.keterangan,
      st.id_divisi,
      st.id_user,
      st.waktu
    FROM surat_tracking st
    INNER JOIN surat_masuk sm 
      ON sm.id_surat = st.id_surat
    ORDER BY st.waktu DESC
  `;

  console.log('📄 QUERY getAllTracking');

  db.query(query, (err, results) => {
    if (err) {
      console.error('🔥 ERROR getAllTracking:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tracking',
        error: err.sqlMessage || err.message,
      });
    }

    res.status(200).json(results);
  });
};

// ================= GET TRACKING BY ID SURAT =================
// GET /api/tracking/surat/:id_surat
exports.getTrackingBySurat = (req, res) => {
  const { id_surat } = req.params;

  console.log('➡️ GET /tracking/surat/:id');
  console.log('📌 id_surat:', id_surat);

  if (!id_surat) {
    return res.status(400).json({
      success: false,
      message: 'id_surat wajib diisi',
    });
  }

  const query = `
    SELECT 
      st.id_tracking,
      st.id_surat,
      sm.no_surat,
      sm.perihal,
      st.status,
      st.keterangan,
      st.id_divisi,
      d.nama_divisi,
      st.id_user,
      st.waktu
    FROM surat_tracking st
    INNER JOIN surat_masuk sm 
      ON sm.id_surat = st.id_surat
    LEFT JOIN divisi d
      ON d.id_divisi = st.id_divisi
    WHERE st.id_surat = ?
    ORDER BY st.waktu ASC
  `;

  console.log('📄 QUERY:', query);

  db.query(query, [id_surat], (err, results) => {
    if (err) {
      console.error('🔥 ERROR getTrackingBySurat:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil tracking surat',
        error: err.sqlMessage || err.message,
      });
    }

    // ⛔ BUKAN ERROR → tracking memang belum ada
    if (results.length === 0) {
      console.warn('⚠️ Tracking kosong untuk id_surat:', id_surat);
      return res.status(200).json([]);
    }

    res.status(200).json(results);
  });
};
