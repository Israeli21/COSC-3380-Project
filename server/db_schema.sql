DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS ride CASCADE;
DROP TABLE IF EXISTS bank_account CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS category CASCADE;

-- ============================================
-- STEP 1: CREATE TABLES (NO FOREIGN KEYS YET)
-- ============================================

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'USA'
);

CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE driver (
    driver_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE bank_account (
    account_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    driver_id INTEGER,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user', 'driver')),
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0)
);

CREATE TABLE ride (
    ride_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    dropoff_location_id INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    ride_time_minutes INTEGER NOT NULL CHECK (ride_time_minutes > 0),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL UNIQUE,
    bank_account_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) NOT NULL CHECK (tax >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'completed'
);

INSERT INTO category (name, description) VALUES
('Economy', 'Standard affordable rides'),
('Premium', 'Luxury vehicles'),
('XL', 'Larger vehicles for groups'),
('Pool', 'Shared rides'),
('Electric', 'Eco-friendly vehicles'),
('Accessible', 'Wheelchair accessible'),
('Pet', 'Pet-friendly rides'),
('Bike', 'Bicycle delivery'),
('Scooter', 'Electric scooter'),
('Business', 'Professional travel');

-- Locations
INSERT INTO location (address, city, state, zip_code, country) VALUES
('4800 Calhoun Rd', 'Houston', 'TX', '77004', 'USA'),
('1400 Hermann Dr', 'Houston', 'TX', '77004', 'USA'),
('2855 South Loop West', 'Houston', 'TX', '77054', 'USA'),
('12848 Queensbury Ln', 'Houston', 'TX', '77024', 'USA'),
('19001 Crescent Springs Dr', 'Houston', 'TX', '77084', 'USA'),
('3200 Southwest Fwy', 'Houston', 'TX', '77027', 'USA'),
('5085 Westheimer Rd', 'Houston', 'TX', '77056', 'USA'),
('8401 Fannin St', 'Houston', 'TX', '77054', 'USA'),
('10001 Westheimer Rd', 'Houston', 'TX', '77042', 'USA'),
('1201 Louisiana St', 'Houston', 'TX', '77002', 'USA');

-- Users
INSERT INTO app_user (name, email, phone) VALUES
('John Smith', 'john.smith@email.com', '713-555-0101'),
('Maria Garcia', 'maria.garcia@email.com', '281-555-0102'),
('James Wilson', 'james.wilson@email.com', '832-555-0103'),
('Lisa Anderson', 'lisa.anderson@email.com', '713-555-0104'),
('Robert Taylor', 'robert.taylor@email.com', '281-555-0105');

-- Drivers
INSERT INTO driver (name, email, phone, license_number) VALUES
('David Johnson', 'david.j@driver.com', '713-555-0201', 'TX-DL-123456'),
('Sarah Martinez', 'sarah.m@driver.com', '281-555-0202', 'TX-DL-234567'),
('Michael Brown', 'michael.b@driver.com', '832-555-0203', 'TX-DL-345678'),
('Jennifer Lee', 'jennifer.l@driver.com', '713-555-0204', 'TX-DL-456789'),
('Chris Davis', 'chris.d@driver.com', '281-555-0205', 'TX-DL-567890');

-- Bank Accounts
INSERT INTO bank_account (user_id, driver_id, account_type, balance) VALUES
(1, NULL, 'user', 150.00),
(2, NULL, 'user', 200.00),
(3, NULL, 'user', 75.50),
(4, NULL, 'user', 300.00),
(5, NULL, 'user', 125.75),
(NULL, 1, 'driver', 2500.00),
(NULL, 2, 'driver', 4200.00),
(NULL, 3, 'driver', 1800.00),
(NULL, 4, 'driver', 5600.00),
(NULL, 5, 'driver', 3100.00);