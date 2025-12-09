const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET LOCATION DISTANCE - Uses composite key (start_location_id, end_location_id)
router.get('/api/location-distance/:startId/:endId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { startId, endId } = req.params;
    
    const result = await client.query(
      `SELECT ld.*, 
              l1.address as start_address, l1.city as start_city,
              l2.address as end_address, l2.city as end_city
       FROM location_distance ld
       JOIN location l1 ON ld.start_location_id = l1.location_id
       JOIN location l2 ON ld.end_location_id = l2.location_id
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
router.get('/api/location-distances', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT ld.*, 
              l1.address as start_address, l1.city as start_city,
              l2.address as end_address, l2.city as end_city
       FROM location_distance ld
       JOIN location l1 ON ld.start_location_id = l1.location_id
       JOIN location l2 ON ld.end_location_id = l2.location_id
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
router.post('/api/location-distance', async (req, res) => {
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
router.delete('/api/location-distance/:startId/:endId', async (req, res) => {
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

module.exports = router;