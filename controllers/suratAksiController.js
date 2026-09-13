const mysql = require('mysql2');

// ================= KONEKSI DATABASE =================
const db = require('../config/db');

// ================= TERIMA SURAT =================
exports.terimaSurat = (req, res) => {
  const id_surat = parseInt(req.params.id);
  const id_user = req.user.id_user;
  const role = req.user.role;

  if (isNaN(id_surat)) {
    return res.status(400).json({ message: 'ID surat tidak valid' });
  }

  const updateSurat = `
    UPDATE surat_masuk 
    SET status = 'Diterima'
    WHERE id_surat = ?
  `;

  db.query(updateSurat, [id_surat], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    const insertTracking = `
      INSERT INTO surat_tracking
      (id_surat, status, keterangan, id_user, waktu)
      VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(
      insertTracking,
      [id_surat, 'Diterima', `Diterima oleh ${role}`, id_user],
      () => {
        res.json({ message: 'Surat diterima & tracking tercatat' });
      }
    );
  });
};

// ================= KIRIM KE KEPALA =================
exports.kirimKeKepala = (req, res) => {
  const id_surat = parseInt(req.params.id);
  const id_user = req.user.id_user;

  if (isNaN(id_surat)) {
    return res.status(400).json({ message: 'ID surat tidak valid' });
  }

  // 1️⃣ update status surat
  const updateSurat = `
    UPDATE surat_masuk
    SET status = 'Disposisi Kepala'
    WHERE id_surat = ?
  `;

  db.query(updateSurat, [id_surat], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    // 2️⃣ insert tracking
    const insertTracking = `
      INSERT INTO surat_tracking
      (id_surat, status, keterangan, id_user, waktu)
      VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(
      insertTracking,
      [
        id_surat,
        'Disposisi Kepala',
        'Surat dikirim ke Kepala',
        id_user
      ],
      () => {
        res.json({ message: 'Surat berhasil dikirim ke Kepala' });
      }
    );
  });
};
