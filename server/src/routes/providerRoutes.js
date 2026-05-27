import express from 'express';
import { Provider } from '../models/Provider.js';

const router = express.Router();

// Seed mock providers helper
const MOCK_PROVIDERS = [
  {
    providerId: 'prov_1',
    name: 'Sajid Ali (Cleaning Specialist)',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
    category: 'Cleaning',
    experience: '5 Years Experience',
    skills: ['Sofa Deep Cleaning', 'Carpet Shampooing', 'Kitchen Sanitization'],
    rating: 4.9,
    reviewsCount: 18,
    completedJobs: 142,
    availability: 'Available',
  },
  {
    providerId: 'prov_2',
    name: 'Kamran Shah (Master Electrician)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    category: 'Repairing',
    experience: '8 Years Experience',
    skills: ['AC Maintenance', 'Short Circuit Fixing', 'UPS Installation'],
    rating: 4.8,
    reviewsCount: 24,
    completedJobs: 219,
    availability: 'Available',
  },
  {
    providerId: 'prov_3',
    name: 'Asma Bibi (Home Beautician)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    category: 'Salon',
    experience: '4 Years Experience',
    skills: ['Hydra Facial', 'Bridal Makeup', 'Hair Styling'],
    rating: 4.7,
    reviewsCount: 15,
    completedJobs: 89,
    availability: 'Available',
  },
  {
    providerId: 'prov_4',
    name: 'Bilal Khan (Plumbing Expert)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    category: 'Plumbing',
    experience: '6 Years Experience',
    skills: ['Water Pump Repair', 'Leakage Detection', 'Geyser Installation'],
    rating: 4.6,
    reviewsCount: 12,
    completedJobs: 98,
    availability: 'Available',
  },
];

async function seedProvidersIfNeeded() {
  try {
    const count = await Provider.countDocuments();
    if (count === 0) {
      await Provider.insertMany(MOCK_PROVIDERS);
      console.log('[Database Seeder] Populated default service providers.');
    }
  } catch (err) {
    console.error('Error seeding providers:', err);
  }
}

// 1. Get all providers with optional filters (category, query, minimum rating)
router.get('/', async (req, res) => {
  try {
    await seedProvidersIfNeeded(); // Auto-seed if database collection is empty

    const { category, query, minRating } = req.query;
    const filter = {};

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { skills: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    const providers = await Provider.find(filter).sort({ rating: -1 });
    return res.json({ success: true, providers });
  } catch (error) {
    console.error('Fetch providers list error:', error);
    return res.status(500).json({ success: false, message: 'Could not load providers list.' });
  }
});

// 2. Get specific provider profile by providerId
router.get('/:providerId', async (req, res) => {
  try {
    const provider = await Provider.findOne({ providerId: req.params.providerId });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }
    return res.json({ success: true, provider });
  } catch (error) {
    console.error('Fetch provider details error:', error);
    return res.status(500).json({ success: false, message: 'Could not load provider profile.' });
  }
});

export default router;
