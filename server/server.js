// Started: 1200 Lines of Code

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const pool = require('./db');
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

const dbInitRoutes = require('./routes/db_initialization');
app.use(dbInitRoutes);

// UPDATE BALANCES ENDPOINT
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

const bookRideRoutes = require('./transactions/book_ride');
app.use(bookRideRoutes);

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

// SIMPLE TABLE QUERIES
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

const userFunctionsRoutes = require('./transactions/user_functions');
app.use(userFunctionsRoutes);

const driverAvailabilityRoutes = require('./transactions/driver_availability');
app.use(driverAvailabilityRoutes);

const favoriteLocationRoutes = require('./transactions/favorite_location');
app.use(favoriteLocationRoutes);

// GET LOCATION DISTANCE - Uses composite key (start_location_id, end_location_id)
app.get('/api/location-distance/:startId/:endId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { startId, endId } = req.params;
    
    const result = await client.query(
      `SELECT ld.*, 
              pl.address as start_address, pl.city as start_city,
              dl.address as end_address, dl.city as end_city
       FROM location_distance ld
       JOIN pickup_location pl ON ld.start_location_id = pl.pickup_location_id
       JOIN destination_location dl ON ld.end_location_id = dl.destination_location_id
       WHERE ld.start_location_id = $1 AND ld.end_location_id = $2`,
      [startId, endId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Distance not found' 
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Location distance query error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query location distance: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// GET ALL LOCATION DISTANCES
app.get('/api/location-distances', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT ld.*, 
              pl.address as start_address, pl.city as start_city,
              dl.address as end_address, dl.city as end_city
       FROM location_distance ld
       JOIN pickup_location pl ON ld.start_location_id = pl.pickup_location_id
       JOIN destination_location dl ON ld.end_location_id = dl.destination_location_id
       ORDER BY ld.start_location_id, ld.end_location_id`
    );

    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Location distances list error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to query location distances: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// ADD/UPDATE LOCATION DISTANCE - Uses composite key
app.post('/api/location-distance', async (req, res) => {
  const client = await pool.connect();
  try {
    const { startLocationId, endLocationId, distanceMiles } = req.body;

    if (!startLocationId || !endLocationId || distanceMiles === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start location ID, end location ID, and distance in miles are required' 
      });
    }

    if (distanceMiles < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Distance must be greater than or equal to 0' 
      });
    }

    const result = await client.query(
      `INSERT INTO location_distance (start_location_id, end_location_id, distance_miles)
       VALUES ($1, $2, $3)
       ON CONFLICT (start_location_id, end_location_id) 
       DO UPDATE SET distance_miles = $3
       RETURNING *`,
      [startLocationId, endLocationId, distanceMiles]
    );

    res.json({ 
      success: true, 
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Add/update distance error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add/update distance: ' + err.message 
    });
  } finally {
    client.release();
  }
});

// DELETE LOCATION DISTANCE - Uses composite key
app.delete('/api/location-distance/:startId/:endId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { startId, endId } = req.params;
    
    const result = await client.query(
      `DELETE FROM location_distance 
       WHERE start_location_id = $1 AND end_location_id = $2
       RETURNING *`,
      [startId, endId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Distance not found' 
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