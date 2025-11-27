const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");
const { notifyNewOrder ,notifyOrderStatusChange} = require("../sockets/notiSocket");
const { createVnpayUrl } = require("../utils/vnpay");
const bcrypt = require("bcrypt");
const moment = require("moment");
const crypto = require("crypto");
require("dotenv").config();
const https = require("https");
const getSettings = require("../utils/getSettings");

async function sendEmails({
  orderId,
  customer,
  email,
  phone,
  address,
  note,
  paymentMethod,
  total,
  discount,
  shipping,
  final_total,
  items,
  plainPassword = null,
}) {
  // Lấy cấu hình email từ DB bằng callback
  getSettings(async (err, settings) => {
    if (err) {
      console.error("❌ Lỗi lấy settings:", err);
    } else {
      console.log("✅ Settings lấy từ DB:", settings);
    }

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port),
      secure: process.env.EMAIL_SECURE,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });

    // Danh sách sản phẩm
    const itemsList = items
      .map(
        i =>
          `- ${i.name} (Size: ${i.size}, Màu: ${i.color}) | SL: ${i.quantity} | Giá: ${i.price.toLocaleString("vi-VN")} đ`
      )
      .join("\n");

    // Email gửi khách hàng
    const customerMail = {
      from: `"Âm Sắc Việt" <${settings.smtp_username}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2E86C1;">Cảm ơn bạn đã đặt hàng tại <strong>Âm Sắc Việt</strong>!</h2>
          <p>Xin chào <strong>${customer}</strong>,</p>
          <p>Chúng tôi đã nhận được đơn hàng của bạn với thông tin như sau:</p>

          <h3 style="color: #1E8449;">🧾 Thông tin đơn hàng</h3>
          <ul>
            <li><strong>Mã đơn hàng:</strong> #${orderId}</li>
            <li><strong>Họ tên:</strong> ${customer}</li>
            <li><strong>Số điện thoại:</strong> ${phone}</li>
            <li><strong>Địa chỉ:</strong> ${address}</li>
            <li><strong>Ghi chú:</strong> ${note || "Không có"}</li>
            <li><strong>Phương thức thanh toán:</strong> ${paymentMethod}</li>
          </ul>

          <h3 style="color: #D35400;">📦 Chi tiết sản phẩm</h3>
          <ul style="background:#f9f9f9; padding:10px; border-left:3px solid #ccc;">
            ${itemsList}
          </ul>

          <h3 style="color: #8E44AD;">💰 Tóm tắt thanh toán</h3>
          <ul>
            <li><strong>Tổng tiền sản phẩm:</strong> ${total.toLocaleString("vi-VN")} đ</li>
            <li><strong>Giảm giá:</strong> ${discount.toLocaleString("vi-VN")} đ</li>
            <li><strong>Phí vận chuyển:</strong> ${shipping.toLocaleString("vi-VN")} đ</li>
            <li><strong style="color:#C0392B;">Tổng thanh toán:</strong> <span style="color: #C0392B;">${final_total.toLocaleString("vi-VN")} đ</span></li>
          </ul>

          ${
            plainPassword
              ? `<h3 style="color: #2E86C1;">🔐 Tài khoản của bạn</h3>
                 <p>Hệ thống đã tạo tài khoản tự động cho bạn:</p>
                 <ul>
                   <li><strong>Email:</strong> ${email}</li>
                   <li><strong>Mật khẩu:</strong> ${plainPassword}</li>
                 </ul>`
              : ""
          }

          <p>Chúng tôi sẽ sớm xử lý và giao hàng đến bạn.</p>
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Âm Sắc Việt Team</strong></p>
        </div>
      `,
    };

    // Email gửi admin
    const adminMail = {
      from: `"Âm Sắc Việt" <${settings.smtp_username}>`,
      to: settings.ADMIN_EMAIL || "tranhung6829@gmail.com",
      subject: `[MỚI] Đơn hàng #${orderId} từ ${customer}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50;">🛒 Thông báo đơn hàng mới từ <span style="color: #1abc9c;">Âm Sắc Việt</span></h2>
          <p><strong>Mã đơn hàng:</strong> <span style="color: #e74c3c;">#${orderId}</span></p>
          <p><strong>Khách hàng:</strong> ${customer}</p>
          <p><strong>Điện thoại:</strong> ${phone}</p>
          <p><strong>Địa chỉ:</strong> ${address}</p>
          <p><strong>Ghi chú:</strong> ${note || "Không có"}</p>
          <p><strong>Phương thức thanh toán:</strong> ${paymentMethod}</p>

          <hr style="margin: 20px 0;">
          <h3 style="color: #34495e;">💰 Thông tin thanh toán:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Tổng tiền:</strong> ${total.toLocaleString("vi-VN")} đ</li>
            <li><strong>Giảm giá:</strong> ${discount.toLocaleString("vi-VN")} đ</li>
            <li><strong>Phí vận chuyển:</strong> ${shipping.toLocaleString("vi-VN")} đ</li>
            <li><strong style="color: #e67e22;">Tổng thanh toán:</strong> <span style="color: #e74c3c;">${final_total.toLocaleString("vi-VN")} đ</span></li>
          </ul>

          <hr style="margin: 20px 0;">
          <h3 style="color: #34495e;">📦 Chi tiết sản phẩm:</h3>
          <div style="background: #fff; border: 1px solid #ccc; padding: 10px; border-radius: 5px; white-space: pre-line;">
            ${itemsList}
          </div>

          <p style="margin-top: 30px;">🕐 <em>Vui lòng xử lý đơn hàng này sớm nhất có thể.</em></p>
          <p style="color: #999; font-size: 13px;">Âm Sắc Việt Team<br/>https://amsacmau.vn</p>
        </div>
      `,
    };

    // Gửi email cùng lúc
    try {
      await Promise.all([
        transporter.sendMail(customerMail),
        transporter.sendMail(adminMail),
      ]);
      console.log("✅ Email gửi thành công");
    } catch (e) {
      console.error("❌ Lỗi gửi email:", e.message);
    }
  });
}

const generateRandomPassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};


// Hàm gọi API MoMo
function createMoMoPayment(dbOrderId, amount, orderInfo, redirectUrl, ipnUrl, callback) {
  const partnerCode = "MOMO";
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  

// tạo orderId duy nhất
  const momoOrderId  = `${dbOrderId}_${Date.now()}`;
    const requestId = momoOrderId;
  // rawSignature theo đúng format trong docs
const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}` +
    `&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;


  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId,
    amount,
    orderId: momoOrderId,   // gửi sang MoMo orderId unique
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType: "payWithMethod",
    autoCapture: true,
    extraData: "",
    signature
  });

  const options = {
    hostname: "test-payment.momo.vn",
    port: 443,
    path: "/v2/gateway/api/create",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  const req = https.request(options, (res2) => {
    let data = "";
    res2.on("data", (chunk) => (data += chunk));
    res2.on("end", () => {
      try {
         console.log("🔗 MoMo response:", data);
        callback(null, JSON.parse(data));
      } catch (err) {
        callback(err, null);
      }
    });
  });

  req.on("error", (e) => callback(e, null));
  req.write(requestBody);
  req.end();
}

router.post("/add", (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    address,
    note,
    total,
    discount,
    shipping,
    final_total,
    payment_method,
    status,
    items,
  } = req.body;
  console.log("🔍 Nhận đơn hàng:", req.body);
  
  const checkEmailSql  = "SELECT * FROM customers WHERE email = ?";
  db.query(checkEmailSql, [customer_email], (emailErr, emailResult) => {
    if (emailErr) {
      return res.status(500).json({
        success: false,
        message: "Lỗi kiểm tra email",
        error: emailErr.message,
      });
    }

    const processOrder = (customerId, plainPassword = null) => {
      db.getConnection((connErr, connection) => {
        if (connErr) return res.status(500).json({ success: false, message: "Không thể kết nối DB", error: connErr.message });

        connection.beginTransaction((beginErr) => {
          if (beginErr) return res.status(500).json({ success: false, message: "Lỗi transaction", error: beginErr.message });
       
          // Thêm đơn hàng
          const orderSql = `
            INSERT INTO orders (customer_name, customer_phone, customer_email, address, note,
              total, discount, shipping, final_total, payment_method, status, customer_id, coupon_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          connection.query(
            orderSql,
            [
              customer_name,
              customer_phone,
              customer_email,
              address,
              note,
              total,
              discount,
              shipping,
              final_total,
              payment_method,
              status,
              customerId,
              null, // coupon_id (để null nếu chưa xử lý)
            ],
            (orderErr, orderResult) => {
              if (orderErr) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({
                    success: false,
                    message: "Lỗi lưu đơn hàng",
                    error: orderErr.sqlMessage || orderErr.message,
                  });
                });
              }

              const orderId = orderResult.insertId;
                // Thêm sản phẩm
              const insertItem = (item) =>
                new Promise((resolve, reject) => {
                  const { product_id, quantity, price, size, color } = item;
                  const insertSql = `
                    INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `;
                  connection.query(
                    insertSql,
                    [orderId, product_id, quantity, price, size, color],
                    (itemErr) => {
                      if (itemErr) {
                        return reject(itemErr);
                      }
                      console.log("✅ Đã insert item, cập nhật tồn kho...");
                      const updateStockSql = `
                        UPDATE sanpham
                        SET quantity = quantity - ?
                        WHERE id = ? AND quantity >= ?
                      `;
                      connection.query(
                        updateStockSql,
                        [quantity, product_id, quantity],
                        (stockErr, stockResult) => {
                          if (stockErr) {
                            console.error("❌ Lỗi khi cập nhật tồn kho:", stockErr.message);
                            return reject(stockErr);
                          }
                          if (stockResult.affectedRows === 0) {
                            return reject(new Error(`Sản phẩm ID ${product_id} không đủ hàng tồn`));
                          }
                          console.log("✅ Cập nhật tồn kho thành công:", stockResult);
                          resolve();
                        }
                      );
                    }
                  );
                });

              Promise.all(items.map(insertItem))
                .then(() => {
                  connection.commit(async (commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({
                          success: false,
                          message: "Lỗi khi commit đơn hàng",
                          error: commitErr.message,
                        });
                      });
                    }

                    connection.release();
                    // 👉 SOCKET + NOTIFICATION
                      try {
                        const io = req.app.get("io");
                        const title = "Đặt hàng thành công";
                        const message = `Đơn hàng #${orderId} của bạn đã được tạo thành công.`;

                        // Insert vào DB
                       db.query(
                          "INSERT INTO notifications (user_id, order_id, type, title, message, link) VALUES (?,?,?,?,?,?)",
                          [customerId || null, orderId, "order_created", title, message, orderId],
                          (err, result) => {
                            if (err) {
                              console.error("❌ Lỗi tạo thông báo:", err.message);
                            } else {
                              console.log("✅ Insert notification thành công:", result.insertId);
                            }
                          }
                        );

                        // Emit cho admin (room admin)
                        io.to("admin_room").emit("new_order", {
                          orderId,
                          customer: customer_name,
                          total: final_total,
                          created_at: new Date()
                        });

                        // Emit cho customer (room riêng)
                        if (customerId) {
                          io.to(`user_${customerId}`).emit("new_notification", {
                            orderId,
                            type: "order_created",
                            title,
                            message,
                            link: orderId,
                            created_at: new Date()
                          });
                        }
                      } catch (e) {
                        console.error("❌ Lỗi tạo thông báo:", e.message);
                      }
                  // Nếu MoMo
                    if (payment_method === "MOMO") {
                      const redirectUrl = process.env.URL_WEBSITE;
                      const ipnUrl = `${process.env.URL_WEB}/api/orders/momo-callback`;

                      createMoMoPayment( orderId,final_total, `Thanh toán đơn hàng #${orderId}`, redirectUrl, ipnUrl, (err, momoRes) => {
                        if (err) {
                          return res.status(500).json({
                            success: false,
                            message: "Lỗi kết nối MoMo",
                            error: err.message,
                          });
                        }
                        return res.status(200).json({
                          success: true,
                          message: "Đơn hàng đã tạo, redirect sang MoMo",
                          orderId,
                          payUrl: momoRes.payUrl,
                        });
                      });
                    } else {
                        // Gửi thông báo và email
                        notifyNewOrder({
                          id: orderId,
                          customer: customer_name,
                          total: final_total,
                        });
                      // Nếu COD / bank → gửi mail luôn
                      try {
                          await sendEmails({
                            orderId,
                            customer: customer_name,
                            email: customer_email,
                            phone: customer_phone,
                            address,
                            note,
                            paymentMethod: payment_method,
                            total,
                            discount,
                            shipping,
                            final_total,
                            items,
                            plainPassword,
                          });
                        } catch (e) {
                          console.error("❌ Lỗi gửi email:", e.message);
                        }

                      res.status(201).json({
                        success: true,
                        message: "Đơn hàng đã tạo thành công",
                        orderId,
                      });
                    }
                  });
                })
                .catch((itemErr) => {
                  connection.rollback(() => {
                    connection.release();
                    res.status(500).json({
                      success: false,
                      message: "Lỗi khi lưu chi tiết sản phẩm",
                      error: itemErr.message,
                    });
                  });
                });
            }
          );
        });
      });
    };

    if (emailResult.length > 0) {
      const updateSql = `
        UPDATE customers SET full_name = ?, phone = ?, address = ?, status = ? WHERE email = ?
      `;
      db.query(
        updateSql,
        [customer_name, customer_phone, address, "active", customer_email],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              success: false,
              message: "Lỗi cập nhật khách hàng",
              error: updateErr.message,
            });
          }
          processOrder(emailResult[0].id, null);
        }
      );
    } else {
      
      if (payment_method === "MOMO") {
    // KH chưa tạo → chỉ process order, KH sẽ được tạo trong callback
    processOrder(null, null);
  } else {
    // COD / bank → tạo KH ngay
    const plainPassword = generateRandomPassword();
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    const insertSql = `
      INSERT INTO customers (full_name, phone, email, address, status, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertSql,
      [customer_name, customer_phone, customer_email, address, "active", hashedPassword],
      (custErr, custResult) => {
        if (custErr) return res.status(500).json({ success: false, message: "Lỗi thêm khách hàng", error: custErr.message });
        processOrder(custResult.insertId, plainPassword);
      }
    );
  }
    }
  });
});


router.post("/momo-callback", async (req, res) => {
  try {
    console.log("📩 Callback từ MoMo:", req.body);

    const { orderId, resultCode } = req.body;
    const dbOrderId = orderId.split("_")[0]; // lấy ID gốc từ orderId MoMo

    if (resultCode == 0) {
      console.log("✅ Thanh toán thành công cho order:", dbOrderId);

      // cập nhật trạng thái "Chờ xử lý"
      db.query(
        "UPDATE orders SET status = 'Chờ xử lý' WHERE id = ?",
        [dbOrderId],
        (err) => {
          if (err) {
            console.error("🔥 Lỗi cập nhật order:", err);
            return res.status(500).json({ success: false, error: err.message });
          }
          console.log("✅ Cập nhật trạng thái đơn hàng thành công:", dbOrderId);
        }
      );

      // lấy thông tin order
      db.query("SELECT * FROM orders WHERE id = ?", [dbOrderId], (err, orders) => {
        if (err) {
          console.error("🔥 Lỗi lấy order:", err);
          return;
        }
        const order = orders[0];

        // lấy order_items kèm tên sản phẩm
        db.query(
          `SELECT oi.*, p.name 
           FROM order_items oi
           JOIN sanpham p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [dbOrderId],
          async (err, items) => {
            if (err) {
              console.error("🔥 Lỗi lấy order_items:", err);
              return;
            }

            console.log("🔍 Thông tin order:", order);
            console.log("🛒 Items:", items);

            // kiểm tra khách hàng
            db.query(
              "SELECT * FROM customers WHERE email = ?",
              [order.customer_email],
              async (err, emailResult) => {
                if (err) {
                  console.error("🔥 Lỗi kiểm tra khách hàng:", err);
                  return;
                }

                let plainPassword = null;

                if (emailResult.length > 0) {
                  // khách đã tồn tại → cập nhật thông tin
                  const updateSql = `
                    UPDATE customers SET full_name = ?, phone = ?, address = ?, status = ? WHERE email = ?
                  `;
                  db.query(
                    updateSql,
                    [
                      order.customer_name,
                      order.customer_phone,
                      order.address,
                      "active",
                      order.customer_email,
                    ],
                    (updateErr) => {
                      if (updateErr) {
                        console.error("🔥 Lỗi cập nhật khách hàng:", updateErr);
                      } else {
                        console.log("✅ Đã cập nhật khách hàng:", order.customer_email);
                      }
                    }
                  );
                } else {
                  // khách mới → tạo account
                  plainPassword = generateRandomPassword();
                  const hashedPassword = bcrypt.hashSync(plainPassword, 10);

                  const insertSql = `
                    INSERT INTO customers (full_name, phone, email, address, status, password)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `;
                  db.query(
                    insertSql,
                    [
                      order.customer_name,
                      order.customer_phone,
                      order.customer_email,
                      order.address,
                      "active",
                      hashedPassword,
                    ],
                    (custErr, custResult) => {
                      if (custErr) {
                        console.error("🔥 Lỗi thêm khách hàng:", custErr);
                      } else {
                        console.log("✅ Tạo khách hàng mới thành công:", order.customer_email);
                      }
                    }
                  );
                }

                // gửi email (KH + Admin)
                try {
                  const mailStatus = await sendEmails({
                    orderId: dbOrderId,
                    customer: order.customer_name,
                    email: order.customer_email,
                    phone: order.customer_phone,
                    address: order.address,
                    note: order.note,
                    paymentMethod: order.payment_method,
                    total: order.total,
                    discount: order.discount,
                    shipping: order.shipping,
                    final_total: order.final_total,
                    items,
                    plainPassword, // nếu KH mới thì gửi pass
                  });
                  console.log("📨 Kết quả gửi email:", mailStatus);
                } catch (mailErr) {
                  console.error("🔥 Gửi email thất bại:", mailErr);
                }
              }
            );
          }
        );
      });
    } else {
      console.log("❌ Thanh toán thất bại cho order:", dbOrderId);
      db.query("UPDATE orders SET status = 'failed' WHERE id = ?", [dbOrderId]);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 Lỗi trong momo-callback:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
















// Lấy danh sách đơn hàng
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const offset = (page - 1) * limit;

  const keyword = req.query.keyword || "";
  const status = req.query.status || "";

  // Dùng điều kiện động
  let whereClause = "WHERE 1=1";
  let params = [];

  if (keyword) {
    whereClause += ` AND (o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ?)`;
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  if (status) {
    whereClause += ` AND o.status = ?`;
    params.push(status);
  }

  // 1. Truy vấn tổng số đơn hàng (với điều kiện lọc)
  const countSql = `SELECT COUNT(*) AS total FROM orders o ${whereClause}`;
  db.query(countSql, params, (countErr, countResult) => {
    if (countErr) {
      console.error("Lỗi truy vấn tổng đơn hàng:", countErr);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn tổng đơn hàng",
        error: countErr.message,
      });
    }

    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / limit);

    // 2. Truy vấn đơn hàng có lọc + phân trang
    const orderSql = `
      SELECT 
        o.id AS order_id,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.address,
        o.note,
        o.total,
        o.discount,
        o.shipping,
        o.final_total,
        o.payment_method,
        o.status,
        o.created_at
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const orderParams = [...params, limit, offset];

    db.query(orderSql, orderParams, (orderErr, orders) => {
      if (orderErr) {
        console.error("Lỗi truy vấn đơn hàng:", orderErr);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi truy vấn đơn hàng",
          error: orderErr.message,
        });
      }

      if (orders.length === 0) {
        return res.json({
          orders: [],
          totalOrders,
          totalPages,
          currentPage: page,
        });
      }

      // 3. Truy vấn sản phẩm trong đơn hàng
      const orderIds = orders.map((o) => o.order_id);
      const placeholders = orderIds.map(() => "?").join(", ");
      const itemSql = `
        SELECT 
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          p.name,
          p.size,
          p.color
        FROM order_items oi
        JOIN sanpham p ON oi.product_id = p.id
        WHERE oi.order_id IN (${placeholders})
      `;

      db.query(itemSql, orderIds, (itemErr, items) => {
        if (itemErr) {
          console.error("Lỗi truy vấn chi tiết sản phẩm:", itemErr);
          return res.status(500).json({
            success: false,
            message: "Lỗi khi truy vấn chi tiết sản phẩm",
            error: itemErr.message,
          });
        }

        const groupedItems = {};
        items.forEach((item) => {
          if (!groupedItems[item.order_id]) {
            groupedItems[item.order_id] = [];
          }
          groupedItems[item.order_id].push({
            product_id: item.product_id,
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
          });
        });

        const result = orders.map((order) => ({
          ...order,
          items: groupedItems[order.order_id] || [],
        }));

        res.json({
          orders: result,
          totalOrders,
          totalPages,
          currentPage: page,
        });
      });
    });
  });
});

// Xóa đơn hàng theo ID
router.delete("/delete/:id", (req, res) => {
  const orderId = req.params.id;

  // Kiểm tra nếu ID là hợp lệ (có thể dùng cách khác để kiểm tra tùy theo yêu cầu)
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, message: "ID đơn hàng không hợp lệ" });
  }

  // SQL xóa đơn hàng
  const deleteOrderSql = "DELETE FROM orders WHERE id = ?";
  db.query(deleteOrderSql, [orderId], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa đơn hàng:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi xóa đơn hàng",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tồn tại" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Xóa đơn hàng thành công" });
  });
});
//cập nhật trạng thái 
router.put("/:id/status", async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const io = req.app.get("io");

  try {
    const rows = await new Promise((resolve, reject) => {
      const sql = "SELECT customer_id FROM orders WHERE id = ?";
      db.query(sql, [orderId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const userId = rows[0].customer_id;

    await new Promise((resolve, reject) => {
      const sql = "UPDATE orders SET status = ? WHERE id = ?";
      db.query(sql, [status, orderId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Gọi hàm thông báo
    if (userId) {
      notifyOrderStatusChange(io, orderId, userId, status);
    }

    // Emit cho tất cả (optional)
    io.emit("orderUpdate", { orderId, status });
    console.log("Emit orderUpdate", { orderId, status });
    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/acv/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  // Truy vấn thông tin đơn hàng
  const orderSql = `
    SELECT 
      o.id AS order_id,
      o.customer_name,
      o.customer_phone,
      o.customer_email,
      o.address,
      o.note,
      o.total,
      o.discount,
      o.shipping,
      o.final_total,
      o.payment_method,
      o.status,
      o.created_at
    FROM orders o
    WHERE o.id = ?
  `;

  db.query(orderSql, [orderId], (orderErr, orderResult) => {
    if (orderErr) {
      console.error("Lỗi khi truy vấn đơn hàng:", orderErr);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn đơn hàng",
        error: orderErr.message,
      });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    const order = orderResult[0];

    // Truy vấn chi tiết sản phẩm trong đơn hàng
    const itemsSql = `
      SELECT 
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        oi.size,
        oi.color
      FROM order_items oi
      JOIN sanpham p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;

    db.query(itemsSql, [orderId], (itemsErr, itemsResult) => {
      if (itemsErr) {
        console.error("Lỗi khi truy vấn chi tiết sản phẩm:", itemsErr);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi truy vấn chi tiết sản phẩm",
          error: itemsErr.message,
        });
      }

      // Trả về kết quả chi tiết đơn hàng và các sản phẩm
      res.json({
        success: true,
        order: {
          ...order,
          items: itemsResult,
        },
      });
    });
  });
});
// Node.js + Express
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Lấy thông tin order
    const orders = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM orders WHERE id = ?", [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (orders.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    // Lấy chi tiết order items kèm thông tin sản phẩm
    const items = await new Promise((resolve, reject) => {
      const sql = `
        SELECT oi.*, sp.name AS name, sp.image AS image, sp.price AS price
        FROM order_items oi
        LEFT JOIN sanpham sp ON oi.product_id = sp.id
        WHERE oi.order_id = ?
      `;
      db.query(sql, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    // Trả về order kèm items
    res.json({ success: true, order: { ...orders[0], items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// router.post("/payment-momo", async (req, res) => {
//   //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
// //parameters
// var accessKey = 'F8BBA842ECF85';
// var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
// var orderInfo = 'pay with MoMo';
// var partnerCode = 'MOMO';
// var redirectUrl = 'http://localhost:5000/api/orders/return-momo';
// var ipnUrl = 'http://localhost:5000/api/orders/return-momo';
// var requestType = "payWithMethod";
// var amount = '50000';
// var orderId = partnerCode + new Date().getTime();
// var requestId = orderId;
// var extraData ='';
// var orderGroupId ='';
// var autoCapture =true;
// var lang = 'vi';

// //before sign HMAC SHA256 with format
// //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
// var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
// //puts raw signature
// console.log("--------------------RAW SIGNATURE----------------")
// console.log(rawSignature)
// //signature
// const crypto = require('crypto');
// var signature = crypto.createHmac('sha256', secretKey)
//     .update(rawSignature)
//     .digest('hex');
// console.log("--------------------SIGNATURE----------------")
// console.log(signature)

// //json object send to MoMo endpoint
// const requestBody = JSON.stringify({
//     partnerCode : partnerCode,
//     partnerName : "Test",
//     storeId : "MomoTestStore",
//     requestId : requestId,
//     amount : amount,
//     orderId : orderId,
//     orderInfo : orderInfo,
//     redirectUrl : redirectUrl,
//     ipnUrl : ipnUrl,
//     lang : lang,
//     requestType: requestType,
//     autoCapture: autoCapture,
//     extraData : extraData,
//     orderGroupId: orderGroupId,
//     signature : signature
// });
// //Create the HTTPS objects
// const https = require('https');
// const options = {
//     hostname: 'test-payment.momo.vn',
//     port: 443,
//     path: '/v2/gateway/api/create',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': Buffer.byteLength(requestBody)
//     }
// }
// //Send the request and get the response
// const req2 = https.request(options, res2 => {
//     console.log(`Status: ${res.statusCode}`);
//     console.log(`Headers: ${JSON.stringify(res2.headers)}`);
//     res2.setEncoding('utf8');
//   res2.on('data', (body) => {
//     const response = JSON.parse(body);
//     res.status(201).json({
//       message: "suscess",
//       data:response
//     })
//         console.log('Body: ');
//         console.log(body);
//         console.log('resultCode: ');
//         console.log(JSON.parse(body).resultCode);
//     });
//     res2.on('end', () => {
//         console.log('No more data in response.');
//     });
// })

// req2.on('error', (e) => {
//     console.log(`problem with request: ${e.message}`);
// });
// // write data to request body
// console.log("Sending....")
// req2.write(requestBody);
// req2.end();
// })

// router.get("/return-momo", (req, res) => {
//   console.log("result" , req.query);
  
// })
module.exports = router;
