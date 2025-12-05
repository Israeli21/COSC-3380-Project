const express = require('express');
const pool = require('../db');

const router = express.Router();

// COMPOSITE KEY ENDPOINTS
// GET USER FAVORITE LOCATIONS - Uses composite key (user_id, pickup_location_id)
router.get('/api/user-favorites/:userId', async (req, res) => {
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
router.post('/api/user-favorites', async (req, res) => {
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
router.delete('/api/user-favorites/:userId/:pickupLocationId', async (req, res) => {
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

module.exports = router;