const express = require("express");
const router = express.Router();
const db = require("../db"); // Đảm bảo bạn đã kết nối đúng với MySQL
const multer = require("multer"); // Đảm bảo bạn đã cấu hình kết nối database
const path = require("path");

// Cấu hình multer để lưu ảnh vào thư mục 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Đặt thư mục lưu trữ ảnh
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file duy nhất bằng cách sử dụng timestamp
  },
});

const upload = multer({ storage: storage });
//WebSite
// routes/slideRoutes.js
router.get("/show", async (req, res) => {
  const { display_area } = req.query;

  try {
    let query = "SELECT * FROM slides WHERE 1";
    const params = [];

    if (display_area) {
      query += " AND display_area = ?";
      params.push(display_area);
    }

    query += " ORDER BY id DESC";

    const [slides] = await db.promise().query(query, params);
    res.json({ slides });
  } catch (err) {
    console.error("Lỗi lấy slide:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 1. Lấy tất cả slide hoặc lọc theo display_area
router.get("/", async (req, res) => {
  const { display_area, keyword, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let baseQuery = "FROM slides WHERE 1"; // đảm bảo có WHERE luôn
    const params = [];

    if (display_area) {
      baseQuery += " AND display_area = ?";
      params.push(display_area);
    }

    if (keyword) {
      baseQuery += " AND title LIKE ?";
      params.push(keyword);
    }

    // Đếm tổng số bản ghi
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [[{ total }]] = await db.promise().query(countQuery, params);

    // Lấy dữ liệu trang hiện tại
    const dataQuery = ` SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const [slides] = await db
      .promise()
      .query(dataQuery, [...params, parseInt(limit), offset]);

    res.json({
      slides,
      totalSlides: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 2. Thêm slide mới
router.post("/add", upload.single("image"), (req, res) => {
  const { title, link, status, position, display_area, start_date, end_date } =
    req.body;
  const image = req.file ? req.file.filename : null;

  if (!image) {
    return res.status(400).json({ message: "Image is required" });
  }

  const query = ` INSERT INTO slides (title, image, link, status, position, display_area, start_date, end_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  // Thực hiện truy vấn với callback
  db.query(
    query,
    [title, image, link, status, position, display_area, start_date, end_date],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }

      // Trả về phản hồi thành công
      res.status(201).json({ message: "Slide added successfully" });
    }
  );
});

// 3. Sửa thông tin slide theo ID (có xử lý ảnh)
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, link, status, position, display_area, start_date, end_date } =
    req.body;
  const image = req.file ? req.file.filename : null; // Lấy tên ảnh từ Multer (nếu có)

  let query = `UPDATE slides SET title = ?, link = ?, status = ?, position = ?, display_area = ?, start_date = ?, end_date = ?`;
  const values = [
    title,
    link,
    status,
    position,
    display_area,
    start_date,
    end_date,
  ];

  if (image) {
    // Nếu có ảnh mới, cần lấy tên ảnh cũ từ cơ sở dữ liệu trước khi cập nhật
    try {
      const [slide] = await db
        .promise()
        .query("SELECT image FROM slides WHERE id = ?", [id]);
      if (slide.length === 0) {
        return res.status(404).json({ message: "Slide not found" });
      }

      // Xóa ảnh cũ nếu có ảnh mới
      const oldImage = slide[0].image;
      if (oldImage) {
        const fs = require("fs");
        const path = require("path");
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          "uploads",
          oldImage
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Xóa ảnh cũ
        }
      }

      query += ", image = ?";
      values.push(image);
    } catch (err) {
      console.error("Error fetching slide:", err);
      return res.status(500).send("Server Error");
    }
  }

  query += " WHERE id = ?";
  values.push(id);

  try {
    const [result] = await db.promise().query(query, values);
    if (result.affectedRows > 0) {
      res.json({ message: "Slide updated successfully" });
    } else {
      res.status(404).json({ message: "Slide not found" });
    }
  } catch (err) {
    console.error("Error updating slide:", err);
    res.status(500).send("Server Error");
  }
});

// 4. Xóa slide theo ID
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM slides WHERE id = ? `;

  try {
    const [result] = await db.promise().query(query, [id]);
    if (result.affectedRows > 0) {
      res.json({ message: "Slide deleted successfully" });
    } else {
      res.status(404).json({ message: "Slide not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// 5. Lấy slide theo ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM slides WHERE id = ?";

  try {
    const [result] = await db.promise().query(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Slide not found" });
    }

    res.json(result[0]); // Trả về slide đầu tiên nếu tìm thấy
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// 6. Cập nhật trạng thái slide theo ID
router.patch("/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Giả sử trạng thái là 'active' hoặc 'inactive'

  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({
      message:
        "Invalid status value. It should be either 'active' or 'inactive'.",
    });
  }

  const query = "UPDATE slides SET status = ? WHERE id = ?";
  try {
    const [result] = await db.promise().query(query, [status, id]);

    if (result.affectedRows > 0) {
       const io = req.app.get("io");
      io.emit("slideStatusUpdated", { id, status });
      return res.json({ success: true });
    } else {
      res.status(404).json({ message: "Slide not found" });
    }
  } catch (err) {
    console.error("Error updating slide status:", err);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
