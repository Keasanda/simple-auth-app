// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();
const path = require('path');

router.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/register', (req, res) => {
  console.log('GET /register - Serving register.html');
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('POST /register - Received:', { name, email, password });
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hashed:', hash);

  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hash],
    (err) => {
      if (err) {
        console.error('DB Error on register:', err);
        return res.send('Error registering');
      }
      console.log('User registered:', email);
      res.send('Registration successful. <a href="/login">Login here</a>');
    }
  );
});

router.post('/login', (req, res) => {
  const { name, password } = req.body;
  console.log('POST /login - Received:', { name, password });

  db.query('SELECT * FROM users WHERE name = ?', [name], async (err, results) => {
    if (err) {
      console.error('DB Error on login:', err);
      return res.send('Database error');
    }
    console.log('DB Query Results:', results);

    if (results.length === 0) {
      console.log('User not found for name:', name);
      return res.send('User not found');
    }

    const match = await bcrypt.compare(password, results[0].password);
    console.log('Password match:', match);

    if (!match) {
      console.log('Incorrect password for user:', name);
      return res.send('Incorrect password');
    }

    req.session.user = name;
    console.log('Login successful for user:', name);
    res.send('Login successful! <a href="/login">Back</a>');
  });
});

module.exports = router;
