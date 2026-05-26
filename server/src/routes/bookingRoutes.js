import express from 'express';
import { Booking } from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';
import { generateBookingId } from '../utils/generateBookingId.js';

const router = express.Router();
const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

router.use(authenticate);

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
      return res.status(400).json({ success: false, message: 'A valid service address is required.' });
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
