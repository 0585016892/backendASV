const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { imageHash } = require("image-hash"); // Cần đúng cú pháp
const hamming = require("hamming-distance");
const URL = process.env.URL_WEB;

// [1] Lấy danh sách người dùng đã chat với admin
router.get("/", (req, res) => {
  console.log("Nhận yêu cầu GET /api/chat");

  const sql = `
     SELECT DISTINCT 
      IF(cm.sender = 'admin', cm.receiver, cm.sender) AS userId,
      u.full_name
    FROM chat_messages cm
    JOIN customers u ON u.id = IF(cm.sender = 'admin', cm.receiver, cm.sender)
    WHERE cm.sender = 'admin' OR cm.receiver = 'admin'
    
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results); // [{ userId: '102', full_name: 'Nguyễn Văn A' }, ...]
  });
});

// [2] Lấy tất cả tin nhắn giữa user và admin
router.get("/conversation/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT * FROM chat_messages
    WHERE (sender = 'admin' AND receiver = ?)
      OR (sender = ? AND receiver = 'admin')
      OR (sender = 'bot' AND receiver = ?)
    ORDER BY created_at ASC
  `;

  db.query(sql, [userId, userId, userId], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Lỗi truy vấn", error: err });
    res.json(results);
  });
});
// API xử lý bot trả lời
router.post("/bot-reply", (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Thiếu nội dung câu hỏi." });
  }

  const sql = `
    SELECT reply FROM chatbot_replies
    WHERE ? LIKE CONCAT('%', keyword, '%')
    LIMIT 1
  `;

  db.query(sql, [message.toLowerCase()], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn DB." });

    if (results.length > 0) {
      res.json({ reply: results[0].reply });
    } else {
      res.json({ reply: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn." });
    }
  });
});
const storage = multer.diskStorage({
  destination: "public/uploads/chat",
  filename: (req, file, cb) => {
    const filename = Date.now() + "_" + file.originalname;
    cb(null, filename);
  },
});
const upload = multer({ storage });
// Hàm tính hash ảnh
function getHash(imagePath) {
  return new Promise((resolve, reject) => {
    imageHash(imagePath, 8, true, (error, data) => {
      if (error) return reject(error);
      resolve(data); // chuỗi hash dạng binary
    });
  });
}

// Xử lý upload và so sánh ảnh
router.post("/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file" });

  const imageUrl = `${URL}/uploads/chat/${req.file.filename}`;
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  const sender = req.body.sender;

  try {
    // Tạo tin nhắn ảnh từ user
    const userMessage = {
      sender,
      receiver: "admin",
      content: "Sản phẩm này còn hàng không?",
      image: imageUrl,
      timestamp: Date.now(),
    };

    // Gửi tin nhắn từ user về cho chính họ
    const senderSockets = onlineUsers.get(sender);
    if (senderSockets) {
      senderSockets.forEach((socketId) => {
        io.to(socketId).emit("receive_private_message", userMessage);
      });
    }

    // Gửi tin nhắn tới admin nếu đang online
    const adminSockets = onlineUsers.get("admin");
    if (adminSockets) {
      adminSockets.forEach((socketId) => {
        io.to(socketId).emit("receive_private_message", userMessage);
      });
    }
    const sqlUser = `INSERT INTO chat_messages (sender, receiver, content, image) VALUES (?, ?, ?, ?)`;
    const valuesUser = [
      userMessage.sender,
      userMessage.receiver,
      userMessage.content,
      userMessage.image || null,
    ];

    db.query(sqlUser, valuesUser, (err, result) => {
      if (err) {
        console.error("Lỗi khi lưu tin nhắn khách hàng:", err);
      }
    });
    // So sánh ảnh để tìm sản phẩm
    const userHash = await getHash(req.file.path);
    db.query("SELECT * FROM sanpham", async (err, products) => {
      if (err) return console.error("DB error:", err);

      let closest = null;
      let minDistance = Infinity;

      for (let product of products) {
        const relativePath = product.image.replace(`${URL}/`, "");
        const imagePath = path.join(
          __dirname,
          "..",
          "public",
          "uploads",
          relativePath
        );

        if (!fs.existsSync(imagePath)) continue;

        try {
          const prodHash = await getHash(imagePath);
          const distance = hamming(userHash, prodHash);

          if (distance < minDistance) {
            minDistance = distance;
            closest = product;
          }
        } catch (hashErr) {
          console.error("Hash error:", hashErr);
        }
      }

      const MAX_HASH_DISTANCE = 15;
      if (closest && minDistance <= MAX_HASH_DISTANCE) {
        const botReply = {
          sender: "bot",
          receiver: sender,
          content: `🔍 Có phải bạn đang tìm sản phẩm "${closest.name}"?\n👉 Xem tại: https://www.finlyshop.site//product/${closest.slug}`,
          image: `${URL}/uploads/${closest.image}`,
          product: {
            id: closest.id,
            name: closest.name,
            image: closest.image,
            slug: closest.slug,
            price: closest.price,
            sizes: closest.size?.split(",") || [],
            colors: closest.color?.split(",") || [],
          },
          timestamp: Date.now(),
        };
        // Lưu vào DB
        const sql = `INSERT INTO chat_messages (sender, receiver, content, image)
               VALUES (?, ?, ?, ?)`;
        const values = [
          botReply.sender,
          botReply.receiver,
          botReply.content,
          botReply.image,
        ];
        db.query(sql, values, (err, result) => {
          if (err) console.error("Lỗi khi lưu botReply:", err);
        });

        // Gửi về client
        if (senderSockets) {
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit("receive_private_message", botReply);
          });
        }

        console.log("🤖 Bot đã gửi gợi ý sản phẩm:", closest.name);
      } else {
        console.log("Không có sản phẩm đủ giống để gợi ý.");
      }
    });

    // Phản hồi về client để reset UI
    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi xử lý ảnh:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Đánh dấu tất cả tin nhắn từ sender gửi đến receiver là đã đọc
router.put("/messages/mark-read", (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ message: "Thiếu sender hoặc receiver" });
  }

  const sql = `
    UPDATE chat_messages
    SET is_read = TRUE
    WHERE sender = ? AND receiver = ? AND is_read = FALSE
  `;

  db.query(sql, [sender, receiver], (err, result) => {
    if (err) {
      console.error("Lỗi khi đánh dấu là đã đọc:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    res.json({
      message: "Đã đánh dấu tin nhắn là đã đọc",
      affectedRows: result.affectedRows,
    });
  });
});


router.get("/notifications/:userId", async (req, res) => {
  const userId = 'admin';

  try {
    const [rows] = await db
      .promise()
      .query(
        `SELECT id, type, message, is_read, sender 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi lấy thông báo" });
  }
});
router.post("/notifications/mark-read", async (req, res) => {
  try {
     const userId = 'admin';

    const { noteId } = req.body; // Lấy đúng noteId

    if (!noteId || !userId) {
      return res.status(400).json({ message: "Thiếu noteId hoặc userId" });
    }

    // Sử dụng async/await
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [noteId, userId],
        (err, result) => {
          if (err) return reject(err);
          if (result.affectedRows === 0) return reject("Thông báo không tồn tại");
          resolve(result);
        }
      );
    });

    return res.json({ message: "Đã đánh dấu là đã đọc" });
  } catch (err) {
    console.error("Lỗi markNotificationAsRead:", err);
    return res.status(500).json({ message: typeof err === "string" ? err : "Lỗi server" });
  }
});

module.exports = router;
