const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { writeLog } = require("../utils/logService");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Đăng nhập
// Đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Lấy user
  const sql = `SELECT * FROM employees WHERE email = ? AND status = 'active'`;
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    // Lấy cấu hình maintenance_mode
    const settingsSQL = `SELECT setting_value FROM settings WHERE setting_key = 'maintenance_mode' LIMIT 1`;
    db.query(settingsSQL, (err, settingRows) => {
      if (err) return res.status(500).json({ message: "Lỗi khi kiểm tra chế độ bảo trì" });

      const maintenance_mode = settingRows[0]?.setting_value === "true";

      // Nếu đang bảo trì và không phải admin, từ chối đăng nhập
      if (maintenance_mode && user.role !== 'admin') {
        return res.status(403).json({ message: "Hệ thống đang bảo trì, vui lòng thử lại sau" });
      }

      // Lấy danh sách quyền từ role
      const permSQL = `
        SELECT p.name FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `;
      db.query(permSQL, [user.role_id], (err, permRows) => {
        if (err) return res.status(500).json({ message: "Lỗi khi lấy quyền" });

        const permissions = permRows.map((p) => p.name);
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role_id,
            permissions,
          },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        // =============================
        // 🚀 GHI LOG — DÙNG writeLog()
        // =============================

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        writeLog(
          user.id,                 // user_id
          "login",                 // action
          "auth",                  // module
          `Người dùng ${user.full_name} đăng nhập thành công`, // description
          null,                    // old_data
          JSON.stringify({ status: "logged_in" }),             // new_data
          ip,
          userAgent
        );

        // =============================
        res.json({
          token,
          user: {
             id: user.id,
            full_name: user.full_name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            position: user.position,
            department: user.department,
            address: user.address,
            status: user.status,
            created_at: user.created_at,
            role_id: user.role_id,
            role: user.role,
            permissions,
          },
        });
      });
    });
  });
});

// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const sql = `SELECT * FROM employees WHERE email = ? AND status = 'active'`;
//   db.query(sql, [email], async (err, results) => {
//     if (err || results.length === 0)
//       return res.status(401).json({ message: "Tài khoản không tồn tại" });

//     const user = results[0];
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(401).json({ message: "Sai mật khẩu" });

//     // Lấy danh sách quyền từ role
//     const permSQL = `
//       SELECT p.name FROM permissions p
//       JOIN role_permissions rp ON p.id = rp.permission_id
//       WHERE rp.role_id = ?
//     `;
//     db.query(permSQL, [user.role_id], (err, permRows) => {
//       if (err) return res.status(500).json({ message: "Lỗi khi lấy quyền" });

//       const permissions = permRows.map((p) => p.name);
//       const token = jwt.sign(
//         {
//           id: user.id,
//           email: user.email,
//           role: user.role_id,
//           permissions,
//         },
//         JWT_SECRET,
//         { expiresIn: "1d" }
//       );

//       res.json({
//         token,
//         user: {
//           id: user.id,
//           full_name: user.full_name,
//           email: user.email,
//           avatar: user.avatar,
//           phone: user.phone,
//           position: user.position,
//           department: user.department,
//           address: user.address,
//           status: user.status,
//           created_at: user.created_at,
//           role_id: user.role_id,
//           role: user.role,
//           permissions: permissions,
//         },
//       });
//     });
//   });
// });
// Đăng nhập người dùng
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM customers WHERE email = ? AND status = 'active'`;
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi hệ thống" });

    if (results.length === 0) {
      return res
        .status(401)
        .json({ message: "Email không tồn tại hoặc đã bị khóa" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  });
});

module.exports = router;
