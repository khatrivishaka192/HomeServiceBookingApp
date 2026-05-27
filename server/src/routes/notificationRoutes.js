import express from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// 1. Get all notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ success: false, message: 'Could not retrieve notifications.' });
  }
});

// 2. Get unread notifications count
router.get('/unread/count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    return res.json({ success: true, count });
  } catch (error) {
    console.error('Fetch unread count error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch unread counts.' });
  }
});

// 3. Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    notification.read = true;
    await notification.save();
    return res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Could not update status.' });
  }
});

// 4. Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ success: false, message: 'Could not update notifications.' });
  }
});

// 5. Delete specific notification
router.delete('/:id', async (req, res) => {
  try {
    const result = await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ success: false, message: 'Could not remove notification.' });
  }
});

export default router;
