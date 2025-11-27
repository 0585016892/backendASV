// backend/routes/assistant.js
const express = require("express");
const router = express.Router();
const db = require("../db");                 // export pool thường
const promisePool = db.promise();            // chuyển sang promise để dùng await
const { manager, loadNlp, addTrainingData } = require("../utils/nlp");
const nodemailer = require("nodemailer");
// Load model khi server start
loadNlp();

/**
 * POST /assistant/ask
 * Body: { question: string }
 */
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question) {
      return res.status(400).json({ success: false, message: "Thiếu câu hỏi" });
    }

    const response = await manager.process("vi", question);
    let answer = "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.";
    const intent = response.intent;

    switch (intent) {
      case "report.revenue.today": {
        const [rows] = await promisePool.query(
          "SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE DATE(created_at)=CURDATE()"
        );
        answer = `Doanh thu hôm nay: ${Number(rows[0].revenue).toLocaleString("vi-VN")} VND`;
        break;
      }

      case "report.revenue.month": {
        const [rows] = await promisePool.query(
          "SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())"
        );
        answer = `Doanh thu tháng này: ${Number(rows[0].revenue).toLocaleString("vi-VN")} VND`;
        break;
      }

      case "report.orders.today": {
        const [rows] = await promisePool.query(
          "SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at)=CURDATE()"
        );
        answer = `Số đơn hàng hôm nay: ${rows[0].total}`;
        break;
      }

      case "report.orders.week": {
        const [rows] = await promisePool.query(
          "SELECT COUNT(*) AS total FROM orders WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)"
        );
        answer = `Số đơn hàng tuần này: ${rows[0].total}`;
        break;
      }

      case "report.topProducts": {
        const [rows] = await promisePool.query(
          `SELECT p.name, SUM(oi.quantity) AS sold
           FROM order_items oi
           JOIN sanpham p ON oi.product_id = p.id
           GROUP BY p.name
           ORDER BY sold DESC
           LIMIT 5`
        );
        answer =
          rows.length === 0
            ? "Chưa có dữ liệu bán hàng."
            : "Top sản phẩm bán chạy:\n" +
              rows.map((r, i) => `${i + 1}. ${r.name} - ${r.sold} cái`).join("\n");
        break;
      }

      case "report.lowStock": {
        const [rows] = await promisePool.query(
          "SELECT name, quantity FROM sanpham WHERE quantity < 30 ORDER BY quantity ASC"
        );
        answer =
          rows.length === 0
            ? "Không có sản phẩm nào sắp hết hàng."
            : "Sản phẩm sắp hết hàng:\n" +
              rows.map((r) => `- ${r.name}: còn ${r.quantity}`).join("\n");
        break;
      }

      case "report.newCustomers": {
        const [rows] = await promisePool.query(
          "SELECT full_name, email FROM customers WHERE created_at >= (CURDATE() - INTERVAL 7 DAY)"
        );
        answer =
          rows.length === 0
            ? "Không có khách hàng mới trong tuần này."
            : "Khách hàng mới:\n" +
              rows.map((c) => `- ${c.full_name} (${c.email})`).join("\n");
        break;
      }

      case "smalltalk.greet":
      case "smalltalk.thanks":
      case "smalltalk.bye": {
        answer = response.answer || answer;
        break;
      }

      default:
        // fallback: gợi ý lệnh
        answer =
          "Mình chưa hiểu ý bạn. Bạn có thể thử:\n" +
          "- \"doanh thu hôm nay\"\n" +
          "- \"đơn hàng trong tuần này\"\n" +
          "- \"top sản phẩm bán chạy\"\n" +
          "- \"sản phẩm nào sắp hết hàng\"";
        break;
    }

    res.json({ success: true, intent, answer });
  } catch (err) {
    console.error("❌ Lỗi /assistant/ask:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/**
 * POST /assistant/train/add
 * Body: { question: string, intent: string, answer?: string }
 * → Bổ sung dữ liệu & train incremental
 */
router.post("/train/add", async (req, res) => {
  try {
    const { question, intent, answer } = req.body || {};
    if (!question || !intent) {
      return res.status(400).json({ success: false, message: "Thiếu question/intent" });
    }
    await addTrainingData("vi", question, intent, answer || null);
    res.json({ success: true, message: "Đã thêm dữ liệu và train lại thành công" });
  } catch (err) {
    console.error("❌ Lỗi /assistant/train/add:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/**
 * GET /assistant/metrics/summary
 * → Dùng cho dashboard admin: vài số liệu nhanh
 */
router.get("/metrics/summary", async (_req, res) => {
  try {
    const [[{ revenueToday }]] = await promisePool.query(
      "SELECT COALESCE(SUM(total),0) AS revenueToday FROM orders WHERE DATE(created_at)=CURDATE() AND status='completed'"
    );
    const [[{ ordersPending }]] = await promisePool.query(
      "SELECT COUNT(*) AS ordersPending FROM orders WHERE status='pending'"
    );
    const [[{ lowStock }]] = await promisePool.query(
      "SELECT COUNT(*) AS lowStock FROM sanpham WHERE quantity < 5"
    );
    res.json({ success: true, data: { revenueToday, ordersPending, lowStock } });
  } catch (err) {
    console.error("❌ Lỗi /assistant/metrics/summary:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
router.post('/send-coupon-email', async (req, res) => {
  try {
    const { couponName } = req.body;

    // Lấy thông tin mã giảm giá từ DB
    const [coupons] = await db.promise().query(
      'SELECT id, discount_value FROM coupons WHERE code  = ? AND description = 0',
      [couponName]
    );

    if (!coupons.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    const coupon = coupons[0];

    // Lấy danh sách khách hàng
    const [customers] = await db.promise().query(
      'SELECT email, full_name FROM customers'
    );

    // Cấu hình Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Gửi email cho từng khách song song
    const emailPromises = customers.map(customer =>
      transporter.sendMail({
        from: `"Shop Âm Sắc Việt" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject: `🎉 Mã khuyến mãi: ${couponName}`,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0d6efd;">🎉 Chào ${customer.full_name}!</h2>
          <p>Shop Âm Sắc Việt rất vui được gửi tới bạn <strong>mã khuyến mãi đặc biệt</strong>:</p>
          <p style="font-size: 16px; font-weight: bold; background-color: #f0f8ff; padding: 10px; border-radius: 8px; display: inline-block;">
            ${couponName}  - Giảm ${coupon.discount_value}%
          </p>
          <p>Nhanh tay sử dụng trước khi chương trình kết thúc!</p>
          <p style="margin-top: 20px;">Chúc bạn có những trải nghiệm tuyệt vời với Shop Âm Sắc Việt 🎵</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Nếu bạn không muốn nhận email khuyến mãi, vui lòng bỏ qua thư này.</p>
        </div>
      `,
      })
    );

    await Promise.all(emailPromises);

    res.json({ success: true, message: 'Đã gửi email cho tất cả khách hàng' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gửi email thất bại' });
  }
});
router.get("/coupons", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM coupons");
    res.json({ success: true, coupons: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách mã" });
  }
});
module.exports = router;
