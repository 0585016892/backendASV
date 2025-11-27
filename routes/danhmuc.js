const express = require("express");
const router = express.Router();
const db = require("../db"); // Đảm bảo bạn đã kết nối đúng với MySQL
const multer = require("multer");

// Middleware để xử lý JSON và x-www-form-urlencoded
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const upload = multer();
// WEBSITE
router.get("/danhmucweb", (req, res) => {
  const query = `
    SELECT 
      c1.id, 
      c1.name, 
      c1.slug, 
      c1.parent_id, 
      c1.description, 
      c1.status, 
      c1.created_at, 
      c1.updated_at,
      c2.id AS child_id,
      c2.slug AS child_slug,
      c2.name AS child_name,
      c2.description AS child_description,
      c2.status AS child_status,
      c2.parent_id AS child_parent_id
    FROM categories c1
    LEFT JOIN categories c2 ON c2.parent_id = c1.id AND c2.status = 'active'
    WHERE c1.status = 'active'
    ORDER BY c1.id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn cơ sở dữ liệu:", err);
      return res
        .status(500)
        .json({ error: "Lỗi khi lấy dữ liệu danh mục", details: err.message });
    }

    // Tạo mảng chứa danh mục cha
    const parentCategories = [];

    // Duyệt qua tất cả kết quả trả về
    results.forEach((category) => {
      // Chỉ xử lý các danh mục cha (parent_id = 0)
      if (category.parent_id === 0 || category.parent_id === null) {
        let parentCategory = parentCategories.find((p) => p.id === category.id);
        if (!parentCategory) {
          // Nếu chưa có danh mục cha trong mảng, thêm vào
          parentCategory = {
            id: category.id,
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
            description: category.description,
            status: category.status,
            created_at: category.created_at,
            updated_at: category.updated_at,
            dmCon: [], // Khởi tạo mảng danh mục con cho danh mục cha
          };
          parentCategories.push(parentCategory);
        }

        // Nếu là danh mục con, thêm vào mảng dmCon của danh mục cha
        if (category.child_id !== null) {
          parentCategory.dmCon.push({
            child_id: category.child_id,
            child_slug: category.child_slug,
            child_name: category.child_name,
            child_description: category.child_description,
            child_status: category.child_status,
            child_parent_id: category.child_parent_id,
          });
        }
      }
    });

    // Trả về kết quả cuối cùng
    res.json(parentCategories);
  });
});

//
router.get("/parents", (req, res) => {
  const sql =
    "SELECT * FROM categories  WHERE parent_id IS NULL OR parent_id = 0"; // Giả sử bảng của bạn là 'categories'
  db.query(sql, (err, categories) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi lấy danh mục" });
    }
    res.json({ categories });
  });
});
// Route để thêm danh mục mới
router.post("/add", upload.none(), (req, res) => {
  const { name, slug, parent_id, description, status } = req.body;

  // Kiểm tra thông tin nhập vào
  if (!name || !slug || !status) {
    return res.status(400).json({
      error: "Vui lòng nhập đầy đủ tên, slug và trạng thái danh mục.",
    });
  }

  // SQL query để thêm danh mục vào cơ sở dữ liệu
  const sql = `
    INSERT INTO categories (name, slug, parent_id, description, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  // Thực hiện query vào cơ sở dữ liệu
  db.query(
    sql,
    [name, slug, parent_id || null, description || "", status],
    (err, result) => {
      if (err) {
        console.error("Lỗi khi thêm danh mục:", err);
        return res.status(500).json({
          error: "Đã xảy ra lỗi khi thêm danh mục vào cơ sở dữ liệu.",
        });
      }

      // Phản hồi thành công
      res.status(201).json({
        message: "Danh mục đã được thêm thành công!",
        category_id: result.insertId,
      });
    }
  );
});

// Api get danh mục
router.get("/", (req, res) => {
  console.log("Nhận yêu cầu GET /api/categories");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1 = 1"; // Phần này cho phép bạn thêm điều kiện lọc vào SQL

  // Kiểm tra nếu có tham số status
  if (req.query.status) {
    whereClause += ` AND status = ${db.escape(req.query.status)}`;
  }
  if (req.query.keyword) {
    whereClause += ` AND name LIKE ${db.escape("%" + req.query.keyword + "%")}`;
  }

  const sqlCount = `SELECT COUNT(*) AS total FROM categories ${whereClause}`; // Đếm tổng số danh mục
  const sqlCategories = `SELECT * FROM categories ${whereClause} LIMIT ${limit} OFFSET ${offset}`; // Lấy danh sách danh mục

  db.query(sqlCount, (err, countResults) => {
    if (err) {
      console.error("Lỗi khi lấy số lượng danh mục:", err);
      return res.status(500).json({ error: "Lỗi khi lấy tổng số danh mục." });
    }

    const totalCategories = countResults[0].total;
    const totalPages = Math.ceil(totalCategories / limit);

    db.query(sqlCategories, (err, categories) => {
      if (err) {
        console.error("Lỗi khi lấy danh mục:", err);
        return res
          .status(500)
          .json({ error: "Lỗi khi lấy dữ liệu danh mục từ cơ sở dữ liệu." });
      }

      res.status(200).json({
        categories: categories,
        totalCategories: totalCategories,
        totalPages: totalPages,
        currentPage: page,
      });
    });
  });
});
// Route để lấy danh mục theo ID
router.get("/:id", (req, res) => {
  console.log(`Nhận yêu cầu GET /api/categories/${req.params.id}`);

  const { id } = req.params;
  const sql = "SELECT * FROM categories WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh mục theo ID:", err);
      return res
        .status(500)
        .json({ error: "Lỗi khi lấy dữ liệu danh mục từ cơ sở dữ liệu." });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy danh mục với ID này." });
    }

    res.status(200).json(results[0]);
  });
});

// Route để cập nhật danh mục
router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { name, slug, description, status } = req.body;

  // Kiểm tra nếu các trường bắt buộc không có dữ liệu
  if (!name || !slug || !status) {
    return res
      .status(400)
      .json({ error: "Tên, slug, và trạng thái là bắt buộc." });
  }

  const sql = `
    UPDATE categories 
    SET 
      name = ?, 
      slug = ?, 
      description = ?, 
      status = ?
    WHERE id = ?
  `;

  db.query(sql, [name, slug, description || "", status, id], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật danh mục:", err);
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật danh mục vào cơ sở dữ liệu." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy danh mục với ID này." });
    }

    // Trả về phản hồi thành công với thông báo chi tiết
    res.status(200).json({
      message: "Cập nhật danh mục thành công!",
      updated_category_id: id,
    });
  });
});

// API để xóa danh mục
router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM categories WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa danh mục:", err);
      return res.status(500).json({ error: "Lỗi khi xóa danh mục." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục để xóa." });
    }

    res.status(200).json({ message: `Xóa danh mục thành công!` });
  });
});

module.exports = router;
