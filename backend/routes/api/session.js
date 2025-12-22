const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../../db/models');
const {
  generateToken,
  requireAuth,
  setTokenCookie,
  clearTokenCookie
} = require('../../middleware/auth');

const router = express.Router();

// Validation middleware
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/session/current
 * Get current logged-in user
 */
router.get('/current', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

/**
 * POST /api/session/register
 * Create a new user account
 */
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateErrors
], async (req, res) => {
  const { email, username, password } = req.body;

  // Check if email already exists
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const user = await User.signup({ email, username, password });
  const token = generateToken(user);

  setTokenCookie(res, token);

  res.status(201).json({
    user: user.toSafeObject(),
    token
  });
});

/**
 * POST /api/session/login
 * Log in with email and password
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required'),
  validateErrors
], async (req, res) => {
  const { email, password } = req.body;

  const user = await User.login({ email, password });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.json({
    user: user.toSafeObject(),
    token
  });
});

/**
 * DELETE /api/session/logout
 * Log out the current user
 */
router.delete('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
