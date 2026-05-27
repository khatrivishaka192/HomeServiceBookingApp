import express from 'express';
import { Category } from '../models/Category.js';
import { authenticate } from '../middleware/auth.js';
import { categoryValidation } from '../middleware/validation.js';

const router = express.Router();

// Seed Categories helper if collection is empty
const DEFAULT_CATEGORIES = [
  {
    categoryId: 'c1',
    name: 'Deep Cleaning',
    icon: 'sparkles-outline',
    image: 'https://picsum.photos/seed/mahir-cleaning/900/600',
    description: 'Professional deep cleaning services for apartments, bungalows, and kitchens.',
    status: 'active',
  },
  {
    categoryId: 'c2',
    name: 'Plumber',
    icon: 'water-outline',
    image: 'https://picsum.photos/seed/mahir-plumber/900/600',
    description: 'Expert tap repair, pipe leak fixes, and complete bathroom installations.',
    status: 'active',
  },
  {
    categoryId: 'c3',
    name: 'Electrician',
    icon: 'flash-outline',
    image: 'https://picsum.photos/seed/mahir-electric/900/600',
    description: 'Safe switchboard repairs, socket fixes, wiring checks, and fan installations.',
    status: 'active',
  },
  {
    categoryId: 'c4',
    name: 'Home Appliances Repair',
    icon: 'hardware-chip-outline',
    image: 'https://picsum.photos/seed/mahir-appliance/900/600',
    description: 'Quick diagnostics and repairs for washing machines, fridges, and ovens.',
    status: 'active',
  },
];

async function seedCategoriesIfNeeded() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('[Database Seeder] Populated default service categories.');
    }
  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

// Admin role check middleware helper
const authorizeAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
};

// 1. Get all categories (Public & Admin search)
router.get('/', async (req, res) => {
  try {
    await seedCategoriesIfNeeded();
    const { query: searchQuery } = req.query;
    const filter = {};
    
    // If not admin, return only active categories
    const header = req.headers.authorization || '';
    if (!header) {
      filter.status = 'active';
    }

    if (searchQuery) {
      filter.$or = [
        { name: new RegExp(searchQuery, 'i') },
        { description: new RegExp(searchQuery, 'i') }
      ];
    }

    const categories = await Category.find(filter).sort({ categoryId: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch categories.' });
  }
});

// 2. Get specific category
router.get('/:categoryId', async (req, res) => {
  try {
    const category = await Category.findOne({ categoryId: req.params.categoryId });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.json({ success: true, category });
  } catch (error) {
    console.error('Fetch category details error:', error);
    return res.status(500).json({ success: false, message: 'Could not load category details.' });
  }
});

// 3. Create a new category (Admin Only)
router.post('/', authenticate, authorizeAdmin, categoryValidation, async (req, res) => {
  try {
    const { categoryId, name, image, icon, description } = req.body;

    const exists = await Category.findOne({ categoryId });
    if (exists) {
      return res.status(409).json({ success: false, message: 'A category with this ID already exists.' });
    }

    const category = await Category.create({
      categoryId: String(categoryId).trim(),
      name: String(name).trim(),
      image: String(image || '').trim(),
      icon: String(icon || 'grid-outline').trim(),
      description: String(description || '').trim(),
      status: 'active',
    });

    return res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Could not create category.' });
  }
});

// 4. Update an existing category (Admin Only)
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, image, icon, description, status } = req.body;
    const category = await Category.findOne({ categoryId: req.params.id });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) category.name = String(name).trim();
    if (image !== undefined) category.image = String(image).trim();
    if (icon) category.icon = String(icon).trim();
    if (description !== undefined) category.description = String(description).trim();
    if (status && ['active', 'inactive'].includes(status)) category.status = status;

    await category.save();
    return res.json({ success: true, message: 'Category updated successfully.', category });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Could not update category.' });
  }
});

// 5. Delete a category (Admin Only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const category = await Category.findOne({ categoryId: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    await category.deleteOne();
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete category.' });
  }
});

// 6. Toggle category active status (Admin Only)
router.put('/:id/toggle', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const category = await Category.findOne({ categoryId: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    return res.json({
      success: true,
      message: `Category is now ${category.status}.`,
      category,
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    return res.status(500).json({ success: false, message: 'Could not toggle category status.' });
  }
});

export default router;
