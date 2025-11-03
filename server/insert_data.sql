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

-- ==================================
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
-- MINIMAL DEMO DATA FOR TA TESTING
-- ============================================

-- Just ONE user for transaction testing - TAs will add more
INSERT INTO app_user (user_id, name, email, phone) VALUES
(1, 'Test User', 'test@email.com', '713-555-0001');

-- ============================================
-- BANK ACCOUNTS
-- ============================================

-- ONE user bank account for transaction testing
INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) VALUES
(1, 1, NULL, 'app_user', 1500.00);

-- Driver Bank Accounts only (for testing driver queries)
INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) VALUES
(2, NULL, 1, 'driver', 2500.00),
(3, NULL, 2, 'driver', 4200.00),
(4, NULL, 3, 'driver', 1800.00);

-- ============================================
-- NO INITIAL RIDES OR PAYMENTS
-- ============================================
-- TAs will create these when they book rides through the interface