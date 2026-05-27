import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

async function seedAdminUser() {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Default Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
        status: 'active'
      });
      console.log('[Database Seeder] Created default administrator: admin@example.com / admin123');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
  await seedAdminUser();
}
