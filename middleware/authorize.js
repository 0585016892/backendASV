module.exports = (requiredPermissions) => {
  return (req, res, next) => {
    if (
      !req.user ||
      !req.user.permissions ||
      !Array.isArray(req.user.permissions)
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
};
