const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');

const router = express.Router();

// DATABASE INITIALIZATION
router.post('/api/init-database', async (req, res) => {
  const client = await pool.connect();
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'db_schema.sql');
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

router.post('/api/insert-data', async (req, res) => {
  const client = await pool.connect();
  try {
    // Read the insert data file
    const dataPath = path.join(__dirname, '..', 'insert_data.sql');
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

module.exports = router;