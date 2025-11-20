-- insert_data.sql: populating the database with sample/test data
-- Fills our empty database with sample data

-- ============================================
-- LOCATIONS (8 rows for each location type)
-- ============================================
INSERT INTO pickup_location (pickup_location_id, address, city, state, zip_code, country) VALUES
(1, 'UH Main Campus', 'Houston', 'TX', '77004', 'USA'),
(2, 'Houston Museum of Fine Arts', 'Houston', 'TX', '77004', 'USA'),
(3, 'Pho Barr', 'Houston', 'TX', '77054', 'USA'),
(4, 'Rice University', 'Houston', 'TX', '77024', 'USA'),
(5, 'Memorial City Mall', 'Houston', 'TX', '77084', 'USA'),
(6, 'Galleria', 'Houston', 'TX', '77027', 'USA'),
(7, 'Downtown Houston', 'Houston', 'TX', '77056', 'USA'),
(8, 'Methodist Hospital', 'Houston', 'TX', '77054', 'USA');

INSERT INTO destination_location (destination_location_id, address, city, state, zip_code, country) VALUES
(1, 'UH Main Campus', 'Houston', 'TX', '77004', 'USA'),
(2, 'Houston Museum of Fine Arts', 'Houston', 'TX', '77004', 'USA'),
(3, 'Pho Barr', 'Houston', 'TX', '77054', 'USA'),
(4, 'Rice University', 'Houston', 'TX', '77024', 'USA'),
(5, 'Memorial City Mall', 'Houston', 'TX', '77084', 'USA'),
(6, 'Galleria', 'Houston', 'TX', '77027', 'USA'),
(7, 'Downtown Houston', 'Houston', 'TX', '77056', 'USA'),
(8, 'Methodist Hospital', 'Houston', 'TX', '77054', 'USA');

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
INSERT INTO app_user (user_id, name) VALUES
(1, 'John Doe');

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
(4, NULL, 3, 'driver', 1800.00),
(5, NULL, 4, 'driver', 3100.00),
(6, NULL, 5, 'driver', 2900.00),
(7, NULL, 6, 'driver', 3500.00);

-- ============================================
-- LOCATION DISTANCES (Composite Key Table)
-- ============================================
INSERT INTO location_distance (start_location_id, end_location_id, distance_miles) VALUES
    (1, 1, 0),
    (1, 2, 3),
    (1, 3, 17),
    (1, 4, 4),
    (1, 5, 16),
    (1, 6, 10),
    (1, 7, 3),
    (1, 8, 4),
    (2, 1, 3),
    (2, 2, 0),
    (2, 3, 22),
    (2, 4, 1),
    (2, 5, 15),
    (2, 6, 7),
    (2, 7, 3),
    (2, 8, 3),
    (3, 1, 17),
    (3, 2, 22),
    (3, 3, 0),
    (3, 4, 22),
    (3, 5, 33),
    (3, 6, 28),
    (3, 7, 22),
    (3, 8, 22),
    (4, 1, 4),
    (4, 2, 1),
    (4, 3, 22),
    (4, 4, 0),
    (4, 5, 13),
    (4, 6, 5),
    (4, 7, 4),
    (4, 8, 1),
    (5, 1, 16),
    (5, 2, 15),
    (5, 3, 33),
    (5, 4, 13),
    (5, 5, 0),
    (5, 6, 7),
    (5, 7, 15),
    (5, 8, 14),
    (6, 1, 10),
    (6, 2, 7),
    (6, 3, 28),
    (6, 4, 5),
    (6, 5, 7),
    (6, 6, 0),
    (6, 7, 9),
    (6, 8, 6),
    (7, 1, 3),
    (7, 2, 3),
    (7, 3, 22),
    (7, 4, 4),
    (7, 5, 15),
    (7, 6, 9),
    (7, 7, 0),
    (7, 8, 5),
    (8, 1, 4),
    (8, 2, 3),
    (8, 3, 22),
    (8, 4, 1),
    (8, 5, 14),
    (8, 6, 6),
    (8, 7, 5),
    (8, 8, 0);