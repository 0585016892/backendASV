const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, hasPermission } = require("../middleware/auth.middleware");

// Lấy tất cả roles
router.get("/roles", verifyToken, hasPermission("view_roles"), (req, res) => {
  db.query(`SELECT * FROM roles`, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi DB" });
    res.json(rows);
  });
});

// Lấy tất cả permissions
router.get(
  "/permissions",
  verifyToken,
  hasPermission("view_roles"),
  (req, res) => {
    db.query(`SELECT * FROM permissions`, (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi DB" });
      res.json(rows);
    });
  }
);

// Tạo role mới với permission
router.post("/roles", verifyToken, hasPermission("edit_users"), (req, res) => {
  const { name, permissions } = req.body;
  db.query(`INSERT INTO roles (name) VALUES (?)`, [name], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi tạo vai trò" });
    const roleId = result.insertId;
    const values = permissions.map((p) => [roleId, p]);
    db.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
      [values],
      (err2) => {
        if (err2) return res.status(500).json({ message: "Lỗi gán quyền" });
        res.json({ message: "Tạo vai trò thành công" });
      }
    );
  });
});

// Cập nhật role
router.put(
  "/roles/:id",
  verifyToken,
  hasPermission("edit_users"),
  (req, res) => {
    const { name, permissions } = req.body;
    const roleId = req.params.id;
    db.query(`UPDATE roles SET name=? WHERE id=?`, [name, roleId], (err) => {
      if (err)
        return res.status(500).json({ message: "Lỗi cập nhật tên vai trò" });
      db.query(`DELETE FROM role_permissions WHERE role_id=?`, [roleId], () => {
        const values = permissions.map((p) => [roleId, p]);
        db.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
          [values],
          () => {
            res.json({ message: "Cập nhật thành công" });
          }
        );
      });
    });
  }
);

module.exports = router;
