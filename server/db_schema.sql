DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS pickup_location CASCADE;
DROP TABLE IF EXISTS destination_location CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS date CASCADE;
DROP TABLE IF EXISTS time CASCADE;
DROP TABLE IF EXISTS ride CASCADE;
DROP TABLE IF EXISTS bank_account CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS driver_availability CASCADE;
DROP TABLE IF EXISTS user_favorite_location CASCADE;
DROP TABLE IF EXISTS location_distance CASCADE;

-- STEP 1: CREATE TABLES (NO FOREIGN KEYS YET):
CREATE TABLE app_user (
    user_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

SELECT * FROM app_user;

CREATE TABLE pickup_location (
    pickup_location_id INTEGER PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'USA'
);

CREATE TABLE destination_location (
    destination_location_id INTEGER PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'USA'
);

CREATE TABLE date (
    date_id INTEGER PRIMARY KEY,
    date_value DATE NOT NULL UNIQUE
);

CREATE TABLE time (
    time_id INTEGER PRIMARY KEY,
    time_value TIME NOT NULL UNIQUE
);

CREATE TABLE driver (
    driver_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE
);

-- STEP 2: Create child tables (with FK dependencies):
CREATE TABLE ride (
    ride_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    destination_location_id INTEGER NOT NULL,
    date_id INTEGER NOT NULL,
    time_id INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    ride_time_minutes INTEGER NOT NULL CHECK (ride_time_minutes > 0),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ride_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_driver FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_pickup FOREIGN KEY (pickup_location_id) REFERENCES pickup_location(pickup_location_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_destination FOREIGN KEY (destination_location_id) REFERENCES destination_location(destination_location_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_date FOREIGN KEY (date_id) REFERENCES date(date_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ride_time FOREIGN KEY (time_id) REFERENCES time(time_id) ON DELETE RESTRICT
);
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

-- STEP 3: Create tables with composite keys:
CREATE TABLE driver_availability (
    availability_id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_hour INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
    end_hour INTEGER NOT NULL CHECK (end_hour BETWEEN 0 AND 24), -- Allow 24 for midnight/end of day
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_availability_driver FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_driver_availability_lookup ON driver_availability(driver_id, day_of_week, is_active);

-- Helper function to check if driver is available at a specific datetime
CREATE OR REPLACE FUNCTION is_driver_available(
    p_driver_id INTEGER,
    p_datetime TIMESTAMP
) RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week INTEGER;
    v_hour INTEGER;
    v_count INTEGER;
BEGIN
    -- Extract day of week (0-6) and hour from datetime
    v_day_of_week := EXTRACT(DOW FROM p_datetime)::INTEGER;
    v_hour := EXTRACT(HOUR FROM p_datetime)::INTEGER;
    
    -- Check if driver has availability for this day/time
    SELECT COUNT(*) INTO v_count
    FROM driver_availability
    WHERE driver_id = p_driver_id
      AND day_of_week = v_day_of_week
      AND start_hour <= v_hour
      AND end_hour > v_hour
      AND is_active = TRUE;
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE user_favorite_location (
    user_id INTEGER NOT NULL,
    pickup_location_id INTEGER NOT NULL,
    nickname VARCHAR(100),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, pickup_location_id),
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_location FOREIGN KEY (pickup_location_id) REFERENCES pickup_location(pickup_location_id) ON DELETE CASCADE
);

CREATE TABLE location_distance (
    start_location_id INTEGER NOT NULL,
    end_location_id INTEGER NOT NULL,
    distance_miles DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (start_location_id, end_location_id),
    CONSTRAINT fk_distance_start FOREIGN KEY (start_location_id) REFERENCES pickup_location(pickup_location_id) ON DELETE CASCADE,
    CONSTRAINT fk_distance_end FOREIGN KEY (end_location_id) REFERENCES destination_location(destination_location_id) ON DELETE CASCADE
);