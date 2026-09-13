const mysql = require('mysql2');

// Membuat koneksi database
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bnn_surat_2',
});

db.connect((err) => {
  if (err) {
    console.error('🔥 Gagal terkoneksi ke database:', err);
    return;
  }
  console.log('✅ Berhasil terhubung ke database MySQL');
});

module.exports = db;