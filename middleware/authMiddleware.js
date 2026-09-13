const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1️⃣ Ambil token dari HEADER (default)
  let token = req.headers['authorization']?.split(' ')[1];

  // 2️⃣ Jika tidak ada, ambil dari QUERY (?token=...)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // 3️⃣ Jika tetap tidak ada
  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized: token tidak ditemukan',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, divisi }
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Unauthorized: token tidak valid',
    });
  }
};
