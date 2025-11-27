const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../db"); // Đảm bảo bạn đã kết nối đúng với MySQL
// Lấy danh sách khách hàng
// Cấu hình multer lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/customers/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
router.get("/", (req, res) => {
  console.log("Nhận yêu cầu GET /api/kh");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1 = 1"; // Phần này cho phép bạn thêm điều kiện lọc vào SQL

  // Kiểm tra nếu có tham số status
  if (req.query.status) {
    whereClause += ` AND status = ${db.escape(req.query.status)}`;
  }
  // Kiểm tra nếu có tham số keyword
  if (req.query.keyword) {
    whereClause += ` AND full_name LIKE ${db.escape(
      "%" + req.query.keyword + "%"
    )}`;
  }

  const sqlCount = `SELECT COUNT(*) AS total FROM customers ${whereClause}`; // Đếm tổng số khách hàng
  const sqlCustomers = `SELECT * FROM customers ${whereClause} LIMIT ${limit} OFFSET ${offset}`; // Lấy danh sách khách hàng

  // Truy vấn số lượng khách hàng
  db.query(sqlCount, (err, countResults) => {
    if (err) {
      console.error("Lỗi khi lấy số lượng khách hàng:", err);
      return res.status(500).json({ error: "Lỗi khi lấy tổng số khách hàng." });
    }

    const totalCustomers = countResults[0].total;
    const totalPages = Math.ceil(totalCustomers / limit);

    // Truy vấn danh sách khách hàng
    db.query(sqlCustomers, (err, customers) => {
      if (err) {
        console.error("Lỗi khi lấy khách hàng:", err);
        return res
          .status(500)
          .json({ error: "Lỗi khi lấy dữ liệu khách hàng từ cơ sở dữ liệu." });
      }

      // Trả kết quả về frontend
      res.status(200).json({
        customers: customers,
        totalCustomers: totalCustomers,
        totalPages: totalPages,
        currentPage: page,
      });
    });
  });
});
// API thêm ảnh khách hàng
router.post("/add-image", upload.single("image"), (req, res) => {
  const { customer_id } = req.body;
  const file = req.file;

  if (!customer_id || !file) {
    return res.status(400).json({ error: "Thiếu customer_id hoặc file" });
  }

  const imageName = file.filename;

  // Update ảnh cho khách hàng đã tồn tại
  const query = `
    UPDATE customers
    SET images = ?  -- hoặc avatar nếu bạn chỉ lưu 1 ảnh
    WHERE id = ?
  `;

  db.query(query, [imageName, customer_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Lỗi cập nhật ảnh" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    }

    res.json({
      message: "Cập nhật ảnh thành công",
      data: {
        customer_id,
        image: imageName,
      },
    });
  });
});

// Thêm khách hàng
router.post("/add", (req, res) => {
  const { full_name, email, phone, address } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ error: "Tên và Email là bắt buộc" });
  }

  const sql = `INSERT INTO customers (full_name, email, phone, address) VALUES (?, ?, ?, ?)`;
  db.query(sql, [full_name, email, phone, address], (err, result) => {
    if (err) {
      console.error("Lỗi:", err);
      return res.status(500).json({ error: "Thêm khách hàng thất bại" });
    }
    res
      .status(201)
      .json({ message: "Thêm thành công", customer_id: result.insertId });
  });
});
// Sửa khách hàng
router.put("/update/:id", (req, res) => {
  const { full_name, email, phone, address } = req.body;
  const sql = `
      UPDATE customers
      SET full_name = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
    `;
  db.query(
    sql,
    [full_name, email, phone, address, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Cập nhật thất bại" });
      res.json({ message: "Cập nhật thành công" });
    }
  );
});
// Xóa khách hàng
router.delete("/delete/:id", (req, res) => {
  db.query(
    "DELETE FROM customers WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Xoá thất bại" });
      res.json({ message: "Đã xoá khách hàng" });
    }
  );
});
// Cập nhật trạng thái khách hàng
router.patch("/update_status/:id", (req, res) => {
  console.log("Dữ liệu request body:", req.body); // Log dữ liệu nhận được từ Postman
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["active", "inactive"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }

  const sql = `UPDATE customers SET status = ? WHERE id = ?`;
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      return res.status(500).json({ error: "Lỗi khi cập nhật trạng thái" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy khách hàng với ID này" });
    }

    res.json({
      message: `Cập nhật trạng thái khách hàng với ID ${id} thành ${status}`,
    });
  });
});
router.get("/details/:id", (req, res) => {
  const customerId = req.params.id;

  const sqlCustomer = `SELECT * FROM customers WHERE id = ?`;
  const sqlOrders = `
    SELECT 
      orders.id AS order_id, orders.created_at,
      sanpham.name, sanpham.image, order_items.quantity,order_items.size,order_items.color, order_items.price
    FROM orders
    JOIN order_items ON orders.id = order_items.order_id
    JOIN sanpham ON order_items.product_id = sanpham.id
    WHERE orders.customer_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sqlCustomer, [customerId], (err, customerResult) => {
    if (err || customerResult.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy khách hàng." });
    }

    const customer = customerResult[0];

    db.query(sqlOrders, [customerId], (err, orders) => {
      if (err) {
        return res.status(500).json({ error: "Lỗi khi lấy dữ liệu đơn hàng." });
      }

      res.json({
        customer,
        orders,
      });
    });
  });
});

module.exports = router;
