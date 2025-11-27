const express = require("express");
const router = express.Router();
const db = require("../db");

// Lấy danh sách màu có phân trang
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const countQuery = "SELECT COUNT(*) AS total FROM colors";
  const dataQuery = "SELECT * FROM colors ORDER BY id DESC LIMIT ? OFFSET ?";

  db.query(countQuery, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn tổng" });

    db.query(dataQuery, [limit, offset], (err, dataResult) => {
      if (err) return res.status(500).json({ message: "Lỗi truy vấn dữ liệu" });

      res.json({
        total: countResult[0].total,
        data: dataResult,
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
      });
    });
  });
});

// Lấy tất cả màu (không phân trang)
router.get("/all", (req, res) => {
  const query = "SELECT * FROM colors ORDER BY id DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi khi lấy dữ liệu" });
    res.json(results);
  });
});

// Thêm màu mới
router.post("/", (req, res) => {
  const { name, code, status } = req.body;
  if (!name) return res.status(400).json({ message: "Tên màu là bắt buộc" });

  const query = "INSERT INTO colors (name, code, status) VALUES (?, ?, ?)";
  db.query(query, [name, code, status], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi khi thêm màu" });
    res.json({ message: "Thêm màu thành công", id: result.insertId });
  });
});

// Cập nhật màu
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, code, status } = req.body;

  const query = "UPDATE colors SET name = ?, code = ?, status = ? WHERE id = ?";
  db.query(query, [name, code, status, id], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi khi cập nhật màu" });
    res.json({ message: "Cập nhật màu thành công" });
  });
});

// Xóa màu
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM colors WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ message: "Lỗi khi xóa màu" });
    res.json({ message: "Xóa màu thành công" });
  });
});

module.exports = router;
