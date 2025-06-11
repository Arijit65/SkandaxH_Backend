const multer = require('multer');
const path = require('path');

// For Cloudinary, we'll use memory storage instead of disk storage
// This will store the file in memory as a Buffer, which we can then upload to Cloudinary
const storage = multer.memoryStorage();

// File filter based on file type
const fileFilter = (req, file, cb) => {
  const resumeTypes = ['.pdf', '.docx'];
  const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check the fieldname to determine which filter to apply
  if (file.fieldname === 'resume') {
    // For resume uploads
    if (resumeTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed for resumes!'), false);
    }
  } else if (file.fieldname === 'profileImage') {
    // For profile image uploads
    if (imageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, GIF, and WEBP files are allowed for profile images!'), false);
    }
  } else {
    // Accept any file for other field names (like testFile)
    cb(null, true);
  }
};

// Create the multer upload instance with memory storage
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// This middleware will process the uploaded file and make it available in req.file
// The actual upload to Cloudinary will happen in the controller
module.exports = upload;
