import express from 'express';
import { Review } from '../models/Review.js';
import { Provider } from '../models/Provider.js';
import { Booking } from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 1. Submit a service review
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, providerId, rating, comment } = req.body;

    if (!bookingId || !providerId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID, Provider ID, and Rating are required.' });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    // Check if user has already reviewed this booking
    const existingReview = await Review.findOne({ bookingId, userId: req.user._id });
    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
    }

    const review = await Review.create({
      bookingId,
      userId: req.user._id,
      userName: req.user.name,
      providerId,
      rating: numericRating,
      comment: String(comment || '').trim(),
    });

    // Update Provider rating statistics dynamically!
    const provider = await Provider.findOne({ providerId });
    if (provider) {
      const allReviews = await Review.find({ providerId });
      const totalRatings = allReviews.reduce((sum, item) => sum + item.rating, 0);
      provider.reviewsCount = allReviews.length;
      provider.rating = Number((totalRatings / allReviews.length).toFixed(1));
      await provider.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ success: false, message: 'Could not submit review.' });
  }
});

// 2. Fetch reviews for a specific provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId }).sort({ createdAt: -1 });
    return res.json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch provider reviews error:', error);
    return res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
});

// 3. Delete a review (Admin or Author only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Allow deletion only if user is author or has admin role
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
    }

    await review.deleteOne();

    // Update Provider rating statistics
    const provider = await Provider.findOne({ providerId: review.providerId });
    if (provider) {
      const allReviews = await Review.find({ providerId: review.providerId });
      if (allReviews.length > 0) {
        const totalRatings = allReviews.reduce((sum, item) => sum + item.rating, 0);
        provider.reviewsCount = allReviews.length;
        provider.rating = Number((totalRatings / allReviews.length).toFixed(1));
      } else {
        provider.reviewsCount = 0;
        provider.rating = 5.0; // Reset default
      }
      await provider.save();
    }

    return res.json({ success: true, message: 'Review removed successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ success: false, message: 'Could not remove review.' });
  }
});

export default router;
