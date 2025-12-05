const express = require('express');
const pool = require('../db');

const router = express.Router();

// CREATE NEW USER
router.post('/api/create-user', async (req, res) => {
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
router.post('/api/adjust-balance', async (req, res) => {
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

module.exports = router;