const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");

function createVnpayUrl({ orderId, final_total, orderInfo, ipAddr }) {
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_Amount: Math.round(final_total) * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: orderInfo.replace(/[^a-zA-Z0-9 ]/g, ""), // loại bỏ ký tự lạ
    vnp_OrderType: "billpayment",
    vnp_Locale: "vn",
    vnp_IpAddr: ipAddr === "::1" ? "127.0.0.1" : ipAddr,

    // 👉 Trả về frontend để người dùng thấy kết quả
    vnp_ReturnUrl: `http://localhost:3000/vnpay-return`,

    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  // 👉 Bắt buộc sắp xếp theo key alphabet để tạo chữ ký đúng
  const sortedParams = Object.fromEntries(Object.entries(vnp_Params).sort());

  // 👉 Tạo chuỗi ký (query string) không encode để tạo secure hash
  const signData = qs.stringify(sortedParams, { encode: false });

  const secureHash = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(signData, "utf-8")
    .digest("hex");

  // 👉 Thêm vào tham số để gửi đi
  sortedParams.vnp_SecureHash = secureHash;

  const paymentUrl =
    process.env.VNP_URL + "?" + qs.stringify(sortedParams, { encode: true });

  console.log("🔍 signData:", signData);
  console.log("🔐 secureHash:", secureHash);
  console.log("🌐 paymentUrl:", paymentUrl);

  return paymentUrl;
}

module.exports = { createVnpayUrl };
