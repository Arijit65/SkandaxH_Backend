const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true
});

console.log('Cloudinary Configuration:');
console.log('Cloud Name:', process.env.CLOUDINARY_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('API Secret:', process.env.CLOUDINARY_SECRET_KEY ? '✓ Set' : '✗ Missing');

// Test Cloudinary connection
async function testCloudinary() {
  try {
    // Test the Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log('Cloudinary Connection Test:', result ? 'Success' : 'Failed');
    
    // Test creating a simple text file and uploading it
    const testUpload = await cloudinary.uploader.upload(
      'data:text/plain;base64,' + Buffer.from('Test file content').toString('base64'),
      {
        resource_type: 'raw',
        folder: 'test',
        public_id: 'test-file',
        access_mode: 'public',
        type: 'upload'
      }
    );
    
    console.log('Test Upload Success!');
    console.log('URL:', testUpload.secure_url);
    
    // Test uploading a PDF-like content
    const pdfUpload = await cloudinary.uploader.upload(
      'data:application/pdf;base64,' + Buffer.from('%PDF-1.5 Test PDF content').toString('base64'),
      {
        resource_type: 'raw',
        folder: 'test',
        public_id: 'test-pdf',
        format: 'pdf',
        access_mode: 'public',
        type: 'upload'
      }
    );
    
    console.log('Test PDF Upload Success!');
    console.log('PDF URL:', pdfUpload.secure_url);
    
    // Verify the URLs are accessible
    console.log('To verify text file access, open:', testUpload.secure_url);
    console.log('To verify PDF file access, open:', pdfUpload.secure_url);
    
  } catch (error) {
    console.error('Cloudinary Test Error:', error);
  }
}

testCloudinary(); 