import express from 'express';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { generateBookingId } from '../utils/generateBookingId.js';

const router = express.Router();
const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

router.use(authenticate);

// 1. Place a new service booking
router.post('/', async (req, res) => {
  try {
    const {
      serviceType,
      bookingDate,
      bookingTime,
      price,
      contactNumber,
      address,
      paymentMethod,
      services,
      subtotal,
      serviceCharge,
      totalPayment,
      status,
    } = req.body;

    const resolvedDate = bookingDate || req.body.date;
    const resolvedTime = bookingTime || req.body.time;
    const resolvedTotal = totalPayment ?? price ?? subtotal ?? 0;

    if (!resolvedDate || !resolvedTime) {
      return res.status(400).json({ success: false, message: 'Booking date and time are required.' });
    }

    if (!address || String(address).trim().length < 10) {
      return res.status(400).json({ success: false, message: 'A valid service address is required (at least 10 characters).' });
    }

    const serviceList = Array.isArray(services) ? services : [];
    const primaryServiceType =
      serviceType ||
      serviceList[0]?.category ||
      serviceList[0]?.name ||
      'Home Service';

    const booking = await Booking.create({
      bookingId: generateBookingId(),
      userId: req.user._id,
      serviceType: primaryServiceType,
      bookingDate: String(resolvedDate).trim(),
      bookingTime: String(resolvedTime).trim(),
      price: Number(resolvedTotal) || 0,
      status: ALLOWED_STATUSES.includes(status) ? status : 'Pending',
      contactNumber: String(contactNumber || req.user.phone || '').trim(),
      address: String(address).trim(),
      paymentMethod: paymentMethod || 'Cash on Service',
      services: serviceList,
      subtotal: Number(subtotal) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      totalPayment: Number(resolvedTotal) || 0,
    });

    // Automatically trigger user notification!
    await Notification.create({
      userId: req.user._id,
      title: 'Booking Placed Successfully!',
      message: `Your booking for ${primaryServiceType} (ID: ${booking.bookingId}) has been received and is pending provider confirmation.`,
      type: 'booking'
    });

    // Notify all admin users of the new booking placement
    try {
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        title: 'New Booking Placed',
        message: `Booking ${booking.bookingId} for ${primaryServiceType} ($${resolvedTotal}) has been placed by ${req.user.name}.`,
        type: 'booking'
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for booking:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking: booking.toClientJSON(req.user.email),
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not save booking. Please try again.' });
  }
});

// 2. Fetch bookings for logged-in user
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      bookings: bookings.map((item) => item.toClientJSON(req.user.email)),
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings.' });
  }
});

// 3. Customer Booking Cancellation & Refund simulation
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({
      $or: [{ bookingId: req.params.id }, { _id: req.params.id }],
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (['Completed', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking that is already ${booking.status}.` });
    }

    // Cancellation refund policy check
    const refundStatus = booking.paymentMethod === 'Card' ? 'Refund Initiated (100% credit)' : 'N/A';

    booking.status = 'Cancelled';
    await booking.save();

    // Trigger user notification
    await Notification.create({
      userId: req.user._id,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingId} has been successfully cancelled. Reason: ${reason || 'User cancelled'}. Refund status: ${refundStatus}.`,
      type: 'cancellation',
    });

    // Notify all admin users of the cancellation
    try {
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        title: 'Booking Cancelled by Customer',
        message: `Booking ${booking.bookingId} has been cancelled by ${req.user.name}. Reason: ${reason || 'User cancelled'}.`,
        type: 'cancellation'
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for cancellation:', notifErr);
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: booking.toClientJSON(req.user.email),
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not cancel booking.' });
  }
});

// 4. Update booking status (and trigger specific notification)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const booking = await Booking.findOne({
      $or: [{ bookingId: req.params.id }, { _id: req.params.id }],
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = status;
    await booking.save();

    // Trigger state-transition notification alerts
    let title = 'Booking Status Update';
    let message = `Your booking ${booking.bookingId} status is now: ${status}.`;

    if (status === 'Confirmed') {
      title = 'Booking Accepted!';
      message = `Good news! Your booking ${booking.bookingId} has been accepted by our provider and is confirmed.`;
    } else if (status === 'In Progress') {
      title = 'Service Started!';
      message = `Our expert provider has arrived and started working on your service booking ${booking.bookingId}.`;
    } else if (status === 'Completed') {
      title = 'Service Completed!';
      message = `Your service booking ${booking.bookingId} is marked as completed. Thank you for choosing us!`;
    } else if (status === 'Cancelled') {
      title = 'Booking Cancelled';
      message = `Your service booking ${booking.bookingId} has been cancelled.`;
    }

    await Notification.create({
      userId: booking.userId,
      title,
      message,
      type: 'booking',
    });

    return res.json({
      success: true,
      message: 'Booking status updated.',
      booking: booking.toClientJSON(req.user.email),
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ success: false, message: 'Could not update booking status.' });
  }
});

export default router;
