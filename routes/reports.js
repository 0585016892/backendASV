const express = require("express");
const router = express.Router();
const db = require("../db"); // Giả sử bạn có db connection

// 1. Báo cáo doanh thu theo khoảng thời gian và theo period (day, month, quarter, year)
router.get("/revenue", (req, res) => {
  const { from_date, to_date, period = "month" } = req.query;

  // Hàm kiểm tra định dạng ngày YYYY-MM-DD
  function isValidDate(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  if (
    (from_date && !isValidDate(from_date)) ||
    (to_date && !isValidDate(to_date))
  ) {
    return res
      .status(400)
      .json({ error: "from_date hoặc to_date sai định dạng YYYY-MM-DD" });
  }

  let dateFormat;
  switch (period) {
    case "day":
      dateFormat = "%Y-%m-%d";
      break;
    case "quarter":
      break;
    case "year":
      dateFormat = "%Y";
      break;
    case "month":
    default:
      dateFormat = "%Y-%m";
  }

  let sql, params;
  if (period === "quarter") {
    sql = `
      SELECT
        CONCAT(YEAR(created_at), '-Q', QUARTER(created_at)) AS period,
        SUM(final_total) AS revenue
      FROM orders
      WHERE (? IS NULL OR created_at >= ?) AND (? IS NULL OR created_at <= ?)
      GROUP BY YEAR(created_at), QUARTER(created_at)
      ORDER BY YEAR(created_at), QUARTER(created_at)
    `;
    params = [
      from_date || null,
      from_date || null,
      to_date || null,
      to_date || null,
    ];
  } else {
    sql = `
      SELECT
        DATE_FORMAT(created_at, ?) AS period,
        SUM(final_total) AS revenue
      FROM orders
      WHERE (? IS NULL OR created_at >= ?) AND (? IS NULL OR created_at <= ?)
      GROUP BY period
      ORDER BY period
    `;
    params = [
      dateFormat,
      from_date || null,
      from_date || null,
      to_date || null,
      to_date || null,
    ];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error in /revenue:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server khi lấy báo cáo doanh thu" });
    }
    res.json({ data: results });
  });
});
// Hàm kiểm tra định dạng date YYYY-MM-DD đơn giản

function isValidDate(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

// 2. Báo cáo đơn hàng theo tháng (dùng created_at để thống nhất)
router.get("/orders", (req, res) => {
  const { from_date, to_date } = req.query;

  // Hàm kiểm tra định dạng ngày đơn giản
  function isValidDate(dateString) {
    // Kiểm tra định dạng YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  if (
    (from_date && !isValidDate(from_date)) ||
    (to_date && !isValidDate(to_date))
  ) {
    return res
      .status(400)
      .json({ error: "from_date hoặc to_date sai định dạng YYYY-MM-DD" });
  }

  let sql = `
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS period,
      COUNT(id) AS orders_count
    FROM orders
  `;
  let params = [];

  if (from_date && to_date) {
    sql += ` WHERE created_at BETWEEN ? AND ?`;
    params = [from_date, to_date];
  }

  sql += ` GROUP BY period ORDER BY period`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error in /orders:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server khi lấy báo cáo đơn hàng" });
    }
    res.json({ data: results });
  });
});

// 3. Top sản phẩm bán chạy
router.get("/top-products", (req, res) => {
  const { limit = 5, from_date, to_date } = req.query;

  function isValidDate(dateString) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  if (!from_date || !to_date) {
    return res.status(400).json({ error: "Thiếu from_date hoặc to_date" });
  }
  if (!isValidDate(from_date) || !isValidDate(to_date)) {
    return res
      .status(400)
      .json({ error: "from_date hoặc to_date sai định dạng YYYY-MM-DD" });
  }

  let limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1) limitNum = 5;
  if (limitNum > 20) limitNum = 20; // Giới hạn max 20

  const sql = `
    SELECT p.name, SUM(od.quantity) AS total_sold
    FROM order_items od
    JOIN sanpham p ON od.product_id = p.id
    JOIN orders o ON od.order_id = o.id
    WHERE o.created_at BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT ?
  `;

  db.query(sql, [from_date, to_date, limitNum], (err, results) => {
    if (err) {
      console.error("Error in /top-products:", err);
      return res.status(500).json({ error: "Lỗi server khi lấy top sản phẩm" });
    }
    res.json({ data: results });
  });
});
// 4. Thống kê khách hàng theo tổng tiền mua
router.get("/customers", (req, res) => {
  const { from_date, to_date } = req.query;

  function isValidDate(dateString) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  if (!from_date || !to_date) {
    return res.status(400).json({ error: "Thiếu from_date hoặc to_date" });
  }
  if (!isValidDate(from_date) || !isValidDate(to_date)) {
    return res
      .status(400)
      .json({ error: "from_date hoặc to_date sai định dạng YYYY-MM-DD" });
  }

  const sql = `
    SELECT
      CASE 
        WHEN total_spent < 500000 THEN 'Khách mới'
        WHEN total_spent BETWEEN 500000 AND 1000000 THEN 'Khách trung thành'
        ELSE 'Khách VIP'
      END AS customer_group,
      COUNT(*) AS count
    FROM (
      SELECT customer_email, SUM(total) AS total_spent
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY customer_email
    ) AS spending
    GROUP BY customer_group
  `;

  db.query(sql, [from_date, to_date], (err, results) => {
    if (err) {
      console.error("Error in /customers:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server khi lấy thống kê khách hàng" });
    }
    res.json({ data: results });
  });
});

module.exports = router;
