-- ============================================================
-- Run this as MySQL root to create the application user
-- ============================================================
-- mysql -u root -p < database/create_user.sql
-- ============================================================

CREATE USER IF NOT EXISTS 'impact_user'@'localhost' IDENTIFIED BY 'impact_pass';
CREATE DATABASE IF NOT EXISTS impact_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON impact_analyzer.* TO 'impact_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Database user impact_user created successfully.' AS status;
