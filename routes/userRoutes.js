const express = require("express");
const { registerUser, loginUser, updateUser, getUserProfile, updateRecruiterProfile, getRecruiterProfile, googleLogin } = require("../controllers/userController");
const { authenticateUser } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { sendOtp, verifyOtp, updatePassword } = require("../controllers/otpController.js");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.put("/update", authenticateUser, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]), updateUser);
router.get("/profile",authenticateUser,getUserProfile);
router.post("/recruiter_update", authenticateUser, upload.fields([
  { name: 'profileImage', maxCount: 1 }
]), updateRecruiterProfile);

router.get("/recruiter",authenticateUser,getRecruiterProfile);



// OTP Routes
router.post("/send-otp",sendOtp);
router.post("/verify-otp",verifyOtp);
router.post("/reset-password",updatePassword);

// Test route for Cloudinary uploads
router.post('/test-upload', upload.single('testFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Test file received:', req.file.originalname, req.file.mimetype, req.file.size);
    
    // Convert buffer to base64 string for Cloudinary upload
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    const base64String = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    const mediaUpload = await cloudinary.uploader.upload(base64String, {
      resource_type: 'auto',
      folder: 'test-uploads',
      public_id: `test_${Date.now()}`,
      access_mode: 'public',
      type: 'upload',
      overwrite: true,
      unique_filename: true
    });
    
    console.log('Test upload successful:', mediaUpload.secure_url);
    
    res.json({
      message: 'Test upload successful',
      url: mediaUpload.secure_url,
      details: mediaUpload
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

module.exports = router;
