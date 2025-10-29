DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS bank_account CASCADE;
DROP TABLE IF EXISTS ride CASCADE;
DROP TABLE IF EXISTS payment CASCADE;

SELECT * FROM payment;

-- ============================================
-- STEP 1: CREATE TABLES (NO FOREIGN KEYS YET)
-- ============================================

CREATE TABLE category (
    category_id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);


CREATE TABLE location (
    location_id INTEGER PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'USA'
);

CREATE TABLE app_user (
    user_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE driver (
    driver_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE
);

-- ==================================================
-- STEP 2: Create child tables (with FK dependencies)
-- ==================================================

CREATE TABLE bank_account (
    account_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    driver_id INTEGER,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('app_user', 'driver')),
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE CASCADE,
    CHECK (
        (account_type = 'app_user' AND user_id IS NOT NULL AND driver_id IS NULL) OR
        (account_type = 'driver' AND driver_id IS NOT NULL AND user_id IS NULL)
    )
);

CREATE TABLE ride (
    ride_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    dropoff_location_id INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    ride_time_minutes INTEGER NOT NULL CHECK (ride_time_minutes > 0),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ride_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_driver FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_pickup FOREIGN KEY (pickup_location_id) REFERENCES location(location_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_dropoff FOREIGN KEY (dropoff_location_id) REFERENCES location(location_id) ON DELETE RESTRICT
);

CREATE TABLE payment (
    payment_id INTEGER PRIMARY KEY,
    ride_id INTEGER NOT NULL UNIQUE,
    bank_account_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) NOT NULL CHECK (tax >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    CONSTRAINT fk_payment_ride FOREIGN KEY (ride_id) REFERENCES ride(ride_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_account FOREIGN KEY (bank_account_id) REFERENCES bank_account(account_id) ON DELETE RESTRICT
);