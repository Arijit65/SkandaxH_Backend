const multer = require('multer');
const path = require('path');

// For Cloudinary, we'll use memory storage instead of disk storage
// This will store the file in memory as a Buffer, which we can then upload to Cloudinary
const storage = multer.memoryStorage();

// File filter to only allow PDF and DOCX files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed!'), false);
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
