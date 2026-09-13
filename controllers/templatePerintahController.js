const mysql = require('mysql2');
const db = require('../config/db');

// ================= GET TEMPLATE PERINTAH =================
exports.getTemplatePerintah = (req, res) => {
  const sql = `
    SELECT id_perintah, isi_perintah
    FROM template_perintah
    ORDER BY id_perintah ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('SQL ERROR template_perintah:', err.sqlMessage);
      return res.status(500).json({ message: 'Gagal mengambil template' });
    }

    res.json(results);
  });
};
