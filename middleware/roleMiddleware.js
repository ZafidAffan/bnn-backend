module.exports = function (...allowedRoles) {
  return (req, res, next) => {
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: akses ditolak' });
    }
    next();
  };
};
