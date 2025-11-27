const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Thiếu token" });

  const token = auth.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token không hợp lệ" });

    req.user = decoded;
    next();
  });
};

exports.hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    next();
  };
};
