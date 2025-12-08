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

-- DRIVERS
INSERT INTO driver (driver_id, name, email, phone, license_number) VALUES
(1, 'David Johnson', 'david.j@driver.com', '713-555-0201', 'TX-DL-123456'),
(2, 'Sarah Martinez', 'sarah.m@driver.com', '281-555-0202', 'TX-DL-234567'),
(3, 'Michael Brown', 'michael.b@driver.com', '832-555-0203', 'TX-DL-345678'),
(4, 'Jennifer Lee', 'jennifer.l@driver.com', '713-555-0204', 'TX-DL-456789'),
(5, 'Chris Davis', 'chris.d@driver.com', '281-555-0205', 'TX-DL-567890'),
(6, 'Amanda White', 'amanda.w@driver.com', '713-555-0206', 'TX-DL-678901');

-- DRIVER AVAILABILITY (Weekly Schedules)
-- Format: driver_id, day_of_week (0=Sun,1=Mon,...,6=Sat), start_hour (0-23), end_hour (0-23)

-- Driver 1: David Johnson - Mon-Fri 5am-2pm
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(1, 1, 5, 14), -- Monday
(1, 2, 5, 14), -- Tuesday
(1, 3, 5, 14), -- Wednesday
(1, 4, 5, 14), -- Thursday
(1, 5, 5, 14); -- Friday

-- Driver 2: Sarah Martinez - Mon-Fri 6am-6pm
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(2, 1, 6, 18), -- Monday
(2, 2, 6, 18), -- Tuesday
(2, 3, 6, 18), -- Wednesday
(2, 4, 6, 18), -- Thursday
(2, 5, 6, 18); -- Friday

-- Driver 3: Michael Brown - Weekends + evenings (Mon-Fri 5pm-11pm, Sat-Sun 8am-11pm)
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(3, 1, 17, 23), -- Monday evening
(3, 2, 17, 23), -- Tuesday evening
(3, 3, 17, 23), -- Wednesday evening
(3, 4, 17, 23), -- Thursday evening
(3, 5, 17, 23), -- Friday evening
(3, 6, 8, 23),  -- Saturday
(3, 0, 8, 23);  -- Sunday

-- Driver 4: Jennifer Lee - Full time Mon-Sun 7am-7pm
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(4, 0, 7, 19), -- Sunday
(4, 1, 7, 19), -- Monday
(4, 2, 7, 19), -- Tuesday
(4, 3, 7, 19), -- Wednesday
(4, 4, 7, 19), -- Thursday
(4, 5, 7, 19), -- Friday
(4, 6, 7, 19); -- Saturday

-- Driver 5: Chris Davis - Night shift Mon-Fri 8pm-4am (split into late night + early morning)
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(5, 1, 20, 24), -- Monday 8pm-midnight
(5, 2, 0, 4),   -- Tuesday midnight-4am
(5, 2, 20, 24), -- Tuesday 8pm-midnight
(5, 3, 0, 4),   -- Wednesday midnight-4am
(5, 3, 20, 24), -- Wednesday 8pm-midnight
(5, 4, 0, 4),   -- Thursday midnight-4am
(5, 4, 20, 24), -- Thursday 8pm-midnight
(5, 5, 0, 4),   -- Friday midnight-4am
(5, 5, 20, 24), -- Friday 8pm-midnight
(5, 6, 0, 4);   -- Saturday midnight-4am

-- Driver 6: Amanda White - Part time Tue/Thu/Sat 9am-3pm
INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour) VALUES
(6, 2, 9, 15), -- Tuesday
(6, 4, 9, 15), -- Thursday
(6, 6, 9, 15); -- Saturday

-- MINIMAL DEMO DATA FOR TA TESTING
-- Just ONE user for transaction testing - TAs will add more
INSERT INTO app_user (user_id, name) VALUES
(1, 'John Doe');

-- BANK ACCOUNTS
-- ONE user bank account for transaction testing with sufficient balance
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