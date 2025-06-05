// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
  const token = crypto.randomBytes(32).toString('hex');

  db.query(
    'INSERT INTO users (name, email, password, confirmation_token) VALUES (?, ?, ?, ?)',
    [name, email, hash, token],
    (err) => {
      if (err) {
        console.error('DB Error on register:', err);
        return res.send('Error registering');
      }

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email provider
        auth: {
          user: 'Mlungisi716@gmail.com',
          pass: 'ovvm oxtt pkjn zezw'
        }
      });

      const confirmUrl = `http://localhost:3000/confirm/${token}`;
      const mailOptions = {
        from: 'Mlungisi716@gmail.com',
        to: email,
        subject: 'Confirm your registration',
        html: `<p>Click <a href="${confirmUrl}">here</a> to confirm your email.</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email error:', error);
          return res.send('Registration successful, but failed to send confirmation email.');
        }
        res.send('Registration successful! Please check your email to confirm your account.');
      });
    }
  );
});


router.get('/confirm/:token', (req, res) => {
  const { token } = req.params;
  db.query(
    'UPDATE users SET is_confirmed = 1, confirmation_token = NULL WHERE confirmation_token = ?',
    [token],
    (err, result) => {
      if (err || result.affectedRows === 0) {
        return res.send('Invalid or expired confirmation link.');
      }
      res.send('Email confirmed! You can now <a href="/login">login</a>.');
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
