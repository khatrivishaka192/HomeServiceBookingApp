import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    category: String,
    price: Number,
    quantity: Number,
    total: Number,
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: {
      type: String,
      required: true,
    },
    bookingTime: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    contactNumber: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: 'Cash on Service',
    },
    services: {
      type: [serviceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    totalPayment: {
      type: Number,
      default: 0,
    },
    providerId: {
      type: String,
      default: '',
    },
    providerName: {
      type: String,
      default: '',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      }
    ],
  },
  {
    timestamps: true,
  },
);

bookingSchema.methods.toClientJSON = function toClientJSON(userEmail = '') {
  return {
    id: this.bookingId,
    bookingId: this.bookingId,
    userId: this.userId.toString(),
    userEmail,
    serviceType: this.serviceType,
    date: this.bookingDate,
    time: this.bookingTime,
    bookingDate: this.bookingDate,
    bookingTime: this.bookingTime,
    price: this.price,
    status: this.status,
    contactNumber: this.contactNumber,
    address: this.address,
    paymentMethod: this.paymentMethod,
    services: this.services,
    subtotal: this.subtotal,
    serviceCharge: this.serviceCharge,
    totalPayment: this.totalPayment,
    providerId: this.providerId,
    providerName: this.providerName,
    statusHistory: this.statusHistory || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Booking = mongoose.model('Booking', bookingSchema);
