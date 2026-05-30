import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  const conn = await mongoose.connect(env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};
