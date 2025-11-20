const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Utility Endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      message: 'Database connected!', 
      timestamp: result.rows[0].current_time 
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// DATABASE INITIALIZATION
app.post('/api/init-database', async (req, res) => {
  const client = await pool.connect();
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'db_schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Execute the schema
    await client.query(schema);
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully! Tables created.' 
    });
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize database: ' + err.message 
    });
  } finally {
    client.release();
  }
});

app.post('/api/insert-data', async (req, res) => {
  const client = await pool.connect();
  try {
    // Read the insert data file
    const dataPath = path.join(__dirname, 'insert_data.sql');
    const insertSQL = await fs.readFile(dataPath, 'utf8');
    
    // Execute the inserts
    await client.query(insertSQL);
    
    // Count rows
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM category) as categories,
        (SELECT COUNT(*) FROM location) as locations,
        (SELECT COUNT(*) FROM app_user) as users,
        (SELECT COUNT(*) FROM driver) as drivers,
        (SELECT COUNT(*) FROM bank_account) as accounts,
        (SELECT COUNT(*) FROM ride) as rides,
        (SELECT COUNT(*) FROM payment) as payments
    `);
    
    res.json({ 
      success: true, 
      message: 'Test data inserted successfully!',
      counts: counts.rows[0]
    });
  } catch (err) {
    console.error('Data insertion error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to insert data: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// ============================================
// UPDATE BALANCES ENDPOINT
// ============================================

app.post('/api/update-balances', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE bank_account SET balance = 500.00 WHERE account_id = 1;
      UPDATE bank_account SET balance = 300.00 WHERE account_id = 2;
      UPDATE bank_account SET balance = 250.50 WHERE account_id = 3;
      UPDATE bank_account SET balance = 300.00 WHERE account_id = 4;
      UPDATE bank_account SET balance = 250.75 WHERE account_id = 5;
      UPDATE bank_account SET balance = 500.00 WHERE account_id = 6;
      UPDATE bank_account SET balance = 90.25 WHERE account_id = 7;
      UPDATE bank_account SET balance = 50.50 WHERE account_id = 8;
    `);
    
    res.json({ 
      success: true, 
      message: 'User balances updated successfully! All users now have sufficient funds.' 
    });
  } catch (err) {
    console.error('Balance update error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update balances: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// TRANSACTION: BOOK RIDE
app.post('/api/book-ride', async (req, res) => {
  const startTime = Date.now();
  const client = await pool.connect();
  try {
    const { user_id, driver_id, pickup_location_id, destination_location_id, ride_date, ride_time } = req.body;
    
    // Default price and ride time for now (can be made dynamic later)
    const price = 25.00;
    const ride_time_minutes = 30;
    
    // Calculate tax (8.25%) and total
    const tax = parseFloat((price * 0.0825).toFixed(2));
    const total = parseFloat((price + tax).toFixed(2));
    
    await client.query('BEGIN');
    
    // Check user balance
    const balanceCheck = await client.query(
      'SELECT balance, account_id FROM bank_account WHERE user_id = $1 AND account_type = $2',
      [user_id, 'app_user']
    );
    
    console.log('Balance check for user_id:', user_id, 'Result:', balanceCheck.rows);
    
    if (balanceCheck.rows.length === 0) {
      throw new Error('User does not have a bank account');
    }
    
    const userBalance = parseFloat(balanceCheck.rows[0].balance);
    const accountId = balanceCheck.rows[0].account_id;
    
    if (userBalance < total) {
      throw new Error(`Insufficient funds. Balance: $${userBalance}, Required: $${total}`);
    }
    
    // Handle date - insert if not exists
    let dateResult = await client.query('SELECT date_id FROM date WHERE date_value = $1', [ride_date]);
    let date_id;
    if (dateResult.rows.length === 0) {
      const maxDateId = await client.query('SELECT COALESCE(MAX(date_id), 0) + 1 as next_id FROM date');
      date_id = maxDateId.rows[0].next_id;
      await client.query('INSERT INTO date (date_id, date_value) VALUES ($1, $2)', [date_id, ride_date]);
    } else {
      date_id = dateResult.rows[0].date_id;
    }
    
    // Handle time - insert if not exists
    let timeResult = await client.query('SELECT time_id FROM time WHERE time_value = $1', [ride_time]);
    let time_id;
    if (timeResult.rows.length === 0) {
      const maxTimeId = await client.query('SELECT COALESCE(MAX(time_id), 0) + 1 as next_id FROM time');
      time_id = maxTimeId.rows[0].next_id;
      await client.query('INSERT INTO time (time_id, time_value) VALUES ($1, $2)', [time_id, ride_time]);
    } else {
      time_id = timeResult.rows[0].time_id;
    }
    
    // Get next ride_id
    const maxRideId = await client.query('SELECT COALESCE(MAX(ride_id), 0) + 1 as next_id FROM ride');
    const rideId = maxRideId.rows[0].next_id;
    
    // Insert ride
    await client.query(
      `INSERT INTO ride (ride_id, user_id, driver_id, pickup_location_id, destination_location_id, date_id, time_id, price, ride_time_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [rideId, user_id, driver_id, pickup_location_id, destination_location_id, date_id, time_id, price, ride_time_minutes, 'completed']
    );
    
    // Insert payment
    const maxPaymentId = await client.query('SELECT COALESCE(MAX(payment_id), 0) + 1 as next_id FROM payment');
    const paymentId = maxPaymentId.rows[0].next_id;
    
    await client.query(
      `INSERT INTO payment (payment_id, ride_id, bank_account_id, amount, subtotal, tax, total, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [paymentId, rideId, accountId, price, price, tax, total, 'completed']
    );
    
    // Deduct from user account
    await client.query(
      'UPDATE bank_account SET balance = balance - $1 WHERE user_id = $2 AND account_type = $3',
      [total, user_id, 'app_user']
    );
    
    // Add to driver account (80% after 20% commission)
    const driverEarnings = parseFloat((price * 0.80).toFixed(2));
    await client.query(
      'UPDATE bank_account SET balance = balance + $1 WHERE driver_id = $2 AND account_type = $3',
      [driverEarnings, driver_id, 'driver']
    );
    
    await client.query('COMMIT');
    
    const executionTime = Date.now() - startTime;
    
    res.json({ 
      success: true, 
      message: `Ride booked successfully! Ride ID: ${rideId}; Total charged: $${total};`,
      executionTime: executionTime
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Transaction failed: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// QUERIES WITH JOINS
app.get('/api/query/ride-history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.ride_id,
        u.name AS rider_name,
        d.name AS driver_name,
        r.price,
        r.status
      FROM ride r
      JOIN app_user u ON r.user_id = u.user_id
      JOIN driver d ON r.driver_id = d.driver_id
      ORDER BY r.ride_id DESC
    `);
    
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/query/user-spending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.name AS user_name,
        COUNT(r.ride_id) AS total_rides,
        SUM(p.subtotal) AS subtotal,
        SUM(p.tax) AS total_tax,
        SUM(p.total) AS total_spent,
        ba.balance AS current_balance
      FROM app_user u
      JOIN ride r ON u.user_id = r.user_id
      JOIN payment p ON r.ride_id = p.ride_id
      JOIN bank_account ba ON u.user_id = ba.user_id
      WHERE ba.account_type = 'app_user'
      GROUP BY u.name, ba.balance
      ORDER BY total_spent DESC
    `);
    
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/query/driver-earnings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.name AS driver_name,
        COUNT(r.ride_id) AS total_rides,
        SUM(r.price) AS total_earnings
      FROM driver d
      JOIN ride r ON d.driver_id = r.driver_id
      GROUP BY d.name
      ORDER BY total_earnings DESC
    `);
    
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/query/payment-audit', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.payment_id,
        u.name AS rider,
        d.name AS driver,
        p.total AS amount_paid,
        p.payment_status
      FROM payment p
      JOIN ride r ON p.ride_id = r.ride_id
      JOIN app_user u ON r.user_id = u.user_id
      JOIN driver d ON r.driver_id = d.driver_id
      ORDER BY p.payment_id DESC
    `);
    
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// SIMPLE TABLE QUERIES
// ============================================

// Get all rides
app.get('/api/rides', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM ride ORDER BY ride_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Ride query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query rides: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM app_user ORDER BY user_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('User query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query users: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// Get all payments
app.get('/api/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM payment ORDER BY payment_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Payment query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query payments: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// Get all pickup locations
app.get('/api/pickup-locations', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM pickup_location ORDER BY pickup_location_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Pickup location query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query pickup locations: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// Get all destination locations
app.get('/api/destination-locations', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM destination_location ORDER BY destination_location_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Destination location query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query destination locations: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM driver ORDER BY driver_id');
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Driver query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query drivers: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET USER BALANCE
app.get('/api/user-balance/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    
    const result = await client.query(
      `SELECT balance 
       FROM bank_account 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User account not found' 
      });
    }

    res.json({ 
      success: true, 
      balance: parseFloat(result.rows[0].balance)
    });
  } catch (err) {
    console.error('User balance query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query user balance: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// CREATE NEW USER
app.post('/api/create-user', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, startingBalance } = req.body;

    if (!name || startingBalance === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and starting balance are required' 
      });
    }

    await client.query('BEGIN');

    // Get next user_id
    const maxUserId = await client.query('SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM app_user');
    const userId = maxUserId.rows[0].next_id;

    // Insert user
    const userResult = await client.query(
      'INSERT INTO app_user (user_id, name) VALUES ($1, $2) RETURNING user_id, name',
      [userId, name]
    );
    const newUser = userResult.rows[0];

    // Get next account_id
    const maxAccountId = await client.query('SELECT COALESCE(MAX(account_id), 0) + 1 as next_id FROM bank_account');
    const accountId = maxAccountId.rows[0].next_id;

    // Create bank account for user
    const bankResult = await client.query(
      `INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) 
       VALUES ($1, $2, NULL, 'app_user', $3) RETURNING account_id`,
      [accountId, newUser.user_id, startingBalance]
    );
    
    console.log('Created bank account:', bankResult.rows[0], 'for user_id:', newUser.user_id);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      user: newUser,
      balance: parseFloat(startingBalance)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create user error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// ADJUST USER BALANCE
app.post('/api/adjust-balance', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, amount, operation } = req.body;

    if (!userId || amount === undefined || !operation) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, amount, and operation are required' 
      });
    }

    const adjustment = operation === 'add' ? parseFloat(amount) : -parseFloat(amount);

    await client.query('BEGIN');

    // Get current balance
    const balanceResult = await client.query(
      'SELECT balance FROM bank_account WHERE user_id = $1',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'User account not found' 
      });
    }

    const currentBalance = parseFloat(balanceResult.rows[0].balance);
    const newBalance = currentBalance + adjustment;

    if (newBalance < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance. Cannot go below $0.00' 
      });
    }

    // Update balance
    await client.query(
      'UPDATE bank_account SET balance = $1 WHERE user_id = $2',
      [newBalance, userId]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      newBalance: newBalance
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Adjust balance error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to adjust balance: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// ============================================
// COMPOSITE KEY ENDPOINTS
// ============================================

// GET DRIVER AVAILABILITY - Uses composite key (driver_id, date_id, time_id)
app.get('/api/driver-availability/:driverId/:dateId/:timeId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId, dateId, timeId } = req.params;
    
    const result = await client.query(
      `SELECT da.*, d.name as driver_name, dt.date_value, t.time_value
       FROM driver_availability da
       JOIN driver d ON da.driver_id = d.driver_id
       JOIN date dt ON da.date_id = dt.date_id
       JOIN time t ON da.time_id = t.time_id
       WHERE da.driver_id = $1 AND da.date_id = $2 AND da.time_id = $3`,
      [driverId, dateId, timeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Availability record not found' 
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Driver availability query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query driver availability: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET ALL AVAILABILITY FOR A DRIVER
app.get('/api/driver-availability/:driverId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId } = req.params;
    
    const result = await client.query(
      `SELECT da.*, d.name as driver_name, dt.date_value, t.time_value
       FROM driver_availability da
       JOIN driver d ON da.driver_id = d.driver_id
       JOIN date dt ON da.date_id = dt.date_id
       JOIN time t ON da.time_id = t.time_id
       WHERE da.driver_id = $1
       ORDER BY dt.date_value, t.time_value`,
      [driverId]
    );

    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Driver availability list error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query driver availability: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// SET DRIVER AVAILABILITY - Creates/Updates using composite key
app.post('/api/driver-availability', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId, dateId, timeId, isAvailable } = req.body;

    if (!driverId || !dateId || !timeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Driver ID, date ID, and time ID are required' 
      });
    }

    // Use UPSERT (INSERT ... ON CONFLICT) with composite key
    const result = await client.query(
      `INSERT INTO driver_availability (driver_id, date_id, time_id, is_available)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (driver_id, date_id, time_id) 
       DO UPDATE SET is_available = $4
       RETURNING *`,
      [driverId, dateId, timeId, isAvailable !== false]
    );

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Set driver availability error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to set driver availability: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// DELETE DRIVER AVAILABILITY - Uses composite key
app.delete('/api/driver-availability/:driverId/:dateId/:timeId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId, dateId, timeId } = req.params;
    
    const result = await client.query(
      `DELETE FROM driver_availability 
       WHERE driver_id = $1 AND date_id = $2 AND time_id = $3
       RETURNING *`,
      [driverId, dateId, timeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Availability record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Availability record deleted'
    });
  } catch (err) {
    console.error('Delete driver availability error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete driver availability: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET USER FAVORITE LOCATIONS - Uses composite key (user_id, pickup_location_id)
app.get('/api/user-favorites/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    
    const result = await client.query(
      `SELECT ufl.*, pl.address, pl.city, pl.state, pl.zip_code
       FROM user_favorite_location ufl
       JOIN pickup_location pl ON ufl.pickup_location_id = pl.pickup_location_id
       WHERE ufl.user_id = $1
       ORDER BY ufl.added_at DESC`,
      [userId]
    );

    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('User favorites query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query user favorites: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// ADD USER FAVORITE LOCATION - Uses composite key
app.post('/api/user-favorites', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, pickupLocationId, nickname } = req.body;

    if (!userId || !pickupLocationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and pickup location ID are required' 
      });
    }

    const result = await client.query(
      `INSERT INTO user_favorite_location (user_id, pickup_location_id, nickname)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, pickup_location_id) 
       DO UPDATE SET nickname = $3
       RETURNING *`,
      [userId, pickupLocationId, nickname]
    );

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Add favorite location error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add favorite location: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// DELETE USER FAVORITE LOCATION - Uses composite key
app.delete('/api/user-favorites/:userId/:pickupLocationId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, pickupLocationId } = req.params;
    
    const result = await client.query(
      `DELETE FROM user_favorite_location 
       WHERE user_id = $1 AND pickup_location_id = $2
       RETURNING *`,
      [userId, pickupLocationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Favorite location not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Favorite location removed'
    });
  } catch (err) {
    console.error('Delete favorite location error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete favorite location: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET RIDE FEEDBACK - Uses composite key (ride_id, user_id)
app.get('/api/ride-feedback/:rideId/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rideId, userId } = req.params;
    
    const result = await client.query(
      `SELECT rf.*, u.name as user_name
       FROM ride_feedback rf
       JOIN app_user u ON rf.user_id = u.user_id
       WHERE rf.ride_id = $1 AND rf.user_id = $2`,
      [rideId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Feedback not found' 
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Ride feedback query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query ride feedback: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET ALL FEEDBACK FOR A RIDE
app.get('/api/ride-feedback/:rideId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rideId } = req.params;
    
    const result = await client.query(
      `SELECT rf.*, u.name as user_name
       FROM ride_feedback rf
       JOIN app_user u ON rf.user_id = u.user_id
       WHERE rf.ride_id = $1
       ORDER BY rf.feedback_date DESC`,
      [rideId]
    );

    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Ride feedback list error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query ride feedback: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// SUBMIT RIDE FEEDBACK - Uses composite key
app.post('/api/ride-feedback', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rideId, userId, rating, comments } = req.body;

    if (!rideId || !userId || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ride ID, user ID, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const result = await client.query(
      `INSERT INTO ride_feedback (ride_id, user_id, rating, comments)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ride_id, user_id) 
       DO UPDATE SET rating = $3, comments = $4, feedback_date = CURRENT_TIMESTAMP
       RETURNING *`,
      [rideId, userId, rating, comments]
    );

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit feedback: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// DELETE RIDE FEEDBACK - Uses composite key
app.delete('/api/ride-feedback/:rideId/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rideId, userId } = req.params;
    
    const result = await client.query(
      `DELETE FROM ride_feedback 
       WHERE ride_id = $1 AND user_id = $2
       RETURNING *`,
      [rideId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Feedback not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Feedback deleted'
    });
  } catch (err) {
    console.error('Delete feedback error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete feedback: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});