-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 29, 2026 at 08:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `securesysv4`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `subject` text NOT NULL,
  `body` text NOT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `encrypted_key` varchar(255) DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_email`, `recipient_email`, `subject`, `body`, `is_encrypted`, `encrypted_key`, `attachment_path`, `timestamp`) VALUES
(1, 'monkjow@gmail.com', 'kyru.roque.ui@phinmaed.com', 'TJOrfQhi7CEbp7zZx0b8dSAVEMpccNwUVda9U6JbS/GV4MY=', 'r0ZFLICmGgt1IyZkgiPKHF5uI+xxoXmF/UiJ8cn4tAvxQ9aUEH4=', 1, 'f274875bde49ff4235525c70efe491f9f90928f3c7c3e5e9093d7175c328dfed', NULL, '2025-11-14 15:35:38'),
(2, 'monkjow@gmail.com', 'kyru.roque.ui@phinmaed.com', 'Pw/Hx/TjonDjeVZ2DCvJHPGdISrcK2G3kEkSA5MTbx/0', 'T8fnTHIhaiH/46MTyqZhE+Jsq7r++JUjxnaCNxM9taDpLl6qHxiPxoaV', 1, 'f274875bde49ff4235525c70efe491f9f90928f3c7c3e5e9093d7175c328dfed', NULL, '2026-03-15 14:50:08'),
(3, 'kyru.roque.ui@phinmaed.com', 'tenb6934@gmail.com', 'cZQ7o6whZy6N/b4quF9dvgq1dVm5UR+zj88m4UuHE9Y=', 'zaq8+0/XpoC++VnQX+8f1/CXHRQOxdXJzQYNX7quxKobDFL4+cM=', 1, 'f274875bde49ff4235525c70efe491f9f90928f3c7c3e5e9093d7175c328dfed', NULL, '2026-03-15 19:05:28'),
(4, 'tenb6934@gmail.com', 'kyru.roque.ui@phinmaed.com', 'RE: (reply)', 'dMMyavfk90ZBgPOkFA8e2N37fdtLgOmmdDTdtMSr', 1, 'f274875bde49ff4235525c70efe491f9f90928f3c7c3e5e9093d7175c328dfed', NULL, '2026-03-15 19:11:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','doctor','client') DEFAULT 'client',
  `last_active` datetime DEFAULT NULL,
  `last_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `last_active`, `last_ip`, `created_at`) VALUES
(1, 'kyru.roque.ui@phinmaed.com', '$2b$12$rTlC3Tb4.UqrJvYqeSNN9.U7Hiuh7Gan0nAxkqKoWIDN6vhD3XIMy', 'client', '2026-03-29 14:13:01', '127.0.0.1', '2025-11-08 15:41:43'),
(3, 'admin', '$2b$12$3XV6GPWCHOyemDyxzwREp.D8lA0evEZBQP4zHOiPs5yh8cCa.S99i', 'admin', '2025-11-14 15:09:32', '127.0.0.1', '2025-11-08 15:45:25'),
(8, 'monkjow@gmail.com', '$2b$12$WNWVm7EbofQdqePFOPOTE.IPR8hDh3SkZNHUaQJidZPb7RFXDhLtu', 'client', '2026-03-15 14:49:49', '127.0.0.1', '2025-11-08 17:21:40'),
(10, 'admin1', '$2b$12$ZYZ1OUAY5zqHUGdJ98Yqmue4c0MLhqayiqGOguwIuFS3WrLKsTvcW', 'admin', '2026-03-29 14:12:32', '127.0.0.1', '2026-03-15 18:42:39'),
(11, 'tenb6934@gmail.com', '$2b$12$93cSmjmg862SLpN3oZmXSOQ6ElAFaacjLZCpPYtkNtEGh1S1Yt6ci', 'client', '2026-03-15 19:00:41', '127.0.0.1', '2026-03-15 19:00:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
