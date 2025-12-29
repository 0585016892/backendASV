const express = require("express");
const router = express.Router();
const db = require("../db"); // Đảm bảo bạn đã kết nối đúng với MySQL
const multer = require("multer");
const path = require("path");
const ExcelJS = require("exceljs");
const { writeLog } = require("../utils/logService");
const { log } = require("console");

// Cấu hình nơi lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // thư mục lưu ảnh
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Middleware để xử lý JSON và x-www-form-urlencoded
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// WEBSITE
router.get("/category/:slug", (req, res) => {
  const categorySlug = req.params.slug;

  // Truy vấn danh mục chính dựa trên slug
  db.query(
    "SELECT * FROM categories WHERE slug = ?",
    [categorySlug],
    (err, categoryResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }

      if (categoryResults.length === 0) {
        return res.status(404).send("Category not found");
      }

      // Lấy categoryTitle
      const categoryTitle = categoryResults[0].name;

      const categoryId = categoryResults[0].id;

      // Truy vấn sản phẩm dựa vào category_id
      db.query(
        `SELECT sanpham.*, coupons.discount_type AS discount_type, coupons.discount_value AS discount_value
   FROM sanpham
   LEFT JOIN coupons ON sanpham.coupon_id = coupons.id
   WHERE sanpham.categoryId = ?`,
        [categoryId],
        (err, productResults) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
          }

          // Trả về categoryTitle và sản phẩm
          res.json({
            categoryTitle,
            products: productResults,
          });
        }
      );
    }
  );
});
router.get("/products/:slug", (req, res) => {
  const { slug } = req.params;

  const productSql = `
    SELECT 
      sanpham.*, 
      coupons.discount_type AS discount_type, 
      coupons.discount_value AS discount_value 
    FROM sanpham 
    LEFT JOIN coupons ON sanpham.coupon_id = coupons.id 
    WHERE slug = ?
  `;

  db.query(productSql, [slug], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy sản phẩm:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const product = results[0];

    // Tiếp tục lấy ảnh phụ
    const subImgSql = `SELECT image_path FROM product_images WHERE product_id = ?`;

    db.query(subImgSql, [product.id], (imgErr, imgResults) => {
      if (imgErr) {
        console.error("Lỗi khi lấy ảnh phụ:", imgErr);
        return res.status(500).json({ message: "Lỗi khi lấy ảnh phụ" });
      }

      product.subImages = imgResults.map((row) => row.image_path); // mảng ảnh phụ
      res.json(product);
    });
  });
});

// GET /api/products/search?keyword=giay
router.get("/search", (req, res) => {
  const keyword = req.query.keyword || "";
  const searchQuery = `
    SELECT * FROM sanpham 
    WHERE name LIKE ?
  `;

  db.query(searchQuery, [`%${keyword}%`], (err, results) => {
    if (err) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", err);
      return res.status(500).json({ error: "Server error" });
    }

    res.json(results);
  });
});
router.get("/related/:categoryId/:productId", (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const productId = Number(req.params.productId);

  if (!categoryId || !productId) {
    return res.status(400).json({ message: "Thiếu tham số" });
  }

  const sql = `
    SELECT *
    FROM sanpham
    WHERE categoryId = ? AND id != ?
    ORDER BY id DESC
    LIMIT 20
  `;

  db.query(sql, [categoryId, productId], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy sản phẩm liên quan:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }

    res.json({
      success: true,
      data: results
    });
  });
});


// QUẢN TRỊ
// Endpoint để lấy danh sách danh mục
router.get("/danhmuc", (req, res) => {
  const sql = "SELECT * FROM categories WHERE parent_id != 0"; // Giả sử bảng của bạn là 'categories'
  db.query(sql, (err, categories) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi lấy danh mục" });
    }
    res.json({ categories });
  });
});

// Route để thêm sản phẩm mới
router.post(
  "/add",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 10 },
  ]),
  (req, res) => {
    const {
      name,
      slug,
      description,
      quantity,
      size,
      color,
      price,
      status,
      brand,
      categoryId,
      couponId,
      userId
    } = req.body;
    
    const image =
      req.files && req.files.image ? req.files.image[0].filename : null;
    const subImages =
      req.files && req.files.subImages ? req.files.subImages : [];

    if (
      !name ||
      !categoryId ||
      !quantity ||
      !slug ||
      !price ||
      !status ||
      !brand ||
      !image
    ) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập đầy đủ thông tin và ảnh." });
    }

    let sizeStr = "",
      colorStr = "";

    try {
      const parsedSize = Array.isArray(size) ? size : JSON.parse(size);
      sizeStr = Array.isArray(parsedSize) ? parsedSize.join(",") : String(size);
    } catch (err) {
      sizeStr = String(size);
    }

    try {
      const parsedColor = Array.isArray(color) ? color : JSON.parse(color);
      colorStr = Array.isArray(parsedColor)
        ? parsedColor.join(",")
        : String(color);
    } catch (err) {
      colorStr = String(color);
    }

    const sql = `
    INSERT INTO sanpham (name, slug, image, description, quantity, size, color, price, status, brand, categoryId, coupon_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(
      sql,
      [
        name,
        slug,
        image,
        description,
        quantity,
        sizeStr,
        colorStr,
        price,
        status,
        brand,
        categoryId,
        couponId && couponId !== "" ? couponId : null,
      ],
      (err, result) => {
        if (err) {
          console.error("Lỗi khi thêm sản phẩm:", err);
          return res
            .status(500)
            .json({ error: "Lỗi khi thêm sản phẩm vào cơ sở dữ liệu." });
        }
        // ----------------------------
          // GHI LOG HỆ THỐNG
          // ----------------------------
        const userIdAdmin = userId || null;
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"];

        // Ghi log theo format bạn muốn
        writeLog(
          userIdAdmin,
          "create",
          "product",
          `Người dùng thêm sản phẩm ${name}`,
          null,
          JSON.stringify({
            name,
            slug,
            image,
            description,
            quantity,
            size: sizeStr,
            color: colorStr,
            price,
            status,
            brand,
            categoryId,
            couponId: couponId || null
          }),
          ip,
          userAgent
        );
          // ----------------------------

        if (subImages.length > 0) {
          const subImgSQL = `
        INSERT INTO product_images (product_id, image_path) VALUES ?
      `;
          const values = subImages.map((f) => [result.insertId, f.filename]);
          db.query(subImgSQL, [values], (err2) => {
            if (err2) {
              console.error("Lỗi khi lưu ảnh phụ:", err2);
              return res.status(500).json({ error: "Lỗi khi lưu ảnh phụ." });
            }
            const io = req.app.get("io");
              io.emit("addProductTrue", { 
                productId: result.insertId,
                name,
                slug,
                image,
                price,
                status,
                color: colorStr,
                categoryId,
                discount_type: null,
                discount_value: null
              });
            res.status(201).json({
              message: "Thêm sản phẩm và ảnh phụ thành công!",
              product_id: result.insertId,
              image: image,
            });
          });
        } else {
           const io = req.app.get("io");
          io.emit("addProductTrue", { 
                productId: result.insertId,
                name,
                slug,
                image,
                price,
                status,
                color: colorStr,
                categoryId,
                discount_type: null,
                discount_value: null
              });
          res.status(201).json({
            message: "Thêm sản phẩm thành công!",
            product_id: result.insertId,
            image: image,
          });
        }
      }
    );
  }
);

// Route để lấy tất cả sản phẩm (có lọc)
router.get("/", (req, res) => {
  console.log("Nhận yêu cầu GET /api/products");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1 = 1";

  // Lọc theo danh mục
  if (req.query.categoryId) {
    whereClause += ` AND sanpham.categoryId = ${db.escape(
      req.query.categoryId
    )}`;
  }

  // Lọc theo trạng thái
  if (req.query.status) {
    whereClause += ` AND sanpham.status = ${db.escape(req.query.status)}`;
  }

  // Lọc theo điểm SEO
  if (req.query.seo) {
    whereClause += ` AND sanpham.seo_score = ${db.escape(req.query.seo)}`;
  }

  // Tìm kiếm theo từ khóa
  if (req.query.keyword) {
    whereClause += ` AND (sanpham.name LIKE ${db.escape(
      "%" + req.query.keyword + "%"
    )} OR sanpham.description LIKE ${db.escape(
      "%" + req.query.keyword + "%"
    )})`;
  }

  // Đếm tổng số sản phẩm
  const sqlCount = `SELECT COUNT(*) AS total FROM sanpham ${whereClause}`;

  // Lấy danh sách sản phẩm kèm theo coupon
  const sqlProducts = `
    SELECT 
      sanpham.*, 
      categories.name AS categoryName,
      coupons.code AS couponCode
    FROM sanpham
    LEFT JOIN categories 
      ON sanpham.categoryId = categories.id
    LEFT JOIN coupons 
      ON sanpham.coupon_id = coupons.id
    ${whereClause}
    ORDER BY sanpham.created_at DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  // Thực thi truy vấn đếm số lượng sản phẩm
  db.query(sqlCount, (err, countResults) => {
    if (err) {
      console.error("Lỗi khi lấy tổng số sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi khi lấy tổng số sản phẩm." });
    }

    const totalProducts = countResults[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Thực thi truy vấn lấy sản phẩm
    db.query(sqlProducts, (err, products) => {
      if (err) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", err);
        return res
          .status(500)
          .json({ error: "Lỗi khi lấy danh sách sản phẩm." });
      }

      res.status(200).json({
        products,
        totalProducts,
        totalPages,
        currentPage: page,
      });
    });
  });
});

// Route để lấy sản phẩm theo ID
router.get("/:id", (req, res) => {
  console.log(`Nhận yêu cầu GET /api/products/${req.params.id}`);
  const { id } = req.params;

  const productSql = `
    SELECT 
      sanpham.*, 
      categories.name AS categoryName,
      coupons.code AS couponCode
    FROM 
      sanpham
    LEFT JOIN 
      categories ON sanpham.categoryId = categories.id
    LEFT JOIN
      coupons ON sanpham.coupon_id = coupons.id  
    WHERE sanpham.id = ?
  `;

  db.query(productSql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy sản phẩm theo ID:", err);
      return res.status(500).json({ error: "Lỗi khi lấy dữ liệu sản phẩm." });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm với ID này." });
    }

    const product = results[0];

    // Lấy danh sách ảnh phụ
    const subImagesSql = `SELECT image_path FROM product_images WHERE product_id = ?`;

    db.query(subImagesSql, [id], (err2, subImageResults) => {
      if (err2) {
        console.error("Lỗi khi lấy ảnh phụ:", err2);
        return res.status(500).json({ error: "Lỗi khi lấy ảnh phụ." });
      }

      // Gắn danh sách ảnh phụ vào kết quả
      product.subImages = subImageResults.map((row) => row.image_path);

      res.status(200).json(product);
    });
  });
});

// Route để cập nhật sản phẩm
router.put("/update/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    quantity,
    size,
    color,
    price,
    status,
    brand,
  } = req.body;

  const image = req.file ? req.file.filename : null;

  let sql;
  let params;

  if (image) {
    // Có ảnh mới
    sql = `
      UPDATE sanpham 
      SET 
        name = ?, 
        slug = ?, 
        image = ?, 
        description = ?, 
        quantity = ?, 
        size = ?, 
        color = ?, 
        price = ?, 
        status = ?, 
        brand = ? 
      WHERE id = ?
    `;
    params = [
      name,
      slug,
      image,
      description,
      quantity,
      size,
      color,
      price,
      status,
      brand,
      id,
    ];
  } else {
    // Không có ảnh mới, giữ nguyên ảnh cũ
    sql = `
      UPDATE sanpham 
      SET 
        name = ?, 
        slug = ?, 
        description = ?, 
        quantity = ?, 
        size = ?, 
        color = ?, 
        price = ?, 
        status = ?, 
        brand = ? 
      WHERE id = ?
    `;
    params = [
      name,
      slug,
      description,
      quantity,
      size,
      color,
      price,
      status,
      brand,
      id,
    ];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật sản phẩm:", err);
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật sản phẩm vào cơ sở dữ liệu." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm với ID này." });
    }

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      updated_product_id: id,
    });
  });
});

// API để xóa sản phẩm
router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  // Xóa review trước
  const sqlDeleteReviews = "DELETE FROM reviews WHERE product_id = ?";
  db.query(sqlDeleteReviews, [id], (err) => {
    if (err) {
      console.error("Lỗi khi xóa review:", err);
      return res.status(500).json({ error: "Lỗi khi xóa review sản phẩm." });
    }

    // Sau đó xóa sản phẩm
    const sqlDeleteProduct = "DELETE FROM sanpham WHERE id = ?";
    db.query(sqlDeleteProduct, [id], (err, result) => {
      if (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        return res.status(500).json({ error: "Lỗi khi xóa sản phẩm." });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sản phẩm để xóa." });
      }

      const io = req.app.get("io");
      io.emit("deleteProductTrue", { productId: id });

      res.status(200).json({ message: "Xóa sản phẩm thành công!" });
    });
  });
});

// xuất exccel
router.get("/export/excel", async (req, res) => {
  try {
    // Dùng db.promise().query thay vì db.query
    const [rows] = await db.promise().query(
      `SELECT name, description, quantity, size, color, price, status, brand, created_at, updated_at
       FROM sanpham`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách sản phẩm");

    worksheet.columns = [
      { header: "Tên sản phẩm", key: "name", width: 30 },
      { header: "Mô tả", key: "description", width: 40 },
      { header: "Số lượng", key: "quantity", width: 10 },
      { header: "Size", key: "size", width: 10 },
      { header: "Màu sắc", key: "color", width: 15 },
      { header: "Giá", key: "price", width: 15 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Thương hiệu", key: "brand", width: 20 },
      { header: "Ngày tạo", key: "created_at", width: 20 },
      { header: "Ngày cập nhật", key: "updated_at", width: 20 },
    ];

    rows.forEach((row) => worksheet.addRow(row));

    // Format tên file kèm ngày VN
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const todayVN = `${day}-${month}-${year}`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products_${todayVN}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi xuất Excel");
  }
});
//========================MOBILE=======================
// GET /api/products/filter
router.get("/timkiem/goiy", async (req, res) => {
  const { categoryId, brand } = req.query;
  try {
    let sql = "SELECT * FROM sanpham WHERE status = 'active'";
    const params = [];

    if (categoryId) {
      sql += " AND categoryId = ?";
      params.push(categoryId);
    }
    if (brand) {
      sql += " AND brand = ?";
      params.push(brand);
    }

    // ✅ Thêm .promise() ở đây
    const [rows] = await db.promise().query(sql, params);

    res.json({ products: rows });
  } catch (error) {
    console.error("Lỗi lấy sản phẩm liên quan:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
