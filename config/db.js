const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 30000 // Menambah waktu timeout jadi 30 detik
});

db.connect((err) => {
  if (err) {
    console.error('🔥 Gagal terkoneksi ke database:', err);
    return;
  }
  console.log('✅ Berhasil terhubung ke database MySQL');
});

module.exports = db;