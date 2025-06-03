// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
    if (err) return res.send('Error registering');
    res.send('Registration successful. <a href="/login">Login here</a>');
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.send('User not found');
    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.send('Incorrect password');
    req.session.user = username;
    res.send('Login successful! <a href="/login">Back</a>');
  });
});

module.exports = router;
