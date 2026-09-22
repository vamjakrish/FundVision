const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadCampaignImage, uploadProfileImage, uploadDocument } = require('../config/cloudinary');

router.post('/campaign-image', protect, uploadCampaignImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post('/profile-image', protect, uploadProfileImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post('/document', protect, uploadDocument.single('document'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
});

router.post('/multiple', protect, uploadCampaignImage.array('images', 5), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded.' });
  const files = req.files.map(f => ({ url: f.path, publicId: f.filename }));
  res.json({ success: true, files });
});

module.exports = router;
