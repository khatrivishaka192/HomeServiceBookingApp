import express from 'express';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Category } from '../models/Category.js';
import { Service } from '../models/Service.js';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Admin verification middleware
const authorizeAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
};

router.use(authenticate, authorizeAdmin);

// 1. GET /stats: Retrieve dashboard metrics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalServices,
      totalCategories,
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      completedBookingsList,
      latestBookings,
      latestUsers
    ] = await Promise.all([
      User.countDocuments(),
      Service.countDocuments(),
      Category.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      Booking.find({ status: 'Completed' }, 'totalPayment'),
      Booking.find().sort({ createdAt: -1 }).limit(5),
      User.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const revenue = completedBookingsList.reduce((sum, b) => sum + (b.totalPayment || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalServices,
        totalCategories,
        totalBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        revenueSummary: revenue,
        latestBookings: latestBookings.map(b => b.toClientJSON()),
        latestUsers: latestUsers.map(u => u.toPublicJSON())
      }
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch admin statistics.' });
  }
});

// 2. GET /users: Paginated user listings with search and role filters
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { query, role } = req.query;
    const filter = {};

    if (role && ['customer', 'provider', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      users: users.map(u => u.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch admin users list error:', error);
    return res.status(500).json({ success: false, message: 'Could not load users list.' });
  }
});

// 3. PUT /users/:id/status: Block/unblock users
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Choose active or blocked.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block your own admin account!' });
    }

    user.status = status;
    await user.save();

    // Notify user simulation
    if (status === 'blocked') {
      console.log(`[Admin Notice] Session blocked for ${user.email}`);
    }

    return res.json({
      success: true,
      message: `User status changed to ${status} successfully.`,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Could not update user status.' });
  }
});

// 4. DELETE /users/:id: Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account!' });
    }

    await user.deleteOne();
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete user account.' });
  }
});

// 5. GET /bookings: List all bookings in the system for admin
router.get('/bookings', async (req, res) => {
  try {
    const { status, query } = req.query;
    const filter = {};

    if (status && ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      filter.status = status;
    }

    if (query) {
      filter.$or = [
        { bookingId: new RegExp(query, 'i') },
        { serviceType: new RegExp(query, 'i') },
        { contactNumber: new RegExp(query, 'i') },
        { address: new RegExp(query, 'i') }
      ];
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      bookings: bookings.map(b => b.toClientJSON())
    });
  } catch (error) {
    console.error('Admin fetch bookings error:', error);
    return res.status(500).json({ success: false, message: 'Could not load bookings.' });
  }
});

// 6. PUT /bookings/:id/status: Update status, assign provider, approve/reject
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status, providerId, providerName } = req.body;
    const booking = await Booking.findOne({ bookingId: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // A. Update Provider Assignment if details are sent
    if (providerId && providerName) {
      booking.providerId = providerId;
      booking.providerName = providerName;

      // Trigger provider assigned notification to customer
      await Notification.create({
        userId: booking.userId,
        title: 'Provider Assigned!',
        message: `Your booking (ID: ${booking.bookingId}) has been assigned to expert: ${providerName}.`,
        type: 'assigned'
      });

      // Add to statusHistory log
      booking.statusHistory.push({
        status: `Assigned: ${providerName}`,
        timestamp: new Date()
      });
    }

    // B. Update general booking status
    if (status) {
      if (!['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status state.' });
      }

      booking.status = status;
      
      // Add status to statusHistory log
      booking.statusHistory.push({
        status: status,
        timestamp: new Date()
      });

      // Trigger customer notification
      let title = 'Booking Updated!';
      let message = `Your service booking ${booking.bookingId} is now ${status}.`;

      if (status === 'Accepted') {
        title = 'Booking Accepted!';
        message = `Congratulations, your booking ${booking.bookingId} has been approved by the Administrator.`;
      } else if (status === 'In Progress') {
        title = 'Service In Progress';
        message = `Our team has started work on your service booking ${booking.bookingId}.`;
      } else if (status === 'Completed') {
        title = 'Booking Completed!';
        message = `Excellent! Your booking ${booking.bookingId} is marked as completed. Thank you!`;
      } else if (status === 'Cancelled') {
        title = 'Booking Cancelled';
        message = `Your booking ${booking.bookingId} has been cancelled by the Administrator.`;
      }

      await Notification.create({
        userId: booking.userId,
        title,
        message,
        type: status === 'Cancelled' ? 'cancellation' : 'booking'
      });
    }

    await booking.save();

    return res.json({
      success: true,
      message: 'Booking updated successfully.',
      booking: booking.toClientJSON()
    });
  } catch (error) {
    console.error('Admin update booking error:', error);
    return res.status(500).json({ success: false, message: 'Could not update booking.' });
  }
});

export default router;
