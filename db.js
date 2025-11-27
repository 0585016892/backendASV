// 📁 db.js
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "node_api",
  port: process.env.MYSQLPORT || 3306,
  ssl: isProduction ? { rejectUnauthorized: false } : false, // fix SSL self-signed
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10s
  acquireTimeout: 10000, // 10s
});


console.log("✅ MySQL pool đã sẵn sàng");

module.exports = pool;
