import express from 'express';
import { Service } from '../models/Service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Seed Services helper if collection is empty
const DEFAULT_SERVICES = [
  {
    serviceId: 's1',
    categoryId: 'c1',
    name: 'Apartment Deep Clean',
    category: 'Deep Cleaning',
    description: 'Complete apartment deep cleaning including rooms, washrooms, and balcony.',
    price: 2499,
    rating: 4.8,
    image: 'https://picsum.photos/seed/mahir-s1/900/600',
    status: 'active',
    featured: true,
  },
  {
    serviceId: 's2',
    categoryId: 'c1',
    name: 'Bungalow Full Clean',
    category: 'Deep Cleaning',
    description: 'Premium bungalow cleaning with staircase, windows, and bathroom detailing.',
    price: 4999,
    rating: 4.9,
    image: 'https://picsum.photos/seed/mahir-s2/900/600',
    status: 'active',
    featured: true,
  },
  {
    serviceId: 's3',
    categoryId: 'c1',
    name: 'Kitchen Deep Clean',
    category: 'Deep Cleaning',
    description: 'Grease removal, cabinet wipe-down, sink scrub, and appliance surface clean.',
    price: 1599,
    rating: 4.7,
    image: 'https://picsum.photos/seed/mahir-s3/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's4',
    categoryId: 'c2',
    name: 'Tap & Leakage Repair',
    category: 'Plumber',
    description: 'Instant repair for leaking taps, pipes, and bathroom fittings.',
    price: 699,
    rating: 4.6,
    image: 'https://picsum.photos/seed/mahir-s4/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's5',
    categoryId: 'c2',
    name: 'Kitchen & Sink Plumbing',
    category: 'Plumber',
    description: 'Sink choking, drain cleaning, and mixer installation by trained plumber.',
    price: 899,
    rating: 4.6,
    image: 'https://picsum.photos/seed/mahir-s5/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's6',
    categoryId: 'c2',
    name: 'Bathroom Fitting Installation',
    category: 'Plumber',
    description: 'Installation of shower sets, flush tanks, and health faucets.',
    price: 1099,
    rating: 4.7,
    image: 'https://picsum.photos/seed/mahir-s6/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's7',
    categoryId: 'c3',
    name: 'Switchboard & Socket Repair',
    category: 'Electrician',
    description: 'Safe repair for switches, sockets, and minor wiring faults.',
    price: 799,
    rating: 4.7,
    image: 'https://picsum.photos/seed/mahir-s7/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's8',
    categoryId: 'c3',
    name: 'Fan & Light Installation',
    category: 'Electrician',
    description: 'Ceiling fan, LED panel, and decorative light installation service.',
    price: 999,
    rating: 4.8,
    image: 'https://picsum.photos/seed/mahir-s8/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's9',
    categoryId: 'c3',
    name: 'MCB & Wiring Inspection',
    category: 'Electrician',
    description: 'Home safety check for wiring load, MCB, and earthing points.',
    price: 1299,
    rating: 4.9,
    image: 'https://picsum.photos/seed/mahir-s9/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's10',
    categoryId: 'c4',
    name: 'Washing Machine Repair',
    category: 'Home Appliances Repair',
    description: 'Drum noise, spin issues, and drainage problem diagnostics with repair.',
    price: 1399,
    rating: 4.8,
    image: 'https://picsum.photos/seed/mahir-s10/900/600',
    status: 'active',
    featured: true,
  },
  {
    serviceId: 's11',
    categoryId: 'c4',
    name: 'Refrigerator Service',
    category: 'Home Appliances Repair',
    description: 'Cooling issue fix, gas check, and compressor health assessment.',
    price: 1699,
    rating: 4.7,
    image: 'https://picsum.photos/seed/mahir-s11/900/600',
    status: 'active',
    featured: false,
  },
  {
    serviceId: 's12',
    categoryId: 'c4',
    name: 'Microwave Oven Repair',
    category: 'Home Appliances Repair',
    description: 'Heating and control panel repair with genuine spare replacement support.',
    price: 1199,
    rating: 4.6,
    image: 'https://picsum.photos/seed/mahir-s12/900/600',
    status: 'active',
    featured: false,
  },
];

async function seedServicesIfNeeded() {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(DEFAULT_SERVICES);
      console.log('[Database Seeder] Populated default service items.');
    }
  } catch (err) {
    console.error('Error seeding services:', err);
  }
}

// Admin role check middleware
const authorizeAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
};

// 1. Get all services (Public)
router.get('/', async (req, res) => {
  try {
    await seedServicesIfNeeded();
    const { categoryId, query, featured } = req.query;
    const filter = {};

    // Standard customers only get active services
    const authHeader = req.headers.authorization || '';
    if (!authHeader) {
      filter.status = 'active';
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') }
      ];
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    const services = await Service.find(filter).sort({ serviceId: 1 });
    return res.json({ success: true, services });
  } catch (error) {
    console.error('Fetch services error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch services.' });
  }
});

// 2. Get details of a service
router.get('/:serviceId', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.serviceId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service item not found.' });
    }
    return res.json({ success: true, service });
  } catch (error) {
    console.error('Fetch service details error:', error);
    return res.status(500).json({ success: false, message: 'Could not load service details.' });
  }
});

// 3. Create a new service (Admin Only)
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { serviceId, categoryId, name, category, description, price, duration, image, featured } = req.body;

    if (!serviceId || !categoryId || !name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Service ID, Category ID, Name, Category Name, and Price are required.' });
    }

    const exists = await Service.findOne({ serviceId });
    if (exists) {
      return res.status(409).json({ success: false, message: 'A service item with this ID already exists.' });
    }

    const service = await Service.create({
      serviceId: String(serviceId).trim(),
      categoryId: String(categoryId).trim(),
      name: String(name).trim(),
      category: String(category).trim(),
      description: String(description || '').trim(),
      price: Number(price),
      duration: String(duration || '60 mins').trim(),
      image: String(image || '').trim(),
      featured: Boolean(featured),
      status: 'active',
    });

    return res.status(201).json({ success: true, message: 'Service created successfully.', service });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ success: false, message: 'Could not create service.' });
  }
});

// 4. Update an existing service (Admin Only)
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, categoryId, category, description, price, duration, image, featured, status } = req.body;
    const service = await Service.findOne({ serviceId: req.params.id });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service item not found.' });
    }

    if (name) service.name = String(name).trim();
    if (categoryId) service.categoryId = String(categoryId).trim();
    if (category) service.category = String(category).trim();
    if (description !== undefined) service.description = String(description).trim();
    if (price !== undefined) service.price = Number(price);
    if (duration) service.duration = String(duration).trim();
    if (image !== undefined) service.image = String(image).trim();
    if (featured !== undefined) service.featured = Boolean(featured);
    if (status && ['active', 'inactive'].includes(status)) service.status = status;

    await service.save();
    return res.json({ success: true, message: 'Service updated successfully.', service });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ success: false, message: 'Could not update service.' });
  }
});

// 5. Delete a service (Admin Only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service item not found.' });
    }

    await service.deleteOne();
    return res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete service.' });
  }
});

// 6. Toggle service status (Admin Only)
router.put('/:id/toggle', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service item not found.' });
    }

    service.status = service.status === 'active' ? 'inactive' : 'active';
    await service.save();

    return res.json({
      success: true,
      message: `Service status is now ${service.status}.`,
      service,
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    return res.status(500).json({ success: false, message: 'Could not toggle service status.' });
  }
});

export default router;
