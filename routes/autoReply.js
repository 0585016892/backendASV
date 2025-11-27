// routes/autoReply.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Cấu hình lưu file

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Lấy danh sách từ khoá
router.get("/", (req, res) => {
  const { keyword } = req.query;
  const sql = keyword
    ? "SELECT * FROM chatbot_replies WHERE keyword LIKE ?"
    : "SELECT * FROM chatbot_replies";
  const values = keyword ? [`%${keyword}%`] : [];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ success: false, err });
    res.json(result);
  });
});

// Thêm từ khoá
router.post("/add", (req, res) => {
  const { keyword, reply } = req.body;
  const sql = "INSERT INTO chatbot_replies (keyword, reply) VALUES (?, ?)";
  db.query(sql, [keyword, reply], (err, result) => {
    if (err) return res.status(500).json({ success: false, err });
    res.json({ success: true });
  });
});

// Cập nhật từ khoá
router.put("/update/:id", (req, res) => {
  const { keyword, reply } = req.body;
  const sql = "UPDATE chatbot_replies SET keyword = ?, reply = ? WHERE id = ?";
  db.query(sql, [keyword, reply, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, err });
    res.json({ success: true });
  });
});

// Xoá từ khoá
router.delete("/delete/:id", (req, res) => {
  db.query(
    "DELETE FROM chatbot_replies WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, err });
      res.json({ success: true });
    }
  );
});

router.post("/import-excel", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file được tải lên" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // console.log("📄 Dữ liệu đọc từ Excel:", data); // ✅ debug

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "File không chứa dữ liệu hợp lệ" });
    }

    const values = data.map((row) => [row.chatbot_replies || row.keyword, row.reply]);

    const sql = "INSERT INTO chatbot_replies (chatbot_replies, reply) VALUES ?";
    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error("Import lỗi:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, inserted: result.affectedRows });
    });
  } catch (err) {
    console.error("Lỗi xử lý file Excel:", err);
    res
      .status(500)
      .json({ success: false, error: "Định dạng file không hợp lệ" });
  }
});
// API: Tự động sinh rule từ GPT và lưu vào DB
router.post("/suggest_gemini_a", async (req, res) => {
  try {
    const { prompt } = req.body;
    const actualPrompt = prompt || "Tạo các rule chatbot cho shop quần áo";

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash-001",
    });
    const result = await model.generateContent(actualPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Kết quả từ Gemini:\n", text);

    const lines = text
      .split("\n")
      .map((line) => line.replace(/^[-–•🔹]*\s*/, "").trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      return res.json({ success: false, message: "Không có phản hồi hợp lệ từ Gemini" });
    }

    const keyword = actualPrompt.toLowerCase().includes("giá")
      ? "giá"
      : actualPrompt.toLowerCase().includes("ship")
      ? "ship"
      : actualPrompt.toLowerCase().includes("đổi")
      ? "đổi trả"
      : actualPrompt.toLowerCase().includes("bảo hành")
      ? "bảo hành"
      : "chung";

    const values = lines.map((reply) => [keyword, reply]);

    const sql = "INSERT INTO chatbot_replies (chatbot_replies, reply) VALUES ?";
    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error("Lỗi lưu DB:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        inserted: result.affectedRows,
        replies: lines,
      });
    });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi gọi Gemini",
      error: error.message,
    });
  }
});

module.exports = router;
