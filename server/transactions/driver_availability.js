
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

// GET DRIVER AVAILABILITY STATUS
router.get('/api/driver-availability', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT da.availability_id, da.driver_id, d.name, 
              da.day_of_week, da.start_hour, da.end_hour, da.is_active,
              CASE da.day_of_week
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
              END as day_name
       FROM driver_availability da
       JOIN driver d ON da.driver_id = d.driver_id
       ORDER BY da.driver_id, da.day_of_week, da.start_hour`
    );
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
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

// ADD DRIVER AVAILABILITY SLOT
router.post('/api/driver-availability', async (req, res) => {
  const client = await pool.connect();
  try {
    const { driverId, dayOfWeek, startHour, endHour } = req.body;
    
    if (driverId === undefined || dayOfWeek === undefined || startHour === undefined || endHour === undefined) {
      return res.status(400).json({
        success: false,
        error: "Driver ID, day of week (0-6), start hour (0-23), and end hour (0-23) are required"
      });
    }
    
    const result = await client.query(
      `INSERT INTO driver_availability (driver_id, day_of_week, start_hour, end_hour)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [driverId, dayOfWeek, startHour, endHour]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Add availability error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add availability: " + err.message
    });
  } finally {
    client.release();
  }
});

// TOGGLE DRIVER AVAILABILITY SLOT (activate/deactivate)
router.patch('/api/driver-availability/:availabilityId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { availabilityId } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: "isActive (true/false) is required"
      });
    }
    
    const result = await client.query(
      `UPDATE driver_availability
       SET is_active = $1
       WHERE availability_id = $2
       RETURNING *`,
      [isActive, availabilityId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Availability slot not found"
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Update availability error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update availability: " + err.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;