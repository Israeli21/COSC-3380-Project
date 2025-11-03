-- insert_data.sql: populating the database with sample/test data
-- Fills our empty database with sample data
INSERT INTO category (category_id, name, description) VALUES
(1, 'Economy', 'Standard affordable rides for everyday travel'),
(2, 'Premium', 'Luxury vehicles with top-rated drivers'),
(3, 'XL', 'Larger vehicles for groups up to 6 people'),
(4, 'Pool', 'Shared rides at lower cost'),
(5, 'Electric', 'Eco-friendly electric vehicles'),
(6, 'Accessible', 'Wheelchair accessible vehicles'),
(7, 'Pet', 'Pet-friendly rides'),
(8, 'Bike', 'Bicycle delivery service'),
(9, 'Scooter', 'Electric scooter rental'),
(10, 'Business', 'Professional business travel'),
(11, 'SUV', 'Sport utility vehicles for comfort'),
(12, 'Luxury', 'High-end luxury car service');

-- ============================================
-- LOCATIONS (10+ rows - LOOKUP TABLE)
-- ============================================
INSERT INTO location (location_id, address, city, state, zip_code, country) VALUES
(1, '4800 Calhoun Rd', 'Houston', 'TX', '77004', 'USA'),
(2, '1400 Hermann Dr', 'Houston', 'TX', '77004', 'USA'),
(3, '2855 South Loop West', 'Houston', 'TX', '77054', 'USA'),
(4, '12848 Queensbury Ln', 'Houston', 'TX', '77024', 'USA'),
(5, '19001 Crescent Springs Dr', 'Houston', 'TX', '77084', 'USA'),
(6, '3200 Southwest Fwy', 'Houston', 'TX', '77027', 'USA'),
(7, '5085 Westheimer Rd', 'Houston', 'TX', '77056', 'USA'),
(8, '8401 Fannin St', 'Houston', 'TX', '77054', 'USA'),
(9, '10001 Westheimer Rd', 'Houston', 'TX', '77042', 'USA'),
(10, '1201 Louisiana St', 'Houston', 'TX', '77002', 'USA'),
(11, '9994 Bellaire Blvd', 'Houston', 'TX', '77036', 'USA'),
(12, '6910 Fannin St', 'Houston', 'TX', '77030', 'USA'),
(13, '2000 Crawford St', 'Houston', 'TX', '77002', 'USA'),
(14, '610 Main St', 'Houston', 'TX', '77002', 'USA'),
(15, '2450 Holcombe Blvd', 'Houston', 'TX', '77021', 'USA');

-- ============================================
-- USERS (Riders/Customers)
-- ============================================
INSERT INTO app_user (user_id, name, email, phone) VALUES
(1, 'John Smith', 'john.smith@email.com', '713-555-0101'),
(2, 'Maria Garcia', 'maria.garcia@email.com', '281-555-0102'),
(3, 'James Wilson', 'james.wilson@email.com', '832-555-0103'),
(4, 'Lisa Anderson', 'lisa.anderson@email.com', '713-555-0104'),
(5, 'Robert Taylor', 'robert.taylor@email.com', '281-555-0105'),
(6, 'Emily Chen', 'emily.chen@email.com', '713-555-0106'),
(7, 'Michael Rodriguez', 'michael.r@email.com', '832-555-0107'),
(8, 'Sarah Johnson', 'sarah.j@email.com', '281-555-0108');

-- ============================================
-- DRIVERS
-- ============================================
INSERT INTO driver (driver_id, name, email, phone, license_number) VALUES
(1, 'David Johnson', 'david.j@driver.com', '713-555-0201', 'TX-DL-123456'),
(2, 'Sarah Martinez', 'sarah.m@driver.com', '281-555-0202', 'TX-DL-234567'),
(3, 'Michael Brown', 'michael.b@driver.com', '832-555-0203', 'TX-DL-345678'),
(4, 'Jennifer Lee', 'jennifer.l@driver.com', '713-555-0204', 'TX-DL-456789'),
(5, 'Chris Davis', 'chris.d@driver.com', '281-555-0205', 'TX-DL-567890'),
(6, 'Amanda White', 'amanda.w@driver.com', '713-555-0206', 'TX-DL-678901');

-- ============================================
-- BANK ACCOUNTS
-- ============================================

-- User Bank Accounts (customers) - Updated with higher balances for testing
INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) VALUES
(1, 1, NULL, 'app_user', 1500.00),
(2, 2, NULL, 'app_user', 2000.00),
(3, 3, NULL, 'app_user', 1750.50),
(4, 4, NULL, 'app_user', 3000.00),
(5, 5, NULL, 'app_user', 1250.75),
(6, 6, NULL, 'app_user', 4500.00),
(7, 7, NULL, 'app_user', 890.25),
(8, 8, NULL, 'app_user', 1750.50);

-- Driver Bank Accounts
INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) VALUES
(9, NULL, 1, 'driver', 2500.00),
(10, NULL, 2, 'driver', 4200.00),
(11, NULL, 3, 'driver', 1800.00),
(12, NULL, 4, 'driver', 5600.00),
(13, NULL, 5, 'driver', 3100.00),
(14, NULL, 6, 'driver', 2950.00);

-- ============================================
-- RIDES (Sample completed rides)
-- ============================================
INSERT INTO ride (ride_id, user_id, driver_id, category_id, pickup_location_id, dropoff_location_id, price, ride_time_minutes, status) VALUES
(1, 1, 1, 1, 1, 2, 15.50, 15, 'completed'),
(2, 2, 2, 2, 3, 4, 32.75, 25, 'completed'),
(3, 3, 3, 3, 5, 6, 28.00, 22, 'completed'),
(4, 1, 4, 1, 2, 7, 18.25, 18, 'completed'),
(5, 4, 1, 4, 8, 9, 12.50, 20, 'completed'),
(6, 5, 5, 1, 10, 11, 22.00, 30, 'completed'),
(7, 2, 2, 2, 12, 13, 45.00, 35, 'completed'),
(8, 6, 3, 5, 14, 15, 19.75, 16, 'completed'),
(9, 7, 4, 1, 1, 10, 25.50, 28, 'completed'),
(10, 8, 6, 3, 3, 8, 31.00, 24, 'completed');

-- ============================================
-- PAYMENTS (for completed rides)
-- ============================================
INSERT INTO payment (payment_id, ride_id, bank_account_id, amount, subtotal, tax, total, payment_status) VALUES
(1, 1, 1, 15.50, 15.50, 1.24, 16.74, 'completed'),
(2, 2, 2, 32.75, 32.75, 2.62, 35.37, 'completed'),
(3, 3, 3, 28.00, 28.00, 2.24, 30.24, 'completed'),
(4, 4, 1, 18.25, 18.25, 1.46, 19.71, 'completed'),
(5, 5, 4, 12.50, 12.50, 1.00, 13.50, 'completed'),
(6, 6, 5, 22.00, 22.00, 1.76, 23.76, 'completed'),
(7, 7, 2, 45.00, 45.00, 3.60, 48.60, 'completed'),
(8, 8, 6, 19.75, 19.75, 1.58, 21.33, 'completed'),
(9, 9, 7, 25.50, 25.50, 2.04, 27.54, 'completed'),
(10, 10, 8, 31.00, 31.00, 2.48, 33.48, 'completed');