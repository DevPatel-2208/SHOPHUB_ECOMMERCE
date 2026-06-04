import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const requiredCloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingCloudinaryVars = requiredCloudinaryVars.filter((key) => !process.env[key]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, formats) =>
  new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      allowed_formats: formats,
      resource_type: 'auto',
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
  });

const normalizePath = (p) => {
  if (!p) return p;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/')) return p;
  return '/' + p.replace(/\\/g, '/');
};

const imageUpload = multer({
  storage: createStorage('ecommerce', ['jpg', 'jpeg', 'png', 'gif', 'webp']),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const brandUpload = multer({
  storage: createStorage('ecommerce/brands', ['jpg', 'jpeg', 'png', 'gif', 'webp']),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const offerUpload = multer({
  storage: createStorage('ecommerce/offers', ['jpg', 'jpeg', 'png', 'gif', 'webp']),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const videoUpload = multer({
  storage: createStorage('ecommerce/videos', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg']),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedVideoTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files (MP4, WEBM, OGG) are allowed'), false);
    }
  },
});

const normalizeFilePaths = (multerMiddleware) => (req, res, next) => {
  if (missingCloudinaryVars.length > 0) {
    return res.status(503).json({
      success: false,
      message: `Image upload service is not configured. Missing: ${missingCloudinaryVars.join(', ')}`,
    });
  }

  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (req.file) req.file.path = normalizePath(req.file.path);
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => (f.path = normalizePath(f.path)));
    }
    if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      Object.keys(req.files).forEach((key) => {
        req.files[key].forEach((f) => (f.path = normalizePath(f.path)));
      });
    }
    next();
  });
};

export const uploadMultiple = normalizeFilePaths(imageUpload.array('images', 10));
export const uploadSingle = normalizeFilePaths(imageUpload.single('image'));
export const uploadBrandLogo = normalizeFilePaths(brandUpload.single('logo'));
export const uploadOfferBanner = normalizeFilePaths(offerUpload.single('banner'));
export const uploadVideo = normalizeFilePaths(videoUpload.single('video'));
export const uploadProductMedia = normalizeFilePaths(
  multer({
    storage: createStorage('ecommerce', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg']),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedVideoTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'), false);
      }
    },
  }).fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ])
);
