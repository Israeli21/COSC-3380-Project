const express = require('express');
const pool = require('../db');

const router = express.Router();

// POST endpoint to execute custom SQL queries
router.post('/custom-query', async (req, res) => {
  const client = await pool.connect();
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required and must be a string' 
      });
    }

    // Trim and validate query
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query cannot be empty' 
      });
    }

    // Security: Only allow SELECT statements for safety
    // Prevent destructive operations (INSERT, UPDATE, DELETE, DROP, etc.)
    const upperQuery = trimmedQuery.toUpperCase();
    if (!upperQuery.startsWith('SELECT')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only SELECT queries are allowed for security reasons' 
      });
    }

    // Execute the query
    const result = await client.query(trimmedQuery);

    res.json({ 
      success: true, 
      results: result.rows,
      rowCount: result.rowCount
    });

  } catch (err) {
    console.error('Custom query error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to execute query'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
