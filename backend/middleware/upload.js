import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const dirs = [
  'uploads/ecommerce',
  'uploads/ecommerce/brands',
  'uploads/ecommerce/offers',
  'uploads/ecommerce/videos',
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Create disk storage for a given folder
const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

// Normalize filesystem path to URL path (Windows backslashes → forward slashes)
const normalizePath = (p) => '/' + p.replace(/\\/g, '/');

// Multer instances for different upload types
const imageUpload = multer({
  storage: createStorage('uploads/ecommerce'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const brandUpload = multer({
  storage: createStorage('uploads/ecommerce/brands'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const offerUpload = multer({
  storage: createStorage('uploads/ecommerce/offers'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// Video upload - supports MP4, WEBM, OGG up to 20MB
const videoUpload = multer({
  storage: createStorage('uploads/ecommerce/videos'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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

// Wrapper that normalizes file paths to URL paths after multer processes the upload
const normalizeFilePaths = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    // Normalize single file
    if (req.file) req.file.path = normalizePath(req.file.path);
    // Normalize array of files
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => (f.path = normalizePath(f.path)));
    }
    // Normalize fields object
    if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      Object.keys(req.files).forEach((key) => {
        req.files[key].forEach((f) => (f.path = normalizePath(f.path)));
      });
    }
    next();
  });
};

// Exported middleware — controllers use req.file.path / req.files[].path as the image URL
export const uploadMultiple = normalizeFilePaths(imageUpload.array('images', 10));
export const uploadSingle = normalizeFilePaths(imageUpload.single('image'));
export const uploadBrandLogo = normalizeFilePaths(brandUpload.single('logo'));
export const uploadOfferBanner = normalizeFilePaths(offerUpload.single('banner'));
export const uploadVideo = normalizeFilePaths(videoUpload.single('video'));
// Combined upload for product with images + video
export const uploadProductMedia = normalizeFilePaths(
  multer({
    storage: createStorage('uploads/ecommerce'),
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
