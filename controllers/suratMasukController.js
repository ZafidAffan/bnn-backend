const mysql = require('mysql2');
const path = require('path');
const axios = require('axios');

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJygUqWh6KPuzbeEG-vkhF8hhDN0GF0r4XcQHSg2eeRNW8arjZjTmDv0HwsTja2DCZ/exec";
const SHEET_SECRET = "BNN_SECRET_2026";
// ================= KONEKSI DATABASE =================
const db = require('../config/db');
// ====================================================
// CREATE SURAT MASUK
// ====================================================
exports.createSuratMasuk = (req, res) => {
  try {
    const {
      no_surat,
      tanggal_surat,
      tanggal_terima,
      dari,
      perihal,
      jenis_surat
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'File PDF wajib diupload' });
    }

    if (!no_surat || !tanggal_surat || !tanggal_terima || !dari || !perihal || !jenis_surat) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const kodeTracking = 'TRK-' + Date.now();
    const filePath = `/uploads/${req.file.filename}`;

    const query = `
      INSERT INTO surat_masuk (
        no_surat,
        tanggal_surat,
        tanggal_terima,
        dari,
        perihal,
        jenis_surat,
        file_surat,
        kode_tracking,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')
    `;

    const values = [
      no_surat,
      tanggal_surat,
      tanggal_terima,
      dari,
      perihal,
      jenis_surat,
      filePath,
      kodeTracking
    ];

    db.query(query, values, async (err) => {
      if (err) {
        console.error('ERROR INSERT SURAT:', err);
        return res.status(500).json({ message: 'Gagal menyimpan surat' });
      }
      // ================== KIRIM KE GOOGLE SHEETS ==================
      try {
        await axios.post(APPS_SCRIPT_URL, {
          secret: SHEET_SECRET,
          no_surat,
          tanggal_surat,
          tanggal_terima,
          dari,
          perihal,
          jenis_surat,
          status: "Menunggu",
          kode_tracking: kodeTracking
        });
      
        console.log("Berhasil kirim ke Google Sheets");
      
      } catch (sheetError) {
        console.error("Gagal kirim ke Google Sheets:", sheetError.message);
        // ⚠ Jangan return error ke user
      }


      res.status(201).json({
        message: 'Surat masuk berhasil ditambahkan',
        kode_tracking: kodeTracking
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ====================================================
// GET SEMUA SURAT MASUK DENGAN SEARCH
// ====================================================
exports.getSuratMasuk = (req, res) => {
  const search = req.query.search || ''; // ambil query parameter search

  let query = `
    SELECT
      id_surat,
      no_surat,
      tanggal_surat,
      tanggal_terima,
      dari,
      perihal,
      jenis_surat,
      file_surat,
      kode_tracking,
      status,
      created_at
    FROM surat_masuk
  `;
  const params = [];

  if (search) {
    query += `
      WHERE no_surat LIKE ? 
      OR dari LIKE ? 
      OR perihal LIKE ? 
      OR jenis_surat LIKE ?
    `;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  query += ` ORDER BY created_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('ERROR GET SURAT:', err);
      return res.status(500).json({ message: 'Error ambil data surat' });
    }
    res.json(results);
  });
};

// ====================================================
// GET DETAIL SURAT
// ====================================================
exports.getDetailSurat = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT *
    FROM surat_masuk
    WHERE id_surat = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('ERROR GET DETAIL:', err);
      return res.status(500).json({ message: 'Gagal mengambil detail surat' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    res.json(results[0]);
  });
};

// ====================================================
// UPDATE SURAT
// ====================================================
exports.updateSurat = (req, res) => {
  const { id } = req.params;
  const {
    no_surat,
    tanggal_surat,
    tanggal_terima,
    dari,
    perihal,
    jenis_surat,
    status
  } = req.body;

  let query = `
    UPDATE surat_masuk SET
      no_surat = ?,
      tanggal_surat = ?,
      tanggal_terima = ?,
      dari = ?,
      perihal = ?,
      jenis_surat = ?,
      status = ?
  `;
  const values = [no_surat, tanggal_surat, tanggal_terima, dari, perihal, jenis_surat, status];

  // jika ada file baru diupdate
  if (req.file) {
    query += `, file_surat = ?`;
    values.push(`/uploads/${req.file.filename}`);
  }

  query += ` WHERE id_surat = ?`;
  values.push(id);

  db.query(query, values, (err) => {
    if (err) {
      console.error('ERROR UPDATE SURAT:', err);
      return res.status(500).json({ message: 'Gagal update surat' });
    }

    res.json({ message: 'Surat berhasil diperbarui' });
  });
};

// ====================================================
// DELETE SURAT
// ====================================================
exports.deleteSurat = (req, res) => {
  const { id } = req.params;

  const query = `
    DELETE FROM surat_masuk
    WHERE id_surat = ?
  `;

  db.query(query, [id], (err) => {
    if (err) {
      console.error('ERROR DELETE SURAT:', err);
      return res.status(500).json({ message: 'Gagal menghapus surat' });
    }

    res.json({ message: 'Surat berhasil dihapus' });
  });
};
