const express = require("express");
const router = express.Router();
const db = require("../db");
const upload = require("../middleware/upload");
const path = require("path");
const { emitAttendanceToUser } = require("../sockets/attendanceSocket");
// ✅ API 1: Lấy danh sách labels từ bảng employees
router.get("/labels", (req, res) => {
  db.query("SELECT id, full_name, avatar FROM employees", (err, results) => {
    
    if (err) return res.status(500).json({ error: "Không thể lấy dữ liệu" });

    const labels = results.map((emp) => ({
      id: emp.id,
      label: emp.full_name,
      avatar: emp.avatar, // bạn có thể dùng ảnh base64 hoặc url
    }));

    res.json(labels);
  });
});
// API CHẤM CÔNG CHECK-IN
// === CHECK-IN ===
router.post("/attendance", upload.single("img_checkin"), (req, res) => {
  console.log(req.file);
  const user_id = req.body.user_id;
  const now = new Date();

  const hour = now.getHours();
  const minute = now.getMinutes();
  const vnOffset = 7 * 60 * 60 * 1000;
  const vnNow = new Date(now.getTime() + vnOffset);
  const today = vnNow.toISOString().split("T")[0];

  if (!user_id || !req.file) {
    return res.status(400).json({ error: "Thiếu dữ liệu (user_id hoặc ảnh)" });
  }

  // ✅ req.savedFilename là custom, nên phải đảm bảo middleware lưu tên này
  const img_checkin = `/uploads/checkin/${req.file.filename}`;

  db.query(
    "SELECT * FROM attendances WHERE user_id = ? AND work_date = ?",
    [user_id, today],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Lỗi truy vấn DB" });

      if (rows.length === 0) {
        let status = "on-time";
        if (hour > 8 || (hour === 8 && minute > 30)) {
          status = "late";
        }

        db.query(
          "INSERT INTO attendances SET ?",
          {
            user_id,
            work_date: today,
            check_in_time: now,
            img_checkin,
            status,
          },
          (err2) => {
            if (err2)
              return res.status(500).json({ error: "Không thể chấm công" });

            emitAttendanceToUser(user_id, {
              time: now,
              img: img_checkin,
              status: "checked-in",
            });

            return res.json({
              status: "checked-in",
              time: now,
              img: img_checkin,
            });
          }
        );
      } else {
        return res.json({
          status: "already checked-in",
          time: rows[0].check_in_time,
          img: rows[0].img_checkin,
        });
      }
    }
  );
});

// === CHECK-OUT ===
router.post("/checkout", upload.single("img_checkout"), (req, res) => {
  const user_id = req.body.user_id;
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const img_checkout = `/uploads/checkout/${req.savedFilename}`;

  if (!user_id || !req.file) {
    return res.status(400).json({ error: "Thiếu user_id hoặc ảnh" });
  }

  // Tìm bản ghi hôm nay đã check-in
  db.query(
    "SELECT * FROM attendances WHERE user_id = ? AND work_date = ?",
    [user_id, today],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(400).json({ error: "Chưa check-in hôm nay" });
      }

      const row = rows[0];
      if (row.check_out_time) {
        return res.json({
          status: "already checked-out",
          time: row.check_out_time,
        });
      }

      // Cập nhật giờ checkout
      db.query(
        "UPDATE attendances SET check_out_time = ?, img_checkout = ? WHERE id = ?",
        [now, img_checkout, row.id],
        (err2) => {
          if (err2)
            return res.status(500).json({ error: "Lỗi cập nhật checkout" });

          return res.json({ status: "checked-out", time: now });
        }
      );
    }
  );
});

module.exports = router;
