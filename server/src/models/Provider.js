import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      default: '1 Year Experience',
    },
    skills: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 1,
    },
    completedJobs: {
      type: Number,
      default: 10,
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Offline'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

export const Provider = mongoose.model('Provider', providerSchema);
