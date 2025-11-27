const express = require("express");
const router = express.Router();
const db = require("../db");

// Route lấy stats
router.get("/stats", (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM orders", (err, ordersRes) => {
    if (err) return res.status(500).json({ message: "Lỗi server" });
    const totalOrders = ordersRes[0].total;

    db.query(
      "SELECT SUM(final_total) AS total FROM orders WHERE DATE(created_at) = CURDATE()",
      (err, revenueRes) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });
        const revenueToday = revenueRes[0].total || 0;

        db.query(
          "SELECT COUNT(*) AS total FROM sanpham WHERE status = 'active'",
          (err, productsRes) => {
            if (err) return res.status(500).json({ message: "Lỗi server" });
            const productsCount = productsRes[0].total;

            db.query(
              "SELECT COUNT(*) AS total FROM customers WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
              (err, customersRes) => {
                if (err) return res.status(500).json({ message: "Lỗi server" });
                const newCustomers = customersRes[0].total;

                const statsData = [
                  {
                    label: "Tổng số đơn hàng",
                    number: totalOrders,
                    helpText: "Cập nhật hôm nay",
                  },
                  {
                    label: "Doanh thu hôm nay",
                    number: revenueToday,
                    helpText: "Tổng doanh thu",
                  },
                  {
                    label: "Sản phẩm đang bán",
                    number: productsCount,
                    helpText: "Đang kinh doanh",
                  },
                  {
                    label: "Khách hàng mới",
                    number: newCustomers,
                    helpText: "Trong tuần",
                  },
                ];

                res.json(statsData);
              }
            );
          }
        );
      }
    );
  });
});
router.get("/revenue", (req, res) => {
  const { from_date, to_date } = req.query;

  // Validate ngày (nếu có)
  const isValidDate = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (
    (from_date && !isValidDate(from_date)) ||
    (to_date && !isValidDate(to_date))
  ) {
    return res
      .status(400)
      .json({ error: "from_date hoặc to_date sai định dạng YYYY-MM-DD" });
  }

  const sql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
      IFNULL(SUM(final_total), 0) AS revenue
    FROM orders
    WHERE (? IS NULL OR created_at >= ?) AND (? IS NULL OR created_at <= ?)
    GROUP BY date
    ORDER BY date
  `;

  const params = [
    from_date || null,
    from_date || null,
    to_date || null,
    to_date || null,
  ];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching daily revenue:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server khi lấy dữ liệu doanh thu" });
    }
    // Kết quả dạng [{ date: '2023-06-01', revenue: 100000 }, ...]
    res.json(results);
  });
});
// API lấy đơn hàng mới nhất (mặc định lấy 10 đơn gần nhất)
router.get("/orders", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const sql = `
    SELECT 
      id, 
      customer_email AS customer, 
      final_total AS total, 
      status, 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date
    FROM orders
    ORDER BY created_at DESC
    LIMIT ?
  `;

  db.query(sql, [limit], (err, results) => {
    if (err) {
      console.error("Error fetching recent orders:", err);
      return res.status(500).json({ error: "Lỗi server khi lấy đơn hàng" });
    }

    res.json({ data: results });
  });
});
router.post("/notifications/mark-read-all", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID không hợp lệ" });

  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
  db.query(sql, 0, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    res.json({ success: true, updatedRows: result.affectedRows });
  });
});
// 3️⃣ Doanh thu theo tháng (biểu đồ đường)
router.get("/revenue-monthly", (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  const sql = `
    SELECT 
      MONTH(created_at) AS month, 
      SUM(total) AS revenue
    FROM orders 
    WHERE status = 'Đã giao' 
      AND YEAR(created_at) = ?
    GROUP BY MONTH(created_at)
    ORDER BY month
  `;

  db.query(sql, [year], (err, result) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi máy chủ" });
    }
    res.json(result);
  });
});
// 5️⃣ Tỷ lệ trạng thái đơn hàng
router.get("/order-status-ratio", (req, res) => {
  const sql = `
    SELECT 
      status AS name,
      COUNT(*) AS value
    FROM orders
    GROUP BY status
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Lỗi máy chủ" });
    }
    res.json(result);
  });
});
/// 📊 API: Doanh thu theo danh mục (biểu đồ cột nhóm)
router.get("/revenue-category", (req, res) => {
  const sql = `
    SELECT 
      dm.name AS category,
      SUM(CASE WHEN o.payment_method IN ('MOMO', 'VNPay') THEN ct.quantity * ct.price ELSE 0 END) AS online,
      SUM(CASE WHEN o.payment_method IN ('COD') THEN ct.quantity * ct.price ELSE 0 END) AS offline
    FROM order_items ct
    JOIN orders o ON ct.order_id = o.id
    JOIN sanpham sp ON ct.product_id = sp.id
    JOIN categories dm ON sp.categoryId = dm.id
    WHERE o.status = 'Đã giao'
    GROUP BY dm.id, dm.name
    ORDER BY 
      (SUM(CASE WHEN o.payment_method IN ('MOMO', 'VNPay') THEN ct.quantity * ct.price ELSE 0 END) +
       SUM(CASE WHEN o.payment_method IN ('COD') THEN ct.quantity * ct.price ELSE 0 END)) DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Lỗi truy vấn doanh thu theo danh mục:", err);
      return res.status(500).json({ error: "Lỗi máy chủ" });
    }
    res.json(result);
  });
});



module.exports = router;
