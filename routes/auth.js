// Auth.js sengaja controller dan routes nya di satuin sebagai pembanding


const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ================= KONEKSI DATABASE =================
// Hapus blok mysql.createConnection yang lama, lalu ganti dengan ini di atas file Auth.js:
const db = require('../config/db');

db.connect(err => {
  if (err) throw err;
  console.log('Database connected');
});


// ================= LOGIN =================
router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email dan password wajib diisi"
    });
  }

  const query = "SELECT * FROM users WHERE email = ? LIMIT 1";

  db.query(query, [email], async (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Server error"
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: "Email tidak ditemukan"
      });
    }

    const user = result[0];

    let isMatch = false;

    try {

      // jika password sudah bcrypt
      if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {

        isMatch = await bcrypt.compare(password, user.password);

      } else {

        // password lama plaintext
        isMatch = password === user.password;

      }

    } catch (error) {

      return res.status(500).json({
        message: "Error saat verifikasi password"
      });

    }

    if (!isMatch) {
      return res.status(401).json({
        message: "Password salah"
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        role: user.role,
        divisi: user.id_divisi
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({

      message: "Login berhasil",

      token,

      user: {
        id_user: user.id_user.toString(),
        nama: user.nama,
        email: user.email,
        role: user.role,
        divisi: user.id_divisi ? user.id_divisi.toString() : ""
      }

    });

  });

});

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {

    const { nama, email, password, role, id_divisi } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        message: "Nama, email, dan password wajib diisi"
      });
    }

    const [existing] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Email sudah terdaftar"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.promise().query(
      `INSERT INTO users (nama, email, password, role, id_divisi)
       VALUES (?, ?, ?, ?, ?)`,
      [nama, email, hashedPassword, role || 'divisi', id_divisi || null]
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      user_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});


// ================= GET DATA DIVISI =================
router.get('/divisi', (req, res) => {

  const query = "SELECT id_divisi, nama_divisi FROM divisi";

  db.query(query, (err, results) => {

    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil data divisi"
      });
    }

    res.json(results);

  });

});

module.exports = router;