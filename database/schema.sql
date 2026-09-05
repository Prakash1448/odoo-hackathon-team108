-- ============================================================
-- DEALFLOW360 — PRODUCTION RELATIONAL DATABASE SCHEMA & SEED
-- Compatible with: XAMPP MySQL, phpMyAdmin, MySQL Workbench, MySQL 8.0+
-- Database: dealflow360
-- ============================================================

CREATE DATABASE IF NOT EXISTS `dealflow360` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `dealflow360`;

-- Disable foreign key checks for clean drops/recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `inventory_allocations`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `warehouses`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `negotiation_logs`;
DROP TABLE IF EXISTS `approvals`;
DROP TABLE IF EXISTS `quote_items`;
DROP TABLE IF EXISTS `quotes`;
DROP TABLE IF EXISTS `upsell_rules`;
DROP TABLE IF EXISTS `approval_rules`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `customer_tiers`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `hashed_password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL, -- 'sales-rep', 'sales-manager', 'finance', 'admin', 'customer'
  `role_name` VARCHAR(100) NOT NULL,
  `company` VARCHAR(100) NULL,
  `avatar` VARCHAR(10) DEFAULT 'U',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. CUSTOMER TIERS
-- ============================================================
CREATE TABLE `customer_tiers` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `hardware_discount_limit` DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  `services_discount_limit` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `subscriptions_discount_limit` DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  `max_auto_approval_discount` DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CUSTOMERS
-- ============================================================
CREATE TABLE `customers` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `tier_id` VARCHAR(50) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `contact_email` VARCHAR(150) NOT NULL,
  `billing_address` TEXT NULL,
  `shipping_address` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customers_tier` FOREIGN KEY (`tier_id`) REFERENCES `customer_tiers` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PRODUCTS & CATALOG
-- ============================================================
CREATE TABLE `products` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- 'Hardware', 'Services', 'Subscriptions'
  `price` DECIMAL(12,2) NOT NULL,
  `cost` DECIMAL(12,2) NOT NULL,
  `max_discount` DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  `billing_frequency` VARCHAR(20) NOT NULL DEFAULT 'one_time', -- 'one_time', 'monthly', 'quarterly', 'yearly'
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_products_category` (`category`),
  INDEX `idx_products_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. DATA-DRIVEN APPROVAL RULES (Outcome 1)
-- ============================================================
CREATE TABLE `approval_rules` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `customer_tier` VARCHAR(50) NULL, -- NULL means applicable to all tiers
  `min_discount` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `max_discount` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `min_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `min_margin` DECIMAL(5,2) NULL,
  `required_role` VARCHAR(50) NOT NULL, -- 'sales-manager', 'finance', 'admin'
  `priority` INT NOT NULL DEFAULT 1,
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`id`),
  INDEX `idx_approval_rules_tier` (`customer_tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. UPSELL & CROSS-SELL RULES (Outcome 2)
-- ============================================================
CREATE TABLE `upsell_rules` (
  `id` VARCHAR(50) NOT NULL,
  `trigger_product_id` VARCHAR(50) NOT NULL,
  `rec_product_id` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- 'Upsell', 'Cross-sell'
  `min_margin` DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  `is_promo` BOOLEAN DEFAULT FALSE,
  `active` BOOLEAN DEFAULT TRUE,
  `title` VARCHAR(150) NOT NULL,
  `explanation` TEXT NULL,
  `confidence` INT DEFAULT 85,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_upsell_trigger` FOREIGN KEY (`trigger_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_upsell_rec` FOREIGN KEY (`rec_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. QUOTATIONS
-- ============================================================
CREATE TABLE `quotes` (
  `id` VARCHAR(50) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `owner_user_id` VARCHAR(50) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `margin` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `risk` VARCHAR(20) NOT NULL DEFAULT 'Low', -- 'Low', 'Moderate', 'High', 'Critical'
  `risk_score` INT NOT NULL DEFAULT 10,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Under Negotiation', 'Confirmed', 'Rejected', 'Fulfillment'
  `rejection_reason` TEXT NULL,
  `customer_proposed_discount` DECIMAL(5,2) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_quotes_status` (`status`),
  INDEX `idx_quotes_customer` (`customer_id`),
  CONSTRAINT `fk_quotes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_quotes_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. QUOTATION ITEMS
-- ============================================================
CREATE TABLE `quote_items` (
  `id` VARCHAR(50) NOT NULL,
  `quote_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `unit_cost` DECIMAL(12,2) NOT NULL,
  `discount` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `line_subtotal` DECIMAL(12,2) NOT NULL,
  `line_discount_amount` DECIMAL(12,2) NOT NULL,
  `line_total` DECIMAL(12,2) NOT NULL,
  `line_cost` DECIMAL(12,2) NOT NULL,
  `line_margin` DECIMAL(5,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_quote_items_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. APPROVALS & HISTORY
-- ============================================================
CREATE TABLE `approvals` (
  `id` VARCHAR(50) NOT NULL,
  `quote_id` VARCHAR(50) NOT NULL,
  `requested_by_user_id` VARCHAR(50) NOT NULL,
  `required_role` VARCHAR(50) NOT NULL, -- 'sales-manager', 'finance', 'admin'
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending Approval', -- 'Pending Approval', 'Approved', 'Rejected', 'Returned'
  `reason` TEXT NULL,
  `comments` TEXT NULL,
  `decided_by_user_id` VARCHAR(50) NULL,
  `decided_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_approvals_status` (`status`),
  CONSTRAINT `fk_approvals_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_approvals_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_approvals_decider` FOREIGN KEY (`decided_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. NEGOTIATION LOGS (Outcome 6)
-- ============================================================
CREATE TABLE `negotiation_logs` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `quote_id` VARCHAR(50) NOT NULL,
  `sender_type` VARCHAR(50) NOT NULL, -- 'Customer', 'Sales Rep', 'Sales Manager'
  `sender_name` VARCHAR(100) NOT NULL,
  `message` TEXT NULL,
  `proposed_discount` DECIMAL(5,2) NULL,
  `proposed_amount` DECIMAL(12,2) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_negotiation_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. ORDERS
-- ============================================================
CREATE TABLE `orders` (
  `id` VARCHAR(50) NOT NULL,
  `quote_id` VARCHAR(50) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Processing', -- 'Processing', 'Warehouse Allocation', 'Partially Fulfilled', 'Shipped', 'Delivered'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ORDER ITEMS (Outcome 4: Mixed Lines)
-- ============================================================
CREATE TABLE `order_items` (
  `id` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `line_total` DECIMAL(12,2) NOT NULL,
  `is_recurring` BOOLEAN DEFAULT FALSE,
  `billing_frequency` VARCHAR(20) DEFAULT 'one_time',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. WAREHOUSES & INVENTORY (Outcome 3)
-- ============================================================
CREATE TABLE `warehouses` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `warehouse_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `quantity_available` INT NOT NULL DEFAULT 0,
  `quantity_reserved` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_product` (`warehouse_id`, `product_id`),
  CONSTRAINT `fk_inv_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_allocations` (
  `id` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `warehouse_id` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL,
  `is_manual_override` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_alloc_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alloc_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_alloc_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. SUBSCRIPTIONS & BILLING SCHEDULE (Outcome 4)
-- ============================================================
CREATE TABLE `subscriptions` (
  `id` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(50) NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NULL,
  `plan_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `amount` DECIMAL(12,2) NOT NULL,
  `billing_frequency` VARCHAR(50) NOT NULL DEFAULT 'Monthly', -- 'Monthly', 'Quarterly', 'Yearly'
  `start_date` DATETIME NOT NULL,
  `next_billing_date` DATETIME NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Modified', 'Cancelled'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sub_customer` (`customer_id`),
  CONSTRAINT `fk_sub_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_sub_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. INVOICES & INVOICE ITEMS
-- ============================================================
CREATE TABLE `invoices` (
  `id` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(50) NULL,
  `quote_id` VARCHAR(50) NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid', -- 'Unpaid', 'Paid', 'Overdue', 'Cancelled'
  `issue_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATETIME NOT NULL,
  `paid_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoices_status` (`status`),
  CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
  `id` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NULL,
  `description` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `is_prorated` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_invoice_items_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA INSERTIONS
-- ============================================================

-- Users: Passwords hashed with bcrypt (plain password: 'password')
-- Hash: $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `role`, `role_name`, `company`, `avatar`) VALUES
('user-1', 'Alex Sterling', 'alex.sterling@dealflow.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'sales-rep', 'Sales Representative', NULL, 'A'),
('user-2', 'Sarah Jenkins', 'sarah.jenkins@dealflow.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'sales-manager', 'Sales Manager', NULL, 'S'),
('user-3', 'Marcus Thorne', 'marcus.thorne@dealflow.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'finance', 'Finance & Operations', NULL, 'M'),
('user-4', 'Elena Rostova', 'elena.admin@dealflow.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', 'System Administrator', NULL, 'E'),
('user-5', 'John Customer', 'john@acmecorp.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'customer', 'Customer', 'Acme Corp', 'J');

-- Customer Tiers (From existing business limits)
INSERT INTO `customer_tiers` (`id`, `name`, `hardware_discount_limit`, `services_discount_limit`, `subscriptions_discount_limit`, `max_auto_approval_discount`) VALUES
('Enterprise', 'Enterprise Tier', 15.00, 10.00, 20.00, 15.00),
('Mid-Market', 'Mid-Market Tier', 10.00, 5.00, 15.00, 10.00),
('SMB', 'SMB Tier', 5.00, 5.00, 10.00, 5.00);

-- Customers
INSERT INTO `customers` (`id`, `name`, `tier_id`, `contact_name`, `contact_email`, `billing_address`, `shipping_address`) VALUES
('c-1', 'Acme Corp', 'Enterprise', 'John Customer', 'john@acmecorp.com', '123 Business Rd, New York, NY 10001', '123 Business Rd, New York, NY 10001'),
('c-2', 'CyberSystems Inc.', 'Mid-Market', 'Sarah Tech', 'sarah@cybersystems.io', '456 Tech Park, San Francisco, CA 94105', '456 Tech Park, San Francisco, CA 94105'),
('c-3', 'Starlight Media', 'SMB', 'Mike Star', 'mike@starlight.media', '789 Media Way, Los Angeles, CA 90028', '789 Media Way, Los Angeles, CA 90028');

-- Products
INSERT INTO `products` (`id`, `name`, `category`, `price`, `cost`, `max_discount`, `billing_frequency`, `status`) VALUES
('p-1', 'Enterprise Server X-100', 'Hardware', 15000.00, 10000.00, 15.00, 'one_time', 'Active'),
('p-2', 'Cloud Storage Array 50TB', 'Hardware', 22000.00, 16000.00, 15.00, 'one_time', 'Active'),
('p-3', 'Network Switch Pro', 'Hardware', 3500.00, 2000.00, 20.00, 'one_time', 'Active'),
('p-4', 'Implementation Service', 'Services', 5000.00, 2500.00, 10.00, 'one_time', 'Active'),
('p-5', 'Premium Support (Annual)', 'Services', 12000.00, 6000.00, 10.00, 'one_time', 'Active'),
('p-6', 'DealFlow360 Enterprise License (User/Mo)', 'Subscriptions', 150.00, 30.00, 25.00, 'monthly', 'Active'),
('p-7', 'DealFlow360 Pro License (User/Mo)', 'Subscriptions', 95.00, 20.00, 20.00, 'monthly', 'Active'),
('p-8', 'Analytics Add-on (Mo)', 'Subscriptions', 500.00, 100.00, 20.00, 'monthly', 'Active'),
('p-9', 'Extended Warranty (3 Yrs)', 'Services', 4500.00, 1000.00, 5.00, 'one_time', 'Active');

-- Approval Rules (Configurable rules per Outcome 1)
INSERT INTO `approval_rules` (`name`, `customer_tier`, `min_discount`, `max_discount`, `min_amount`, `min_margin`, `required_role`, `priority`) VALUES
('Standard Tier Over-Discount Rule', NULL, 15.01, 20.00, 0.00, NULL, 'sales-manager', 1),
('High Discount Rule (Finance Review)', NULL, 20.01, 100.00, 0.00, NULL, 'finance', 2),
('Low Margin Protection Rule', NULL, 0.00, 100.00, 0.00, 20.00, 'sales-manager', 3),
('SMB Strict Discount Rule', 'SMB', 5.01, 15.00, 0.00, NULL, 'sales-manager', 4),
('Enterprise Large Deal Auto Route', 'Enterprise', 15.01, 25.00, 100000.00, NULL, 'finance', 5);

-- Upsell / Cross-sell Intelligence Rules (Outcome 2)
INSERT INTO `upsell_rules` (`id`, `trigger_product_id`, `rec_product_id`, `type`, `min_margin`, `is_promo`, `active`, `title`, `explanation`, `confidence`) VALUES
('r-1', 'p-1', 'p-9', 'Cross-sell', 20.00, FALSE, TRUE, 'Extended 3-Yr Warranty', 'Hardware purchases typically require Extended Warranty for enterprise SLA compliance.', 87),
('r-2', 'p-7', 'p-6', 'Upsell', 15.00, TRUE, TRUE, 'Upgrade to Enterprise License', 'Unlock advanced workflow automation and enterprise RBAC per seat.', 92),
('r-3', 'p-2', 'p-4', 'Cross-sell', 25.00, FALSE, TRUE, 'Implementation & Migration Service', 'High-capacity storage setups require professional deployment services.', 78),
('r-4', 'p-1', 'p-5', 'Cross-sell', 20.00, FALSE, TRUE, 'Premium Support Plan', 'Enterprise servers are best paired with 24/7 Premium Support.', 89);

-- Warehouses
INSERT INTO `warehouses` (`id`, `name`, `code`, `location`, `is_active`) VALUES
('Warehouse A', 'Warehouse A - East Hub', 'WH-A', 'New Jersey, USA', TRUE),
('Warehouse B', 'Warehouse B - West Hub', 'WH-B', 'California, USA', TRUE);

-- Initial Inventory (from initialInventory mock)
INSERT INTO `inventory` (`warehouse_id`, `product_id`, `quantity_available`, `quantity_reserved`) VALUES
('Warehouse A', 'p-1', 5, 0),
('Warehouse B', 'p-1', 10, 0),
('Warehouse A', 'p-2', 2, 0),
('Warehouse B', 'p-2', 0, 0),
('Warehouse A', 'p-3', 50, 0),
('Warehouse B', 'p-3', 100, 0);

-- Quotations (Preserving exact mock data)
INSERT INTO `quotes` (`id`, `customer_id`, `owner_user_id`, `subtotal`, `discount`, `discount_amount`, `amount`, `cost`, `margin`, `risk`, `risk_score`, `status`, `created_at`, `updated_at`) VALUES
('QT-2026-0042', 'c-1', 'user-1', 193333.33, 25.00, 48333.33, 145000.00, 118900.00, 18.00, 'High', 85, 'Pending Approval', '2026-08-25 10:00:00', '2026-09-02 14:30:00'),
('QT-2026-0043', 'c-2', 'user-1', 89473.68, 5.00, 4473.68, 85000.00, 56100.00, 34.00, 'Low', 10, 'Sent', '2026-08-28 09:15:00', '2026-09-01 11:20:00'),
('QT-2026-0044', 'c-3', 'user-1', 247058.82, 15.00, 37058.82, 210000.00, 151200.00, 28.00, 'Medium', 45, 'Under Negotiation', '2026-08-15 16:45:00', '2026-09-04 08:10:00'),
('QT-2026-0045', 'c-1', 'user-2', 61111.11, 10.00, 6111.11, 55000.00, 38500.00, 30.00, 'Low', 15, 'Draft', '2026-09-03 13:20:00', '2026-09-03 13:20:00'),
('QT-2026-0046', 'c-2', 'user-1', 410256.41, 22.00, 90256.41, 320000.00, 259200.00, 19.00, 'High', 80, 'Confirmed', '2026-08-10 11:00:00', '2026-09-05 09:00:00'),
('QT-2026-0047', 'c-3', 'user-1', 42000.00, 0.00, 0.00, 42000.00, 26040.00, 38.00, 'Low', 5, 'Fulfillment', '2026-08-01 14:30:00', '2026-08-20 10:15:00');

-- Quote Items for existing quotes
INSERT INTO `quote_items` (`id`, `quote_id`, `product_id`, `quantity`, `unit_price`, `unit_cost`, `discount`, `line_subtotal`, `line_discount_amount`, `line_total`, `line_cost`, `line_margin`, `created_at`) VALUES
('qi-1', 'QT-2026-0042', 'p-1', 8, 15000.00, 10000.00, 25.00, 120000.00, 30000.00, 90000.00, 80000.00, 11.11, '2026-08-25 10:00:00'),
('qi-2', 'QT-2026-0042', 'p-6', 50, 150.00, 30.00, 25.00, 7500.00, 1875.00, 5625.00, 1500.00, 73.33, '2026-08-25 10:00:00'),
('qi-3', 'QT-2026-0043', 'p-2', 4, 22000.00, 16000.00, 5.00, 88000.00, 4400.00, 83600.00, 64000.00, 23.44, '2026-08-28 09:15:00'),
('qi-4', 'QT-2026-0044', 'p-1', 12, 15000.00, 10000.00, 15.00, 180000.00, 27000.00, 153000.00, 120000.00, 21.57, '2026-08-15 16:45:00');

-- Pending Approval Record for QT-2026-0042
INSERT INTO `approvals` (`id`, `quote_id`, `requested_by_user_id`, `required_role`, `status`, `reason`, `created_at`) VALUES
('app-1', 'QT-2026-0042', 'user-1', 'sales-manager', 'Pending Approval', 'Discount (25.0%) exceeds customer limit (15.0%) and margin drops to 18.0%', '2026-08-25 10:05:00');

-- Negotiation logs for QT-2026-0044
INSERT INTO `negotiation_logs` (`quote_id`, `sender_type`, `sender_name`, `message`, `proposed_discount`, `proposed_amount`, `created_at`) VALUES
('QT-2026-0044', 'Customer', 'Mike Star', 'We are looking for a 15% discount for long term partnership.', 15.00, 210000.00, '2026-08-20 14:00:00'),
('QT-2026-0044', 'Sales Rep', 'Alex Sterling', 'Approved 15% discount with standard 30-day payment term.', 15.00, 210000.00, '2026-08-21 09:30:00');

-- Seed Order for Confirmed Quote
INSERT INTO `orders` (`id`, `quote_id`, `customer_id`, `amount`, `status`, `created_at`) VALUES
('ORD-2026-0046', 'QT-2026-0046', 'c-2', 320000.00, 'Processing', '2026-09-05 09:15:00'),
('ORD-2026-0047', 'QT-2026-0047', 'c-3', 42000.00, 'Warehouse Allocation', '2026-08-20 11:00:00');

-- Order items (Mixed lines: One-time hardware + recurring subscription)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`, `is_recurring`, `billing_frequency`) VALUES
('oi-1', 'ORD-2026-0046', 'p-1', 15, 15000.00, 225000.00, FALSE, 'one_time'),
('oi-2', 'ORD-2026-0046', 'p-6', 100, 150.00, 15000.00, TRUE, 'monthly'),
('oi-3', 'ORD-2026-0047', 'p-3', 12, 3500.00, 42000.00, FALSE, 'one_time');

-- Subscriptions for recurring order items
INSERT INTO `subscriptions` (`id`, `order_id`, `customer_id`, `product_id`, `plan_name`, `quantity`, `amount`, `billing_frequency`, `start_date`, `next_billing_date`, `status`) VALUES
('SUB-2026-0046', 'ORD-2026-0046', 'c-2', 'p-6', 'DealFlow360 Enterprise License (User/Mo)', 100, 15000.00, 'Monthly', '2026-09-05 09:15:00', '2026-10-05 09:15:00', 'Active');

-- Invoices
INSERT INTO `invoices` (`id`, `order_id`, `quote_id`, `customer_id`, `subtotal`, `tax`, `amount`, `status`, `issue_date`, `due_date`) VALUES
('INV-2026-0046', 'ORD-2026-0046', 'QT-2026-0046', 'c-2', 320000.00, 25600.00, 345600.00, 'Unpaid', '2026-09-05 09:30:00', '2026-10-05 09:30:00');

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `description`, `quantity`, `unit_price`, `amount`, `is_prorated`) VALUES
('ii-1', 'INV-2026-0046', 'p-1', 'Enterprise Server X-100 (Hardware)', 15, 15000.00, 225000.00, FALSE),
('ii-2', 'INV-2026-0046', 'p-6', 'DealFlow360 Enterprise License (Monthly Subscription)', 100, 150.00, 15000.00, FALSE);
