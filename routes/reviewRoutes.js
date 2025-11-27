const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { notifyNewReview} = require("../sockets/notiSocket");

// ------------------- Cấu hình upload ảnh -------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "public/uploads/reviews";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Chỉ cho phép file ảnh (jpg, jpeg, png, gif)!"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ------------------- API Reviews -------------------

// Lấy danh sách đánh giá theo productId
router.get("/:productId", (req, res) => {
  const { productId } = req.params;
  const { rating, hasImage, hasVideo, page = 1, limit = 5 } = req.query;

  const offset = (page - 1) * limit;

  // Base query
  let query = `
    SELECT r.*, u.full_name, u.phone 
    FROM reviews r 
    JOIN customers u ON r.user_id = u.id 
    WHERE r.product_id = ?`;
  let params = [productId];

  if (rating) {
    query += " AND r.rating = ?";
    params.push(rating);
  }
  if (hasImage) query += " AND JSON_LENGTH(r.images) > 0";
  if (hasVideo) query += " AND JSON_LENGTH(r.videos) > 0";

  // Count tổng số review
  let countQuery = `
    SELECT COUNT(*) as total
    FROM reviews r
    WHERE r.product_id = ?`;
  let countParams = [productId];

  if (rating) {
    countQuery += " AND r.rating = ?";
    countParams.push(rating);
  }
  if (hasImage) countQuery += " AND JSON_LENGTH(r.images) > 0";
  if (hasVideo) countQuery += " AND JSON_LENGTH(r.videos) > 0";

  query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Lỗi đếm số đánh giá" });
    }

    const total = countResult[0].total;

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi lấy đánh giá" });
      }

      // Parse JSON an toàn
      const result = rows.map((r) => {
        let images = [];
        let videos = [];
        try {
          images = r.images && r.images !== "null" && r.images !== "" ? JSON.parse(r.images) : [];
        } catch (e) {
          images = [];
        }
        try {
          videos = r.videos && r.videos !== "null" && r.videos !== "" ? JSON.parse(r.videos) : [];
        } catch (e) {
          videos = [];
        }

        return { ...r, images, videos };
      });

      res.json({
        data: result,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    });
  });
});


// Upload ảnh đánh giá
router.post("/upload", upload.array("images", 5), (req, res) => {
  try {
    const files = req.files.map((file) => file.filename);
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi upload ảnh" });
  }
});

// Thêm đánh giá
router.post("/", upload.array("images", 5), (req, res) => {
  const { product_id, user_id, rating, content, videos, variant } = req.body;

  let imagePaths = [];
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map((file) => `/uploads/reviews/${file.filename}`);
  } else if (req.body.images) {
    try {
      imagePaths = JSON.parse(req.body.images);
    } catch (e) {
      imagePaths = [];
    }
  }

  let videoPaths = [];
  if (videos) {
    try {
      videoPaths = JSON.parse(videos);
    } catch (e) {
      videoPaths = [];
    }
  }

  const insertQuery = `
    INSERT INTO reviews (product_id, user_id, rating, content, images, variant, is_verified, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    insertQuery,
    [
      product_id,
      user_id,
      rating,
      content,
      JSON.stringify(imagePaths),
      variant || null,
      false, // mặc định chưa xác minh đã mua
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi thêm đánh giá" });
      }

      // tạo object review vừa thêm
      const newReview = {
        id: result.insertId,
        product_id,
        user_id,
        rating,
        content,
        images: imagePaths,
        videos: videoPaths,
        variant: variant || null,
        is_verified: 0,
        created_at: new Date(),
      };

      // phát socket cho tất cả client
      const io = req.app.get("io");
      io.emit("newReview", newReview);
      notifyNewReview({
                          id:result.insertId,
                         
                        });
      res.json({ message: "Đánh giá thành công", review: newReview });
    }
  );
});


// Like / Hữu ích
router.put("/:id/helpful", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi update helpful" });
    res.json({ message: "Đã ghi nhận đánh giá hữu ích" });
  });
});

// Shop phản hồi đánh giá
router.post("/:id/reply", (req, res) => {
  const { id } = req.params;
  const { reply_content } = req.body;

  db.query("UPDATE reviews SET reply = ? WHERE id = ?", [reply_content, id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi phản hồi" });
    
    res.json({ message: "Đã phản hồi đánh giá" });
  });
});
// admin
router.get("/", (req, res) => {
  const { productId, rating, hasImage, hasVideo, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  if (productId) {
    // ✅ Trường hợp lấy chi tiết review theo sản phẩm
    let query = `
      SELECT r.*, u.full_name, u.phone, p.name AS product_name
      FROM reviews r
      JOIN customers u ON r.user_id = u.id
      JOIN sanpham p ON r.product_id = p.id
      WHERE r.product_id = ?
    `;
    let params = [productId];

    if (rating) {
      query += " AND r.rating = ?";
      params.push(rating);
    }
    if (hasImage === "true") query += " AND JSON_LENGTH(r.images) > 0";
    if (hasVideo === "true") query += " AND JSON_LENGTH(r.videos) > 0";

    let countQuery = `SELECT COUNT(*) as total FROM reviews r WHERE r.product_id = ?`;
    let countParams = [productId];
    if (rating) {
      countQuery += " AND r.rating = ?";
      countParams.push(rating);
    }
    if (hasImage === "true") countQuery += " AND JSON_LENGTH(r.images) > 0";
    if (hasVideo === "true") countQuery += " AND JSON_LENGTH(r.videos) > 0";

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) return res.status(500).json({ error: "Lỗi đếm review" });

      const total = countResult[0].total;

      db.query(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy review" });

        const result = rows.map((r) => {
          let imgs = [];
          let vids = [];
          try { imgs = r.images && r.images !== "null" ? JSON.parse(r.images) : []; } catch {}
          try { vids = r.videos && r.videos !== "null" ? JSON.parse(r.videos) : []; } catch {}
          return { ...r, images: imgs, videos: vids };
        });

        res.json({
          data: result,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        });
      });
    });
  } else {
    // ✅ Trường hợp lấy tổng hợp theo sản phẩm
    const query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        COUNT(r.id) AS total_reviews,
        AVG(r.rating) AS avg_rating,
        SUM(CASE WHEN r.is_verified = 1 THEN 1 ELSE 0 END) AS verified_reviews,
        SUM(CASE WHEN r.is_verified = 0 THEN 1 ELSE 0 END) AS pending_reviews,
        MAX(r.created_at) AS last_review_date,
        -- lấy nội dung + ảnh review mới nhất
        (SELECT content FROM reviews WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_content,
        (SELECT images FROM reviews WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_images
      FROM sanpham p
      JOIN reviews r ON p.id = r.product_id
      GROUP BY p.id, p.name
      ORDER BY last_review_date DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(DISTINCT product_id) as total_products FROM reviews`;

    db.query(countQuery, (err, countResult) => {
      if (err) return res.status(500).json({ error: "Lỗi đếm sản phẩm có review" });

      const total = countResult[0].total_products;

      db.query(query, [Number(limit), Number(offset)], (err, rows) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy danh sách review" });

        const result = rows.map((r) => {
          let imgs = [];
          try { imgs = r.latest_images && r.latest_images !== "null" ? JSON.parse(r.latest_images) : []; } catch {}
          return { ...r, latest_images: imgs };
        });

        res.json({
          data: result,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        });
      });
    });
  }
});


router.put("/:id/approve", (req, res) => {
  const reviewId = req.params.id;

  const query = "UPDATE reviews SET is_verified = 1 WHERE id = ?";
  db.query(query, [reviewId], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi duyệt review" });

    // Trả về cho FE, không emit ở đây
    res.json({ success: true, reviewId, message: "Đã duyệt đánh giá thành công!" });
  });
});

// Xóa review (admin)
router.delete("/:id", (req, res) => {
  const reviewId = req.params.id;

  const query = "DELETE FROM reviews WHERE id = ?";
  db.query(query, [reviewId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Lỗi xóa review" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy review" });
    }
    res.json({ message: "Đã xóa đánh giá thành công!" });
  });
});

module.exports = router;
