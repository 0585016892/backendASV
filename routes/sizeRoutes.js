const express = require("express");
const router = express.Router();
const db = require("../db");

// 📌 GET /api/sizes?page=&limit= => Lấy danh sách size có phân trang
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const countQuery = "SELECT COUNT(*) AS total FROM sizes";
  const dataQuery = "SELECT * FROM sizes LIMIT ? OFFSET ?";

  db.query(countQuery, (err, countResult) => {
    if (err) return res.status(500).json({ error: "Lỗi đếm dữ liệu" });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    db.query(dataQuery, [limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi truy vấn dữ liệu" });

      res.json({
        data: results,
        currentPage: page,
        totalPages,
        total,
      });
    });
  });
});

// 📌 GET /api/sizes/all => Lấy toàn bộ size
router.get("/all", (req, res) => {
  db.query("SELECT * FROM sizes", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn dữ liệu" });
    res.json(results);
  });
});

// 📌 POST /api/sizes => Thêm size mới
router.post("/", (req, res) => {
  const { name, active } = req.body;
  if (!name || !active)
    return res.status(400).json({ error: "Thiếu tên size hoặc trạng thái" });

  db.query(
    "INSERT INTO sizes (name, active) VALUES (?, ?)",
    [name, active],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi khi thêm size" });

      res.json({ message: "Thêm size thành công", id: result.insertId });
    }
  );
});

// 📌 PUT /api/sizes/:id => Cập nhật size
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, active } = req.body;
  if (!name || !active)
    return res.status(400).json({ error: "Thiếu tên size hoặc trạng thái" });

  db.query(
    "UPDATE sizes SET name = ?, active = ? WHERE id = ?",
    [name, active, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi khi cập nhật size" });

      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Không tìm thấy size" });

      res.json({ message: "Cập nhật size thành công" });
    }
  );
});

// 📌 DELETE /api/sizes/:id => Xoá size
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM sizes WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Lỗi khi xoá size" });

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Không tìm thấy size" });

    res.json({ message: "Xoá size thành công" });
  });
});

module.exports = router;
