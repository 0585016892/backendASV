// routes/settings.js
const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../db"); // mysql thường
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "public/uploads/logo"); // .. để ra khỏi thư mục routes

// tạo folder nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// PUT /settings
router.put("/", upload.fields([
  { name: "site_logo", maxCount: 1 },
  { name: "site_favicon", maxCount: 1 }
]), (req, res) => {
  const updates = req.body; // các trường khác
  const files = req.files;  // các file upload

  // Nếu có logo upload, set URL
  if (files?.site_logo?.[0]) {
    updates.site_logo = `/uploads/logo/${files.site_logo[0].filename}`;
  }
  if (files?.site_favicon?.[0]) {
    updates.site_favicon = `/uploads/logo/${files.site_favicon[0].filename}`;
  }

  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: "No settings provided" });

  let count = 0;
  let hasError = false;

  keys.forEach(key => {
    const value = updates[key];
    db.query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value],
      (err) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          return res.status(500).json({ error: err.message });
        }
        count++;
        if (count === keys.length) {
          res.json({ message: "Cập nhật settings thành công!", updates });
        }
      }
    );
  });
});
/* =============================
   1) Lấy tất cả settings
============================= */
router.get("/", (req, res) => {
  db.query("SELECT setting_key, setting_value FROM settings", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const settings = {};
    rows.forEach(r => (settings[r.setting_key] = r.setting_value));
    res.json(settings);
  });
});

/* =============================
   2) Lưu / Cập nhật settings
   Dùng PUT /api/settings
============================= */




module.exports = router;
