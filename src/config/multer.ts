import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { randomUUID } from 'crypto';

// Ensure upload directories exist
const createDirectory = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create directories
const uploadsDir = path.join(process.cwd(), 'uploads');
createDirectory(uploadsDir);
createDirectory(path.join(uploadsDir, 'avatars'));
createDirectory(path.join(uploadsDir, 'posts'));
createDirectory(path.join(uploadsDir, 'temp'));

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'));
  }
};

// File filter for videos
const videoFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MPEG, MOV, and WEBM videos are allowed.'));
  }
};

// File filter for all media (images + videos)
const mediaFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

// Storage configuration for avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

// Storage configuration for posts
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsDir, 'posts'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

// Multer configurations
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: imageFileFilter,
});

export const uploadPostMedia = multer({
  storage: postStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for posts
  },
  fileFilter: mediaFileFilter,
});

export const uploadMultipleMedia = multer({
  storage: postStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10, // Max 10 files per post
  },
  fileFilter: mediaFileFilter,
});

// File filter for Excel files
const excelFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
  }
};

// Storage for Excel imports
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `import_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

export const uploadExcel = multer({
  storage: excelStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: excelFileFilter,
});

export default {
  uploadAvatar,
  uploadPostMedia,
  uploadMultipleMedia,
  uploadExcel,
  uploadsDir,
};