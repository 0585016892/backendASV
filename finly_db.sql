-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th6 26, 2025 lúc 01:26 PM
-- Phiên bản máy phục vụ: 10.4.28-MariaDB
-- Phiên bản PHP: 8.1.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
USE railway;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `nodejs_shop`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `attendances`
--

CREATE TABLE `attendances` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `img_checkin` text NOT NULL,
  `img_checkout` text NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('on-time','late','absent-morning','absent-afternoon','absent-full') DEFAULT 'on-time'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `attendances`
--

INSERT INTO `attendances` (`id`, `user_id`, `work_date`, `check_in_time`, `check_out_time`, `img_checkin`, `img_checkout`, `note`, `created_at`, `updated_at`, `status`) VALUES
(49, 23, '2025-06-08', '2025-06-08 11:39:08', '2025-06-08 11:39:14', '', '', NULL, '2025-06-08 04:39:08', '2025-06-08 04:39:14', 'on-time'),
(50, 23, '2025-06-10', '2025-06-10 22:39:51', '2025-06-10 22:40:00', '', '', NULL, '2025-06-10 15:39:51', '2025-06-10 15:40:00', 'on-time'),
(51, 23, '2025-06-11', '2025-06-11 21:50:16', '2025-06-11 21:50:30', '', '', NULL, '2025-06-11 14:50:16', '2025-06-11 14:50:30', 'on-time'),
(52, 24, '2025-06-11', '2025-06-11 23:14:13', '2025-06-11 23:14:16', '', '', NULL, '2025-06-11 16:14:13', '2025-06-11 16:14:16', 'on-time'),
(53, 23, '2025-06-13', '2025-06-13 15:25:18', '2025-06-13 15:25:21', '', '', NULL, '2025-06-13 08:25:18', '2025-06-13 08:25:21', 'on-time'),
(75, 1, '2025-06-19', '2025-06-19 23:55:38', '2025-06-19 23:55:38', '/uploads/checkin/1750352138239-819895498.jpg', '/uploads/checkout/1750352138546-154419857.jpg', NULL, '2025-06-19 16:55:38', '2025-06-19 16:55:38', 'late'),
(78, 1, '2025-06-20', '2025-06-20 00:14:32', '2025-06-20 17:58:17', '/uploads/checkin/1750353272804-990281117.jpg', '/uploads/checkout/1750417097374-557013402.jpg', NULL, '2025-06-19 17:14:32', '2025-06-20 10:58:17', 'on-time'),
(79, 23, '2025-06-20', '2025-06-20 17:59:32', '2025-06-20 17:59:47', '/uploads/checkin/1750417172311-114198291.jpg', '/uploads/checkout/1750417187365-635719310.jpg', NULL, '2025-06-20 10:59:32', '2025-06-20 10:59:47', 'late'),
(81, 1, '2025-06-22', '2025-06-22 11:22:27', '2025-06-22 11:22:30', '/uploads/checkin/1750566147785-442784547.jpg', '/uploads/checkout/1750566150799-756440648.jpg', NULL, '2025-06-22 04:22:27', '2025-06-22 04:22:30', 'late');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_temp`
--

CREATE TABLE `cart_temp` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` varchar(50) NOT NULL,
  `price` varchar(255) NOT NULL,
  `size` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `parent_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Áo', 'ao', NULL, 'Áo các loại (áo thun, áo sơ mi)', 'active', '2025-04-24 13:39:01', '2025-05-07 13:29:42'),
(2, 'Quần', 'quan', NULL, 'Quần các loại (quần jean, quần âu)', 'active', '2025-04-24 13:39:38', '2025-05-07 13:29:47'),
(3, 'Phụ kiện', 'phu-kien', NULL, 'Các loại váy, đầm nữ', 'active', '2025-04-24 13:39:48', '2025-05-07 13:29:49'),
(4, 'Đồ thể thao', 'do-the-thao', NULL, 'Các loại đồ thể thao (quần áo thể thao)', 'active', '2025-04-24 13:39:58', '2025-05-07 13:29:51'),
(9, 'Áo chống nắng', 'ao-chong-nang', 1, 'Áo chống nắng các loại', 'active', '2025-04-24 13:40:12', '2025-04-28 15:00:11'),
(18, 'Áo nam', 'ao-nam', 1, 'Áo nam', 'active', '2025-04-28 15:03:14', '2025-04-28 15:03:14'),
(19, 'Áo khoác nữ', 'ao-khoac-nu', 1, 'Áo khoác nữ', 'active', '2025-04-28 15:03:34', '2025-04-28 15:03:34'),
(20, 'Áo nữ', 'ao-nu', 1, 'Áo nữ', 'active', '2025-04-28 15:04:04', '2025-05-01 05:46:36'),
(21, 'Áo khoác nam', 'ao-khoac-nam', 1, 'Áo khoác nam', 'active', '2025-04-28 15:04:20', '2025-04-28 15:04:20'),
(22, 'Quần nam', 'quan-nam', 2, 'Quần nam', 'active', '2025-04-28 15:05:00', '2025-04-28 15:05:00'),
(23, 'Quần nữ', 'quan-nu', 2, 'Quần nữ', 'active', '2025-04-28 15:05:46', '2025-04-28 15:05:46'),
(24, 'Quần trẻ em', 'quan-tre-em', 2, 'Quần trẻ em', 'active', '2025-04-28 15:06:01', '2025-04-28 15:06:01'),
(25, 'Đồ thể thao nam', 'do-the-thao-nam', 4, 'Đồ thể thao nam', 'active', '2025-04-28 15:06:18', '2025-04-28 15:06:18'),
(26, 'Đồ thể thao nữ', 'do-the-thao-nu', 4, 'Đồ thể thao nữ', 'active', '2025-04-28 15:06:40', '2025-04-28 15:06:40'),
(27, 'Phụ kiện nam', 'phu-kien-nam', 3, 'Phụ kiện nam', 'active', '2025-04-28 15:09:16', '2025-04-28 15:09:16'),
(28, 'Phụ kiện nữ', 'phu-kien-nu', 3, 'Phụ kiện nữ', 'active', '2025-04-28 15:09:33', '2025-04-28 15:12:49'),
(34, 'Váy', 'vay', NULL, 'Váy nữ các loại', 'active', '2025-06-16 14:18:00', '2025-06-16 14:19:20'),
(35, 'Váy nữ', 'vay-nu', 34, 'Váy nữ', 'active', '2025-06-16 14:19:01', '2025-06-16 14:19:35');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `sender` varchar(100) NOT NULL,
  `receiver` varchar(100) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `sender`, `receiver`, `content`, `created_at`) VALUES
(173, '30', 'admin', 'alo shop', '2025-06-16 22:35:06'),
(174, '32', 'admin', 'alo shop', '2025-06-16 22:36:46'),
(175, 'admin', '32', 'alo ạ', '2025-06-16 22:37:15'),
(176, '32', 'admin', 'aaaaa', '2025-06-22 02:11:12'),
(177, 'admin', '32', 'aaaaa', '2025-06-22 02:11:25');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `colors`
--

CREATE TABLE `colors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `colors`
--

INSERT INTO `colors` (`id`, `name`, `code`, `status`, `created_at`, `updated_at`) VALUES
(35, 'Đen', '#000000', 'active', '2025-06-13 14:13:53', '2025-06-13 14:17:08'),
(36, 'Trắng', '#FFFFFF', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(37, 'Đỏ', '#FF0000', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(38, 'Xanh lá', '#008000', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(40, 'Vàng', '#FFFF00', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(41, 'Cam', '#FFA500', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(42, 'Tím', '#ff8fff', 'active', '2025-06-13 14:13:53', '2025-06-16 22:24:30'),
(43, 'Hồng', '#FFC0CB', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(44, 'Xám', '#808080', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(45, 'Nâu', '#A52A2A', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(46, 'Be', '#F5F5DC', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(47, 'Tím than', '#000080', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(48, 'Than chì', '#cccccc', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(49, 'Xanh dương nhạt', '#ADD8E6', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(50, 'Lục nhạt', '#90EE90', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(51, 'Xanh ngọc', '#d1ffd7', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(52, 'Xanh nhạt', '#1790c8', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(53, 'Xanh lam', '#1E90FF', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(54, 'Xanh biển', '#00008B', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(55, 'Hồng nhạt', '#FFB6C1', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(56, 'Đỏ tươi', '#FF6347', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(57, 'Màu cà phê', '#6F4F37', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(58, 'Lục đậm', '#006400', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(59, 'Xanh lá nhạt', '#32CD32', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(60, 'Xanh dương đậm', '#00008B', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(61, 'Cam nhạt', '#f36b26', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(62, 'Xanh rêu', '#556B2F', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(63, 'Đỏ gạch', '#B22222', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(64, 'Xanh lá mạ', '#98FB98', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(65, 'Bạc', '#C0C0C0', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(66, 'Vàng kim', '#FFD700', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(67, 'Bạch kim', '#E5E4E2', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(68, 'Xanh da trời', '#1790c8', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(69, 'Xanh lá cây dưa', '#C2F0C2', 'active', '2025-06-13 14:13:53', '2025-06-13 14:13:53'),
(70, 'ngọc lam', '#61dbc7', 'active', '2025-06-16 22:21:07', '2025-06-16 22:21:07');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percent','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_total` decimal(10,2) DEFAULT 0.00,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_total`, `start_date`, `end_date`, `quantity`, `status`, `created_at`, `updated_at`) VALUES
(13, 'DISCOUNT123', '0', 'fixed', 100000.00, 500000.00, '2025-04-28 16:00:00', '2025-05-29 16:00:00', 4, 'active', '2025-04-30 22:10:22', '2025-06-24 21:52:32'),
(35, 'DISCOUNT', '0', 'percent', 10.00, 150000.00, '2025-04-30 14:59:00', '2025-05-30 14:59:00', 66, 'active', '2025-05-01 11:59:48', '2025-06-22 12:45:41'),
(38, 'IVY30', '1', 'percent', 30.00, 500000.00, '2025-06-01 14:23:00', '2025-08-30 14:23:00', 10, 'active', '2025-06-16 21:23:41', '2025-06-16 21:25:02'),
(39, 'YD50', '1', 'percent', 50.00, 500000.00, '2025-06-01 21:28:00', '2025-08-30 21:28:00', 10, 'active', '2025-06-16 21:28:16', '2025-06-16 21:28:16'),
(40, 'YD20', '1', 'percent', 20.00, 4000000.00, '2025-06-16 22:49:00', '2025-08-07 22:49:00', 10, 'active', '2025-06-16 22:49:19', '2025-06-16 22:49:19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','inactive','deleted') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `customers`
--

INSERT INTO `customers` (`id`, `full_name`, `email`, `password`, `phone`, `address`, `status`, `created_at`, `updated_at`) VALUES
(32, 'Nguyễn Thị Thịnh', 'nguyenthinh016892@gmail.com', '$2b$10$FgVUF5WNMwu8GiQDnK8DDOcQUdGH8GERvvuE6FAe55vn.IoDfpkxu', '0585016892', 'Phường Cổ Nhuế 2, Quận Bắc Từ Liêm, Thành phố Hà Nội', 'active', '2025-06-16 22:29:06', '2025-06-16 22:45:01'),
(33, 'Trần Khánh Hưng', 'tranhung6829@gmail.com', '$2b$10$34W81YOBvoD4ba6uWO4vmOjM5PRxenmZUIn.MmjZQVXx6OxPZZ6sy', '0587142011', 'Xã Yên Lạc, Huyện Phú Lương, Tỉnh Thái Nguyên', 'active', '2025-06-21 23:02:40', '2025-06-21 23:02:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` enum('admin','staff','hr') DEFAULT 'staff',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role_id` int(11) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `employees`
--

INSERT INTO `employees` (`id`, `full_name`, `email`, `password`, `phone`, `position`, `department`, `address`, `role`, `status`, `created_at`, `updated_at`, `role_id`, `avatar`) VALUES
(1, 'Trần Khánh Hưng', 'tranhung6829@gmail.com', '$2b$10$Dz5SEGFq7FfXMk0k6PHf3.3DTjDIIEzB9s2iX7EuIoZVTgr0idQ6G', '0585016892', 'Admin', 'Bắc Từ Liêm', 'Hà nội', 'admin', 'active', '2025-05-28 17:06:45', '2025-06-19 16:45:51', 1, '/uploads/avatars/1750351551535-782474437.jfif'),
(23, 'Nguyễn Thị Trang', 'nguyenthinh016892@gmail.com', '$2b$10$xTBbdmARTEVujJQZw3RuXOqoIoM5GbiPTwhlAaLMtK/y6CQJSsHE.', '0364023640', 'Nhân viên bán hàng', 'Cầu giấy', 'Hà Nội', 'staff', 'active', '2025-06-01 05:29:38', '2025-06-20 13:44:02', 2, '/uploads/avatars/1750348930243-220753022.jfif'),
(24, 'Trần Hoàng Phúc', 'phuc2015@gmail.com', '$2b$10$.FbAOztcg26ZHghDzP1mLeVjzPP/es8XdZuLkFxJZSi63/GhNBpri', '097463342', 'Bảo vệ', 'Cầu giấy', 'Thái bình', 'staff', 'active', '2025-06-11 16:12:43', '2025-06-11 16:12:43', 2, NULL),
(29, 'Trần Hương Giang', 'giang2013@gmail.com', '$2b$10$/YNiEHG2Jtdga60IzWV.pecN/jejriptc.gM8k7qy/9NRAMDYadZi', '0585016892', 'HR', 'Bắc Từ Liêm', 'Thái bình', 'hr', 'active', '2025-06-20 12:25:57', '2025-06-20 12:26:43', 2, '/uploads/avatars/1750422357170-78609995.jpg');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `footer_items`
--

CREATE TABLE `footer_items` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `footer_items`
--

INSERT INTO `footer_items` (`id`, `title`, `label`, `value`, `type`, `parent_id`, `status`, `icon`, `created_at`, `updated_at`) VALUES
(2, 'MUA SẮM', NULL, NULL, 'group', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 15:06:37'),
(3, 'DỊCH VỤ KHÁCH HÀNG', NULL, NULL, 'group', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:00'),
(4, 'VỀ FINLY', NULL, NULL, 'group', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:03'),
(5, 'Đặt hàng', '024 999 86 999', 'phone', 'lienhe', NULL, 'active', 'FaPhoneAlt', '2025-05-05 13:46:10', '2025-06-16 08:52:04'),
(6, 'Email', 'tranhung6829@gmail.com', 'email', 'lienhe', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-06-16 08:47:58'),
(7, 'Địa chỉ', 'Trường Đại học Mỏ - Địa chất', 'address', 'lienhe', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-06-16 08:48:04'),
(8, 'Áo nam', '/ao-nam', 'link', 'link', 2, 'active', '0', '2025-05-05 13:46:10', '2025-06-16 09:04:33'),
(11, 'Chính sách khách hàng thân thiết', '/chinh-sach', 'link', 'link', 3, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:21'),
(12, 'Hướng dẫn chọn kích thước', '/huong-dan-kich-thuoc', 'link', 'link', 3, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:23'),
(13, 'Giới thiệu', '/gioi-thieu', 'link', 'link', 4, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:27'),
(14, 'Tin tức', '/tin-tuc', 'link', 'link', 4, 'active', '0', '2025-05-05 13:46:10', '2025-05-07 13:05:31'),
(15, '@ Công ty cổ phần thời trang FINLY', NULL, NULL, '@', NULL, 'active', '0', '2025-05-05 13:46:10', '2025-06-16 09:07:57'),
(20, 'FINLY XIN CHÀO 💖', NULL, NULL, 'hi', 0, 'active', '0', '2025-05-07 15:03:37', '2025-06-16 08:36:10'),
(41, 'Chúng tôi luôn quý trọng và tiếp thu mọi ý kiến đóng góp từ khách hàng, nhằm không ngừng cải thiện và nâng tầm trải nghiệm dịch vụ cũng như chất lượng sản phẩm.', 'https://www.facebook.com/tran.khanh.hung.770881/', 'link', 'hi', 0, 'active', '0', '2025-06-16 08:42:03', '2025-06-16 08:45:17'),
(42, 'Áo chống nắng', '/ao-chong-nang', 'link', 'link', 2, 'active', '', '2025-06-16 09:05:30', '2025-06-16 09:05:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `shipping` decimal(10,2) DEFAULT NULL,
  `final_total` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `coupon_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `customer_name`, `customer_phone`, `customer_email`, `address`, `note`, `total`, `discount`, `shipping`, `final_total`, `payment_method`, `status`, `customer_id`, `created_at`, `coupon_id`) VALUES
(84, 'Trần Khánh Hưng', '0585016892', 'nguyenthinh016892@gmail.com', 'Phường Cổ Nhuế 2, Quận Bắc Từ Liêm, Thành phố Hà Nội', 'Số nhà 4A1', 1168000.00, 116800.00, 0.00, 1051200.00, 'COD', 'Đã giao', 32, '2025-06-16 15:29:06', 0),
(152, 'Trần Khánh Hưng', '0587142011', 'tranhung6829@gmail.com', 'Xã Lao Xả Phình, Huyện Tủa Chùa, Tỉnh Điện Biên', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 05:31:56', 13),
(153, 'Trần Khánh Hưng', '0585016892', 'thinhnguyen016892@gmail.com', 'Phường Cẩm Thủy, Thành phố Cẩm Phả, Tỉnh Quảng Ninh', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 05:35:15', 13),
(154, 'Nguyễn Thị Trang', '98231029', 'trangtrang0102@gmail.com', 'Xã Thành Hòa, Huyện Văn Lãng, Tỉnh Lạng Sơn', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 05:36:33', 13),
(155, 'Trần Khánh Hưng', '0585016892', 'thinhnguyen016892@gmail.com', 'Xã Đầm Hà, Huyện Đầm Hà, Tỉnh Quảng Ninh', 'a', 599000.00, 59900.00, 20000.00, 559100.00, 'vnpay', 'pending', 0, '2025-06-22 05:45:41', 35),
(156, 'Trần Khánh Hưng', '0587142011', 'tranhung6829@gmail.com', 'Xã La Hiên, Huyện Võ Nhai, Tỉnh Thái Nguyên', 'âdsas', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 05:50:24', 13),
(157, 'Nguyễn Thị Trang', '98231029', 'trangtrang0102@gmail.com', 'Xã Động Đạt, Huyện Phú Lương, Tỉnh Thái Nguyên', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:03:33', 13),
(158, 'Trần Khánh Hưng', '0585016892', 'thinhnguyen016892@gmail.com', 'Xã Lương Năng, Huyện Văn Quan, Tỉnh Lạng Sơn', '-kkkkkkkkk', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:05:33', 13),
(159, 'Trần Khánh Hưng', '0587142011', 'tranhung6829@gmail.com', 'Xã Đồng Văn, Huyện Bình Liêu, Tỉnh Quảng Ninh', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:07:31', 13),
(160, 'Trần Khánh Hưng', '0587142011', 'tranhung6829@gmail.com', 'Xã Mai Sơn, Huyện Lục Yên, Tỉnh Yên Bái', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:30:56', 13),
(161, 'Trần Khánh Hưng', '0585016892', 'thinhnguyen016892@gmail.com', 'Xã Lộc Yên, Huyện Cao Lộc, Tỉnh Lạng Sơn', 'aa', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:35:20', 13),
(162, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:38:53', 3),
(163, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:39:45', 3),
(164, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:41:48', 3),
(165, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:41:53', 3),
(166, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:43:10', 3),
(167, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:45:10', 3),
(168, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:46:50', 3),
(169, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:47:10', 3),
(170, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:48:20', 3),
(171, 'Trần Khánh Hưng', '0587142011', 'tranhung6829@gmail.com', 'Xã Kim Bôi, Huyện Kim Bôi, Tỉnh Hoà Bình', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 06:58:07', 13),
(172, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 06:59:02', 3),
(173, 'Nguyễn Thị Trang', '0585016892', 'trangtrang0102@gmail.com', 'Xã Tân Hòa, Huyện Bình Gia, Tỉnh Lạng Sơn', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 07:02:17', 13),
(174, 'adssad', '123421313', 'tranhung6829@gmail.com', 'Phường Vĩnh Trại, Thành phố Lạng Sơn, Tỉnh Lạng Sơn', 'a', 599000.00, 100000.00, 20000.00, 519000.00, 'vnpay', 'pending', 0, '2025-06-22 07:02:57', 13),
(175, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:04:54', 3),
(176, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:06:29', 3),
(177, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:08:03', 3),
(178, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:08:33', 3),
(179, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:10:49', 3),
(180, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:11:56', 3),
(181, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:13:23', 3),
(182, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:13:36', 3),
(183, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:15:28', 3),
(184, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:16:51', 3),
(185, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:22:19', 3),
(186, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:23:28', 3),
(187, 'Nguyễn Văn A', '0123456789', 'a@gmail.com', '123 Lê Lợi, Hà Nội', 'Giao giờ hành chính', 600000.00, 50000.00, 10000.00, 560000.00, 'vnpay', 'pending', 0, '2025-06-22 07:25:13', 3),
(188, 'Nguyễn Thị Thịnh', '0585016892', 'nguyenthinh016892@gmail.com', 'Phường Cổ Nhuế 2, Quận Bắc Từ Liêm, Thành phố Hà Nội', 'aaa', 1268000.00, 100000.00, 0.00, 1168000.00, 'COD', 'Chờ xử lý', 32, '2025-06-24 14:52:23', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `size` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `size`, `color`) VALUES
(110, 84, 48, 1, 669000.00, 'L', 'ngọc lam'),
(111, 84, 49, 1, 499000.00, 'L', 'Hồng'),
(131, 152, 47, 1, 599000.00, 'L', 'Bạc'),
(132, 153, 47, 1, 599000.00, 'L', 'Bạc'),
(133, 154, 47, 1, 599000.00, 'L', 'Bạc'),
(134, 155, 47, 1, 599000.00, 'L', 'Bạc'),
(135, 156, 47, 1, 599000.00, 'L', 'Bạc'),
(136, 157, 47, 1, 599000.00, 'L', 'Bạc'),
(137, 158, 47, 1, 599000.00, 'L', 'Bạc'),
(138, 159, 47, 1, 599000.00, 'L', 'Bạc'),
(139, 160, 47, 1, 599000.00, 'L', 'Bạc'),
(140, 161, 47, 1, 599000.00, 'L', 'Bạc'),
(141, 162, 1, 2, 250000.00, 'L', 'Đen'),
(142, 163, 1, 2, 250000.00, 'L', 'Đen'),
(143, 164, 1, 2, 250000.00, 'L', 'Đen'),
(144, 165, 1, 2, 250000.00, 'L', 'Đen'),
(145, 166, 1, 2, 250000.00, 'L', 'Đen'),
(146, 167, 1, 2, 250000.00, 'L', 'Đen'),
(147, 168, 1, 2, 250000.00, 'L', 'Đen'),
(148, 169, 1, 2, 250000.00, 'L', 'Đen'),
(149, 170, 1, 2, 250000.00, 'L', 'Đen'),
(150, 171, 47, 1, 599000.00, 'L', 'Bạc'),
(151, 172, 1, 2, 250000.00, 'L', 'Đen'),
(152, 173, 47, 1, 599000.00, 'L', 'Bạc'),
(153, 174, 47, 1, 599000.00, 'L', 'Bạc'),
(154, 175, 1, 2, 250000.00, 'L', 'Đen'),
(155, 176, 1, 2, 250000.00, 'L', 'Đen'),
(156, 177, 1, 2, 250000.00, 'L', 'Đen'),
(157, 178, 1, 2, 250000.00, 'L', 'Đen'),
(158, 179, 1, 2, 250000.00, 'L', 'Đen'),
(159, 180, 1, 2, 250000.00, 'L', 'Đen'),
(160, 181, 1, 2, 250000.00, 'L', 'Đen'),
(161, 182, 1, 2, 250000.00, 'L', 'Đen'),
(162, 183, 1, 2, 250000.00, 'L', 'Đen'),
(163, 184, 1, 2, 250000.00, 'L', 'Đen'),
(164, 185, 1, 2, 250000.00, 'L', 'Đen'),
(165, 186, 1, 2, 250000.00, 'L', 'Đen'),
(166, 187, 1, 2, 250000.00, 'L', 'Đen'),
(167, 188, 47, 1, 599000.00, 'L', 'Tím than'),
(168, 188, 48, 1, 669000.00, 'XL', 'Tím than');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`) VALUES
(1, 'view_users', 'Xem danh sách người dùng'),
(2, 'edit_users', 'Chỉnh sửa người dùng'),
(3, 'delete_users', 'Xóa người dùng'),
(4, 'view_orders', 'Xem đơn hàng'),
(5, 'edit_orders', 'Chỉnh sửa đơn hàng'),
(6, 'delete_orders', 'Xóa đơn hàng');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `created_at`) VALUES
(5, 44, '1750086488506-43832482116796cdbc73c60eaddc50fd.webp', '2025-06-16 22:08:08'),
(6, 44, '1750086488512-930ae1618cb39d3901b9a5724df34d4e.webp', '2025-06-16 22:08:08'),
(7, 45, '1750086586550-7210be621f3fef0816ca1b2ac33a37dd.webp', '2025-06-16 22:09:46'),
(8, 45, '1750086586552-9557affaf03dc86ba54d880c88c5adb0.webp', '2025-06-16 22:09:46'),
(9, 45, '1750086586554-e22dd0ee160c32b14f63add56e997adc.webp', '2025-06-16 22:09:46'),
(10, 46, '1750086983568-16810c8e0ba526eaf3a2f5fea6089057.webp', '2025-06-16 22:16:23'),
(11, 46, '1750086983574-ba83c2653c95c7feb260d42e837b7d27.webp', '2025-06-16 22:16:23'),
(12, 47, '1750087170018-e77c39df73f910285a4ce1cdb84511a5.webp', '2025-06-16 22:19:30'),
(13, 47, '1750087170018-353d301f9090efa5920d4d356015ce3c.webp', '2025-06-16 22:19:30'),
(14, 47, '1750087170018-51be6de7a8552d5bab7189b21333e590.webp', '2025-06-16 22:19:30'),
(15, 47, '1750087170019-588b1cc74458717d454cb054e6f09d41.webp', '2025-06-16 22:19:30'),
(16, 48, '1750087323653-e58e901ec993f239d4d89c6eb1152fb9.webp', '2025-06-16 22:22:03'),
(17, 48, '1750087323653-45be09edae11a6667c835af48a8fe59b.webp', '2025-06-16 22:22:03'),
(18, 48, '1750087323653-d3ceed2286183d5d7e66eef4e94fdee5.webp', '2025-06-16 22:22:03'),
(19, 48, '1750087323654-dccd7d5292ec5858613cffceb4dfe252.webp', '2025-06-16 22:22:03'),
(20, 49, '1750087450355-97faf5e39d23144d8e0b22816da6cdd1.webp', '2025-06-16 22:24:10'),
(21, 49, '1750087450357-d9890ed637f3c3b1df485bf42086335b.webp', '2025-06-16 22:24:10'),
(22, 49, '1750087450358-0dce7ed250f71b19ebf7c23ecb99cd3c.webp', '2025-06-16 22:24:10'),
(23, 49, '1750087450360-ce6e8adf11b2661a09160097d908c010.webp', '2025-06-16 22:24:10'),
(24, 50, '1750087565754-d43b9aa348db622214b2f7dc4e9bc85a.webp', '2025-06-16 22:26:05'),
(25, 50, '1750087565754-237c5f787c3bd8554e417265f6c935ad.webp', '2025-06-16 22:26:05'),
(26, 50, '1750087565756-426d6e43725d67cc130256f13a727129 (1).webp', '2025-06-16 22:26:05'),
(27, 51, '1750087659478-dabd856390f6bf3291849a9af84e6da1.webp', '2025-06-16 22:27:39'),
(28, 51, '1750087659478-603b24e6f0c2934d1d3cf3f2750e58e6.webp', '2025-06-16 22:27:39'),
(29, 52, '1750088886815-6a8b5cd6220349a02d39934cc23afe05.webp', '2025-06-16 22:48:06'),
(30, 52, '1750088886815-5f848a800949beef1ae04e5743f8a038.webp', '2025-06-16 22:48:06'),
(31, 52, '1750088886815-89830f097338a4ab760738aafa905294.webp', '2025-06-16 22:48:06'),
(32, 52, '1750088886815-38ec31a0a1b78f0c08588f1b92a46de2.webp', '2025-06-16 22:48:06'),
(33, 53, '1750089003916-c0d78ee339fb20de043e36c0310f9445.webp', '2025-06-16 22:50:03'),
(34, 53, '1750089003916-3e2f226a79be83694883f46f8e97b4ec.webp', '2025-06-16 22:50:03'),
(35, 53, '1750089003916-a96fbf2fc7b51d5ed9479e5e06d47d85.webp', '2025-06-16 22:50:03'),
(36, 54, '1750089094155-297e0ebef50ff9f504db1865565c8768.webp', '2025-06-16 22:51:34'),
(37, 54, '1750089094155-9335bfc51a8ccfb99f70acd13ac368ef.webp', '2025-06-16 22:51:34'),
(38, 54, '1750089094156-2ed5d8a174cd7f485d6a8e11bd8e43fd.webp', '2025-06-16 22:51:34'),
(39, 54, '1750089094158-83fae724047f99d7b0c6343d4085ffce.webp', '2025-06-16 22:51:34');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'admin'),
(3, 'manager'),
(2, 'staff');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(2, 1),
(2, 4);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `salaries`
--

CREATE TABLE `salaries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `soNgayCong` int(11) DEFAULT NULL,
  `tongGio` decimal(10,2) DEFAULT NULL,
  `soLanTre` int(11) DEFAULT NULL,
  `soLanVeSom` int(11) DEFAULT NULL,
  `tongGioTangCa` decimal(10,2) DEFAULT NULL,
  `luongNgay` int(11) DEFAULT NULL,
  `luongTangCa` int(11) DEFAULT NULL,
  `tongLuong` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `salaries`
--

INSERT INTO `salaries` (`id`, `user_id`, `month`, `year`, `soNgayCong`, `tongGio`, `soLanTre`, `soLanVeSom`, `tongGioTangCa`, `luongNgay`, `luongTangCa`, `tongLuong`, `created_at`) VALUES
(8, 1, 6, 2025, 2, 16.73, 1, 0, 8.73, 600000, 436500, 1036500, '2025-06-20 12:20:41'),
(9, 23, 6, 2025, 5, 0.00, 5, 2, 0.00, 1500000, 0, 1500000, '2025-06-20 12:22:01');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sanpham`
--

CREATE TABLE `sanpham` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` varchar(255) NOT NULL,
  `size` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `price` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `brand` varchar(100) DEFAULT NULL,
  `categoryId` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `coupon_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `sanpham`
--

INSERT INTO `sanpham` (`id`, `name`, `slug`, `image`, `description`, `quantity`, `size`, `color`, `price`, `status`, `brand`, `categoryId`, `created_at`, `updated_at`, `coupon_id`) VALUES
(44, 'Summer Flare Dress - Đầm lụa xòe họa tiết', 'summer-flare-dress---dam-lua-xoe-hoa-tiet', '1750086488487-9cb2c5c0365c96e671c9d9a634c33a44.webp', 'Gợi nhớ vẻ đẹp dịu dàng và thanh lịch với họa tiết hoa mùa hè rực rỡ, thiết kế đầm mới nhà IVY moda tạo cảm giác tươi mới, tràn đầy sức sống. Thiết kế dáng xòe nhẹ nhàng giúp tôn lên nét nữ tính, uyển chuyển trong từng bước di chuyển.', '150', 'S,M,L,XL', 'Hồng nhạt,Đen,Trắng', '2190000', 'active', 'IVY', 35, '2025-06-16 22:08:08', '2025-06-16 22:08:08', 0),
(45, 'Blossom Pink Dress - Đầm lụa họa tiết', 'blossom-pink-dress---dam-lua-hoa-tiet', '1750086586548-5d7e1e13e612d1edbf6ae1e1fb7e0ff4.webp', 'Blossom Pink Dress mang đến vẻ đẹp dịu dàng và thanh lịch với họa tiết hoa đầy nữ tính. Kiểu dáng xòe nhẹ nhàng giúp tôn lên nét duyên dáng, tạo cảm giác bay bổng, uyển chuyển theo từng bước di chuyển.', '150', 'S,M,L', 'Hồng nhạt', '1790000', 'active', 'IVY', 35, '2025-06-16 22:09:46', '2025-06-16 22:09:46', 0),
(46, 'Áo thun basic trơn', 'ao-thun-basic-tron', '1750086983560-bfe6711a81b3f26504729107a6cce2c5.webp', '- Áo thun nam thiết kế cổ tròn, cộc tay là một sản phẩm đa năng và phổ biến trong thế giới thời trang hiện nay.', '150', 'S,M,L,XL,2XL', 'Đen,Trắng,Lục đậm', '250000', 'active', 'IVY', 18, '2025-06-16 22:16:23', '2025-06-16 22:16:23', 0),
(47, 'Áo Chống Nắng Nam Có Mũ', 'ao-chong-nang-nam-co-mu', '1750087170018-ad1c1a8fd18f4b4a4769dd6b4bf12737.webp', 'Chống tia UVA, UVB hiệu quả: Chất liệu đặc biệt giúp ngăn chặn tia cực tím, bảo vệ da tối ưu lến đến 99.7%\r\nMềm mại, thoáng khí: Vải nhẹ nhàng, không gây bí bách, tạo cảm giác dễ chịu khi mặc cả ngày dài.', '22', 'M,L,XL,2XL', 'Tím than,Bạc', '599000', 'active', 'YD', 9, '2025-06-16 22:19:30', '2025-06-24 21:52:23', 0),
(48, 'Áo Khoác Chống Nắng Thoáng Khí', 'ao-khoac-chong-nang-thoang-khi', '1750087323653-e58e901ec993f239d4d89c6eb1152fb9.webp', 'MEJA25S007-ST009-2XL\r\n\r\nChất liệu: vải dệt kim đan dọc hiệu ứng gió co giãn 360 độ\r\n\r\nThành phần:76%Nylon, 24%Spandex', '48', 'M,L,XL,2XL,3XL', 'ngọc lam,Tím than,Đen', '669000', 'active', 'YD', 9, '2025-06-16 22:22:03', '2025-06-24 21:52:23', 0),
(49, 'Áo Khoác Chống Nắng Basic', 'ao-khoac-chong-nang-basic', '1750087450355-a3346a085a12a701ba74dc3d138f11af.webp', 'WEJA25S009-SG046-M\r\n\r\nChất liệu: UV Soft\r\n\r\nThành phần: 88% POLYESTER 12% ELASTANE', '48', 'S,M,L,XL,2XL', 'Xanh ngọc,Bạc,Tím,Hồng,Đen', '499000', 'active', 'YD', 9, '2025-06-16 22:24:10', '2025-06-21 23:02:40', 0),
(50, 'Áo Chống Nắng Nữ Chống UV Dáng Suông', 'ao-chong-nang-nu-chong-uv-dang-suong', '1750087565754-5a08f324ac2be6cb2dd2d05fec38c504.webp', 'Mẫu áo đa năng phiên bản mới, lý tưởng cho những ngày nắng nóng. Chất liệu Double Face UV mang lại cảm giác thoải mái và thấm hút mồ hôi tốt. UPF 50+ bảo vệ da khỏi tác động từ tia UV cùng khóa kéo YKK chất lượng và có thể tháo rời vành mũ linh hoạt.', '50', 'S,M,L,XL,2XL', 'Bạc,Xanh da trời,Cam,Xanh biển', '549000', 'active', 'YD', 9, '2025-06-16 22:26:05', '2025-06-16 22:26:05', 0),
(51, 'Áo Khoác Chống Nắng Toàn Thân (acn6002)', 'ao-khoac-chong-nang-toan-than-acn6002', '1750087659478-71c4ac03cffe0c2034f71aed6684669c.webp', 'Bề mặt mềm mại: Kiểu dệt Double Face mang lại cảm giác êm ái, dễ chịu khi tiếp xúc với da\r\n\r\nCo giãn & Thoáng khí: Thành phần Spandex giúp vải đàn hồi tốt, thông thoáng và thấm hút hiệu quả.', '50', 'S,M,L,XL', 'Xanh dương đậm,Bạc,Xanh da trời', '799000', 'active', 'YD', 9, '2025-06-16 22:27:39', '2025-06-16 22:27:39', 0),
(52, 'Áo Polo Thể Thao In Kẻ Ngang Ngực (SAM6065)', 'ao-polo-the-thao-in-ke-ngang-nguc-sam6065', '1750088886814-7721531a30e71d5049e724f95b45bc32.webp', 'Áo polo thể thao nam thoáng mát với bề mặt vải nhiều lỗ nhỏ hỗ trợ quá trình thoát ẩm, thấm hút mồ hôi tốt, an toàn cho da. Thiết kế dáng suông phù hợp với mọi dáng người, in ngực tạo điểm nhấn nối bật.', '50', 'M,L,XL,2XL', '', '400000', 'active', 'YD', 18, '2025-06-16 22:48:06', '2025-06-16 22:48:06', 39),
(53, 'Áo Polo Yoguu Phối Thân Có Kéo Khoá', 'ao-polo-yoguu-phoi-than-co-keo-khoa', '1750089003916-c59eeb78c28010081502878296a4c475.webp', 'Trẻ trung, hiện đại với thiết kế áo polo Unisex mới của nhà YODY. Chất liệu nỉ double face dày dặn. Bề mặt được xử lý sạch xơ thừa đem đến cảm giác mặc mềm mại, chạm lên da dễ chịu.', '50', 'S,M,L,XL', 'Trắng', '449000', 'active', 'YD', 18, '2025-06-16 22:50:03', '2025-06-16 22:50:03', 40),
(54, 'Áo Sơ Mi Nam Dài Tay Túi Kiểu', 'ao-so-mi-nam-dai-tay-tui-kieu', '1750089094155-b742a3cdd579680ccbbd3f647bd48986 (1).webp', 'MCSH25S042-SV006-M\r\n\r\nChất liệu: vải sơ mi cotton lóng chéo twill\r\n\r\nThành phần:70% Cotton, 30% Tencel', '50', 'M,L,XL,2XL,3XL', 'Tím than,Trắng', '549000', 'active', 'YD', 18, '2025-06-16 22:51:34', '2025-06-16 22:51:34', 40);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sizes`
--

CREATE TABLE `sizes` (
  `id` int(11) NOT NULL,
  `name` varchar(10) NOT NULL,
  `active` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `sizes`
--

INSERT INTO `sizes` (`id`, `name`, `active`, `created_at`) VALUES
(16, 'S', 'active', '2025-06-13 06:10:56'),
(17, 'M', 'active', '2025-06-13 06:11:03'),
(18, 'L', 'active', '2025-06-13 06:11:08'),
(19, 'XL', 'active', '2025-06-13 06:11:14'),
(20, '2XL', 'active', '2025-06-13 06:11:22'),
(21, '3XL', 'active', '2025-06-13 06:11:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `slides`
--

CREATE TABLE `slides` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `position` int(11) DEFAULT 0,
  `display_area` enum('homepage','sidebar','popup','footer','product_page') DEFAULT 'homepage',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `slides`
--

INSERT INTO `slides` (`id`, `title`, `image`, `link`, `status`, `position`, `display_area`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(7, 'Slide 1', '1746451616898.png', 'http://localhost:3002/category/ao-nam', 'inactive', 1, 'sidebar', '2025-05-01 00:00:00', '2025-05-05 00:00:00', '2025-05-05 19:36:13', '2025-06-16 15:07:48'),
(9, 'Slide 2', '1746618911774.webp', 'https://www.youtube.com/watch?v=nK9tNijoojA', 'inactive', 0, 'sidebar', '2025-01-01 00:00:00', '2025-12-31 00:00:00', '2025-05-07 18:55:11', '2025-06-16 15:07:45'),
(10, 'Footer', '1746639656080.png', 'https://daotaodaihoc.humg.edu.vn', 'active', 0, 'footer', '2025-01-01 00:00:00', '2025-12-31 00:00:00', '2025-05-08 00:40:56', '2025-06-16 15:23:47'),
(11, 'Sale mùa hè', '1750061308565.png', 'http://localhost:3001/category/ao-nam', 'active', 1, 'sidebar', '2025-01-01 00:00:00', '2025-12-31 00:00:00', '2025-06-16 15:08:28', '2025-06-16 15:08:28'),
(12, 'Sale mùa hè', '1750061328982.png', 'http://localhost:3001/category/ao-nam', 'active', 2, 'sidebar', '2025-01-01 00:00:00', '2025-12-31 00:00:00', '2025-06-16 15:08:49', '2025-06-16 15:08:49'),
(13, 'Mỏ ĐC', '1750073878131.png', 'https://humg.edu.vn/Pages/home.aspx', 'active', 3, 'popup', '2024-12-31 17:00:00', '2025-12-30 17:00:00', '2025-06-16 18:37:58', '2025-06-16 18:50:25'),
(14, 'Bộ siêu tập 1', '1750074293625.png', 'http://localhost:3002/slides/create', 'active', 0, 'popup', '2025-01-01 00:00:00', '2025-12-31 00:00:00', '2025-06-16 18:44:53', '2025-06-16 18:46:05');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_date` (`user_id`,`work_date`);

--
-- Chỉ mục cho bảng `cart_temp`
--
ALTER TABLE `cart_temp`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `colors`
--
ALTER TABLE `colors`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Chỉ mục cho bảng `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_role` (`role_id`);

--
-- Chỉ mục cho bảng `footer_items`
--
ALTER TABLE `footer_items`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Chỉ mục cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Chỉ mục cho bảng `salaries`
--
ALTER TABLE `salaries`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `sanpham`
--
ALTER TABLE `sanpham`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `sizes`
--
ALTER TABLE `sizes`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `slides`
--
ALTER TABLE `slides`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT cho bảng `cart_temp`
--
ALTER TABLE `cart_temp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT cho bảng `colors`
--
ALTER TABLE `colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT cho bảng `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT cho bảng `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT cho bảng `footer_items`
--
ALTER TABLE `footer_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `salaries`
--
ALTER TABLE `salaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `sanpham`
--
ALTER TABLE `sanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `sizes`
--
ALTER TABLE `sizes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `slides`
--
ALTER TABLE `slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`);

--
-- Các ràng buộc cho bảng `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `sanpham` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
