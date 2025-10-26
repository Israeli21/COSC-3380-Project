-- ============================================
-- TRANSACTION: BOOK A RIDE AND PROCESS PAYMENT
-- Updates: RIDE table, PAYMENT table, BANK_ACCOUNT table (2+ tables)
-- ============================================

-- Example: User 1 books a ride with Driver 1
-- From UH to Hermann Park
-- Price: $15.50, Tax: $1.24, Total: $16.74

BEGIN;

-- Step 1: Check if user has enough balance
DO $$
DECLARE
    user_balance DECIMAL(10,2);
    total_cost DECIMAL(10,2) := 16.74;
BEGIN
    SELECT balance INTO user_balance 
    FROM bank_account 
    WHERE user_id = 1 AND account_type = 'user';
    
    IF user_balance < total_cost THEN
        RAISE EXCEPTION 'Insufficient funds. Balance: $%, Required: $%', user_balance, total_cost;
    END IF;
END $$;

-- Step 2: Create the ride
INSERT INTO ride (
    user_id,
    driver_id,
    category_id,
    pickup_location_id,
    dropoff_location_id,
    price,
    ride_time,
    status
) VALUES (
    1,                      -- User: John Smith
    1,                      -- Driver: David Johnson
    1,                      -- Category: Economy
    1,                      -- Pickup: UH (4800 Calhoun Rd)
    2,                      -- Dropoff: Hermann Park
    15.50,                  -- Price
    INTERVAL '15 minutes',  -- Ride duration
    'completed'
);

-- Step 3: Process payment
INSERT INTO payment (
    ride_id,
    bank_account_id,
    amount,
    subtotal,
    tax,
    total
) VALUES (
    (SELECT MAX(ride_id) FROM ride),  -- Last inserted ride
    1,          -- User 1's bank account
    15.50,      -- Amount (same as price)
    15.50,      -- Subtotal
    1.24,       -- Tax (8%)
    16.74       -- Total
);

-- Step 4: Deduct money from user's account
UPDATE bank_account
SET balance = balance - 16.74
WHERE user_id = 1 AND account_type = 'user';

-- Step 5: Add money to driver's account (80% after 20% commission)
UPDATE bank_account
SET balance = balance + (15.50 * 0.80)
WHERE driver_id = 1 AND account_type = 'driver';

COMMIT;

-- ============================================
-- VERIFY TRANSACTION
-- ============================================

-- Check the ride
SELECT 
    r.ride_id,
    u.name as rider,
    d.name as driver,
    c.name as category,
    l1.address as pickup,
    l2.address as dropoff,
    r.price,
    r.status
FROM ride r
JOIN app_user u ON r.user_id = u.user_id
JOIN driver d ON r.driver_id = d.driver_id
JOIN category c ON r.category_id = c.category_id
JOIN location l1 ON r.pickup_location_id = l1.location_id
JOIN location l2 ON r.dropoff_location_id = l2.location_id
ORDER BY r.ride_id DESC
LIMIT 1;

-- Check the payment
SELECT 
    p.payment_id,
    p.ride_id,
    p.subtotal,
    p.tax,
    p.total,
    ba.balance as user_balance_after
FROM payment p
JOIN bank_account ba ON p.bank_account_id = ba.account_id
ORDER BY p.payment_id DESC
LIMIT 1;

-- Check balances
SELECT 'User Balance' as type, balance FROM bank_account WHERE user_id = 1
UNION ALL
SELECT 'Driver Balance' as type, balance FROM bank_account WHERE driver_id = 1;