const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `fundvision/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const campaignImageStorage = createStorage('campaigns');
const profileImageStorage = createStorage('profiles');
const documentStorage = createStorage('documents');

const uploadCampaignImage = multer({
  storage: campaignImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Campaign Proofs multer memory storage for buffer-level validation before upload
const uploadCampaignProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG, and WEBP files are allowed'), false);
    }
  }
});

/**
 * Upload buffer directly to Cloudinary with secure settings and safe mock fallback
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    
    if (!isCloudinaryConfigured) {
      const fakeId = `fundvision/campaign-proofs/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return resolve({
        public_id: options.public_id || fakeId,
        secure_url: `https://res.cloudinary.com/fundvision-mock/image/upload/${fakeId}`,
        url: `http://res.cloudinary.com/fundvision-mock/image/upload/${fakeId}`,
        bytes: buffer ? buffer.length : 0,
        format: options.format || 'pdf'
      });
    }

    const uploadOptions = {
      folder: 'fundvision/campaign-proofs',
      resource_type: 'auto',
      type: 'upload',
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Generate secure signed URL for confidential campaign document preview
 */
const generateSecureSignedUrl = (publicId, fileType = 'application/pdf', expiresInSeconds = 3600) => {
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  if (!isCloudinaryConfigured) {
    return {
      url: `https://res.cloudinary.com/fundvision-mock/image/upload/${publicId}?expires=${expiresAt}`,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    };
  }

  const isPdf = fileType === 'application/pdf' || (publicId && publicId.endsWith('.pdf'));
  const resourceType = isPdf ? 'raw' : 'image';

  const signedUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    secure: true,
    expires_at: expiresAt
  });

  return {
    url: signedUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString()
  };
};

/**
 * Delete asset from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    if (!isCloudinaryConfigured || !publicId) return { result: 'ok' };
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary destroy error:', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadCampaignImage,
  uploadProfileImage,
  uploadDocument,
  uploadCampaignProof,
  uploadBufferToCloudinary,
  generateSecureSignedUrl,
  deleteFromCloudinary,
};
