let ioInstance;
const db = require("../db");

function initSocket(io) {
  ioInstance = io;

  ioInstance.on("connection", (socket) => {

    // Client join room riêng theo userId
    socket.on("join", (room) => {
    socket.join(room);
});

    socket.on("disconnect", () => {
    });
  });
}

// 🔔 Gửi thông báo cho admin khi có đơn hàng mới
function notifyNewOrder(order) {
  if (!ioInstance) return;

  const adminId = 1; // id số của admin trong bảng users

  // Lưu vào DB
  db.query(
    "INSERT INTO notifications (user_id, type, title, message, order_id, is_read, created_at) VALUES (?, 'order', ?, ?, ?, 0, NOW())",
    [adminId, "Đơn hàng mới", `Đơn hàng #${order.id} mới được tạo!`, order.id],
    (err, result) => {
      if (err) {
        console.error("❌ Lỗi lưu thông báo admin:", err);
        return;
      }

      // Emit cho admin
      ioInstance.to("user_admin").emit("newOrderNotification", {
        id: result.insertId,
        orderId: order.id,
        title: "Đơn hàng mới",
        message: `Đơn hàng #${order.id} mới được tạo!`,
        is_read: 0,
        created_at: new Date(),
      });
    }
  );
}

function notifyNewReview(order) {
  if (!ioInstance) {
    console.error("❌ Socket chưa khởi tạo!");
    return;
  }
  const adminId = 1;
  // Lưu thông báo vào DB
  const sql =
    "INSERT INTO notifications (user_id, type, title, message, order_id, is_read, created_at) VALUES (?, 'order', ?, ?, ?, 0, NOW())";
  const params = [
    adminId,
    "Đánh giá mới",
    `Đánh giá #${order.id} mới được tạo!`,
    order.id,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Lỗi lưu thông báo admin:", err);
      return;
    }

    // Emit cho tất cả client trong room "user_admin"
    ioInstance.to("user_admin").emit("newReview1", {
      id: result.insertId,
      orderId: order.id,
      title: "Đánh giá mới",
      message: `Đánh giá #${order.id} mới được tạo!`,
      is_read: 0,
      created_at: new Date(),
    });

  });
}

// 🔔 Gửi thông báo cho khách hàng khi trạng thái đơn hàng thay đổi
function notifyOrderStatusChange(io, orderId, userId, status) {
  if (!io) return;

  orderId = Number(orderId);
  if (isNaN(orderId)) {
    console.error("❌ orderId không hợp lệ:", orderId);
    return;
  }


  const title = "Cập nhật đơn hàng";
  const message = `Đơn hàng #${orderId} đã chuyển sang ${status}`;

  db.query(
    `INSERT INTO notifications (user_id, type, title, message, order_id, is_read, created_at)
     VALUES (?, 'status', ?, ?, ?, 0, NOW())`,
    [userId, title, message, orderId],
    (err, result) => {
      if (err) return console.error("❌ Lỗi lưu thông báo khách hàng:", err);

      const notificationId = result.insertId;

      // Lấy thông tin sản phẩm và tổng tiền từ order
      const sql = `
        SELECT 
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
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN sanpham p ON oi.product_id = p.id
        WHERE o.id = ?
        GROUP BY o.id
      `;

      db.query(sql, [orderId], (err2, rows) => {
        if (err2 || !rows.length) return console.error("❌ Lỗi lấy thông tin đơn hàng:", err2);

        let products = [];
        try {
          products = rows[0].products ? JSON.parse(`[${rows[0].products}]`) : [];
        } catch (e) {
          products = [];
        }

        const total = rows[0].total;
        const createdAt = new Date();

        const notifData = {
          notification_id: notificationId,
          order_id: orderId,
          order_status: status,
          title,
          message,
          is_read: 0,
          created_at: createdAt,
          products,
          total,
          type: 'status'
        };

        io.to(`user_${userId}`).emit("newNotification", notifData);
      });
    }
  );
}





module.exports = { initSocket, notifyNewOrder, notifyOrderStatusChange,notifyNewReview };
