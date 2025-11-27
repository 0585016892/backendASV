const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");
const moment = require("moment");
// Lấy danh sách chấm công theo user_id
router.get("/", (req, res) => {
  const { user_id, work_date } = req.query;

  if (!user_id)
    return res.status(400).json({ success: false, message: "Thiếu user_id" });

  let query = "SELECT * FROM attendances WHERE user_id = ?";
  let params = [user_id];

  if (work_date) {
    query += " AND DATE(work_date) = ?";
    params.push(work_date);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Lỗi SQL:", err);
      return res
        .status(500)
        .json({ success: false, message: "Lỗi truy vấn", error: err });
    }
    res.json(results);
  });
});
router.get("/month", (req, res) => {
  const user_id = Number(req.query.user_id);
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (!user_id || !year || !month) {
    return res
      .status(400)
      .json({ message: "Thiếu user_id hoặc year hoặc month" });
  }

  // Tính ngày cuối tháng chính xác
  const lastDay = new Date(year, month, 0).getDate(); // tháng trong JS từ 1-12 nhưng Date() nhận 0-based

  const monthStr = month.toString().padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

  const sql = `
    SELECT DISTINCT DATE(work_date) AS day
    FROM attendances
    WHERE user_id = ?
      AND work_date BETWEEN ? AND ?
  `;

  db.query(sql, [user_id, startDate, endDate], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi truy vấn" });
    }

    const days = results.map((r) => r.day.toISOString().split("T")[0]);
    res.json(days);
  });
});
// Tính số giờ làm thực tế (trừ nghỉ trưa nếu có)
function calculateWorkHours(checkIn, checkOut) {
  const inTime = moment(checkIn);
  const outTime = moment(checkOut);

  const noonStart = moment(inTime).hour(12).minute(0);
  const noonEnd = moment(inTime).hour(13).minute(0);

  let duration = moment.duration(outTime.diff(inTime));
  let totalMinutes = duration.asMinutes();

  if (inTime.isBefore(noonEnd) && outTime.isAfter(noonStart)) {
    totalMinutes -= 60; // nghỉ trưa
  }

  return parseFloat((totalMinutes / 60).toFixed(2));
}
router.get("/salary", (req, res) => {
  const user_id = Number(req.query.user_id);
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const salaryPerDay = 300000;
  const overtimeRate = 50000;

  if (!user_id || !year || !month) {
    return res
      .status(400)
      .json({ message: "Thiếu user_id hoặc year hoặc month" });
  }

  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = month.toString().padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

  const sql = `
    SELECT * FROM attendances
    WHERE user_id = ? AND work_date BETWEEN ? AND ?
  `;

  db.query(sql, [user_id, startDate, endDate], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn", err });

    let tongGio = 0;
    let soNgayCong = 0;
    let soLanTre = 0;
    let soLanVeSom = 0;
    let tongGioTangCa = 0;

    rows.forEach((r) => {
      if (!r.check_in_time || !r.check_out_time) return;

      const workHours = calculateWorkHours(r.check_in_time, r.check_out_time);
      tongGio += workHours;

      const checkIn = moment(r.check_in_time);
      const checkOut = moment(r.check_out_time);

      if (checkIn.isAfter(moment(checkIn).hour(8).minute(30))) {
        soLanTre += 1;
      }

      if (checkOut.isBefore(moment(checkOut).hour(17).minute(30))) {
        soLanVeSom += 1;
      }

      if (workHours > 8) {
        tongGioTangCa += workHours - 8;
      }

      soNgayCong += 1;
    });

    const luongNgay = soNgayCong * salaryPerDay;
    const luongTangCa = tongGioTangCa * overtimeRate;
    const tongLuong = luongNgay + luongTangCa;

    res.json({
      soNgayCong,
      tongGio: tongGio.toFixed(2),
      soLanTre,
      soLanVeSom,
      tongGioTangCa: tongGioTangCa.toFixed(2),
      luongNgay,
      luongTangCa,
      tongLuong,
    });
  });
});
// Lưu lương
// POST /api/salary/save
router.post("/save", (req, res) => {
  const {
    user_id,
    full_name,
    email,
    year,
    month,
    soNgayCong,
    tongGio,
    soLanTre,
    soLanVeSom,
    tongGioTangCa,
    luongNgay,
    luongTangCa,
    tongLuong,
  } = req.body;

  if (!user_id || !year || !month) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu thông tin bắt buộc" });
  }

  const sql = `
    INSERT INTO salaries (
      user_id, year, month, soNgayCong, tongGio, soLanTre, soLanVeSom,
      tongGioTangCa, luongNgay, luongTangCa, tongLuong
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      soNgayCong = VALUES(soNgayCong),
      tongGio = VALUES(tongGio),
      soLanTre = VALUES(soLanTre),
      soLanVeSom = VALUES(soLanVeSom),
      tongGioTangCa = VALUES(tongGioTangCa),
      luongNgay = VALUES(luongNgay),
      luongTangCa = VALUES(luongTangCa),
      tongLuong = VALUES(tongLuong)
  `;

  const params = [
    user_id,
    year,
    month,
    soNgayCong,
    tongGio,
    soLanTre,
    soLanVeSom,
    tongGioTangCa,
    luongNgay,
    luongTangCa,
    tongLuong,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Lỗi SQL:", err);
      return res
        .status(500)
        .json({ success: false, message: "Lỗi lưu lương", error: err.message });
    }

    // Gửi email thông báo lương
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

 const content = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <p>Xin chào <strong>${full_name}</strong>,</p>

    <p>Đây là bảng lương của bạn trong tháng <strong>${month}/${year}</strong>:</p>

    <table cellpadding="10" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th style="text-align: left;">Mục</th>
          <th style="text-align: right;">Giá trị</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ngày công</td>
          <td style="text-align: right;">${soNgayCong} ngày</td>
        </tr>
        <tr>
          <td>Tổng giờ làm</td>
          <td style="text-align: right;">${tongGio} giờ</td>
        </tr>
        <tr>
          <td>Số lần đi trễ</td>
          <td style="text-align: right;">${soLanTre}</td>
        </tr>
        <tr>
          <td>Số lần về sớm</td>
          <td style="text-align: right;">${soLanVeSom}</td>
        </tr>
        <tr>
          <td>Giờ tăng ca</td>
          <td style="text-align: right;">${tongGioTangCa} giờ</td>
        </tr>
        <tr>
          <td><strong>Lương chính</strong></td>
          <td style="text-align: right;"><strong>${Number(luongNgay).toLocaleString("vi-VN")} đ</strong></td>
        </tr>
        <tr>
          <td><strong>Lương tăng ca</strong></td>
          <td style="text-align: right;"><strong>${Number(luongTangCa).toLocaleString("vi-VN")} đ</strong></td>
        </tr>
        <tr style="background-color: #dff0d8;">
          <td><strong>👉 Tổng lương</strong></td>
          <td style="text-align: right;"><strong>${Number(tongLuong).toLocaleString("vi-VN")} đ</strong></td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 20px;">Trân trọng,<br><strong>Phòng Nhân sự</strong></p>
  </div>
`.trim();

    transporter.sendMail(
      {
        from: `"HR Finly" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Bảng lương tháng ${month}/${year} của bạn`,
        text: content,
      },
      (mailErr) => {
        if (mailErr) {
          console.error("Gửi email lỗi:", mailErr);
          return res.status(500).json({
            success: false,
            message: "Lưu lương OK nhưng gửi mail lỗi",
            error: mailErr.message,
          });
        }

        res.json({
          success: true,
          message: "Lưu và gửi email lương thành công",
        });
      }
    );
  });
});

// Kiểm tra đã lưu lương chưa
router.get("/check", (req, res) => {
  const { user_id, year, month } = req.query;

  if (!user_id || !year || !month) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu thông tin kiểm tra" });
  }

  const sql = `SELECT id FROM salaries WHERE user_id = ? AND year = ? AND month = ? LIMIT 1`;
  db.query(sql, [user_id, year, month], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, message: "Lỗi kiểm tra" });
    return res.json({ saved: rows.length > 0 });
  });
});

module.exports = router;
