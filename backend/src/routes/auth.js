const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with operator role by default
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, hashedPassword, fullName, 'operator']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Logout endpoint (client-side removes token, but included for completeness)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
