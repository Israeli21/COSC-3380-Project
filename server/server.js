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
  const client = await pool.connect();
  try {
    const { user_id, driver_id, category_id, pickup_location_id, dropoff_location_id, price, ride_time_minutes } = req.body;
    
    // Calculate tax and total
    const tax = parseFloat((price * 0.08).toFixed(2));
    const total = parseFloat((price + tax).toFixed(2));
    
    await client.query('BEGIN');
    
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
    
    // Get next ride_id
    const maxRideId = await client.query('SELECT COALESCE(MAX(ride_id), 0) + 1 as next_id FROM ride');
    const rideId = maxRideId.rows[0].next_id;
    
    // Insert ride
    await client.query(
      `INSERT INTO ride (ride_id, user_id, driver_id, category_id, pickup_location_id, dropoff_location_id, price, ride_time_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [rideId, user_id, driver_id, category_id, pickup_location_id, dropoff_location_id, price, ride_time_minutes, 'completed']
    );
    
    // Insert payment
    await client.query(
      `INSERT INTO payment (payment_id, ride_id, bank_account_id, amount, subtotal, tax, total, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [rideId, rideId, accountId, price, price, tax, total, 'completed']
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
    
    // Get transaction details
    const result = await client.query(`
      SELECT 
        r.ride_id,
        u.name AS rider,
        d.name AS driver,
        c.name AS category,
        l1.address AS pickup,
        l2.address AS dropoff,
        r.price,
        p.tax,
        p.total,
        ba.balance AS user_balance_after
      FROM ride r
      JOIN app_user u ON r.user_id = u.user_id
      JOIN driver d ON r.driver_id = d.driver_id
      JOIN category c ON r.category_id = c.category_id
      JOIN location l1 ON r.pickup_location_id = l1.location_id
      JOIN location l2 ON r.dropoff_location_id = l2.location_id
      JOIN payment p ON r.ride_id = p.ride_id
      JOIN bank_account ba ON p.bank_account_id = ba.account_id
      WHERE r.ride_id = $1
    `, [rideId]);
    
    res.json({ 
      success: true, 
      message: `Transaction completed! Ride ID: ${rideId}, User charged: $${total}, Driver earned: $${driverEarnings}`,
      result: result.rows
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
        r.created_at as ride_date,
        u.name AS rider_name,
        d.name AS driver_name,
        c.name AS category,
        l1.address AS pickup_address,
        l1.city AS pickup_city,
        l2.address AS dropoff_address,
        l2.city AS dropoff_city,
        r.ride_time_minutes,
        r.price,
        p.tax,
        p.total,
        r.status
      FROM ride r
      INNER JOIN app_user u ON r.user_id = u.user_id
      INNER JOIN driver d ON r.driver_id = d.driver_id
      INNER JOIN category c ON r.category_id = c.category_id
      INNER JOIN location l1 ON r.pickup_location_id = l1.location_id
      INNER JOIN location l2 ON r.dropoff_location_id = l2.location_id
      LEFT JOIN payment p ON r.ride_id = p.ride_id
      WHERE r.status = 'completed'
      ORDER BY r.created_at DESC
      LIMIT 20
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
        u.user_id,
        u.name AS user_name,
        u.email,
        COUNT(r.ride_id) AS total_rides,
        COALESCE(SUM(p.subtotal), 0) AS total_spent_on_rides,
        COALESCE(SUM(p.tax), 0) AS total_tax_paid,
        COALESCE(SUM(p.total), 0) AS total_paid,
        COALESCE(AVG(p.total), 0) AS average_ride_cost,
        ba.balance AS current_balance
      FROM app_user u
      LEFT JOIN ride r ON u.user_id = r.user_id AND r.status = 'completed'
      LEFT JOIN payment p ON r.ride_id = p.ride_id
      LEFT JOIN bank_account ba ON u.user_id = ba.user_id
      GROUP BY u.user_id, u.name, u.email, ba.balance
      ORDER BY total_paid DESC
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
        d.driver_id,
        d.name AS driver_name,
        d.email,
        d.license_number,
        COUNT(r.ride_id) AS total_rides_completed,
        COALESCE(SUM(r.price), 0) AS total_ride_fares,
        COALESCE(AVG(r.price), 0) AS average_fare,
        COALESCE(SUM(r.ride_time_minutes), 0) AS total_minutes_driven,
        ba.balance AS current_balance
      FROM driver d
      LEFT JOIN ride r ON d.driver_id = r.driver_id AND r.status = 'completed'
      LEFT JOIN bank_account ba ON d.driver_id = ba.driver_id
      GROUP BY d.driver_id, d.name, d.email, d.license_number, ba.balance
      ORDER BY total_ride_fares DESC
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
        p.payment_time,
        u.name AS rider,
        d.name AS driver,
        r.ride_id,
        c.name AS category,
        l1.city || ' → ' || l2.city AS route,
        r.ride_time_minutes,
        p.subtotal,
        p.tax,
        p.total,
        p.payment_status
      FROM payment p
      INNER JOIN ride r ON p.ride_id = r.ride_id
      INNER JOIN app_user u ON r.user_id = u.user_id
      INNER JOIN driver d ON r.driver_id = d.driver_id
      INNER JOIN category c ON r.category_id = c.category_id
      INNER JOIN location l1 ON r.pickup_location_id = l1.location_id
      INNER JOIN location l2 ON r.dropoff_location_id = l2.location_id
      ORDER BY p.payment_time DESC
      LIMIT 20
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

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints ready:`);
  console.log(`   - POST /api/init-database`);
  console.log(`   - POST /api/insert-data`);
  console.log(`   - POST /api/book-ride`);
  console.log(`   - GET  /api/rides`);
  console.log(`   - GET  /api/users`);
  console.log(`   - GET  /api/payments`);
  console.log(`   - GET  /api/query/ride-history`);
  console.log(`   - GET  /api/query/user-spending`);
  console.log(`   - GET  /api/query/driver-earnings`);
  console.log(`   - GET  /api/query/payment-audit`);
});