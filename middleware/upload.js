// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🔧 Hàm đảm bảo thư mục tồn tại
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Xác định đường dẫn thư mục lưu theo tên field
    let subFolder = "others";
    if (file.fieldname === "img_checkin") subFolder = "checkin";
    else if (file.fieldname === "img_checkout") subFolder = "checkout";

    const uploadPath = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      subFolder
    );
    console.log("✅ Uploading to:", uploadPath);
    ensureDir(uploadPath); // 🔧 Đảm bảo thư mục tồn tại

    req.uploadSubFolder = subFolder; // dùng nếu muốn sau này
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    req.savedFilename = filename;
    cb(null, filename);
  },
});

const upload = multer({ storage });

module.exports = upload;
