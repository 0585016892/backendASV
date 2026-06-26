const express = require("express");
const router = express.Router();
const db = require("../db"); // Kết nối MySQL
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // <-- BẮT BUỘC: Thêm dòng này lên đầu file router nếu chưa có
// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/bst"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Thêm collection
router.post("/", upload.single("image"), (req, res) => {
  console.log("--- DEBUG UPLOAD ---");
  console.log("File nhận được từ Multer:", req.file);
  let { name, slug, description, status } = req.body;
  const image = req.file ? req.file.filename : null;

  // Lọc sạch nếu dữ liệu bị biến thành chuỗi chữ 'undefined' hoặc 'null'
  if (name === "undefined" || !name) name = null;
  if (slug === "undefined" || !slug) slug = null;
  if (description === "undefined") description = "";

  // Ép trạng thái về chuẩn 'active' hoặc 'inactive' theo cột ENUM của database
  if (status !== "active" && status !== "inactive") {
    status = "active";
  }

  // Chặn không cho lưu nếu thiếu tên bộ sưu tập
  if (!name) {
    return res
      .status(400)
      .json({ success: false, error: "Tên bộ sưu tập không hợp lệ." });
  }

  db.query(
    "INSERT INTO collections (name, slug, description, image, status) VALUES (?, ?, ?, ?, ?)",
    [name, slug, description, image, status],
    (err, result) => {
      if (err) {
        console.error("Lỗi Database chi tiết: ", err);
        return res.status(500).json({ success: false, error: err.sqlMessage });
      }
      return res.json({ success: true, message: "Thêm thành công!" });
    },
  );
});
// Lấy danh sách collection có lọc + phân trang
router.get("/", (req, res) => {
  const { search = "", status = "", page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let sql = "SELECT * FROM collections WHERE 1=1";
  let params = [];

  if (search) {
    sql += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    db.query(
      "SELECT COUNT(*) as total FROM collections WHERE 1=1" +
        (search ? " AND name LIKE ?" : "") +
        (status ? " AND status = ?" : ""),
      params.slice(0, params.length - 2), // Count dùng cùng params
      (err2, countRes) => {
        if (err2) return res.status(500).json({ error: err2 });

        res.json({
          data: results,
          total: countRes[0].total,
          page: Number(page),
          totalPages: Math.ceil(countRes[0].total / limit),
        });
      },
    );
  });
});

// Lấy 1 collection
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM collections WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results[0]);
    },
  );
});

// Cập nhật collection
router.put("/:id", upload.single("image"), (req, res) => {
  const { name, description, status } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const image = req.file ? req.file.filename : null;

  let sql =
    "UPDATE collections SET name = ?, slug = ?, description = ?, status = ?";
  let params = [name, slug, description, status];

  if (image) {
    sql += ", image = ?";
    params.push(image);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Cập nhật thành công!" });
  });
});

// Xóa collection
// Xóa bộ sưu tập + Xóa file ảnh vật lý
router.delete("/delete/:id", (req, res) => {
  const collectionId = req.params.id;

  // Bước 1: Tìm tên file ảnh trong DB trước khi xóa dòng dữ liệu
  db.query(
    "SELECT image FROM collections WHERE id = ?",
    [collectionId],
    (err, rows) => {
      if (err) {
        console.error("Lỗi tìm kiếm bộ sưu tập:", err);
        return res.status(500).json({ success: false, error: err });
      }

      // Nếu không tìm thấy bản ghi nào khớp với ID
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bộ sưu tập!" });
      }

      const imageName = rows[0].image;

      // Bước 2: Thực hiện xóa dòng dữ liệu trong Database
      db.query(
        "DELETE FROM collections WHERE id = ?",
        [collectionId],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Lỗi xóa Database:", deleteErr);
            return res.status(500).json({ success: false, error: deleteErr });
          }

          // Bước 3: Nếu xóa DB thành công và bản ghi đó có chứa ảnh, tiến hành xóa file ngoài đời thực
          if (imageName) {
            // Đường dẫn tuyệt đối tới file ảnh cần xóa (khớp với cấu hình public/uploads lúc lưu file)
            const filePath = path.join(
              __dirname,
              "../public/uploads",
              imageName,
            );
            // LƯU Ý: Nếu file router của bạn nằm cùng cấp với thư mục 'public', hãy sửa lại thành: "public/uploads"

            // Kiểm tra xem file có thực sự tồn tại trong thư mục không rồi mới xóa
            fs.access(filePath, fs.constants.F_OK, (accessErr) => {
              if (!accessErr) {
                // Tiến hành xóa file
                fs.unlink(filePath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error("Lỗi khi xóa file ảnh vật lý:", unlinkErr);
                  } else {
                    console.log(`Đã xóa sạch file ảnh: ${imageName}`);
                  }
                });
              } else {
                console.log(
                  "Ảnh không tồn tại trong thư mục, bỏ qua bước xóa file.",
                );
              }
            });
          }

          // Trả về phản hồi thành công cho ReactJS hiển thị Toast
          return res.json({
            success: true,
            message: "Xóa bộ sưu tập và ảnh thành công!",
          });
        },
      );
    },
  );
});

// Cập nhật status riêng
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const { id } = req.params; // 👉 cần lấy id ra

  db.query(
    "UPDATE collections SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      const io = req.app.get("io");
      socket.on("collectionStatusUpdated", ({ id, status }) => {
        console.log("Trạng thái cập nhật:", id, status);
      }); // 👉 nên đồng bộ tên event

      res.json({
        success: true,
        message: "Cập nhật trạng thái thành công!",
      });
    },
  );
});

module.exports = router;
