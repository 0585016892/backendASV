const db = require("../db");
const Website_URL = process.env.URL_WEBSITE;
const Web_URL = process.env.URL_WEB;

// userId -> Set<socketId>
const onlineUsers = new Map();

function chatSocket(io) {
  // ==============================
  // ✅ BOT REPLY FUNCTION
  // ==============================
  function getBotReply(message, callback) {
    const lowerMsg = message.toLowerCase();

    const replySql = `
      SELECT reply FROM chatbot_replies
      WHERE ? LIKE CONCAT('%', keyword, '%')
      ORDER BY LENGTH(keyword) DESC
      LIMIT 1
    `;

    db.query(replySql, [lowerMsg], (err, results) => {
      if (err) {
        console.error("❌ [BOT ERROR] Truy vấn chatbot_replies lỗi:", err);
        return callback("Bot bị lỗi, bạn thử lại sau!");
      }

      if (results.length > 0) {
        return callback({ content: results[0].reply });
      }

      // 🔍 Nếu không khớp keyword → tìm sản phẩm
      const productSql = `
        SELECT name, slug, image FROM sanpham
        WHERE status = 'active' AND ? LIKE CONCAT('%', name, '%')
        LIMIT 1
      `;
      db.query(productSql, [lowerMsg], (err, prods) => {
        if (err) {
          console.error("❌ [BOT ERROR] Truy vấn sản phẩm lỗi:", err);
          return callback({ content: "Bot bị lỗi, bạn thử lại sau!" });
        }

        if (prods.length === 0) {
          return callback({ content: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn!" });
        }

        const p = prods[0];
        const link = `${Website_URL}/product/${p.slug}`;
        const img = `${Web_URL}/uploads/${p.image}`;
        const reply = `✔️ Sản phẩm **${p.name}** hiện đang có hàng.\nXem tại: ${link}`;

        callback({ content: reply, image: img });
      });
    });
  }

  // ==============================
  // ✅ SOCKET CONNECTION
  // ==============================
  io.on("connection", (socket) => {

    // Khi người dùng đăng ký (vào phòng chat)
    socket.on("register", (userId) => {
      if (!userId) return;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      io.emit("update_online_users", Array.from(onlineUsers.keys()));

      // Nếu là admin → kiểm tra tin chưa đọc
      if (userId === "admin") {
        const unreadSql = `
          SELECT sender, content FROM chat_messages
          WHERE receiver = 'admin' AND is_read = FALSE
          ORDER BY created_at DESC
        `;
        db.query(unreadSql, (err, rows) => {
          if (!err && rows.length > 0) {
            const latest = rows[0];
            socket.emit("newMessageNotification", {
              type: "message",
              message: `💬 Có ${rows.length} tin nhắn chưa đọc.\nGần nhất từ ${latest.sender}: "${latest.content}"`,
            });
          }
        });
      }
    });

    // ==============================
    // ✅ XỬ LÝ GỬI TIN NHẮN
    // ==============================
    socket.on("send_private_message", (data, callback) => {
      const { sender, receiver, content, image } = data;
      const timestamp = new Date();


      const isAdminOnline =
        onlineUsers.has("admin") && onlineUsers.get("admin").size > 0;

      // 👇 Nếu admin OFFLINE → xử lý bot
      if (receiver === "admin" && !isAdminOnline) {
        getBotReply(content, (reply) => {
          const botTime = new Date();

          db.query(
            `INSERT INTO chat_messages (sender, receiver, content, image, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sender, "admin", content, image || null, false, timestamp],
            (err) => {
              if (err) console.error("❌ [DB ERROR] Lưu tin khách thất bại:", err);
            }
          );

          db.query(
            `INSERT INTO chat_messages (sender, receiver, content, image, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            ["bot", sender, reply.content, reply.image || null, botTime],
            (err) => {
              if (err) console.error("❌ [DB ERROR] Lưu phản hồi bot thất bại:", err);
            }
          );

          // Trả lại 2 tin nhắn cho client
          socket.emit("receive_private_message", {
            sender,
            receiver: "admin",
            content,
            timestamp: timestamp.getTime(),
          });

          socket.emit("receive_private_message", {
            sender: "bot",
            receiver: sender,
            content: reply.content,
            image: reply.image || null,
            timestamp: botTime.getTime(),
          });


          callback && callback({ success: true });
        });
        return;
      }

      // ✅ Admin ONLINE → gửi bình thường
      db.query(
        `INSERT INTO chat_messages (sender, receiver, content, image, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sender, receiver, content, image || null, false, timestamp],
        (err) => {
          if (err) {
            console.error("❌ [DB ERROR] Lưu tin nhắn thất bại:", err);
            callback && callback({ success: false });
            return;
          }

          const msg = {
            sender,
            receiver,
            content,
            image: image || null,
            timestamp: timestamp.getTime(),
          };


          const receiverSockets = onlineUsers.get(receiver);
          if (receiverSockets) {
            receiverSockets.forEach((sockId) => {
              io.to(sockId).emit("receive_private_message", msg);

              if (receiver === "admin") {
                io.to(sockId).emit("newMessageNotification", {
                  type: "message",
                  message: `💬 Tin nhắn mới từ ${sender}`,
                  sender,
                  content,
                });
              }
            });
          }

          socket.emit("receive_private_message", msg);

          callback && callback({ success: true });
        }
      );
    });

    // ==============================
    // ✅ NGẮT KẾT NỐI
    // ==============================
    socket.on("disconnect", () => {
      console.log("🔴 [SOCKET DISCONNECTED]", socket.id);
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
          }
          io.emit("update_online_users", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });
}

module.exports = {
  chatSocket,
  onlineUsers,
};
