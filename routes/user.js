const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware xác thực token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Thiếu token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

// 1. Lấy thông tin người dùng
router.get("/me", authenticate, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, full_name, email, phone, address ,images
    FROM customers 
    WHERE id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    if (results.length === 0)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json(results[0]);
  });
});

// 2. Lịch sử mua hàng (đã giao hoặc huỷ)
router.get("/orders/history", authenticate, (req, res) => {
  const customerEmail = req.user.email;

  const orderSql = `
    SELECT *	
    FROM orders 
    WHERE customer_email = ? 
      AND status IN ('Đã giao', 'Đã hủy','Chờ xử lý','Đang giao','Đang chờ thanh toán')
    ORDER BY created_at DESC
  `;

  db.query(orderSql, [customerEmail], (err, orders) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map((order) => order.id);

    const detailSql = `
      SELECT od.*, p.name,p.size,p.color,p.image,p.slug
      FROM order_items od
      JOIN sanpham p ON od.product_id = p.id
      WHERE od.order_id IN (?)
    `;

    db.query(detailSql, [orderIds], (err, details) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
      }

      const result = orders.map((order) => {
        const items = details.filter((d) => d.order_id === order.id);
        return { ...order, items };
      });

      res.json(result);
    });
  });
});

// 3. Đơn hàng đang xử lý (chưa giao)
router.get("/orders/pending", authenticate, (req, res) => {
  const customerEmail = req.user.email;

  // 1. Lấy đơn hàng có trạng thái chưa giao
  const orderSql = `
  SELECT id, final_total, status, created_at ,shipping	
    FROM orders 
    WHERE customer_email = ? 
      AND status IN ('Đã giao', 'Đã hủy','Chờ xử lý','Đang giao')
    ORDER BY created_at DESC
  `;

  db.query(orderSql, [customerEmail], (err, orders) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });

    if (orders.length === 0) return res.json([]);

    // 2. Lấy danh sách order_id để truy vấn chi tiết
    const orderIds = orders.map((order) => order.id);

    // 3. Truy vấn chi tiết sản phẩm từng đơn
    const detailSql = `
      SELECT od.order_id, p.name, od.quantity, od.price, od.size, od.color
      FROM order_items od
      JOIN sanpham p ON od.product_id = p.id
      WHERE od.order_id IN (?)
    `;

    db.query(detailSql, [orderIds], (err, details) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Lỗi khi lấy chi tiết đơn hàng" });

      // 4. Gộp chi tiết vào từng đơn
      const result = orders.map((order) => {
        const items = details.filter((d) => d.order_id === order.id);
        return { ...order, items };
      });

      res.json(result);
    });
  });
});

// 4. Cập nhật thông tin người dùng
router.put("/update", authenticate, (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, address } = req.body;

  if (!full_name || !phone || !address) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  }

  const sql = `
    UPDATE customers 
    SET full_name = ?, phone = ?, address = ?
    WHERE id = ?
  `;
  db.query(sql, [full_name, phone, address, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi khi cập nhật" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({ message: "Cập nhật thông tin thành công" });
  });
});

// 5. Xem chi tiết đơn hàng
router.get("/orders/:orderId", authenticate, (req, res) => {
  const customerEmail = req.user.email;
  const orderId = req.params.orderId;

  // Kiểm tra đơn hàng có thuộc user không
  const orderSql = `
    SELECT id, code, total_price, status, created_at 
    FROM orders 
    WHERE id = ? AND customer_email = ?
  `;

  db.query(orderSql, [orderId, customerEmail], (err, orderResults) => {
    if (err) return res.status(500).json({ message: "Lỗi khi lấy đơn hàng" });
    if (orderResults.length === 0)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const order = orderResults[0];

    // Lấy chi tiết sản phẩm trong đơn hàng
    const detailSql = `
      SELECT p.name, od.quantity, od.price 
      FROM order_details od 
      JOIN products p ON od.product_id = p.id 
      WHERE od.order_id = ?
    `;
    db.query(detailSql, [orderId], (err, detailResults) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Lỗi khi lấy chi tiết đơn hàng" });

      order.items = detailResults;
      res.json(order);
    });
  });
});
router.put("/change-password", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  }

  const sql = "SELECT password FROM customers WHERE id = ?";
  db.query(sql, [userId], async (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi máy chủ" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const hashedPassword = results[0].password;
    const isMatch = await bcrypt.compare(oldPassword, hashedPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu cũ không đúng" });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSql = "UPDATE customers SET password = ? WHERE id = ?";
    db.query(updateSql, [newHashedPassword, userId], (err2) => {
      if (err2)
        return res.status(500).json({ message: "Lỗi khi cập nhật mật khẩu" });
      res.json({ message: "Đổi mật khẩu thành công" });
    });
  });
});
// thông báo
router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      n.id AS notification_id,
      n.order_id,
      n.type,
      n.title,
      n.message,
      n.is_read,
      n.created_at,
      o.status AS order_status,
      o.total,
      GROUP_CONCAT(
        CONCAT(
          '{"product_id":', p.id,
          ',"product_name":"', p.name,
          '","product_image":"', p.image,
          '","quantity":', oi.quantity,
          ',"price":', oi.price, '}'
        )
      ) AS products
    FROM notifications n
    LEFT JOIN orders o ON n.order_id = o.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN sanpham p ON oi.product_id = p.id
    WHERE n.user_id = ?
    GROUP BY n.id
    ORDER BY n.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông báo",
        error: err.message,
      });
    }

    // Parse chuỗi products thành mảng JSON
    const formatted = results.map(row => {
      let products = [];
      if (row.products) {
        try {
          products = JSON.parse(`[${row.products}]`); // bọc [] để thành mảng
        } catch (e) {
          products = [];
        }
      }
      return { ...row, products };
    });

    res.json({
      success: true,
      notifications: formatted,
    });
  });
});

// PUT /api/notifications/:id/read
router.put("/:id/read", (req, res) => {
  const { id } = req.params;

  db.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true });
    }
  );
});
router.put("/user/:userId/read-all", (req, res) => {
  const { userId } = req.params;

  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }

    res.json({ success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc" });
  });
});
module.exports = router;
