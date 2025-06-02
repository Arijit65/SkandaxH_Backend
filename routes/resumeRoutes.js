const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { authenticateUser } = require('../middleware/authMiddleware');
const { getResumeReportByApplicationId } = require('../controllers/Ai_Controllers/resumeanalysisController');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true // Use HTTPS
});

const router = express.Router();

// Test route to verify Cloudinary configuration
router.get('/test-cloudinary', async (req, res) => {
  try {
    // Get Cloudinary account info to verify credentials
    const result = await cloudinary.api.ping();
    
    // Return success with Cloudinary info
    res.json({
      status: 'success',
      message: 'Cloudinary is properly configured',
      cloudName: process.env.CLOUDINARY_NAME,
      result
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Cloudinary configuration error',
      error: error.message
    });
  }
});

// Route to download/view a resume - handles both local files and Cloudinary URLs
router.get('/:filename', authenticateUser, async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('Resume request for filename:', filename);
    
    // Check if this is a Cloudinary URL or filename
    if (filename.includes('cloudinary.com')) {
      // This is a full Cloudinary URL - redirect to it
      console.log('Redirecting to full Cloudinary URL:', filename);
      return res.redirect(filename);
    }
    
    // Check if this is a Cloudinary public ID or a local file
    if (filename.startsWith('resume_') || filename.startsWith('resume-')) {
      // This is likely a Cloudinary file
      console.log('Handling Cloudinary file:', filename);
      
      // Determine if it's a PDF or DOCX file
      const isPdfOrDocx = filename.endsWith('.pdf') || filename.endsWith('.docx') || filename.endsWith('.doc');
      
      // Construct the Cloudinary URL with the appropriate resource type
      const resourceType = isPdfOrDocx ? 'raw' : 'image';
      
      // Create the Cloudinary URL - try both with and without version number
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/${resourceType}/upload/resumes/${filename}`;
      
      console.log('Trying to fetch from Cloudinary URL:', cloudinaryUrl);
      
      try {
        // Fetch the file from Cloudinary
        const response = await axios({
          method: 'get',
          url: cloudinaryUrl,
          responseType: 'arraybuffer'
        });
        
        console.log('Successfully fetched file from Cloudinary');
        
        // Set appropriate content type
        if (filename.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        } else if (filename.endsWith('.docx')) {
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else if (filename.endsWith('.doc')) {
          res.setHeader('Content-Type', 'application/msword');
        }
        
        // Set content disposition (for download or inline viewing)
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        // Send the file data
        return res.send(Buffer.from(response.data));
      } catch (cloudinaryError) {
        console.error('Error fetching from Cloudinary:', cloudinaryError.message);
        
        // Try with a direct public URL
        try {
          console.log('Trying direct public URL...');
          // Try a direct public URL without authentication
          const publicUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/${resourceType}/upload/resumes/${filename}`;
          return res.redirect(publicUrl);
        } catch (redirectError) {
          console.error('Redirect error:', redirectError.message);
          return res.status(404).json({ error: 'Resume not found on Cloudinary' });
        }
      }
    }
    
    // For backward compatibility - check if it's a local file
    const filePath = path.join(__dirname, '../uploads/resumes', filename);
    
    // Check if file exists locally
    if (!fs.existsSync(filePath)) {
      // If not found locally, try to construct a Cloudinary URL
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/raw/upload/resumes/${filename}`;
      
      try {
        // Check if the file exists on Cloudinary
        const response = await axios.head(cloudinaryUrl);
        if (response.status === 200) {
          // File exists on Cloudinary, redirect to it
          return res.redirect(cloudinaryUrl);
        }
      } catch (cloudinaryError) {
        // File doesn't exist on Cloudinary either
        return res.status(404).json({ error: 'Resume not found' });
      }
    }
    
    // If we get here, the file exists locally
    // Get file extension
    const ext = path.extname(filename).toLowerCase();
    
    // Set appropriate content type
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    
    // Set content disposition (for download)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//route for fetching analysis report
router.get('/report/:applicationId',authenticateUser,getResumeReportByApplicationId);



module.exports = router;