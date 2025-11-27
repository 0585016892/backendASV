const express = require("express");
const router = express.Router();
const db = require("../db"); // Dùng mysql dạng callback
const ExcelJS = require("exceljs");

// ✅ Lấy danh sách chấm công theo ngày (callback)
router.get("/date/:date", (req, res) => {
  const { date } = req.params;

  const sql = `
    SELECT a.*, u.*
    FROM attendances a
    JOIN employees u ON a.user_id = u.id
    WHERE a.work_date = ?
  `;

  db.query(sql, [date], (err, rows) => {
    if (err) {
      console.error("Lỗi lấy chấm công theo ngày:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    res.json(rows);
  });
});

// ✅ Export chấm công theo tháng (callback)
router.get("/export/:month", (req, res) => {
  const { month } = req.params;

  const sql = `
    SELECT a.*, u.*
    FROM attendances a
    JOIN employees u ON a.user_id = u.id
    WHERE DATE_FORMAT(a.work_date, '%Y-%m') = ?
    ORDER BY a.work_date ASC
  `;

  db.query(sql, [month], (err, rows) => {
    if (err) {
      console.error("Lỗi export chấm công:", err);
      return res.status(500).json({ message: "Lỗi máy chủ khi export" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cham Cong");

    worksheet.columns = [
      { header: "Ngày", key: "work_date", width: 15 },
      { header: "Mã NV", key: "user_id", width: 10 },
      { header: "Tên nhân viên", key: "full_name", width: 25 },
      { header: "Check In", key: "check_in_time", width: 20 },
      { header: "Check Out", key: "check_out_time", width: 20 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Ghi chú", key: "note", width: 30 },
    ];

    rows.forEach((row) => {
      worksheet.addRow({
        work_date: row.work_date,
        user_id: row.user_id,
        full_name: row.full_name,
        check_in_time: row.check_in_time,
        check_out_time: row.check_out_time,
        status: row.status,
        note: row.note || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=chamcong-${month}.xlsx`
    );

    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Lỗi khi ghi file Excel:", error);
        res.status(500).json({ message: "Lỗi khi tạo file Excel" });
      });
  });
});
router.get("/filter", (req, res) => {
  const name = req.query.name || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM attendances a
    JOIN employees u ON a.user_id = u.id
    WHERE u.full_name LIKE ?
  `;

  const dataSql = `
    SELECT a.*, u.full_name
    FROM attendances a
    JOIN employees u ON a.user_id = u.id
    WHERE u.full_name LIKE ?
    ORDER BY a.work_date DESC
    LIMIT ? OFFSET ?
  `;

  const searchName = `%${name}%`;

  // Truy vấn tổng số bản ghi
  db.query(countSql, [searchName], (countErr, countResult) => {
    if (countErr) {
      console.error("Lỗi đếm tổng bản ghi:", countErr);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Truy vấn dữ liệu phân trang
    db.query(dataSql, [searchName, limit, offset], (dataErr, dataRows) => {
      if (dataErr) {
        console.error("Lỗi lấy dữ liệu:", dataErr);
        return res.status(500).json({ message: "Lỗi máy chủ" });
      }

      res.json({
        total,
        totalPages,
        currentPage: page,
        data: dataRows,
      });
    });
  });
});

module.exports = router;
