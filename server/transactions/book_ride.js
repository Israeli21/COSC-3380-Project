const express = require('express');
const pool = require('../db');

const router = express.Router();

// TRANSACTION: BOOK RIDE
router.post('/api/book-ride', async (req, res) => {
  const startTime = Date.now();
  const client = await pool.connect();
  try {
    const { user_id, pickup_location_id, destination_location_id, ride_date, ride_time } = req.body;
    
    await client.query('BEGIN');
    
    // Check user exists
    const userResult = await client.query(
      'SELECT user_id FROM app_user WHERE user_id = $1',
      [user_id]
    );
    if (userResult.rows.length === 0) {
      throw new Error('Selected user does not exist');
    }
    
    // Get distance from location_distance table
    const distanceResult = await client.query(
      'SELECT distance_miles FROM location_distance WHERE start_location_id = $1 AND end_location_id = $2',
      [pickup_location_id, destination_location_id]
    );
    
    if (distanceResult.rows.length === 0) {
      throw new Error('Distance not found for selected locations');
    }
    
    const distanceMiles = parseFloat(distanceResult.rows[0].distance_miles);
    
    // Calculate price based on distance: $3 base + $2.50 per mile
    const basePrice = 3.00;
    const pricePerMile = 2.50;
    const price = parseFloat((basePrice + (distanceMiles * pricePerMile)).toFixed(2));
    
    // Estimate ride time: assume 30 mph average speed, minimum 5 minutes
    const ride_time_minutes = Math.max(5, Math.ceil((distanceMiles / 30) * 60));
    
    // Calculate tax (8.25%) and total
    const tax = parseFloat((price * 0.0825).toFixed(2));
    const total = parseFloat((price + tax).toFixed(2));
    
    // Check user balance
    const balanceCheck = await client.query(
      'SELECT balance, account_id FROM bank_account WHERE user_id = $1 AND account_type = $2',
      [user_id, 'app_user']
    );
    
    console.log('Balance check for user_id:', user_id, 'Result:', balanceCheck.rows);
    
    if (balanceCheck.rows.length === 0) {
      throw new Error('User does not have a bank account');
    }
    
    const userBalance = parseFloat(balanceCheck.rows[0].balance);
    const accountId = balanceCheck.rows[0].account_id;
    
    if (userBalance < total) {
      throw new Error(`Insufficient funds. Balance: $${userBalance}, Required: $${total}`);
    }
    
    // AUTOMATIC DRIVER SELECTION - Find available driver for requested datetime
    // Combine ride_date and ride_time to create full timestamp
    const rideDateTime = `${ride_date} ${ride_time}`;
    
    const availableDriverRes = await client.query(
      `SELECT DISTINCT d.driver_id, d.name
       FROM driver d
       JOIN driver_availability da ON d.driver_id = da.driver_id
       WHERE da.day_of_week = EXTRACT(DOW FROM $1::TIMESTAMP)::INTEGER
         AND da.start_hour <= EXTRACT(HOUR FROM $1::TIMESTAMP)::INTEGER
         AND da.end_hour > EXTRACT(HOUR FROM $1::TIMESTAMP)::INTEGER
         AND da.is_active = TRUE
         -- Ensure driver is not already booked at this exact date and time
         AND NOT EXISTS (
           SELECT 1 FROM ride r
           JOIN date dt ON r.date_id = dt.date_id
           JOIN time tm ON r.time_id = tm.time_id
           WHERE r.driver_id = d.driver_id
             AND dt.date_value = $2::DATE
             AND tm.time_value = $3::TIME
         )
       ORDER BY d.driver_id ASC
       LIMIT 1`,
      [rideDateTime, ride_date, ride_time]
    );
    
    if (availableDriverRes.rows.length === 0) {
      throw new Error('No drivers available for the selected date and time. Please choose a different time.');
    }
    
    const driver_id = availableDriverRes.rows[0].driver_id;
    const driverName = availableDriverRes.rows[0].name;
    
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
      message: `Ride booked successfully! Driver: ${driverName}; Ride ID: ${rideId}; Distance: ${distanceMiles} miles; Price: $${price}; Total charged: $${total}`,
      executionTime: executionTime,
      rideDetails: {
        rideId,
        driverId: driver_id,
        driverName,
        distance: distanceMiles,
        price,
        tax,
        total,
        estimatedTime: ride_time_minutes
      }
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

module.exports = router;