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
    // Update user balances to higher amounts
    await client.query(`
      UPDATE bank_account SET balance = 1500.00 WHERE account_id = 1;
      UPDATE bank_account SET balance = 2000.00 WHERE account_id = 2;
      UPDATE bank_account SET balance = 1750.50 WHERE account_id = 3;
      UPDATE bank_account SET balance = 3000.00 WHERE account_id = 4;
      UPDATE bank_account SET balance = 1250.75 WHERE account_id = 5;
      UPDATE bank_account SET balance = 4500.00 WHERE account_id = 6;
      UPDATE bank_account SET balance = 890.25 WHERE account_id = 7;
      UPDATE bank_account SET balance = 1750.50 WHERE account_id = 8;
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
    const { user_name, driver_id, pickup_location_id, destination_location_id, ride_date, ride_time } = req.body;
    
    // Default price and ride time for now (can be made dynamic later)
    const price = 25.00;
    const ride_time_minutes = 30;
    
    // Calculate tax (8.25%) and total
    const tax = parseFloat((price * 0.0825).toFixed(2));
    const total = parseFloat((price + tax).toFixed(2));
    
    await client.query('BEGIN');
    
    // Check if user exists, if not create them
    let userResult = await client.query(
      'SELECT user_id FROM app_user WHERE name = $1',
      [user_name]
    );
    
    let user_id;
    if (userResult.rows.length === 0) {
      // Create new user
      const maxUserId = await client.query('SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM app_user');
      user_id = maxUserId.rows[0].next_id;
      
      await client.query(
        'INSERT INTO app_user (user_id, name) VALUES ($1, $2)',
        [user_id, user_name]
      );
      
      // Create bank account for new user with $1000 starting balance
      const maxAccountId = await client.query('SELECT COALESCE(MAX(account_id), 0) + 1 as next_id FROM bank_account');
      const accountId = maxAccountId.rows[0].next_id;
      
      await client.query(
        'INSERT INTO bank_account (account_id, user_id, driver_id, account_type, balance) VALUES ($1, $2, NULL, $3, $4)',
        [accountId, user_id, 'app_user', 1000.00]
      );
    } else {
      user_id = userResult.rows[0].user_id;
    }
    
    // Check user balance
    const balanceCheck = await client.query(
      'SELECT balance, account_id FROM bank_account WHERE user_id = $1 AND account_type = $2',
      [user_id, 'app_user']
    );
    
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

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});