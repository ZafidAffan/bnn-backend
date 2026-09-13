const mysql = require('mysql2');

// ================= DATABASE =================
const db =  require('../config/db');

// ================= AMBIL DIVISI =================
exports.getDivisi = (req, res) => {
  const query = `SELECT id_divisi, nama_divisi FROM divisi`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil divisi', error: err });
    res.json(results);
  });
};

// ================= AMBIL SUB DIVISI BERDASARKAN DIVISI =================
exports.getSubDivisiByDivisi = (req, res) => {
  const { id_divisi } = req.params;
  const query = `SELECT id_subdivisi, nama_subdivisi, keterangan FROM sub_divisi WHERE id_divisi = ?`;
  db.query(query, [id_divisi], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil sub divisi', error: err });
    res.json(results);
  });
};

// ================= AMBIL DISPOSISI BERDASARKAN DIVISI (JOIN SURAT_MASUK) =================
exports.getDisposisiByDivisi = (req, res) => {
  const { id_divisi } = req.params;
  const role = req.user.role;

  let query = '';
  let params = [];

  if (role === 'umum') {
    query = `
      SELECT d.*, s.no_surat, s.tanggal_surat, s.tanggal_terima, s.dari, s.perihal, s.jenis_surat FROM disposisi d
      LEFT JOIN surat_masuk s ON d.id_surat = s.id_surat
      ORDER BY d.tanggal_disposisi DESC
    `;
  } else {
    query = `
      SELECT d.*, s.no_surat, s.tanggal_surat, s.tanggal_terima, s.dari, s.perihal, s.jenis_surat FROM disposisi d
      LEFT JOIN surat_masuk s ON d.id_surat = s.id_surat
      WHERE d.ke_divisi = ?
      ORDER BY d.tanggal_disposisi DESC
    `;
    params = [id_divisi];
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil disposisi', error: err });
    res.json(results);
  });
};

// ================= AMBIL SEMUA DISPOSISI UMUM =================
exports.getAllDisposisiUmum = (req, res) => {
  const query = `SELECT * FROM disposisi ORDER BY tanggal_disposisi DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil disposisi umum', error: err });
    res.json(results);
  });
};

// ================= TAMBAH DISPOSISI KEPALA =================
exports.tambahDisposisiKepala = (req, res) => {
  const { id_surat, ke_divisi, perintah, keterangan } = req.body;
  const dari_user = req.user.id_user;

  if (!id_surat || !ke_divisi) {
    return res.status(400).json({ message: 'id_surat dan ke_divisi wajib diisi' });
  }

  const statusProses = 'menunggu_divisi';
  const statusSurat = 'Disposisi Divisi';

  const insertDisposisi = `
    INSERT INTO disposisi
      (id_surat, dari_user, ke_divisi, perintah, keterangan, tanggal_disposisi, status_konfirmasi, status_proses)
    VALUES (?, ?, ?, ?, ?, NOW(), 'belum diterima', ?)
  `;

  db.query(
    insertDisposisi,
    [id_surat, dari_user, ke_divisi, perintah || 'Disposisi Kepala', keterangan || '', statusProses],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Gagal tambah disposisi Kepala', error: err });

      const id_disposisi = result.insertId;

      const updateSurat = `UPDATE surat_masuk SET status = ? WHERE id_surat = ?`;
      db.query(updateSurat, [statusSurat, id_surat], (err2) => {
        if (err2) return res.status(500).json({ message: 'Disposisi berhasil tapi gagal update status surat', error: err2 });

        const insertTracking = `
          INSERT INTO surat_tracking
            (id_surat, status, keterangan, id_divisi, id_user)
          VALUES (?, ?, ?, ?, ?)
        `;
        const trackingData = [id_surat, 'Disposisi Divisi', keterangan || 'Disposisi langsung dari Kepala', ke_divisi, dari_user];

        db.query(insertTracking, trackingData, (err3) => {
          if (err3) return res.status(500).json({ message: 'Disposisi berhasil tapi gagal simpan tracking', error: err3 });

          res.status(201).json({
            message: 'Disposisi Kepala berhasil dan langsung diteruskan ke Divisi',
            id_disposisi,
            status_proses: statusProses
          });
        });
      });
    }
  );
};

// ================= xxxxx-"TAMBAH DISPOSISI UMUM"-xxxx =================
exports.tambahDisposisiUmum = (req, res) => {
  const { id_surat, ke_divisi, perintah, keterangan } = req.body;
  const dari_user = req.user.id_user;

  if (!id_surat || !ke_divisi)
    return res.status(400).json({ message: 'id_surat dan ke_divisi wajib diisi' });

  const statusProses = 'menunggu_divisi';

  const sql = `
    INSERT INTO disposisi
      (id_surat, dari_user, ke_divisi, perintah, keterangan, tanggal_disposisi, status_konfirmasi, status_proses)
    VALUES (?, ?, ?, ?, ?, NOW(), 'belum diterima', ?)
  `;

  db.query(
    sql,
    [id_surat, dari_user, ke_divisi, perintah || 'Disposisi', keterangan || '', statusProses],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Gagal tambah disposisi Umum', error: err });

      const id_disposisi = result.insertId;

      const selectDivisi = `SELECT nama_divisi FROM divisi WHERE id_divisi = ?`;
      db.query(selectDivisi, [ke_divisi], (errDiv, divisiResult) => {
        let statusTracking = 'Disposisi Divisi';
        if (!errDiv && divisiResult.length > 0) {
          statusTracking = `Disposisi Divisi (${divisiResult[0].nama_divisi})`;
        }

        const insertTracking = `
          INSERT INTO surat_tracking
            (id_surat, status, keterangan, id_divisi, id_user)
          VALUES (?, ?, ?, ?, ?)
        `;
        const trackingData = [id_surat, statusTracking, keterangan || 'Disposisi dari Umum', ke_divisi || null, dari_user || null];

        db.query(insertTracking, trackingData, (err3) => {
          if (err3) return res.status(500).json({ message: 'Disposisi berhasil tapi gagal tambah tracking', error: err3 });

          res.status(201).json({
            message: 'Disposisi Umum berhasil dan tracking tersimpan',
            id_disposisi,
            status_proses: statusProses
          });
        });
      });
    }
  );
};

// ================= xxxxxx-"KONFIRMASI DISPOSISI UMUM"-xxxxxx =================
exports.konfirmasiDisposisiUmum = (req, res) => {
  const { id_disposisi } = req.params;
  const id_user = req.user.id_user;

  const selectDisposisi = `SELECT id_surat, ke_divisi, keterangan FROM disposisi WHERE id_disposisi = ?`;
  db.query(selectDisposisi, [id_disposisi], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil disposisi', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Disposisi tidak ditemukan' });

    const { id_surat, ke_divisi, keterangan } = results[0];

    const updateDisposisi = `
      UPDATE disposisi 
      SET status_proses = 'menunggu_divisi', status_konfirmasi = 'diterima' 
      WHERE id_disposisi = ?
    `;
    db.query(updateDisposisi, [id_disposisi], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal update disposisi', error: err2 });

      const updateSurat = `UPDATE surat_masuk SET status = 'Disposisi Divisi' WHERE id_surat = ?`;
      db.query(updateSurat, [id_surat], (err3) => {
        if (err3) return res.status(500).json({ message: 'Gagal update surat', error: err3 });

        const selectDivisi = `SELECT nama_divisi FROM divisi WHERE id_divisi = ?`;
        db.query(selectDivisi, [ke_divisi], (errDiv, divisiResult) => {
          let statusTracking = 'Disposisi Divisi';
          if (!errDiv && divisiResult.length > 0) {
            statusTracking = `Disposisi Divisi (${divisiResult[0].nama_divisi})`;
          }

          const insertTracking = `
            INSERT INTO surat_tracking
              (id_surat, status, keterangan, id_divisi, id_user)
            VALUES (?, ?, ?, ?, ?)
          `;
          const trackingData = [id_surat, statusTracking, keterangan || 'Konfirmasi Umum', ke_divisi || null, id_user || null];

          db.query(insertTracking, trackingData, (err4) => {
            if (err4) return res.status(500).json({ message: 'Gagal tambah tracking', error: err4 });

            res.json({ message: 'Disposisi dikonfirmasi, status disposisi & surat berhasil diperbarui' });
          });
        });
      });
    });
  });
};

// ================= UPDATE STATUS DISPOSISI =================
exports.updateStatusDisposisi = (req, res) => {
  const { id_disposisi } = req.params;
  const { newStatus } = req.body;

  const sql = `UPDATE disposisi SET status_proses = ? WHERE id_disposisi = ?`;
  db.query(sql, [newStatus, id_disposisi], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal update status', error: err });
    res.json({ message: 'Status berhasil diperbarui' });
  });
};

// ================= KONFIRMASI DISPOSISI DIVISI =================
exports.konfirmasiDisposisiDivisi = (req, res) => {
  const { id_disposisi } = req.params;
  const id_user = req.user.id_user;

  const selectSql = `SELECT id_surat, ke_divisi, keterangan FROM disposisi WHERE id_disposisi = ?`;
  db.query(selectSql, [id_disposisi], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil disposisi', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Disposisi tidak ditemukan' });

    const { id_surat, ke_divisi, keterangan } = results[0];

    const updateDisposisi = `
      UPDATE disposisi
      SET status_konfirmasi = 'diterima', tanggal_konfirmasi = NOW()
      WHERE id_disposisi = ?
    `;
    db.query(updateDisposisi, [id_disposisi], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal konfirmasi disposisi', error: err2 });

      const insertTracking = `
        INSERT INTO surat_tracking
          (id_surat, status, keterangan, id_divisi, id_user)
        VALUES (?, ?, ?, ?, ?)
      `;
      const trackingData = [id_surat, 'Disposisi Divisi Diterima', keterangan || 'Disposisi diterima oleh divisi', ke_divisi, id_user];

      db.query(insertTracking, trackingData, (err3) => {
        if (err3) return res.status(500).json({ message: 'Gagal tambah tracking', error: err3 });

        res.json({ message: 'Disposisi berhasil dikonfirmasi dan tracking tersimpan' });
      });
    });
  });
};

// ================= DISPOSISI KE SUB DIVISI =================
exports.kirimKeSubDivisi = (req, res) => {
  const { id_disposisi } = req.params;
  const { ke_divisi_sub, keterangan } = req.body;
  const dari_user = req.user.id_user;

  if (!ke_divisi_sub) {
    return res.status(400).json({ message: 'ke_divisi_sub wajib diisi' });
  }

  // 1️⃣ Ambil disposisi induk
  const selectSql = `SELECT id_surat FROM disposisi WHERE id_disposisi = ?`;
  db.query(selectSql, [id_disposisi], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil disposisi', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Disposisi tidak ditemukan' });

    const id_surat = results[0].id_surat;

    // 2️⃣ Update disposisi dengan sub divisi, status_proses = 'selesai'
    const updateSql = `
      UPDATE disposisi
      SET id_subdivisi = ?, keterangan = ?, status_proses = 'selesai'
      WHERE id_disposisi = ?
    `;
    db.query(updateSql, [ke_divisi_sub, keterangan || '', id_disposisi], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal update disposisi', error: err2 });

      // 3️⃣ Simpan tracking
      const trackingSql = `
        INSERT INTO surat_tracking
          (id_surat, status, keterangan, id_divisi, id_user)
        VALUES (?, 'Disposisi Sub Divisi', ?, ?, ?)
      `;
      const trackingData = [id_surat, keterangan || 'Disposisi diteruskan ke Sub Divisi', ke_divisi_sub, dari_user];

      db.query(trackingSql, trackingData, (err3) => {
        if (err3) return res.status(500).json({ message: 'Gagal simpan tracking', error: err3 });

        res.status(201).json({
          message: 'Disposisi berhasil diteruskan ke Sub Divisi',
          id_disposisi,
          id_subdivisi: ke_divisi_sub,
          status_proses: 'selesai'
        });
      });
    });
  });
};
