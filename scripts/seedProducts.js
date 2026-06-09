import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import connectDB from '../configs/db.js';
import connectCloudinary from '../configs/cloudinary.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { seedDefaultCategories } from '../services/categorySeedService.js';
import { v2 as cloudinary } from 'cloudinary';

const ASSETS_DIR = path.resolve(process.cwd(), '..', 'client', 'src', 'assets');

const productsToSeed = [
  {
    name: 'Maggi 70g (Pack)',
    description: ['Instant noodles', 'Ready in 2 minutes', 'Popular savory snack'],
    price: 40, // original price (BDT)
    offerPrice: 35, // selling price (BDT)
    imageFile: 'maggi_image.png',
    categoryName: 'Instant Food',
    quantity: 200,
  },
  {
    name: 'Fresh Milk 1L',
    description: ['Full cream milk', 'Rich in calcium'],
    price: 120,
    offerPrice: 110,
    imageFile: 'dairy_product_image.png',
    categoryName: 'Dairy Products',
    quantity: 100,
  },
  {
    name: 'Brown Bread (500g)',
    description: ['Baked daily', 'Soft and fresh'],
    price: 55,
    offerPrice: 50,
    imageFile: 'bakery_image.png',
    categoryName: 'Bakery & Breads',
    quantity: 80,
  },
  {
    name: 'Organic Vegetables Pack',
    description: ['Mixed seasonal organic veggies', 'Locally sourced'],
    price: 220,
    offerPrice: 200,
    imageFile: 'organic_vegitable_image.png',
    categoryName: 'Organic Veggies',
    quantity: 60,
  },
  {
    name: 'Fresh Fruits Box',
    description: ['Seasonal fruit selection', 'Washed & packed'],
    price: 350,
    offerPrice: 320,
    imageFile: 'fresh_fruits_image.png',
    categoryName: 'Fresh Fruits',
    quantity: 50,
  },
  {
    name: 'Mineral Water (1.5L)',
    description: ['Pure drinking water', 'Bottle packaging'],
    price: 30,
    offerPrice: 25,
    imageFile: 'bottles_image.png',
    categoryName: 'Cold Drinks',
    quantity: 500,
  },
  {
    name: 'Premium Rice 5kg',
    description: ['Aromatic long-grain rice', 'High quality'],
    price: 720,
    offerPrice: 680,
    imageFile: 'grain_image.png',
    categoryName: 'Grains & Cereals',
    quantity: 40,
  },
];

const uploadImage = async (localPath, publicId) => {
  if (!fs.existsSync(localPath)) {
    console.warn('Image not found:', localPath);
    return null;
  }

  // If Cloudinary is configured, upload and return the secure_url
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      await connectCloudinary();
      const res = await cloudinary.uploader.upload(localPath, {
        folder: 'freshko/products',
        public_id: publicId,
        overwrite: true,
      });
      return res.secure_url;
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local path', err.message);
    }
  }

  // Fallback: return a relative path that the frontend may resolve if assets are exposed
  return `/src/assets/${path.basename(localPath)}`;
};

const run = async () => {
  try {
    await connectDB();
    await seedDefaultCategories();

    for (const p of productsToSeed) {
      const category = await Category.findOne({ name: p.categoryName });
      if (!category) {
        console.warn('Category not found, skipping product:', p.name, 'category:', p.categoryName);
        continue;
      }

      const localImage = path.join(ASSETS_DIR, p.imageFile);
      const uploadedUrl = await uploadImage(localImage, `${p.name.replace(/\s+/g, '_')}`);

      const existing = await Product.findOne({ name: p.name, category: category.name });
      if (existing) {
        console.log('Product already exists, updating:', p.name);
        existing.description = p.description;
        existing.price = p.price;
        existing.offerPrice = p.offerPrice;
        existing.quantity = p.quantity;
        existing.inStock = p.quantity > 0;
        existing.images = uploadedUrl ? [uploadedUrl] : [];
        await existing.save();
        continue;
      }

      const prod = new Product({
        name: p.name,
        description: p.description,
        price: p.price,
        offerPrice: p.offerPrice,
        images: uploadedUrl ? [uploadedUrl] : [],
        category: category.name,
        quantity: p.quantity,
        inStock: p.quantity > 0,
      });

      await prod.save();
      console.log('Seeded product:', p.name);
    }

    console.log('Product seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
};

run();
