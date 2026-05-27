import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { signupValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sendAuthSuccess(res, user, statusCode = 200) {
  const token = createToken(user._id);
  return res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created successfully.' : 'Login successful.',
    token,
    user: user.toPublicJSON(),
  });
}

router.post('/signup', signupValidation, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();
    const role = req.body.role === 'provider' ? 'provider' : 'customer';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    // Notify all admin users of the new signup
    try {
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        title: 'New User Registered',
        message: `${user.name} (${user.email}) has signed up as a ${user.role}.`,
        type: 'general'
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for signup:', notifErr);
    }

    return sendAuthSuccess(res, user, 201);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Could not create account. Please try again.' });
  }
});

router.post('/login', loginValidation, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return sendAuthSuccess(res, user);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Could not login. Please try again.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: user.toPublicJSON() });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
});

// Admin-only route to list all users
router.get('/admin/users', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
    }

    const users = await User.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (err) {
    console.error('Fetch admin users error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
