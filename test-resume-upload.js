const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Test file upload to the backend
async function testUpload() {
  try {
    // Create a sample PDF-like content
    const samplePdfContent = '%PDF-1.5\nThis is a test PDF file for upload testing.\n%%EOF';
    const tempFilePath = path.join(__dirname, 'temp-test-resume.pdf');
    
    // Write the sample content to a temporary file
    fs.writeFileSync(tempFilePath, samplePdfContent);
    console.log('Created temporary test file:', tempFilePath);
    
    // Create form data for the upload
    const formData = new FormData();
    formData.append('testFile', fs.createReadStream(tempFilePath));
    
    // Send the file to the test upload endpoint
    console.log('Sending file to test upload endpoint...');
    const response = await axios.post(
      'http://localhost:5000/api/users/test-upload',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('Upload response:', response.data);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    console.log('Temporary file deleted');
    
    return response.data;
  } catch (error) {
    console.error('Test upload failed:', error.response ? error.response.data : error.message);
    // Clean up the temporary file if it exists
    try {
      const tempFilePath = path.join(__dirname, 'temp-test-resume.pdf');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file deleted');
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

// Run the test
testUpload()
  .then(result => {
    if (result && result.url) {
      console.log('\nSUCCESS: File uploaded successfully to Cloudinary');
      console.log('URL:', result.url);
      console.log('\nTry opening this URL in your browser to verify it works');
    } else {
      console.log('\nFAILED: Could not upload file to Cloudinary');
    }
  })
  .catch(err => {
    console.error('\nERROR:', err);
  }); 