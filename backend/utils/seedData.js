/**
 * MASTER SEEDER — Production Demo Data for MERN E-Commerce
 *
 * Creates:
 *  - 20 Categories
 *  - 60+ Subcategories
 *  - 40+ Brands with logos
 *  - 170+ Products with images, specs, tags, SEO
 *  - 6 Hero Banners
 *  - 10 Coupons
 *  - 10 Offers
 *  - 50+ Reviews
 *  - 20 Sample Orders
 *  - Sample Users
 *
 * Run: npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Models ──
import User from '../models/User.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import Shipment from '../models/Shipment.js';

// ── Image URL Builder ──
const IMG = (seed, w = 640, h = 640) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const IMG_BANNER = (seed) => `https://picsum.photos/seed/banner-${seed}/1600/600`;
const IMG_BANNER_MOBILE = (seed) => `https://picsum.photos/seed/banner-mob-${seed}/600/800`;

// ── Connect ──
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');
};

// ── Clear Existing Data ──
const clearData = async () => {
  console.log('\n🧹 Clearing existing data...');
  const collections = [
    Category, Subcategory, Brand, Product, Banner, Coupon, Offer,
    Review, Order, Cart, Wishlist, Address, Notification, Shipment,
  ];
  for (const Model of collections) {
    await Model.deleteMany({});
    console.log(`   Cleared ${Model.modelName}`);
  }
  // Reset user reviews
  await User.updateMany({}, { $set: { addresses: [], wishlist: [] } });
  console.log('✅ All data cleared');
};

// =====================================================================
// CATEGORIES + SUBCATEGORIES
// =====================================================================
const CATEGORIES = [
  {
    name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and electronic devices', image: IMG('cat-electronics', 400, 400), order: 1,
    subcategories: [
      'Mobile Phones', 'Laptops', 'Tablets', 'Headphones', 'Speakers', 'Wearables', 'Cameras', 'Gaming Consoles',
    ],
  },
  {
    name: 'Fashion', slug: 'fashion', description: 'Trendy clothing and accessories', image: IMG('cat-fashion', 400, 400), order: 2,
    subcategories: [
      'Men\'s Clothing', 'Women\'s Clothing', 'Kids Clothing', 'Ethnic Wear', 'Western Wear', 'Party Wear', 'Winter Wear', 'Innerwear',
    ],
  },
  {
    name: 'Footwear', slug: 'footwear', description: 'Shoes for every occasion', image: IMG('cat-footwear', 400, 400), order: 3,
    subcategories: ['Sports Shoes', 'Casual Shoes', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flip-Flops'],
  },
  {
    name: 'Beauty', slug: 'beauty', description: 'Premium beauty and personal care', image: IMG('cat-beauty', 400, 400), order: 4,
    subcategories: ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Bath & Body', 'Men\'s Grooming', 'Beauty Tools', 'Organic'],
  },
  {
    name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Everything for your home', image: IMG('cat-home', 400, 400), order: 5,
    subcategories: ['Furniture', 'Kitchen Appliances', 'Home Decor', 'Cookware', 'Bedding', 'Bathroom', 'Lighting', 'Storage'],
  },
  {
    name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Gear up for an active lifestyle', image: IMG('cat-sports', 400, 400), order: 6,
    subcategories: ['Gym Equipment', 'Yoga', 'Cycling', 'Cricket', 'Football', 'Badminton', 'Swimming', 'Camping'],
  },
  {
    name: 'Books', slug: 'books', description: 'Books for every reader', image: IMG('cat-books', 400, 400), order: 7,
    subcategories: ['Fiction', 'Non-Fiction', 'Academic', 'Children', 'Self-Help', 'Comics', 'Biography', 'Cooking'],
  },
  {
    name: 'Watches', slug: 'watches', description: 'Timepieces for every style', image: IMG('cat-watches', 400, 400), order: 8,
    subcategories: ['Analog', 'Digital', 'Smart', 'Luxury', 'Sports', 'Fashion', 'Chronograph', 'Automatic'],
  },
  {
    name: 'Accessories', slug: 'accessories', description: 'Complete your look', image: IMG('cat-accessories', 400, 400), order: 9,
    subcategories: ['Bags', 'Belts', 'Sunglasses', 'Wallets', 'Jewelry', 'Hats', 'Scarves', 'Keychains'],
  },
  {
    name: 'Health', slug: 'health', description: 'Health and wellness products', image: IMG('cat-health', 400, 400), order: 10,
    subcategories: ['Supplements', 'Vitamins', 'Ayurvedic', 'Medical Equipment', 'Fitness Trackers', 'Massagers', 'First Aid', 'Personal Care'],
  },
  {
    name: 'Groceries', slug: 'groceries', description: 'Daily essentials delivered fresh', image: IMG('cat-groceries', 400, 400), order: 11,
    subcategories: ['Snacks', 'Beverages', 'Dairy', 'Staples', 'Organic', 'Health Foods', 'Baby Foods', 'Spreads'],
  },
  {
    name: 'Automotive', slug: 'automotive', description: 'Car care and accessories', image: IMG('cat-auto', 400, 400), order: 12,
    subcategories: ['Car Accessories', 'Car Care', 'Helmets', 'Riding Gear', 'Lubricants', 'GPS', 'Dash Cams', 'Cleaning'],
  },
  {
    name: 'Furniture', slug: 'furniture', description: 'Beautiful furniture for your space', image: IMG('cat-furniture', 400, 400), order: 13,
    subcategories: ['Sofas', 'Beds', 'Tables', 'Chairs', 'Wardrobes', 'Bookshelves', 'Desks', 'Outdoor'],
  },
  {
    name: 'Gaming', slug: 'gaming', description: 'Level up your gaming', image: IMG('cat-gaming', 400, 400), order: 14,
    subcategories: ['Consoles', 'Games', 'Controllers', 'Headsets', 'Chairs', 'Keyboards', 'Mice', 'Streaming'],
  },
  {
    name: 'Stationery', slug: 'stationery', description: 'Office and school supplies', image: IMG('cat-stationery', 400, 400), order: 15,
    subcategories: ['Pens', 'Notebooks', 'Art Supplies', 'Office Supplies', 'Desk Organizers', 'Planners', 'Cards', 'Crafts'],
  },
  {
    name: 'Pets', slug: 'pets', description: 'Everything for your furry friend', image: IMG('cat-pets', 400, 400), order: 16,
    subcategories: ['Dog Food', 'Cat Food', 'Pet Toys', 'Pet Grooming', 'Pet Beds', 'Collars', 'Aquariums', 'Bird Supplies'],
  },
  {
    name: 'Jewelry', slug: 'jewelry', description: 'Fine jewelry for every occasion', image: IMG('cat-jewelry', 400, 400), order: 17,
    subcategories: ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Gold', 'Silver', 'Diamond', 'Fashion Jewelry'],
  },
  {
    name: 'Baby & Kids', slug: 'baby-kids', description: 'Everything for your little one', image: IMG('cat-baby', 400, 400), order: 18,
    subcategories: ['Diapers', 'Baby Food', 'Toys', 'Clothing', 'Strollers', 'Car Seats', 'Nursery', 'Bathing'],
  },
  {
    name: 'Music', slug: 'music', description: 'Instruments and audio gear', image: IMG('cat-music', 400, 400), order: 19,
    subcategories: ['Guitars', 'Keyboards', 'Drums', 'Studio Gear', 'DJ Equipment', 'Microphones', 'Strings', 'Accessories'],
  },
  {
    name: 'Travel', slug: 'travel', description: 'Gear for your adventures', image: IMG('cat-travel', 400, 400), order: 20,
    subcategories: ['Luggage', 'Backpacks', 'Travel Accessories', 'Tents', 'Sleeping Bags', 'Travel Pillows', 'Locks', 'Adapters'],
  },
];

// =====================================================================
// BRANDS
// =====================================================================
const BRANDS = [
  // Electronics
  { name: 'Apple', slug: 'apple', subcategory: 'Mobile Phones', logo: IMG('brand-apple', 200, 200), description: 'Premium technology products' },
  { name: 'Samsung', slug: 'samsung', subcategory: 'Mobile Phones', logo: IMG('brand-samsung', 200, 200), description: 'Innovative electronics' },
  { name: 'OnePlus', slug: 'oneplus', subcategory: 'Mobile Phones', logo: IMG('brand-oneplus', 200, 200), description: 'Flagship killer smartphones' },
  { name: 'Xiaomi', slug: 'xiaomi', subcategory: 'Mobile Phones', logo: IMG('brand-xiaomi', 200, 200), description: 'Technology for everyone' },
  { name: 'Dell', slug: 'dell', subcategory: 'Laptops', logo: IMG('brand-dell', 200, 200), description: 'Powerful computing solutions' },
  { name: 'HP', slug: 'hp', subcategory: 'Laptops', logo: IMG('brand-hp', 200, 200), description: 'Innovative personal computers' },
  { name: 'Lenovo', slug: 'lenovo', subcategory: 'Laptops', logo: IMG('brand-lenovo', 200, 200), description: 'Smart technology for all' },
  { name: 'Sony', slug: 'sony', subcategory: 'Headphones', logo: IMG('brand-sony', 200, 200), description: 'Premium audio and visual' },
  { name: 'Boat', slug: 'boat', subcategory: 'Headphones', logo: IMG('brand-boat', 200, 200), description: 'Lifestyle audio brand' },
  { name: 'JBL', slug: 'jbl', subcategory: 'Speakers', logo: IMG('brand-jbl', 200, 200), description: 'Professional audio equipment' },
  // Fashion
  { name: 'Nike', slug: 'nike', subcategory: 'Sports Shoes', logo: IMG('brand-nike', 200, 200), description: 'Just do it' },
  { name: 'Adidas', slug: 'adidas', subcategory: 'Sports Shoes', logo: IMG('brand-adidas', 200, 200), description: 'Impossible is nothing' },
  { name: 'Puma', slug: 'puma', subcategory: 'Sports Shoes', logo: IMG('brand-puma', 200, 200), description: 'Forever faster' },
  { name: 'H&M', slug: 'hm', subcategory: "Men's Clothing", logo: IMG('brand-hm', 200, 200), description: 'Fashion and quality' },
  { name: 'Zara', slug: 'zara', subcategory: "Women's Clothing", logo: IMG('brand-zara', 200, 200), description: 'Latest fashion trends' },
  { name: 'Levi\'s', slug: 'levis', subcategory: "Men's Clothing", logo: IMG('brand-levis', 200, 200), description: 'Iconic denim since 1853' },
  { name: 'Raymond', slug: 'raymond', subcategory: "Men's Clothing", logo: IMG('brand-raymond', 200, 200), description: 'Complete man\'s wardrobe' },
  { name: 'Woodland', slug: 'woodland', subcategory: 'Casual Shoes', logo: IMG('brand-woodland', 200, 200), description: 'Adventure footwear' },
  // Beauty
  { name: 'Lakmé', slug: 'lakme', subcategory: 'Makeup', logo: IMG('brand-lakme', 200, 200), description: 'Expert beauty solutions' },
  { name: 'Maybelline', slug: 'maybelline', subcategory: 'Makeup', logo: IMG('brand-maybelline', 200, 200), description: 'Makeup made easy' },
  { name: 'The Body Shop', slug: 'the-body-shop', subcategory: 'Skincare', logo: IMG('brand-body-shop', 200, 200), description: 'Natural beauty products' },
  { name: 'L\'Oréal', slug: 'loreal', subcategory: 'Skincare', logo: IMG('brand-loreal', 200, 200), description: 'Because you\'re worth it' },
  // Watches
  { name: 'Fastrack', slug: 'fastrack', subcategory: 'Analog', logo: IMG('brand-fastrack', 200, 200), description: 'Cool youth accessories' },
  { name: 'Titan', slug: 'titan', subcategory: 'Analog', logo: IMG('brand-titan', 200, 200), description: 'India\'s favorite watch brand' },
  { name: 'Casio', slug: 'casio', subcategory: 'Digital', logo: IMG('brand-casio', 200, 200), description: 'Standard timepieces' },
  { name: 'Fossil', slug: 'fossil', subcategory: 'Fashion', logo: IMG('brand-fossil', 200, 200), description: 'Modern vintage' },
  // Home & Kitchen
  { name: 'Prestige', slug: 'prestige', subcategory: 'Kitchen Appliances', logo: IMG('brand-prestige', 200, 200), description: 'Trusted kitchen solutions' },
  { name: 'Bajaj', slug: 'bajaj', subcategory: 'Kitchen Appliances', logo: IMG('brand-bajaj', 200, 200), description: 'Reliable home appliances' },
  { name: 'Philips', slug: 'philips', subcategory: 'Kitchen Appliances', logo: IMG('brand-philips', 200, 200), description: 'Innovative health technology' },
  { name: 'IKEA', slug: 'ikea', subcategory: 'Furniture', logo: IMG('brand-ikea', 200, 200), description: 'Affordable home furniture' },
  // Books
  { name: 'Penguin', slug: 'penguin', subcategory: 'Fiction', logo: IMG('brand-penguin', 200, 200), description: 'Quality publishing' },
  { name: 'Harper Collins', slug: 'harper-collins', subcategory: 'Fiction', logo: IMG('brand-harper', 200, 200), description: 'World-class literature' },
  // Sports
  { name: 'Decathlon', slug: 'decathlon', subcategory: 'Gym Equipment', logo: IMG('brand-decathlon', 200, 200), description: 'Sports for all' },
  // Gaming
  { name: 'Logitech', slug: 'logitech', subcategory: 'Gaming Consoles', logo: IMG('brand-logitech', 200, 200), description: 'Gaming peripherals' },
  // Accessories
  { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', subcategory: 'Bags', logo: IMG('brand-tommy', 200, 200), description: 'American lifestyle brand' },
  // Groceries
  { name: 'Tata', slug: 'tata', subcategory: 'Staples', logo: IMG('brand-tata', 200, 200), description: 'Trusted Indian brand' },
  // Furniture
  { name: 'Wakefit', slug: 'wakefit', subcategory: 'Beds', logo: IMG('brand-wakefit', 200, 200), description: 'Sleep solutions' },
  // Automotive
  { name: 'Bosch', slug: 'bosch', subcategory: 'Car Accessories', logo: IMG('brand-bosch', 200, 200), description: 'Automotive technology' },
  // Pets
  { name: 'Pedigree', slug: 'pedigree', subcategory: 'Dog Food', logo: IMG('brand-pedigree', 200, 200), description: 'Nutrition for dogs' },
  // Health
  { name: 'HealthKart', slug: 'healthkart', subcategory: 'Supplements', logo: IMG('brand-healthkart', 200, 200), description: 'India\'s health supplement brand' },
  // Stationery
  { name: 'Classmate', slug: 'classmate', subcategory: 'Notebooks', logo: IMG('brand-classmate', 200, 200), description: 'Student stationery' },
  // Jewelry
  { name: 'Tanishq', slug: 'tanishq', subcategory: 'Gold', logo: IMG('brand-tanishq', 200, 200), description: 'Fine jewelry' },
];

// =====================================================================
// PRODUCT DATA — 170+ Realistic Indian Products
// =====================================================================
const PRODUCT_TEMPLATES = [
  // ─── MOBILE PHONES (12) ───
  { name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', category: 'Electronics', subcategory: 'Mobile Phones', price: 159900, comparePrice: 169900, sku: 'APL-IP15PM-256', tags: ['5g', 'premium', 'apple', 'smartphone', 'flagship'], isFeatured: true, rating: 4.7, numReviews: 1243 },
  { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Electronics', subcategory: 'Mobile Phones', price: 134999, comparePrice: 149999, sku: 'SAM-S24U-256', tags: ['5g', 'android', 'samsung', 'flagship', 'ai'], isFeatured: true, rating: 4.6, numReviews: 987 },
  { name: 'OnePlus 12 5G', brand: 'OnePlus', category: 'Electronics', subcategory: 'Mobile Phones', price: 69999, comparePrice: 74999, sku: 'ONP-12-256', tags: ['5g', 'flagship', 'fast-charging', 'android'], rating: 4.5, numReviews: 876 },
  { name: 'Xiaomi 14 Pro', brand: 'Xiaomi', category: 'Electronics', subcategory: 'Mobile Phones', price: 49999, comparePrice: 59999, sku: 'XIA-14P-256', tags: ['5g', 'flagship', 'leica', 'android'], rating: 4.3, numReviews: 654 },
  { name: 'iPhone 15 128GB', brand: 'Apple', category: 'Electronics', subcategory: 'Mobile Phones', price: 79900, comparePrice: 89900, sku: 'APL-IP15-128', tags: ['5g', 'apple', 'smartphone'], rating: 4.6, numReviews: 2341 },
  { name: 'Samsung Galaxy A55 5G', brand: 'Samsung', category: 'Electronics', subcategory: 'Mobile Phones', price: 29999, comparePrice: 34999, sku: 'SAM-A55-128', tags: ['5g', 'mid-range', 'samsung'], rating: 4.2, numReviews: 567 },
  { name: 'OnePlus Nord CE 4', brand: 'OnePlus', category: 'Electronics', subcategory: 'Mobile Phones', price: 24999, comparePrice: 27999, sku: 'ONP-NCE4-128', tags: ['5g', 'mid-range', 'oneplus'], rating: 4.1, numReviews: 432 },
  { name: 'Xiaomi Redmi Note 13 Pro', brand: 'Xiaomi', category: 'Electronics', subcategory: 'Mobile Phones', price: 17999, comparePrice: 21999, sku: 'XIA-RN13P-128', tags: ['4g', 'budget', 'xiaomi', 'amoled'], rating: 4.3, numReviews: 1876 },
  { name: 'Samsung Galaxy Z Fold 6', brand: 'Samsung', category: 'Electronics', subcategory: 'Mobile Phones', price: 164999, comparePrice: 179999, sku: 'SAM-ZF6-512', tags: ['foldable', 'premium', '5g', 'tablet'], isFeatured: true, rating: 4.4, numReviews: 321 },
  { name: 'iPhone 14 128GB', brand: 'Apple', category: 'Electronics', subcategory: 'Mobile Phones', price: 59900, comparePrice: 69900, sku: 'APL-IP14-128', tags: ['5g', 'apple', 'previous-gen'], rating: 4.5, numReviews: 3456 },
  { name: 'Samsung Galaxy M34 5G', brand: 'Samsung', category: 'Electronics', subcategory: 'Mobile Phones', price: 15999, comparePrice: 19999, sku: 'SAM-M34-128', tags: ['5g', 'budget', 'samsung'], rating: 4.1, numReviews: 2345 },
  { name: 'Xiaomi Redmi Note 12', brand: 'Xiaomi', category: 'Electronics', subcategory: 'Mobile Phones', price: 11999, comparePrice: 14999, sku: 'XIA-RN12-128', tags: ['4g', 'budget', 'xiaomi'], rating: 4.0, numReviews: 5678 },

  // ─── LAPTOPS (12) ───
  { name: 'MacBook Pro 16" M3 Max', brand: 'Apple', category: 'Electronics', subcategory: 'Laptops', price: 249900, comparePrice: 269900, sku: 'APL-MBP16-M3', tags: ['premium', 'apple', 'powerful', 'creator'], isFeatured: true, rating: 4.8, numReviews: 456 },
  { name: 'Dell XPS 15 Intel i9', brand: 'Dell', category: 'Electronics', subcategory: 'Laptops', price: 189990, comparePrice: 209990, sku: 'DEL-XPS15-I9', tags: ['premium', 'windows', 'ultrabook', 'creator'], rating: 4.5, numReviews: 234 },
  { name: 'HP Spectre x360 14', brand: 'HP', category: 'Electronics', subcategory: 'Laptops', price: 149990, comparePrice: 169990, sku: 'HP-SPX360-14', tags: ['premium', 'convertible', 'touchscreen'], rating: 4.4, numReviews: 187 },
  { name: 'Lenovo ThinkPad X1 Carbon', brand: 'Lenovo', category: 'Electronics', subcategory: 'Laptops', price: 179990, comparePrice: 199990, sku: 'LEN-TPX1C-G11', tags: ['business', 'premium', 'ultralight'], rating: 4.6, numReviews: 345 },
  { name: 'MacBook Air 15" M3', brand: 'Apple', category: 'Electronics', subcategory: 'Laptops', price: 149900, comparePrice: 164900, sku: 'APL-MBA15-M3', tags: ['apple', 'thin', 'lightweight', 'student'], isFeatured: true, rating: 4.7, numReviews: 891 },
  { name: 'Dell Inspiron 16 5640', brand: 'Dell', category: 'Electronics', subcategory: 'Laptops', price: 72990, comparePrice: 82990, sku: 'DEL-INS16-5640', tags: ['mid-range', 'student', 'everyday'], rating: 4.2, numReviews: 567 },
  { name: 'HP Pavilion 15', brand: 'HP', category: 'Electronics', subcategory: 'Laptops', price: 59990, comparePrice: 69990, sku: 'HP-PAV15-2024', tags: ['mid-range', 'student', 'entertainment'], rating: 4.1, numReviews: 789 },
  { name: 'Lenovo IdeaPad Slim 5', brand: 'Lenovo', category: 'Electronics', subcategory: 'Laptops', price: 52990, comparePrice: 60990, sku: 'LEN-IDEAPAD5', tags: ['mid-range', 'thin', 'student'], rating: 4.2, numReviews: 654 },
  { name: 'MacBook Pro 14" M3 Pro', brand: 'Apple', category: 'Electronics', subcategory: 'Laptops', price: 199900, comparePrice: 219900, sku: 'APL-MBP14-M3P', tags: ['premium', 'pro', 'apple', 'developer'], rating: 4.7, numReviews: 678 },
  { name: 'Dell Alienware m18', brand: 'Dell', category: 'Electronics', subcategory: 'Laptops', price: 289990, comparePrice: 319990, sku: 'DEL-ALW-M18', tags: ['gaming', 'premium', 'powerful', 'rgb'], isFeatured: true, rating: 4.5, numReviews: 234 },
  { name: 'HP Victus 16 Gaming', brand: 'HP', category: 'Electronics', subcategory: 'Laptops', price: 84990, comparePrice: 94990, sku: 'HP-VIC16-GAMING', tags: ['gaming', 'mid-range', 'rtx'], rating: 4.3, numReviews: 456 },
  { name: 'Lenovo Legion Pro 5', brand: 'Lenovo', category: 'Electronics', subcategory: 'Laptops', price: 149990, comparePrice: 169990, sku: 'LEN-LEGION5', tags: ['gaming', 'premium', 'high-performance'], rating: 4.4, numReviews: 345 },

  // ─── HEADPHONES (10) ───
  { name: 'Sony WH-1000XM5 Wireless ANC', brand: 'Sony', category: 'Electronics', subcategory: 'Headphones', price: 29990, comparePrice: 34990, sku: 'SONY-WH1000XM5', tags: ['noise-cancelling', 'premium', 'wireless', 'bluetooth'], isFeatured: true, rating: 4.6, numReviews: 2341 },
  { name: 'boAt Nirvana 751 ANC', brand: 'Boat', category: 'Electronics', subcategory: 'Headphones', price: 3499, comparePrice: 7999, sku: 'BOAT-NV751', tags: ['budget', 'anc', 'wireless', 'boAt'], rating: 4.1, numReviews: 5678 },
  { name: 'Sony WF-1000XM5 Earbuds', brand: 'Sony', category: 'Electronics', subcategory: 'Headphones', price: 24990, comparePrice: 27990, sku: 'SONY-WF1000XM5', tags: ['true-wireless', 'anc', 'premium'], rating: 4.5, numReviews: 1234 },
  { name: 'boAt Rockerz 550', brand: 'Boat', category: 'Electronics', subcategory: 'Headphones', price: 1999, comparePrice: 3999, sku: 'BOAT-ROCK550', tags: ['wireless', 'budget', 'boAt', 'bass'], rating: 4.0, numReviews: 12345 },
  { name: 'Sony WH-CH720N Wireless', brand: 'Sony', category: 'Electronics', subcategory: 'Headphones', price: 9990, comparePrice: 12990, sku: 'SONY-WHCH720N', tags: ['anc', 'mid-range', 'wireless'], rating: 4.3, numReviews: 876 },
  { name: 'boAt Airdopes 141 Pro', brand: 'Boat', category: 'Electronics', subcategory: 'Headphones', price: 1299, comparePrice: 3499, sku: 'BOAT-AD141P', tags: ['tws', 'budget', 'boAt', 'small'], rating: 4.0, numReviews: 23456 },
  { name: 'Sony HT-S2000 Soundbar', brand: 'Sony', category: 'Electronics', subcategory: 'Speakers', price: 39990, comparePrice: 45990, sku: 'SONY-HTS2000', tags: ['soundbar', 'home-theater', 'sony'], rating: 4.4, numReviews: 567 },
  { name: 'JBL Flip 6 Bluetooth Speaker', brand: 'JBL', category: 'Electronics', subcategory: 'Speakers', price: 12999, comparePrice: 15999, sku: 'JBL-FLIP6', tags: ['portable', 'waterproof', 'bass', 'party'], isFeatured: true, rating: 4.5, numReviews: 3456 },
  { name: 'JBL Charge 5', brand: 'JBL', category: 'Electronics', subcategory: 'Speakers', price: 16999, comparePrice: 19999, sku: 'JBL-CHARGE5', tags: ['portable', 'powerbank', 'waterproof'], rating: 4.6, numReviews: 2345 },
  { name: 'boAt Stone 1800', brand: 'Boat', category: 'Electronics', subcategory: 'Speakers', price: 2499, comparePrice: 4999, sku: 'BOAT-ST1800', tags: ['portable', 'budget', 'boAt', 'speaker'], rating: 4.0, numReviews: 8765 },

  // ─── SPORTS SHOES (10) ───
  { name: 'Nike Air Max 270 React', brand: 'Nike', category: 'Footwear', subcategory: 'Sports Shoes', price: 14995, comparePrice: 17995, sku: 'NIKE-AM270-RCT', tags: ['running', 'comfortable', 'air-max', 'lifestyle'], isFeatured: true, rating: 4.5, numReviews: 3456 },
  { name: 'Adidas Ultraboost Light', brand: 'Adidas', category: 'Footwear', subcategory: 'Sports Shoes', price: 15999, comparePrice: 18999, sku: 'ADI-UBOOST-LIGHT', tags: ['running', 'boost', 'premium', 'comfort'], rating: 4.6, numReviews: 2345 },
  { name: 'Puma Run XX Nitro', brand: 'Puma', category: 'Footwear', subcategory: 'Sports Shoes', price: 8999, comparePrice: 11999, sku: 'PUMA-XX-NITRO', tags: ['running', 'nitro', 'mid-range'], rating: 4.2, numReviews: 1234 },
  { name: 'Nike Air Force 1 \'07', brand: 'Nike', category: 'Footwear', subcategory: 'Casual Shoes', price: 11995, comparePrice: 12995, sku: 'NIKE-AF107', tags: ['iconic', 'casual', 'classic', 'lifestyle'], rating: 4.7, numReviews: 8765 },
  { name: 'Adidas Originals Superstar', brand: 'Adidas', category: 'Footwear', subcategory: 'Casual Shoes', price: 10999, comparePrice: 12999, sku: 'ADI-SUPERSTAR', tags: ['iconic', 'casual', 'classic', 'shell-toe'], rating: 4.5, numReviews: 5678 },
  { name: 'Puma Smash V2 Vulc', brand: 'Puma', category: 'Footwear', subcategory: 'Casual Shoes', price: 4999, comparePrice: 6999, sku: 'PUMA-SMASH-V2', tags: ['casual', 'budget', 'everyday'], rating: 4.1, numReviews: 3456 },
  { name: 'Woodland Men\'s Leather Boots', brand: 'Woodland', category: 'Footwear', subcategory: 'Boots', price: 6995, comparePrice: 8995, sku: 'WDL-BOOTS-M', tags: ['boots', 'leather', 'outdoor', 'durable'], rating: 4.3, numReviews: 2345 },
  { name: 'Nike Revolution 7', brand: 'Nike', category: 'Footwear', subcategory: 'Sports Shoes', price: 5995, comparePrice: 7495, sku: 'NIKE-REV7', tags: ['running', 'budget', 'daily'], rating: 4.1, numReviews: 6789 },
  { name: 'Adidas Grand Court', brand: 'Adidas', category: 'Footwear', subcategory: 'Sports Shoes', price: 4999, comparePrice: 6999, sku: 'ADI-GRANDCT', tags: ['tennis', 'casual', 'classic'], rating: 4.2, numReviews: 4567 },
  { name: 'Puma One 8 Stability', brand: 'Puma', category: 'Footwear', subcategory: 'Sports Shoes', price: 12999, comparePrice: 15999, sku: 'PUMA-ONE8', tags: ['running', 'stability', 'performance'], rating: 4.3, numReviews: 1234 },

  // ─── FASHION (14) ───
  { name: 'Levi\'s 501 Original Jeans', brand: 'Levi\'s', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 4999, comparePrice: 6499, sku: 'LEVI-501-M', tags: ['jeans', 'denim', 'classic', 'timeless'], isFeatured: true, rating: 4.6, numReviews: 6789 },
  { name: 'Raymond Premium Suit Set', brand: 'Raymond', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 15999, comparePrice: 21999, sku: 'RAY-SUIT-BLK', tags: ['formal', 'suit', 'premium', 'wool'], rating: 4.5, numReviews: 1234 },
  { name: 'H&M Slim Fit Chinos', brand: 'H&M', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 2499, comparePrice: 3999, sku: 'HM-CHINO-SLIM', tags: ['pants', 'casual', 'slim-fit'], rating: 4.1, numReviews: 4567 },
  { name: 'Zara Printed Maxi Dress', brand: 'Zara', category: 'Fashion', subcategory: 'Women\'s Clothing', price: 4990, comparePrice: 6990, sku: 'ZARA-MAXI-DR', tags: ['dress', 'ethnic', 'printed', 'flowy'], rating: 4.3, numReviews: 2345 },
  { name: 'H&M Cotton T-Shirt Pack (3)', brand: 'H&M', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 1799, comparePrice: 2999, sku: 'HM-TEE-3PK', tags: ['t-shirt', 'cotton', 'basics', 'pack'], rating: 4.2, numReviews: 9876 },
  { name: 'Levi\'s Trucker Jacket', brand: 'Levi\'s', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 6999, comparePrice: 8999, sku: 'LEVI-JACKET-DENIM', tags: ['jacket', 'denim', 'iconic', 'outerwear'], rating: 4.5, numReviews: 3456 },
  { name: 'Raymond Formal Shirt', brand: 'Raymond', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 2499, comparePrice: 3499, sku: 'RAY-SHIRT-FORM', tags: ['shirt', 'formal', 'office'], rating: 4.3, numReviews: 4567 },
  { name: 'Zara Leather Jacket', brand: 'Zara', category: 'Fashion', subcategory: 'Women\'s Clothing', price: 12990, comparePrice: 15990, sku: 'ZARA-LTH-JKT', tags: ['jacket', 'leather', 'premium', 'style'], isFeatured: true, rating: 4.4, numReviews: 1234 },
  { name: 'H&M Linen Shirt', brand: 'H&M', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 2999, comparePrice: 3999, sku: 'HM-LINEN-SHIRT', tags: ['shirt', 'linen', 'summer', 'casual'], rating: 4.1, numReviews: 3456 },
  { name: 'Zara High-Waist Trousers', brand: 'Zara', category: 'Fashion', subcategory: 'Women\'s Clothing', price: 3990, comparePrice: 4990, sku: 'ZARA-TROUSER-HW', tags: ['pants', 'formal', 'women'], rating: 4.2, numReviews: 2345 },
  { name: 'Levi\'s 512 Slim Taper Jeans', brand: 'Levi\'s', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 4499, comparePrice: 5999, sku: 'LEVI-512-M', tags: ['jeans', 'slim', 'denim', 'tapered'], rating: 4.4, numReviews: 5678 },
  { name: 'Raymond Casual Blazer', brand: 'Raymond', category: 'Fashion', subcategory: 'Men\'s Clothing', price: 8999, comparePrice: 11999, sku: 'RAY-BLAZER-CAS', tags: ['blazer', 'casual', 'semi-formal'], rating: 4.2, numReviews: 2345 },
  { name: 'H&M Open Cardigan', brand: 'H&M', category: 'Fashion', subcategory: 'Women\'s Clothing', price: 2999, comparePrice: 3999, sku: 'HM-CARDIGAN', tags: ['cardigan', 'winter', 'layering'], rating: 4.0, numReviews: 2345 },
  { name: 'Zara Cropped Denim Jacket', brand: 'Zara', category: 'Fashion', subcategory: 'Women\'s Clothing', price: 5990, comparePrice: 7990, sku: 'ZARA-CROP-DENIM', tags: ['jacket', 'denim', 'cropped', 'trendy'], rating: 4.3, numReviews: 3456 },

  // ─── WATCHES (10) ───
  { name: 'Titan Karishma Analog Watch', brand: 'Titan', category: 'Watches', subcategory: 'Analog', price: 4995, comparePrice: 6495, sku: 'TIT-KARISHMA', tags: ['analog', 'titan', 'classic', 'leather'], rating: 4.3, numReviews: 4567 },
  { name: 'Fastrack Reflex VOX Smartwatch', brand: 'Fastrack', category: 'Watches', subcategory: 'Smart', price: 4995, comparePrice: 6995, sku: 'FST-REFLEX-VOX', tags: ['smartwatch', 'fastrack', 'fitness', 'voice'], isFeatured: true, rating: 4.1, numReviews: 5678 },
  { name: 'Casio G-Shock GA-2100', brand: 'Casio', category: 'Watches', subcategory: 'Digital', price: 8995, comparePrice: 10995, sku: 'CAS-GSHOCK-GA2100', tags: ['g-shock', 'tough', 'sports', 'iconic'], rating: 4.7, numReviews: 7890 },
  { name: 'Fossil FS5995 Grant Chronograph', brand: 'Fossil', category: 'Watches', subcategory: 'Chronograph', price: 15995, comparePrice: 19995, sku: 'FOS-FS5995', tags: ['chronograph', 'fossil', 'premium', 'steel'], rating: 4.4, numReviews: 2345 },
  { name: 'Titan Edge Ceramic', brand: 'Titan', category: 'Watches', subcategory: 'Analog', price: 24995, comparePrice: 29995, sku: 'TIT-EDGE-CER', tags: ['slim', 'titan', 'premium', 'ceramic'], rating: 4.6, numReviews: 3456 },
  { name: 'Fastrack Limitless FS1', brand: 'Fastrack', category: 'Watches', subcategory: 'Smart', price: 2995, comparePrice: 4995, sku: 'FST-LIMITLESS', tags: ['smartwatch', 'budget', 'fitness'], rating: 3.9, numReviews: 8901 },
  { name: 'Casio Enticer Analog', brand: 'Casio', category: 'Watches', subcategory: 'Analog', price: 2695, comparePrice: 3495, sku: 'CAS-ENTICER-M', tags: ['casio', 'analog', 'budget', 'daily'], rating: 4.2, numReviews: 6789 },
  { name: 'Fossil Machine Chronograph', brand: 'Fossil', category: 'Watches', subcategory: 'Fashion', price: 21995, comparePrice: 26995, sku: 'FOS-MACHINE', tags: ['fossil', 'premium', 'steel', 'heavy'], rating: 4.5, numReviews: 3456 },
  { name: 'Titan Raga Viva', brand: 'Titan', category: 'Watches', subcategory: 'Fashion', price: 5995, comparePrice: 7995, sku: 'TIT-RAGA-VIVA', tags: ['women', 'titan', 'fashion', 'stylish'], rating: 4.3, numReviews: 4567 },
  { name: 'Fastrack Reflex Play', brand: 'Fastrack', category: 'Watches', subcategory: 'Smart', price: 1795, comparePrice: 3495, sku: 'FST-REFLEX-PLAY', tags: ['smartwatch', 'budget', 'student', 'sports'], rating: 3.8, numReviews: 12345 },

  // ─── BEAUTY & SKINCARE (10) ───
  { name: 'Lakmé Absolute Matte Lipstick', brand: 'Lakmé', category: 'Beauty', subcategory: 'Makeup', price: 975, comparePrice: 1250, sku: 'LAK-LIP-MATTE', tags: ['lipstick', 'matte', 'long-lasting'], rating: 4.3, numReviews: 5678 },
  { name: 'Maybelline Fit Me Foundation', brand: 'Maybelline', category: 'Beauty', subcategory: 'Makeup', price: 849, comparePrice: 1099, sku: 'MAY-FITME-FDN', tags: ['foundation', 'natural', 'everyday'], rating: 4.2, numReviews: 7890 },
  { name: 'The Body Shop Tea Tree Oil', brand: 'The Body Shop', category: 'Beauty', subcategory: 'Skincare', price: 1495, comparePrice: 1995, sku: 'TBS-TEA-TREE', tags: ['skincare', 'acne', 'natural', 'tea-tree'], rating: 4.5, numReviews: 4567 },
  { name: 'L\'Oréal Paris Revitalift Night Cream', brand: 'L\'Oréal', category: 'Beauty', subcategory: 'Skincare', price: 1299, comparePrice: 1699, sku: 'LOR-REVITALIFT-N', tags: ['night-cream', 'anti-aging', 'skincare'], rating: 4.3, numReviews: 3456 },
  { name: 'Lakmé 9 to 5 Primer + Matte Powder', brand: 'Lakmé', category: 'Beauty', subcategory: 'Makeup', price: 675, comparePrice: 975, sku: 'LAK-PRIMER-PWDR', tags: ['compact', 'powder', 'matte'], rating: 4.0, numReviews: 6789 },
  { name: 'Maybelline Colossal Kajal', brand: 'Maybelline', category: 'Beauty', subcategory: 'Makeup', price: 349, comparePrice: 499, sku: 'MAY-KAJAL', tags: ['kajal', 'eye', 'waterproof'], rating: 4.4, numReviews: 12345 },
  { name: 'The Body Shop Shea Body Butter', brand: 'The Body Shop', category: 'Beauty', subcategory: 'Bath & Body', price: 1995, comparePrice: 2495, sku: 'TBS-SHEA-BTR', tags: ['body-butter', 'moisture', 'natural'], rating: 4.6, numReviews: 5678 },
  { name: 'L\'Oréal Paris Shampoo Absolute Repair', brand: 'L\'Oréal', category: 'Beauty', subcategory: 'Haircare', price: 599, comparePrice: 849, sku: 'LOR-SHAMPOO-REP', tags: ['shampoo', 'haircare', 'repair'], rating: 4.1, numReviews: 8901 },
  { name: 'Lakmé Absolute Eye Shadow Palette', brand: 'Lakmé', category: 'Beauty', subcategory: 'Makeup', price: 1450, comparePrice: 1895, sku: 'LAK-EYESHADOW', tags: ['eye-shadow', 'palette', 'makeup'], rating: 4.2, numReviews: 3456 },
  { name: 'L\'Oréal Paris Men Expert Face Wash', brand: 'L\'Oréal', category: 'Beauty', subcategory: 'Men\'s Grooming', price: 349, comparePrice: 499, sku: 'LOR-MEN-FACEWASH', tags: ['face-wash', 'men', 'skincare'], rating: 4.0, numReviews: 12345 },

  // ─── HOME & KITCHEN (12) ───
  { name: 'Prestige Deluxe Pressure Cooker 5L', brand: 'Prestige', category: 'Home & Kitchen', subcategory: 'Cookware', price: 3399, comparePrice: 4299, sku: 'PRE-PC-5L', tags: ['cooker', 'stainless', 'kitchen'], rating: 4.5, numReviews: 5678 },
  { name: 'Bajaj Majesty Mixer Grinder 750W', brand: 'Bajaj', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 3999, comparePrice: 5499, sku: 'BAJ-MIXER-750', tags: ['mixer', 'grinder', 'kitchen', 'appliance'], rating: 4.2, numReviews: 4567 },
  { name: 'Philips Air Fryer HD9252', brand: 'Philips', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 10999, comparePrice: 14999, sku: 'PHL-AIRFRY-9252', tags: ['air-fryer', 'healthy', 'rapid-air'], isFeatured: true, rating: 4.4, numReviews: 2345 },
  { name: 'Prestige Induction Cooktop', brand: 'Prestige', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 2499, comparePrice: 3499, sku: 'PRE-INDUCT-1500W', tags: ['induction', 'cooktop', 'portable'], rating: 4.1, numReviews: 6789 },
  { name: 'Philips Electric Kettle HD9350', brand: 'Philips', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 1799, comparePrice: 2499, sku: 'PHL-KETTLE-9350', tags: ['kettle', 'electric', 'kitchen'], rating: 4.3, numReviews: 8901 },
  { name: 'IKEA MALM Bed Frame', brand: 'IKEA', category: 'Furniture', subcategory: 'Beds', price: 25990, comparePrice: 29990, sku: 'IKEA-MALM-QUEEN', tags: ['bed', 'frame', 'storage', 'modern'], rating: 4.2, numReviews: 3456 },
  { name: 'Wakefit Orthopedic Mattress Queen', brand: 'Wakefit', category: 'Furniture', subcategory: 'Beds', price: 17999, comparePrice: 24999, sku: 'WKF-MATRESS-QUEEN', tags: ['mattress', 'orthopedic', 'comfort'], isFeatured: true, rating: 4.5, numReviews: 5678 },
  { name: 'IKEA KALLAX Shelf Unit', brand: 'IKEA', category: 'Furniture', subcategory: 'Bookshelves', price: 6990, comparePrice: 8990, sku: 'IKEA-KALLAX', tags: ['shelf', 'storage', 'modern', 'modular'], rating: 4.3, numReviews: 4567 },
  { name: 'Bajaj Room Heater 2000W', brand: 'Bajaj', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 1999, comparePrice: 2999, sku: 'BAJ-HEATER-2KW', tags: ['heater', 'winter', 'room'], rating: 4.0, numReviews: 6789 },
  { name: 'Philips Mixer Grinder HL7699', brand: 'Philips', category: 'Home & Kitchen', subcategory: 'Kitchen Appliances', price: 6499, comparePrice: 8499, sku: 'PHL-MIXER-7699', tags: ['mixer', 'grinder', 'powerful', 'juicer'], rating: 4.3, numReviews: 3456 },
  { name: 'Prestige Non-Stick Kadai Set', brand: 'Prestige', category: 'Home & Kitchen', subcategory: 'Cookware', price: 1999, comparePrice: 2999, sku: 'PRE-KADAI-NS', tags: ['kadai', 'non-stick', 'cookware'], rating: 4.2, numReviews: 5678 },
  { name: 'Wakefit Study Table', brand: 'Wakefit', category: 'Furniture', subcategory: 'Desks', price: 9999, comparePrice: 12999, sku: 'WKF-STUDY-DESK', tags: ['desk', 'study', 'home-office'], rating: 4.1, numReviews: 2345 },

  // ─── SPORTS & FITNESS (10) ───
  { name: 'Decathlon Home Gym Kit 20kg', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 4999, comparePrice: 6999, sku: 'DEC-HOME-GYM-20', tags: ['home-gym', 'dumbbells', 'strength'], rating: 4.1, numReviews: 4567 },
  { name: 'Decathlon Yoga Mat Premium', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Yoga', price: 1499, comparePrice: 1999, sku: 'DEC-YOGA-MAT', tags: ['yoga', 'fitness', 'exercise'], rating: 4.3, numReviews: 6789 },
  { name: 'Nike Storm-Fit Running Jacket', brand: 'Nike', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 8995, comparePrice: 11995, sku: 'NIKE-STORM-JKT', tags: ['jacket', 'running', 'waterproof'], rating: 4.4, numReviews: 2345 },
  { name: 'Decathlon Cycling Helmet', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Cycling', price: 1999, comparePrice: 2999, sku: 'DEC-HELMET-CYCLE', tags: ['helmet', 'cycling', 'safety'], rating: 4.2, numReviews: 3456 },
  { name: 'Adidas Gym Bag Medium', brand: 'Adidas', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 3499, comparePrice: 4999, sku: 'ADI-GYM-BAG', tags: ['bag', 'gym', 'duffle'], rating: 4.3, numReviews: 4567 },
  { name: 'Decathlon Resistance Bands Set', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 999, comparePrice: 1499, sku: 'DEC-RES-BANDS', tags: ['bands', 'exercise', 'home-gym'], rating: 4.0, numReviews: 8901 },
  { name: 'Nike Pro Dri-FIT Leggings', brand: 'Nike', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 3995, comparePrice: 4995, sku: 'NIKE-PRO-LEGGINGS', tags: ['leggings', 'training', 'dri-fit'], rating: 4.4, numReviews: 5678 },
  { name: 'Decathlon Camping Tent 4P', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Camping', price: 7999, comparePrice: 9999, sku: 'DEC-TENT-4P', tags: ['tent', 'camping', 'outdoor', 'waterproof'], rating: 4.1, numReviews: 2345 },
  { name: 'Adidas Performance Backpack', brand: 'Adidas', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 2999, comparePrice: 3999, sku: 'ADI-BACKPACK-PERF', tags: ['backpack', 'sports', 'gym'], rating: 4.2, numReviews: 4567 },
  { name: 'Decathlon Dumbbell Set 10kg', brand: 'Decathlon', category: 'Sports & Fitness', subcategory: 'Gym Equipment', price: 2499, comparePrice: 3499, sku: 'DEC-DUMBBELL-10', tags: ['dumbbells', 'strength', 'home-gym'], rating: 4.0, numReviews: 6789 },

  // ─── BOOKS (10) ───
  { name: 'Atomic Habits by James Clear', brand: 'Penguin', category: 'Books', subcategory: 'Self-Help', price: 799, comparePrice: 999, sku: 'BK-ATOMIC-HABITS', tags: ['self-help', 'bestseller', 'habits', 'productivity'], isFeatured: true, rating: 4.8, numReviews: 23456 },
  { name: 'The Alchemist by Paulo Coelho', brand: 'Harper Collins', category: 'Books', subcategory: 'Fiction', price: 499, comparePrice: 699, sku: 'BK-ALCHEMIST', tags: ['fiction', 'classic', 'philosophy', 'bestseller'], rating: 4.7, numReviews: 34567 },
  { name: 'Rich Dad Poor Dad by Robert Kiyosaki', brand: 'Harper Collins', category: 'Books', subcategory: 'Non-Fiction', price: 599, comparePrice: 799, sku: 'BK-RICH-DAD', tags: ['finance', 'wealth', 'education', 'bestseller'], rating: 4.6, numReviews: 45678 },
  { name: 'Wings of Fire by APJ Abdul Kalam', brand: 'Penguin', category: 'Books', subcategory: 'Biography', price: 399, comparePrice: 499, sku: 'BK-WINGS-FIRE', tags: ['biography', 'inspiration', 'india', 'science'], rating: 4.9, numReviews: 56789 },
  { name: '1984 by George Orwell', brand: 'Penguin', category: 'Books', subcategory: 'Fiction', price: 449, comparePrice: 599, sku: 'BK-1984', tags: ['fiction', 'classic', 'dystopian', 'political'], rating: 4.7, numReviews: 34567 },
  { name: 'Think and Grow Rich by Napoleon Hill', brand: 'Harper Collins', category: 'Books', subcategory: 'Self-Help', price: 349, comparePrice: 499, sku: 'BK-THINK-RICH', tags: ['self-help', 'wealth', 'classic', 'motivation'], rating: 4.5, numReviews: 23456 },
  { name: 'The Psychology of Money', brand: 'Harper Collins', category: 'Books', subcategory: 'Non-Fiction', price: 599, comparePrice: 799, sku: 'BK-PSYCH-MONEY', tags: ['finance', 'psychology', 'bestseller', 'wealth'], rating: 4.6, numReviews: 34567 },
  { name: 'Sapiens by Yuval Noah Harari', brand: 'Harper Collins', category: 'Books', subcategory: 'Non-Fiction', price: 699, comparePrice: 899, sku: 'BK-SAPIENS', tags: ['history', 'science', 'humanity', 'bestseller'], rating: 4.7, numReviews: 45678 },
  { name: 'The Great Gatsby by F. Scott Fitzgerald', brand: 'Penguin', category: 'Books', subcategory: 'Fiction', price: 399, comparePrice: 499, sku: 'BK-GATSBY', tags: ['fiction', 'classic', 'american', 'drama'], rating: 4.4, numReviews: 23456 },
  { name: 'Do Epic Shit by Ankur Warikoo', brand: 'Penguin', category: 'Books', subcategory: 'Self-Help', price: 499, comparePrice: 699, sku: 'BK-EPIC-SHIT', tags: ['self-help', 'startup', 'india', 'motivation'], rating: 4.3, numReviews: 56789 },

  // ─── GAMING (8) ───
  { name: 'Sony PS5 Slim Disc Edition', brand: 'Sony', category: 'Gaming', subcategory: 'Consoles', price: 44990, comparePrice: 49990, sku: 'SONY-PS5-SLIM', tags: ['console', 'gaming', 'sony', '4k'], isFeatured: true, rating: 4.7, numReviews: 5678 },
  { name: 'Logitech G Pro X Superlight', brand: 'Logitech', category: 'Gaming', subcategory: 'Mice', price: 14999, comparePrice: 17999, sku: 'LOG-GPRO-SUPER', tags: ['mouse', 'gaming', 'wireless', 'lightweight'], rating: 4.6, numReviews: 3456 },
  { name: 'Sony DualSense Wireless Controller', brand: 'Sony', category: 'Gaming', subcategory: 'Consoles', price: 5999, comparePrice: 6999, sku: 'SONY-DUALSENSE', tags: ['controller', 'ps5', 'haptic'], rating: 4.5, numReviews: 4567 },
  { name: 'Logitech G915 TKL Keyboard', brand: 'Logitech', category: 'Gaming', subcategory: 'Keyboards', price: 24999, comparePrice: 29999, sku: 'LOG-G915-TKL', tags: ['keyboard', 'wireless', 'mechanical', 'rgb'], rating: 4.5, numReviews: 2345 },
  { name: 'Sony WH-1000XM5 Gaming Edition', brand: 'Sony', category: 'Gaming', subcategory: 'Headsets', price: 34990, comparePrice: 39990, sku: 'SONY-1000XM5-G', tags: ['headset', 'anc', 'wireless', 'gaming'], rating: 4.4, numReviews: 2345 },
  { name: 'Logitech C920 HD Pro Webcam', brand: 'Logitech', category: 'Gaming', subcategory: 'Streaming', price: 8999, comparePrice: 10999, sku: 'LOG-C920-WEBCAM', tags: ['webcam', 'streaming', '1080p'], rating: 4.3, numReviews: 5678 },
  { name: 'Logitech G733 Lightspeed Headset', brand: 'Logitech', category: 'Gaming', subcategory: 'Headsets', price: 15999, comparePrice: 19999, sku: 'LOG-G733', tags: ['headset', 'wireless', 'rgb', 'gaming'], rating: 4.2, numReviews: 3456 },
  { name: 'Logitech G502 Hero Mouse', brand: 'Logitech', category: 'Gaming', subcategory: 'Mice', price: 5999, comparePrice: 7999, sku: 'LOG-G502-HERO', tags: ['mouse', 'wired', 'gaming', 'rgb'], rating: 4.6, numReviews: 8901 },

  // ─── ACCESSORIES (8) ───
  { name: 'Tommy Hilfiger Boston Bag', brand: 'Tommy Hilfiger', category: 'Accessories', subcategory: 'Bags', price: 8995, comparePrice: 11995, sku: 'TH-BOSTON-BAG', tags: ['bag', 'travel', 'tommy', 'premium'], rating: 4.3, numReviews: 2345 },
  { name: 'Tommy Hilfiger Leather Belt', brand: 'Tommy Hilfiger', category: 'Accessories', subcategory: 'Belts', price: 3995, comparePrice: 4995, sku: 'TH-BELT-LEATHER', tags: ['belt', 'leather', 'formal'], rating: 4.2, numReviews: 3456 },
  { name: 'Ray-Ban Aviator Sunglasses', brand: 'Tommy Hilfiger', category: 'Accessories', subcategory: 'Sunglasses', price: 9999, comparePrice: 12999, sku: 'RAY-AVIATOR-GOLD', tags: ['sunglasses', 'classic', 'premium', 'uv-protection'], rating: 4.6, numReviews: 5678 },
  { name: 'Tommy Hilfiger Leather Wallet', brand: 'Tommy Hilfiger', category: 'Accessories', subcategory: 'Wallets', price: 3495, comparePrice: 4495, sku: 'TH-WALLET-LEATHER', tags: ['wallet', 'leather', 'slim', 'bi-fold'], rating: 4.3, numReviews: 4567 },
  { name: 'Fastrack Sunglasses UV Protected', brand: 'Fastrack', category: 'Accessories', subcategory: 'Sunglasses', price: 1995, comparePrice: 2995, sku: 'FST-SUNGLASS-UV', tags: ['sunglasses', 'trendy', 'uv-protected'], rating: 4.0, numReviews: 6789 },
  { name: 'Tommy Hilfiger Backpack', brand: 'Tommy Hilfiger', category: 'Accessories', subcategory: 'Bags', price: 6995, comparePrice: 8995, sku: 'TH-BACKPACK', tags: ['backpack', 'college', 'tommy', 'style'], rating: 4.3, numReviews: 3456 },
  { name: 'Titan Raga Chain Necklace', brand: 'Tanishq', category: 'Jewelry', subcategory: 'Necklaces', price: 24999, comparePrice: 29999, sku: 'TAN-RAGA-CHAIN-G', tags: ['gold', 'necklace', 'traditional', '22k'], rating: 4.5, numReviews: 2345 },
  { name: 'Tanishq Diamond Earrings', brand: 'Tanishq', category: 'Jewelry', subcategory: 'Earrings', price: 45999, comparePrice: 54999, sku: 'TAN-DM-EARRINGS', tags: ['diamond', 'earrings', 'premium', '18k'], rating: 4.6, numReviews: 3456 },

  // ─── GROCERIES (8) ───
  { name: 'Tata Salt 1kg Pack', brand: 'Tata', category: 'Groceries', subcategory: 'Staples', price: 28, comparePrice: 35, sku: 'TATA-SALT-1KG', tags: ['salt', 'daily', 'staple', 'iodized'], rating: 4.5, numReviews: 56789 },
  { name: 'Tata Tea Premium 500g', brand: 'Tata', category: 'Groceries', subcategory: 'Beverages', price: 315, comparePrice: 375, sku: 'TATA-TEA-500G', tags: ['tea', 'beverage', 'tata', 'premium'], rating: 4.3, numReviews: 45678 },
  { name: 'Tata Sampann Dal Makhani 500g', brand: 'Tata', category: 'Groceries', subcategory: 'Staples', price: 189, comparePrice: 245, sku: 'TATA-DAL-500G', tags: ['dal', 'pulses', 'protein', 'staples'], rating: 4.2, numReviews: 34567 },
  { name: 'Tata Gold Tea Bags 100', brand: 'Tata', category: 'Groceries', subcategory: 'Beverages', price: 475, comparePrice: 575, sku: 'TATA-TEABAGS-100', tags: ['tea', 'bags', 'premium'], rating: 4.4, numReviews: 23456 },
  { name: 'Tata Cooking Oil 1L', brand: 'Tata', category: 'Groceries', subcategory: 'Staples', price: 215, comparePrice: 255, sku: 'TATA-OIL-1L', tags: ['oil', 'cooking', 'healthy'], rating: 4.1, numReviews: 34567 },
  { name: 'Tata Salt Lite Low Sodium', brand: 'Tata', category: 'Groceries', subcategory: 'Health Foods', price: 45, comparePrice: 55, sku: 'TATA-SALT-LITE', tags: ['salt', 'low-sodium', 'health'], rating: 4.0, numReviews: 23456 },
  { name: 'Pedigree Adult Dog Food 3kg', brand: 'Pedigree', category: 'Pets', subcategory: 'Dog Food', price: 999, comparePrice: 1299, sku: 'PDG-DOG-3KG', tags: ['dog-food', 'pedigree', 'adult'], rating: 4.2, numReviews: 12345 },
  { name: 'HealthKart Whey Protein 1kg', brand: 'HealthKart', category: 'Health', subcategory: 'Supplements', price: 2499, comparePrice: 3299, sku: 'HK-WHEY-1KG', tags: ['protein', 'whey', 'fitness', 'supplement'], isFeatured: true, rating: 4.3, numReviews: 6789 },

  // ─── STATIONERY (6) ───
  { name: 'Classmate Pulse Notebook A4 172 Pages', brand: 'Classmate', category: 'Stationery', subcategory: 'Notebooks', price: 245, comparePrice: 325, sku: 'CLM-PULSE-A4', tags: ['notebook', 'college', 'writing', 'classmate'], rating: 4.3, numReviews: 34567 },
  { name: 'Classmate Geometry Box', brand: 'Classmate', category: 'Stationery', subcategory: 'Office Supplies', price: 175, comparePrice: 249, sku: 'CLM-GEO-BOX', tags: ['geometry', 'school', 'math'], rating: 4.2, numReviews: 23456 },
  { name: 'Classmate Regalia Notebook A5', brand: 'Classmate', category: 'Stationery', subcategory: 'Notebooks', price: 195, comparePrice: 275, sku: 'CLM-REGALIA-A5', tags: ['notebook', 'premium', 'classmate'], rating: 4.1, numReviews: 45678 },
  { name: 'Classmate Pen Set 10pk', brand: 'Classmate', category: 'Stationery', subcategory: 'Pens', price: 145, comparePrice: 199, sku: 'CLM-PEN-10PK', tags: ['pens', 'ball-pen', 'writing'], rating: 4.0, numReviews: 56789 },
  { name: 'Classmate Drawing Book A3', brand: 'Classmate', category: 'Stationery', subcategory: 'Art Supplies', price: 295, comparePrice: 395, sku: 'CLM-DRAW-A3', tags: ['drawing', 'art', 'sketchbook'], rating: 4.2, numReviews: 12345 },
  { name: 'Classmate Watercolor Set 24', brand: 'Classmate', category: 'Stationery', subcategory: 'Art Supplies', price: 395, comparePrice: 549, sku: 'CLM-WATERCOLOR', tags: ['paint', 'art', 'colors', 'watercolor'], rating: 4.1, numReviews: 23456 },

  // ─── AUTOMOTIVE (6) ───
  { name: 'Bosch Wiper Blade Set', brand: 'Bosch', category: 'Automotive', subcategory: 'Car Accessories', price: 1299, comparePrice: 1799, sku: 'BOSCH-WIPER', tags: ['wiper', 'car', 'bosch', 'twin'], rating: 4.3, numReviews: 5678 },
  { name: 'Bosch Car Battery 70Ah', brand: 'Bosch', category: 'Automotive', subcategory: 'Car Accessories', price: 7499, comparePrice: 8999, sku: 'BOSCH-BATTERY-70', tags: ['battery', 'car', 'bosch', 'maintenance-free'], rating: 4.4, numReviews: 3456 },
  { name: 'Bosch Engine Oil 5W30 4L', brand: 'Bosch', category: 'Automotive', subcategory: 'Lubricants', price: 3999, comparePrice: 4999, sku: 'BOSCH-OIL-5W30', tags: ['engine-oil', 'lubricant', 'car'], rating: 4.2, numReviews: 4567 },
  { name: 'Bosch Car Vacuum Cleaner', brand: 'Bosch', category: 'Automotive', subcategory: 'Car Care', price: 4999, comparePrice: 6499, sku: 'BOSCH-VACUUM', tags: ['vacuum', 'car', 'cleaner', 'powerful'], rating: 4.1, numReviews: 2345 },
  { name: 'Bosch Interior Car Cleaner Kit', brand: 'Bosch', category: 'Automotive', subcategory: 'Cleaning', price: 999, comparePrice: 1399, sku: 'BOSCH-CLEAN-KIT', tags: ['cleaning', 'interior', 'car-care'], rating: 4.0, numReviews: 3456 },
  { name: 'Bosch TPMS Tyre Pressure Sensor', brand: 'Bosch', category: 'Automotive', subcategory: 'Car Accessories', price: 5999, comparePrice: 7999, sku: 'BOSCH-TPMS', tags: ['safety', 'tyre', 'pressure', 'sensor'], rating: 4.3, numReviews: 2345 },
];

// =====================================================================
// BANNERS
// =====================================================================
const BANNERS = [
  { title: 'Summer Mega Sale', subtitle: 'Up to 70% Off', description: 'Exclusive deals on fashion, electronics, and more. Limited time offer!', image: IMG_BANNER('summer-sale'), mobileImage: IMG_BANNER_MOBILE('summer-sale'), link: '/products?sort=price_asc', ctaText: 'Shop Now', gradient: 'from-orange-500 to-red-600', badge: 'Mega Sale', order: 1 },
  { title: 'Premium Electronics', subtitle: 'Latest Tech Arrivals', description: 'Explore the newest smartphones, laptops, and gadgets from top brands.', image: IMG_BANNER('electronics'), mobileImage: IMG_BANNER_MOBILE('electronics'), link: '/products?category=electronics', ctaText: 'Explore Electronics', gradient: 'from-purple-600 to-blue-600', badge: 'New Arrivals', order: 2 },
  { title: 'Fashion Fest 2025', subtitle: 'Style That Speaks', description: 'Curated collections from top fashion brands. Get the look you love.', image: IMG_BANNER('fashion'), mobileImage: IMG_BANNER_MOBILE('fashion'), link: '/products?category=fashion', ctaText: 'Shop Fashion', gradient: 'from-pink-500 to-rose-600', badge: 'Trending', order: 3 },
  { title: 'Fitness Frenzy', subtitle: 'Gear Up & Get Fit', description: 'Premium sports equipment, activewear, and supplements at best prices.', image: IMG_BANNER('fitness'), mobileImage: IMG_BANNER_MOBILE('fitness'), link: '/products?category=sports-fitness', ctaText: 'Explore Fitness', gradient: 'from-green-500 to-teal-600', badge: 'Sports', order: 4 },
  { title: 'Home Makeover', subtitle: 'Transform Your Space', description: 'Beautiful furniture, kitchen appliances, and decor to upgrade your home.', image: IMG_BANNER('home'), mobileImage: IMG_BANNER_MOBILE('home'), link: '/products?category=home-kitchen', ctaText: 'Shop Home', gradient: 'from-amber-500 to-orange-600', badge: 'Home', order: 5 },
  { title: 'Festival Bonanza', subtitle: 'Celebrate with Savings', description: 'Special festival discounts on every category. Grab the best deals!', image: IMG_BANNER('festival'), mobileImage: IMG_BANNER_MOBILE('festival'), link: '/products', ctaText: 'View All Deals', gradient: 'from-indigo-500 to-purple-600', badge: 'Festival', order: 6 },
];

// =====================================================================
// COUPONS
// =====================================================================
const COUPONS = [
  { code: 'WELCOME10', description: '10% off for new customers', discountType: 'percentage', discountValue: 10, maxDiscount: 500, minOrderValue: 999, maxUses: 1000, perUserLimit: 1, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  { code: 'FREEDEL', description: 'Free delivery on orders above ₹500', discountType: 'fixed', discountValue: 49, minOrderValue: 500, maxUses: 5000, expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
  { code: 'SAVE20', description: '20% off on fashion', discountType: 'percentage', discountValue: 20, maxDiscount: 1000, minOrderValue: 1499, maxUses: 2000, expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  { code: 'ELECTRO15', description: '15% off on electronics', discountType: 'percentage', discountValue: 15, maxDiscount: 2000, minOrderValue: 4999, maxUses: 1500, expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  { code: 'FESTIVE200', description: 'Flat ₹200 off on orders above ₹1999', discountType: 'fixed', discountValue: 200, minOrderValue: 1999, maxUses: 3000, expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  { code: 'BEAUTY30', description: '30% off on beauty products', discountType: 'percentage', discountValue: 30, maxDiscount: 750, minOrderValue: 999, maxUses: 1000, expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  { code: 'BOOKLOVER', description: 'Flat 50% off on books', discountType: 'percentage', discountValue: 50, maxDiscount: 500, minOrderValue: 399, maxUses: 500, expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  { code: 'FIRSTORDER', description: '₹100 off on first order', discountType: 'fixed', discountValue: 100, minOrderValue: 999, maxUses: 5000, perUserLimit: 1, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  { code: 'PAYTM500', description: 'Flat ₹500 off on ₹4999+', discountType: 'fixed', discountValue: 500, minOrderValue: 4999, maxUses: 500, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { code: 'SUMMER25', description: '25% off summer collection', discountType: 'percentage', discountValue: 25, maxDiscount: 1500, minOrderValue: 1999, maxUses: 2000, expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
];

// =====================================================================
// OFFERS
// =====================================================================
const OFFERS = [
  { title: 'Flash Sale: 40% Off Electronics', slug: 'flash-electronics', description: 'Limited time flash sale on premium electronics. Grab the best deals before they\'re gone!', discountType: 'percentage', discountValue: 40, maxDiscount: 5000, priority: 10, applyOn: 'all', startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { title: 'Buy More Save More', slug: 'buy-more-save', description: 'Buy 2 items get 10% off, buy 3+ get 20% off', discountType: 'percentage', discountValue: 15, maxDiscount: 3000, priority: 5, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { title: 'Fashion Weekend Special', slug: 'fashion-weekend', description: 'Exclusive weekend offer on all fashion items', discountType: 'percentage', discountValue: 25, maxDiscount: 2000, priority: 8, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { title: 'Premium Watch Offer', slug: 'premium-watch', description: 'Special discount on premium watch collection', discountType: 'percentage', discountValue: 20, maxDiscount: 10000, priority: 7, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
  { title: 'Health & Fitness Fest', slug: 'health-fitness', description: 'Get fit with exclusive discounts on supplements and equipment', discountType: 'percentage', discountValue: 30, maxDiscount: 1500, priority: 6, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { title: 'Beauty Bonanza', slug: 'beauty-bonanza', description: 'Pamper yourself with premium beauty products at unbeatable prices', discountType: 'percentage', discountValue: 35, maxDiscount: 1000, priority: 8, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  { title: 'Book Lovers Sale', slug: 'books-sale', description: 'Flat 50% off on bestselling books', discountType: 'percentage', discountValue: 50, maxDiscount: 500, priority: 9, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { title: 'Smartphone Fest', slug: 'smartphone-fest', description: 'Exclusive discounts on latest smartphones', discountType: 'percentage', discountValue: 10, maxDiscount: 15000, priority: 7, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  { title: 'Home Makeover Sale', slug: 'home-sale', description: 'Transform your home with up to 30% off on furniture and kitchen', discountType: 'percentage', discountValue: 30, maxDiscount: 8000, priority: 6, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { title: 'Gaming Weekend', slug: 'gaming-weekend', description: 'Level up your gaming setup with special weekend prices', discountType: 'percentage', discountValue: 15, maxDiscount: 5000, priority: 5, applyOn: 'category', applicableItems: [], startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

// =====================================================================
// REVIEW DATA
// =====================================================================
const REVIEW_COMMENTS = [
  { rating: 5, title: 'Absolutely love it!', comment: 'Best purchase I\'ve made this year. The quality exceeds all expectations. Highly recommended!' },
  { rating: 5, title: 'Great value for money', comment: 'Excellent product at this price point. Delivery was fast and packaging was perfect.' },
  { rating: 4, title: 'Very good product', comment: 'Really happy with this purchase. Works exactly as described. Would buy again.' },
  { rating: 4, title: 'Good quality', comment: 'Good build quality and performance. Minor issues but overall satisfied with the purchase.' },
  { rating: 5, title: 'Perfect!', comment: 'Exceeded my expectations. The product is premium and feels very well made.' },
  { rating: 3, title: 'Decent product', comment: 'Okay for the price. Could be better but does the job. Not bad overall.' },
  { rating: 5, title: 'Must buy!', comment: 'I researched a lot before buying this and it was the right decision. Fantastic product!' },
  { rating: 4, title: 'Worth the money', comment: 'Solid product. Does what it promises. The customer support was also helpful.' },
  { rating: 5, title: 'Outstanding quality', comment: 'Premium feel and great performance. Packed with features at this price. Very impressed.' },
  { rating: 4, title: 'Very satisfied', comment: 'Delivery was quick and the product matches the description perfectly. Happy customer!' },
  { rating: 5, title: 'Excellent purchase', comment: 'One of the best products I\'ve bought online. The quality is top-notch.' },
  { rating: 5, title: 'Super happy!', comment: 'Bought this as a gift and the recipient loved it. Great product and great service.' },
];

// =====================================================================
// SAMPLE USERS
// =====================================================================
const SAMPLE_USERS = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@email.com', phone: '9876543210', password: 'Test@123' },
  { name: 'Priya Patel', email: 'priya.patel@email.com', phone: '9876543211', password: 'Test@123' },
  { name: 'Amit Singh', email: 'amit.singh@email.com', phone: '9876543212', password: 'Test@123' },
  { name: 'Neha Gupta', email: 'neha.gupta@email.com', phone: '9876543213', password: 'Test@123' },
  { name: 'Vikram Reddy', email: 'vikram.reddy@email.com', phone: '9876543214', password: 'Test@123' },
  { name: 'Ananya Verma', email: 'ananya.verma@email.com', phone: '9876543215', password: 'Test@123' },
  { name: 'Karan Joshi', email: 'karan.joshi@email.com', phone: '9876543216', password: 'Test@123' },
  { name: 'Divya Nair', email: 'divya.nair@email.com', phone: '9876543217', password: 'Test@123' },
  { name: 'Rohit Malhotra', email: 'rohit.malhotra@email.com', phone: '9876543218', password: 'Test@123' },
  { name: 'Sneha Kapoor', email: 'sneha.kapoor@email.com', phone: '9876543219', password: 'Test@123' },
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
];
const INDIAN_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal',
];

// =====================================================================
// SPEC GENERATORS
// =====================================================================
const generateSpecs = (product) => {
  const specs = [];
  const cat = product.category;
  const sub = product.subcategory;
  if (cat === 'Electronics' && sub === 'Mobile Phones') {
    specs.push({ key: 'Display', value: '6.7" Super AMOLED, 120Hz' }, { key: 'Processor', value: 'Octa-core 3.2GHz' }, { key: 'RAM', value: '12GB' }, { key: 'Storage', value: '256GB' }, { key: 'Battery', value: '5000mAh' }, { key: 'OS', value: 'Android 14 / iOS 18' }, { key: 'Camera (Rear)', value: '50MP + 12MP + 10MP' }, { key: 'Camera (Front)', value: '12MP' }, { key: 'Weight', value: '210g' }, { key: 'SIM', value: 'Dual Nano-SIM' });
  } else if (cat === 'Electronics' && sub === 'Laptops') {
    specs.push({ key: 'Processor', value: 'Intel Core i7-13700H / Apple M3' }, { key: 'RAM', value: '16GB DDR5' }, { key: 'Storage', value: '512GB SSD' }, { key: 'Display', value: '15.6" FHD+ IPS 165Hz' }, { key: 'Battery', value: 'Up to 12 hours' }, { key: 'Weight', value: '1.8kg' }, { key: 'Ports', value: '2x USB-C, HDMI, 3.5mm' }, { key: 'OS', value: 'Windows 11 / macOS' });
  } else if (cat === 'Footwear') {
    specs.push({ key: 'Material', value: 'Mesh / Leather' }, { key: 'Sole', value: 'Rubber' }, { key: 'Closure', value: 'Lace-up' }, { key: 'Fit', value: 'True to size' }, { key: 'Warranty', value: '3 months' });
  } else if (cat === 'Watches') {
    specs.push({ key: 'Movement', value: 'Quartz / Automatic' }, { key: 'Water Resistance', value: '50m' }, { key: 'Case Material', value: 'Stainless Steel' }, { key: 'Dial', value: 'Analog / Digital' }, { key: 'Strap', value: 'Leather / Silicone / Metal' }, { key: 'Warranty', value: '2 years' });
  } else if (cat === 'Beauty') {
    specs.push({ key: 'Net Quantity', value: '25ml / 50g' }, { key: 'Shelf Life', value: '36 months' }, { key: 'Skin Type', value: 'All skin types' }, { key: 'Made In', value: 'India' });
  } else if (cat === 'Books') {
    specs.push({ key: 'Publisher', value: 'Penguin Random House / HarperCollins' }, { key: 'Language', value: 'English' }, { key: 'Pages', value: '250-400' }, { key: 'ISBN', value: '978-0-14-XXXXXX-X' }, { key: 'Dimensions', value: '13 x 2 x 20 cm' });
  } else if (cat === 'Home & Kitchen' || cat === 'Furniture') {
    specs.push({ key: 'Material', value: 'Stainless Steel / Wood' }, { key: 'Color', value: 'Silver / Brown' }, { key: 'Warranty', value: '1 year' }, { key: 'Weight', value: '2.5kg' }, { key: 'Country of Origin', value: 'India' });
  } else if (cat === 'Gaming') {
    specs.push({ key: 'Connectivity', value: 'Wireless / Wired' }, { key: 'Battery Life', value: 'Up to 40 hours' }, { key: 'Compatibility', value: 'PC, PS5, Xbox' }, { key: 'Warranty', value: '1 year' });
  } else if (cat === 'Sports & Fitness') {
    specs.push({ key: 'Material', value: 'High-quality fabric / Steel' }, { key: 'Max Load', value: '100kg' }, { key: 'Warranty', value: '6 months' }, { key: 'Color', value: 'Black / Multi' });
  } else {
    specs.push({ key: 'Material', value: 'Premium quality' }, { key: 'Color', value: 'As shown' }, { key: 'Warranty', value: '6 months' }, { key: 'Country of Origin', value: 'India' });
  }
  return specs;
};

// =====================================================================
// MAIN SEED FUNCTION
// =====================================================================
const seedData = async () => {
  try {
    await connectDB();
    await clearData();

    // ── 1. Create Categories + Subcategories ──
    console.log('\n📁 Creating categories & subcategories...');
    const catMap = {};
    const subcatMap = {};
    for (const catData of CATEGORIES) {
      const category = await Category.create({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
        order: catData.order,
        isActive: true,
      });
      catMap[catData.name] = category;
      console.log(`   ✅ Category: ${category.name}`);

      for (const subName of catData.subcategories) {
        const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const sub = await Subcategory.create({
          name: subName,
          slug: subSlug,
          category: category._id,
          description: `${subName} in ${catData.name}`,
          image: IMG(`sub-${subSlug}`, 400, 400),
          isActive: true,
        });
        const key = `${catData.name}::${subName}`;
        subcatMap[key] = sub;
      }
    }
    console.log(`   ✅ ${CATEGORIES.length} categories, ${CATEGORIES.reduce((a, c) => a + c.subcategories.length, 0)} subcategories created`);

    // ── 2. Create Brands ──
    console.log('\n🏷️ Creating brands...');
    const brandMap = {};
    for (const bData of BRANDS) {
      // Find subcategory
      const catName = CATEGORIES.find(c => c.subcategories.includes(bData.subcategory))?.name;
      if (!catName) {
        console.warn(`   ⚠️  Could not find category for brand ${bData.name} (sub: ${bData.subcategory})`);
        continue;
      }
      const subKey = `${catName}::${bData.subcategory}`;
      const sub = subcatMap[subKey];
      if (!sub) {
        console.warn(`   ⚠️  Subcategory not found for brand ${bData.name}: ${subKey}`);
        continue;
      }
      const brand = await Brand.create({
        name: bData.name,
        slug: bData.slug,
        logo: bData.logo,
        description: bData.description,
        subcategory: sub._id,
        category: catMap[catName]._id,
        isActive: true,
        order: 0,
      });
      brandMap[bData.name] = brand;
      console.log(`   ✅ Brand: ${brand.name}`);
    }
    console.log(`   ✅ ${Object.keys(brandMap).length} brands created`);

    // ── 3. Create Products ──
    console.log('\n📦 Creating products...');
    const productIds = [];
    for (const pData of PRODUCT_TEMPLATES) {
      const cat = catMap[pData.category];
      if (!cat) { console.warn(`   ⚠️  Category not found: ${pData.category}`); continue; }
      const subKey = `${pData.category}::${pData.subcategory}`;
      const sub = subcatMap[subKey];
      if (!sub) { console.warn(`   ⚠️  Subcategory not found: ${subKey}`); continue; }
      const brand = brandMap[pData.brand];
      if (!brand) { console.warn(`   ⚠️  Brand not found: ${pData.brand}`); continue; }

      const slug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const seedName = slug.substring(0, 40);
      const images = [IMG(`${seedName}-0`, 640, 640), IMG(`${seedName}-1`, 640, 640), IMG(`${seedName}-2`, 640, 640)];

      const description = `Experience the best-in-class ${pData.name} from ${pData.brand}. Designed for those who demand excellence, this ${pData.subcategory.toLowerCase()} offers premium quality, outstanding performance, and exceptional value. Whether you're upgrading your lifestyle or looking for the perfect gift, ${pData.name} delivers on every front.`;

      const product = await Product.create({
        name: pData.name,
        slug,
        description,
        price: pData.price,
        comparePrice: pData.comparePrice,
        thumbnail: images[0],
        images,
        video: '',
        category: cat._id,
        subcategory: sub._id,
        brand: brand._id,
        stock: Math.floor(Math.random() * 150) + 10,
        lowStockThreshold: 5,
        sku: pData.sku,
        weight: Math.round(Math.random() * 5 * 10) / 10 + 0.5,
        dimensions: { length: 15 + Math.random() * 20, width: 10 + Math.random() * 15, height: 2 + Math.random() * 8 },
        isActive: true,
        isFeatured: pData.isFeatured || false,
        ratings: pData.rating || (3 + Math.random() * 2).toFixed(1),
        numReviews: pData.numReviews || Math.floor(Math.random() * 500) + 10,
        specifications: generateSpecs(pData),
        tags: pData.tags || [],
        seoTitle: `Buy ${pData.name} Online at Best Price in India`,
        seoDescription: `Shop ${pData.name} from ${pData.brand} at best price. ✓Free Delivery ✓Easy Returns ✓COD Available.`,
      });

      productIds.push(product._id);
      if (productIds.length <= 5) console.log(`   ✅ ${product.name} — ₹${product.price}`);
    }
    console.log(`   ✅ ${productIds.length} products created`);

    // ── 4. Link category offers ──
    for (const offer of OFFERS) {
      if (offer.applyOn === 'category') {
        const catName = offer.title.includes('Fashion') ? 'Fashion'
          : offer.title.includes('Watch') ? 'Watches'
          : offer.title.includes('Health') || offer.title.includes('Fitness') ? 'Sports & Fitness'
          : offer.title.includes('Beauty') ? 'Beauty'
          : offer.title.includes('Book') ? 'Books'
          : offer.title.includes('Smartphone') || offer.title.includes('Electronics') ? 'Electronics'
          : offer.title.includes('Home') || offer.title.includes('Makeover') ? 'Home & Kitchen'
          : offer.title.includes('Gaming') ? 'Gaming' : null;
        if (catName && catMap[catName]) {
          offer.applicableItems = [catMap[catName]._id];
          offer.applyOnModel = 'Category';
        }
      }
    }

    // ── 5. Create Banners ──
    console.log('\n🖼️ Creating banners...');
    for (const bData of BANNERS) {
      await Banner.create(bData);
    }
    console.log(`   ✅ ${BANNERS.length} banners created`);

    // ── 6. Create Coupons ──
    console.log('\n🎫 Creating coupons...');
    for (const cData of COUPONS) {
      await Coupon.create(cData);
    }
    console.log(`   ✅ ${COUPONS.length} coupons created`);

    // ── 7. Create Offers ──
    console.log('\n🔥 Creating offers...');
    for (const oData of OFFERS) {
      const offerData = { ...oData };
      if (!offerData.applicableItems || offerData.applicableItems.length === 0) {
        delete offerData.applicableItems;
        offerData.applyOnModel = undefined;
      }
      await Offer.create(offerData);
    }
    console.log(`   ✅ ${OFFERS.length} offers created`);

    // ── 8. Create Sample Users ──
    console.log('\n👤 Creating sample users...');
    const userIds = [];
    for (const uData of SAMPLE_USERS) {
      const user = await User.create({ ...uData, isVerified: true, isActive: true, role: 'user' });
      userIds.push(user._id);
    }
    console.log(`   ✅ ${userIds.length} sample users created`);

    // ── 9. Create Reviews ──
    console.log('\n⭐ Creating reviews...');
    let reviewCount = 0;
    for (let i = 0; i < Math.min(60, productIds.length); i++) {
      const productId = productIds[i];
      const numReviews = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numReviews; j++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const rc = REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];
        try {
          await Review.create({
            user: userId,
            product: productId,
            rating: rc.rating,
            title: rc.title,
            comment: rc.comment,
            isActive: true,
            isVerifiedPurchase: Math.random() > 0.3,
          });
          reviewCount++;
        } catch (e) {
          // Skip duplicate reviews
        }
      }
    }
    console.log(`   ✅ ${reviewCount} reviews created`);

    // ── 10. Sample Orders ──
    console.log('\n📋 Creating sample orders...');
    let orderCount = 0;
    for (let i = 0; i < 20; i++) {
      const user = await User.findById(userIds[i % userIds.length]);
      if (!user) continue;
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let totalPrice = 0;
      const usedProducts = new Set();
      for (let j = 0; j < numItems; j++) {
        let pi;
        let attempts = 0;
        do {
          pi = Math.floor(Math.random() * productIds.length);
          attempts++;
        } while (usedProducts.has(pi) && attempts < 10);
        usedProducts.add(pi);
        const prod = await Product.findById(productIds[pi]).populate('category', 'name').lean();
        if (!prod) continue;
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = prod.offer?.discountedPrice || prod.price;
        orderItems.push({
          product: prod._id,
          name: prod.name,
          image: prod.images?.[0] || '',
          price,
          quantity: qty,
          sku: prod.sku || '',
        });
        totalPrice += price * qty;
      }
      if (orderItems.length === 0) continue;
      const shippingPrice = totalPrice > 500 ? 0 : 49;
      const taxPrice = Math.round(totalPrice * 0.18 * 100) / 100;
      const cityIdx = Math.floor(Math.random() * INDIAN_CITIES.length);
      const orderStatuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending'];
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

      const order = await Order.create({
        user: user._id,
        orderItems,
        shippingAddress: {
          fullName: user.name,
          phone: user.phone,
          addressLine1: `${Math.floor(Math.random() * 999) + 1}, ${['MG Road', 'Main Street', 'Park Avenue', 'Lake View', 'Green Park'][Math.floor(Math.random() * 5)]}`,
          city: INDIAN_CITIES[cityIdx],
          state: INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)],
          postalCode: String(100000 + Math.floor(Math.random() * 900000)),
          country: 'India',
          landmark: Math.random() > 0.5 ? ['Near City Center', 'Opposite Metro Station', 'Beside Park'][Math.floor(Math.random() * 3)] : '',
        },
        paymentMethod: Math.random() > 0.3 ? 'cashfree' : 'cod',
        paymentStatus: orderStatus === 'pending' ? 'pending' : orderStatus === 'cancelled' ? 'refunded' : 'paid',
        isPaid: orderStatus !== 'pending' && orderStatus !== 'cancelled',
        paidAt: orderStatus !== 'pending' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
        itemsPrice: totalPrice,
        shippingPrice,
        taxPrice,
        totalPrice: Math.round((totalPrice + shippingPrice + taxPrice) * 100) / 100,
        status: orderStatus,
        trackingStatus: orderStatus === 'delivered' ? 'delivered' : orderStatus === 'shipped' ? 'shipped' : orderStatus === 'processing' ? 'processing' : 'payment_pending',
        isDelivered: orderStatus === 'delivered',
        deliveredAt: orderStatus === 'delivered' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined,
      });
      orderCount++;
    }
    console.log(`   ✅ ${orderCount} orders created`);

    // ── Summary ──
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`   Categories:     ${CATEGORIES.length}`);
    console.log(`   Subcategories:  ${CATEGORIES.reduce((a, c) => a + c.subcategories.length, 0)}`);
    console.log(`   Brands:         ${Object.keys(brandMap).length}`);
    console.log(`   Products:       ${productIds.length}`);
    console.log(`   Banners:        ${BANNERS.length}`);
    console.log(`   Coupons:        ${COUPONS.length}`);
    console.log(`   Offers:         ${OFFERS.length}`);
    console.log(`   Reviews:        ${reviewCount}`);
    console.log(`   Sample Users:   ${userIds.length}`);
    console.log(`   Sample Orders:  ${orderCount}`);
    console.log('='.repeat(50));
    console.log('\n📧 Admin Login:');
    console.log('   Email:    admin@gmail.com');
    console.log('   Password: admin123');
    console.log('\n👤 Sample User Login:');
    console.log('   Email:    rahul.sharma@email.com');
    console.log('   Password: Test@123');
    console.log('\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
