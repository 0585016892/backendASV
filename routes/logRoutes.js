const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2 bản thường (createConnection)

router.get("/logs", (req, res) => {
  const { user_id, action, module, date_from, date_to, page = 1, limit = 20 } = req.query;

  let sql = `
    SELECT l.*, e.full_name, e.email, e.role
    FROM system_logs l
    LEFT JOIN employees e ON l.user_id = e.id
    WHERE 1=1
  `;
  let params = [];

  if (user_id) {
    sql += " AND l.user_id = ?";
    params.push(user_id);
  }
  if (action) {
    sql += " AND l.action = ?";
    params.push(action);
  }
  if (module) {
    sql += " AND l.module = ?";
    params.push(module);
  }
  if (date_from) {
    sql += " AND DATE(l.created_at) >= ?";
    params.push(date_from);
  }
  if (date_to) {
    sql += " AND DATE(l.created_at) <= ?";
    params.push(date_to);
  }

  // Phân trang
  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("Error fetching logs:", err);
      return res.status(500).json({ success: false, message: "Lỗi khi lấy log" });
    }

    // Lấy tổng số bản ghi để frontend hiển thị phân trang
    let countSql = "SELECT COUNT(*) as total FROM system_logs l WHERE 1=1";
    let countParams = [];

    if (user_id) countParams.push(user_id);
    if (action) countParams.push(action);
    if (module) countParams.push(module);
    if (date_from) countParams.push(date_from);
    if (date_to) countParams.push(date_to);

    // Phải tạo count query tương tự (không cần join)
    countSql += user_id ? " AND user_id = ?" : "";
    countSql += action ? " AND action = ?" : "";
    countSql += module ? " AND module = ?" : "";
    countSql += date_from ? " AND DATE(created_at) >= ?" : "";
    countSql += date_to ? " AND DATE(created_at) <= ?" : "";

    db.query(countSql, countParams, (err2, countRows) => {
      if (err2) {
        console.error("Error counting logs:", err2);
        return res.status(500).json({ success: false, message: "Lỗi khi đếm log" });
      }

      res.json({
        success: true,
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows,
      });
    });
  });
});


module.exports = router;
