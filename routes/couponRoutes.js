const express = require("express");
const router = express.Router();
const db = require("../db"); // Đảm bảo bạn đã kết nối đúng với MySQL
const multer = require("multer");

// Middleware để xử lý JSON và x-www-form-urlencoded
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const upload = multer();
// Lấy danh sách coupon
router.get("/", (req, res) => {
  console.log("Nhận yêu cầu GET /api/coupons");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1 = 1"; // Phần này cho phép bạn thêm điều kiện lọc vào SQL

  // Kiểm tra nếu có tham số status
  if (req.query.status) {
    whereClause += ` AND status = ${db.escape(req.query.status)}`;
  }

  // Kiểm tra nếu có tham số code
  if (req.query.code) {
    whereClause += ` AND code LIKE ${db.escape("%" + req.query.code + "%")}`;
  }

  // Kiểm tra nếu có tham số discount_type
  if (req.query.discount_type) {
    whereClause += ` AND discount_type = ${db.escape(req.query.discount_type)}`;
  }

  // Kiểm tra nếu có tham số min_order_total
  if (req.query.min_order_total) {
    whereClause += ` AND min_order_total >= ${db.escape(
      req.query.min_order_total
    )}`;
  }

  const sqlCount = `SELECT COUNT(*) AS total FROM coupons ${whereClause}`; // Đếm tổng số coupon
  const sqlCoupons = `SELECT * FROM coupons ${whereClause} LIMIT ${limit} OFFSET ${offset}`; // Lấy danh sách coupon

  // Truy vấn số lượng coupon
  db.query(sqlCount, (err, countResults) => {
    if (err) {
      console.error("Lỗi khi lấy số lượng coupon:", err);
      return res.status(500).json({ error: "Lỗi khi lấy tổng số coupon." });
    }

    const totalCoupons = countResults[0].total;
    const totalPages = Math.ceil(totalCoupons / limit);

    // Truy vấn danh sách coupon
    db.query(sqlCoupons, (err, coupons) => {
      if (err) {
        console.error("Lỗi khi lấy coupon:", err);
        return res
          .status(500)
          .json({ error: "Lỗi khi lấy dữ liệu coupon từ cơ sở dữ liệu." });
      }

      // Trả kết quả về frontend
      res.status(200).json({
        coupons: coupons,
        totalCoupons: totalCoupons,
        totalPages: totalPages,
        currentPage: page,
      });
    });
  });
});

// Thêm coupon
// Thêm coupon
router.post("/add", upload.none(), (req, res) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_total,
    start_date,
    end_date,
    quantity,
    status,
  } = req.body;

  // Kiểm tra thông tin nhập vào
  if (!code || !discount_value || !start_date || !end_date) {
    return res.status(400).json({
      error:
        "Mã giảm giá, giá trị giảm giá, ngày bắt đầu và ngày kết thúc là bắt buộc.",
    });
  }

  // SQL query để thêm coupon vào cơ sở dữ liệu
  const sql = `
    INSERT INTO coupons (code, description, discount_type, discount_value, min_order_total, start_date, end_date, quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Thực hiện query vào cơ sở dữ liệu
  db.query(
    sql,
    [
      code,
      description || "",
      discount_type, // Mặc định là "percentage" nếu không có
      discount_value,
      min_order_total, // Mặc định là 0 nếu không có
      start_date,
      end_date,
      quantity, // Mặc định là 0 nếu không có
      status || "active", // Mặc định là "active" nếu không có
    ],
    (err, result) => {
      if (err) {
        // In chi tiết lỗi ra console
        console.error("Lỗi khi thêm coupon:", err);

        // Trả về thông tin chi tiết lỗi trong phản hồi
        return res.status(500).json({
          error: "Đã xảy ra lỗi khi thêm coupon vào cơ sở dữ liệu.",
          details: err.message, // Thêm thông tin lỗi chi tiết vào response
        });
      }

      // Phản hồi thành công
      res.status(201).json({
        message: "Coupon đã được thêm thành công!",
        coupon_id: result.insertId,
      });
    }
  );
});

// API cập nhật mã giảm giá
router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_total,
    start_date,
    end_date,
    quantity,
    status,
  } = req.body;

  // Kiểm tra dữ liệu nhận được
  console.log("ok");

  // Truy vấn cập nhật mã giảm giá
  db.query(
    "UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?, min_order_total = ?, start_date = ?, end_date = ?, quantity = ?, status = ? WHERE id = ?",
    [
      code,
      description,
      discount_type,
      discount_value,
      min_order_total,
      start_date,
      end_date,
      quantity,
      status,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("Lỗi cập nhật:", err);
        return res
          .status(500)
          .json({ message: "Lỗi khi cập nhật mã giảm giá." });
      }

      // Truy vấn lấy thông tin mã giảm giá đã cập nhật
      db.query(
        "SELECT * FROM coupons WHERE id = ?",
        [id],
        (err, updatedCoupon) => {
          if (err) {
            console.error("Lỗi khi lấy dữ liệu mã giảm giá:", err);
            return res
              .status(500)
              .json({ message: "Lỗi khi lấy dữ liệu mã giảm giá." });
          }

          // Trả về thông báo thành công
          res.json({
            message: "Cập nhật thành công!",
            updatedCoupon: updatedCoupon[0],
          });
        }
      );
    }
  );
});
// Xóa coupon
router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM coupons WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Xóa coupon thất bại" });
    res.json({ message: "Đã xóa mã giảm giá ! " });
  });
});

// Cập nhật trạng thái coupon
router.patch("/update-status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Cập nhật trạng thái coupon:", { id, status });

  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({ message: "Trạng thái không hợp lệ." });
  }

  db.query(
    "UPDATE coupons SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("Chi tiết lỗi cập nhật:", err.sqlMessage || err);
        return res
          .status(500)
          .json({ message: "Lỗi khi cập nhật trạng thái." });
      }

      db.query("SELECT * FROM coupons WHERE id = ?", [id], (err2, results) => {
        if (err2) {
          console.error("Lỗi khi lấy lại dữ liệu:", err2.sqlMessage || err2);
          return res
            .status(500)
            .json({ message: "Lỗi khi lấy mã giảm giá sau cập nhật." });
        }

        res.json({
          message: "Cập nhật trạng thái thành công!",
          updatedCoupon: results[0],
        });
      });
    }
  );
});
// Trừ quantity của coupon theo ID
// PATCH /api/coupons/use/:id
router.patch("/use/:id", (req, res) => {
  const { id } = req.params;

  const sql =
    "UPDATE coupons SET quantity = quantity - 1 WHERE id = ? AND quantity > 0";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Lỗi:", err);
      return res.status(500).json({ message: "Lỗi máy chủ." });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Không thể sử dụng mã này nữa." });
    }

    res.json({ message: "Đã sử dụng mã thành công." });
  });
});

module.exports = router;
