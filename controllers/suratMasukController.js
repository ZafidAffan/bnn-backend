const mysql = require('mysql2');
const path = require('path');
const axios = require('axios');

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9LZupAqQrdJ4iNjFY43xulS_sUG2T6oLTzkPQuodYl6oVXBHuajrtk1h6BNY5VVA9/exec";
const SHEET_SECRET = "BNN_SECRET_2026";
// ================= KONEKSI DATABASE =================
const db = require('../config/db');
// ====================================================
// CREATE SURAT MASUK
// ====================================================
exports.createSuratMasuk = async (req, res) => {
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
    
    // Konversi file buffer ke Base64 untuk dikirim ke Google Drive via Apps Script
    const fileBase64 = req.file.buffer.toString('base64');
    const fileName = req.file.originalname;
    const fileMimeType = req.file.mimetype;

    let fileUrl = '';

    // Upload ke Google Drive & Google Sheets terlebih dahulu untuk mendapatkan URL
    try {
      const response = await axios.post(APPS_SCRIPT_URL, {
        secret: SHEET_SECRET,
        no_surat,
        tanggal_surat,
        tanggal_terima,
        dari,
        perihal,
        jenis_surat,
        status: "Menunggu",
        kode_tracking: kodeTracking,
        fileBase64,
        fileName,
        fileMimeType
      });
      
      if (response.data && response.data.fileUrl) {
        fileUrl = response.data.fileUrl;
      }
      console.log("Berhasil upload ke Google Drive & Sheets");
    } catch (sheetError) {
      console.error("Gagal sinkronisasi ke Google:", sheetError.message);
      return res.status(500).json({ message: 'Gagal mengunggah file ke Google Drive' });
    }

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
      fileUrl, // Menyimpan URL Google Drive ke database
      kodeTracking
    ];

    db.query(query, values, (err) => {
      if (err) {
        console.error('ERROR INSERT SURAT:', err);
        return res.status(500).json({ message: 'Gagal menyimpan surat ke database' });
      }

      res.status(201).json({
        message: 'Surat masuk berhasil ditambahkan',
        kode_tracking: kodeTracking,
        file_url: fileUrl
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
exports.updateSurat = async (req, res) => {
  try {
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

    let fileUrl = null;

    // Jika ada file PDF baru yang di-upload saat update
    if (req.file) {
      const fileBase64 = req.file.buffer.toString('base64');
      const fileName = req.file.originalname;
      const fileMimeType = req.file.mimetype;

      try {
        const response = await axios.post(APPS_SCRIPT_URL, {
          secret: SHEET_SECRET,
          no_surat: no_surat || 'UPDATE_FILE',
          tanggal_surat: '-',
          tanggal_terima: '-',
          dari: '-',
          perihal: 'Update Lampiran File',
          jenis_surat: '-',
          status: status || 'Update',
          kode_tracking: 'UPD-' + id,
          fileBase64,
          fileName,
          fileMimeType
        });

        if (response.data && response.data.fileUrl) {
          fileUrl = response.data.fileUrl;
        }
      } catch (sheetError) {
        console.error("Gagal upload file baru ke Google Drive:", sheetError.message);
        return res.status(500).json({ message: 'Gagal mengunggah file baru ke Google Drive' });
      }
    }

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

    if (fileUrl) {
      query += `, file_surat = ?`;
      values.push(fileUrl);
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
  } catch (error) {
    console.error('SERVER ERROR UPDATE:', error);
    res.status(500).json({ message: 'Server error' });
  }
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