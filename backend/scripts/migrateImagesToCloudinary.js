import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Brand from '../models/Brand.js';
import Offer from '../models/Offer.js';
import Banner from '../models/Banner.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

const requiredEnv = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnv.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const backendRoot = path.resolve('.');
const uploaded = new Map();
const failed = new Set();
const stats = { uploaded: 0, updated: 0, missing: 0, failed: 0 };

const isLocalUpload = (value) =>
  typeof value === 'string' && /^(?:https?:\/\/[^/]+)?\/?uploads\//i.test(value);

const localFilePath = (value) => {
  const uploadPath = value.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');
  return path.resolve(backendRoot, uploadPath);
};

const migrateUrl = async (value) => {
  if (!isLocalUpload(value)) return value;
  if (uploaded.has(value)) return uploaded.get(value);
  if (failed.has(value)) return value;

  const filePath = localFilePath(value);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing local file: ${filePath}`);
    failed.add(value);
    stats.missing += 1;
    return value;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'ecommerce/migrated',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });
    uploaded.set(value, result.secure_url);
    stats.uploaded += 1;
    console.log(`Uploaded: ${value} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    failed.add(value);
    stats.failed += 1;
    console.error(`Upload failed for ${value}: ${error.message}`);
    return value;
  }
};

const migrateScalarFields = async (Model, fields) => {
  const documents = await Model.find({ $or: fields.map((field) => ({ [field]: /uploads\//i })) });
  for (const document of documents) {
    let changed = false;
    for (const field of fields) {
      const current = document.get(field);
      const migrated = await migrateUrl(current);
      if (migrated !== current) {
        document.set(field, migrated);
        changed = true;
      }
    }
    if (changed) {
      await document.save();
      stats.updated += 1;
    }
  }
};

const migrateArrayField = async (Model, field) => {
  const documents = await Model.find({ [field]: /uploads\//i });
  for (const document of documents) {
    const current = document.get(field) || [];
    const migrated = await Promise.all(current.map(migrateUrl));
    if (migrated.some((value, index) => value !== current[index])) {
      document.set(field, migrated);
      await document.save();
      stats.updated += 1;
    }
  }
};

const migrateOrderImages = async () => {
  const orders = await Order.find({ 'orderItems.image': /uploads\//i });
  for (const order of orders) {
    let changed = false;
    for (const item of order.orderItems) {
      const migrated = await migrateUrl(item.image);
      if (migrated !== item.image) {
        item.image = migrated;
        changed = true;
      }
    }
    if (changed) {
      await order.save();
      stats.updated += 1;
    }
  }
};

const run = async () => {
  await cloudinary.api.ping();
  console.log('Cloudinary credentials verified.');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Starting image migration...');

  await migrateArrayField(Product, 'images');
  await migrateScalarFields(Product, ['thumbnail']);
  await migrateScalarFields(Category, ['image']);
  await migrateScalarFields(Subcategory, ['image']);
  await migrateScalarFields(Brand, ['logo']);
  await migrateScalarFields(Offer, ['banner']);
  await migrateScalarFields(Banner, ['image', 'mobileImage']);
  await migrateScalarFields(User, ['avatar']);
  await migrateArrayField(Review, 'images');
  await migrateOrderImages();

  console.log('Migration complete:', stats);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
