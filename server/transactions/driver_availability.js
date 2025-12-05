
const express = require('express');
const pool = require('../db');

const router = express.Router();

// COMPOSITE KEY ENDPOINTS
// GET DRIVER AVAILABILITY - Uses composite key (driver_id, date_id, time_id)
router.get('/api/driver-availability/:driverId/:dateId/:timeId', async (req, res) => {
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
router.get('/api/driver-availability/:driverId', async (req, res) => {
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
router.post('/api/driver-availability', async (req, res) => {
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
router.delete('/api/driver-availability/:driverId/:dateId/:timeId', async (req, res) => {
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

module.exports = router;