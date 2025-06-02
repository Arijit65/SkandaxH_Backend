const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const db = require("../models");
const { User, Jobseeker, Recruiter } = db;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true // Use HTTPS
});

// Log Cloudinary configuration for debugging
console.log('Cloudinary configured with cloud name:', process.env.CLOUDINARY_NAME);

/**
 * Register a new user
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "All fields (name, email, password) are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email." });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(), // Normalize email
      password: hashedPassword,
      role: role || "user", // Default to "user" if role is not provided
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * Login a user
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password,role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Both email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }
    if (user.role!== role) {
      return res.status(403).json({ error: "Invalid role registration" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

/**
 * Update user data (both basic and jobseeker-specific fields)
 */
exports.updateUser = async (req, res) => {
  try {
    let {name,email,password,skills,phone,location,designation,certificates,education,experienceYears,jobDetails,githubLink,resumePath,resumeUrl} = req.body;
    const userId = req.user.id; // Get the logged-in user's ID from the JWT token
    
    console.log('Update request received with data:', {
      name, email, skills, phone, location, designation, 
      certificates: certificates ? 'provided' : 'not provided',
      education: education ? 'provided' : 'not provided',
      jobDetails: jobDetails ? 'provided' : 'not provided',
      resumePath: resumePath ? 'provided' : 'not provided',
      resumeUrl: resumeUrl ? 'provided' : 'not provided',
      file: req.file ? `${req.file.originalname} (${req.file.mimetype})` : 'not provided'
    });
    
    // Validate input - removed strict validation to allow partial updates
    if (!name && !email && !password && !skills && !location && !designation && !certificates && !education && !experienceYears && !jobDetails && !githubLink && !req.file && !resumePath && !resumeUrl) {
      return res.status(400).json({ error: "No data provided to update." });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update the user's basic fields (name, email, password)
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim(); // Normalize email
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();
    
    // Parse JSON strings for arrays if they come as strings
    if (certificates && typeof certificates === 'string') {
      try {
        if (certificates.startsWith('[')) {
          certificates = JSON.parse(certificates);
        } else {
          certificates = certificates.split(',').map(item => item.trim()).filter(Boolean);
        }
      } catch (e) {
        console.error('Error parsing certificates:', e);
        certificates = certificates.split(',').map(item => item.trim()).filter(Boolean);
      }
    }

    if (education && typeof education === 'string') {
      try {
        education = JSON.parse(education);
      } catch (e) {
        console.error('Error parsing education:', e);
        education = [];
      }
    }

    if (jobDetails && typeof jobDetails === 'string') {
      try {
        jobDetails = JSON.parse(jobDetails);
      } catch (e) {
        console.error('Error parsing jobDetails:', e);
        jobDetails = [];
      }
    }
    
    // Ensure the certificates and education fields are arrays
    if (certificates && !Array.isArray(certificates)) {
      certificates = [certificates]; // Wrap it in an array if it's not already an array
    }

    if (education && !Array.isArray(education)) {
      education = [education]; // Wrap it in an array if it's not already an array
    }

    if (jobDetails && !Array.isArray(jobDetails)) {
      jobDetails = [jobDetails]; // Wrap it in an array if it's not already an array
    }

    // Ensure experienceYears is a valid number and not null
    if (experienceYears === null || experienceYears === undefined) {
      experienceYears = 0; // Default to 0 if experienceYears is not provided
    }

    let jobseeker = null;

    // If the user is a jobseeker, update the jobseeker fields
    if (user.role === "jobseeker") {
      jobseeker = await Jobseeker.findOne({ where: { userId } });
      
      // Create a new jobseeker record if it doesn't exist
      if (!jobseeker) {
        jobseeker = await Jobseeker.create({
          userId,
          skills: skills || '',
          phone: phone || '',
          location: location || '',
          designation: designation || '',
          certificates: certificates || [],
          education: education || [],
          experienceYears: experienceYears || 0,
          jobDetails: jobDetails || [],
          githubLink: githubLink || '',
        });
      } else {
        // Update jobseeker fields if provided
        if (skills) jobseeker.skills = skills;
        if (phone) jobseeker.phone = phone;
        if (location) jobseeker.location = location;
        if (designation) jobseeker.designation = designation;
        if (certificates) jobseeker.certificates = certificates;
        if (education) jobseeker.education = education;
        if (experienceYears) jobseeker.experienceYears = experienceYears;
        if (jobDetails) jobseeker.jobDetails = jobDetails;
        if (githubLink) jobseeker.githubLink = githubLink;

        // Handle resume upload if a file is provided
        let resumeUrl = null;
        
        // Check if we need to delete an existing resume from Cloudinary
        if (req.file && jobseeker.resume && jobseeker.resume.includes('cloudinary.com')) {
          try {
            // Extract the public_id from the Cloudinary URL
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/resumes/resume-1234567890.pdf
            const urlParts = jobseeker.resume.split('/');
            
            // Find the 'resumes' folder index
            const resumesFolderIndex = urlParts.findIndex(part => part === 'resumes');
            if (resumesFolderIndex !== -1 && resumesFolderIndex < urlParts.length - 1) {
              // Get the filename with extension
              const fileNameWithExtension = urlParts[resumesFolderIndex + 1];
              // Remove extension to get public_id
              const publicId = `resumes/${fileNameWithExtension.split('.')[0]}`;
              
              console.log('Deleting old resume from Cloudinary:', publicId);
              
              // Try to delete with both raw and image resource types
              try {
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                console.log('Deleted as raw resource');
              } catch (rawError) {
                console.log('Failed to delete as raw resource, trying as image');
                try {
                  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                  console.log('Deleted as image resource');
                } catch (imageError) {
                  console.error('Failed to delete as image resource too:', imageError);
                }
              }
            } else {
              console.log('Could not find resumes folder in URL:', jobseeker.resume);
            }
          } catch (deleteError) {
            console.error('Error deleting old resume from Cloudinary:', deleteError);
            // Continue even if delete fails
          }
        }
        
        // Handle new resume upload
        if (req.file) {
          try {
            console.log('Processing resume file upload:', req.file.originalname);
            
            // Convert buffer to base64 string for Cloudinary upload
            const fileBuffer = req.file.buffer;
            const fileType = req.file.mimetype;
            const base64String = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
            
            // Determine the appropriate resource_type based on file extension
            const fileExt = path.extname(req.file.originalname).toLowerCase();
            const isDocument = ['.pdf', '.docx', '.doc'].includes(fileExt);
            
            // Generate a unique public_id without special characters
            const timestamp = Date.now();
            const publicId = `resume_${timestamp}`;
            
            console.log('Uploading file to Cloudinary:', {
              resourceType: isDocument ? 'raw' : 'auto',
              publicId,
              format: fileExt.substring(1)
            });
            
            // Upload to Cloudinary
            const mediaUpload = await cloudinary.uploader.upload(base64String, {
              resource_type: 'raw', // Changed from 'raw' to 'auto' for better handling
              folder: 'resumes',
              public_id: publicId,
              format: fileExt.substring(1), // Remove the dot from extension
              access_mode: 'public', // Make sure the file is publicly accessible
              type: 'upload', // Ensure it's a standard upload
              overwrite: true, // Overwrite if a file with the same name exists
              use_filename: false, // Don't use the original filename
              unique_filename: true, // Ensure the filename is unique
              flags: 'attachment' // Make it downloadable
            });
            
            console.log('Cloudinary upload successful:', mediaUpload.secure_url);
            
            resumeUrl = mediaUpload.secure_url;
            
            // Update the jobseeker's resume field with the Cloudinary URL
            jobseeker.resume = resumeUrl;
          } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            // Continue without resume if upload fails
          }
        } else if (resumeUrl) {
          // If a resumeUrl is provided in the request body (from frontend)
          jobseeker.resume = resumeUrl;
          console.log('Using provided resumeUrl:', resumeUrl);
        } else if (resumePath) {
          // If a resumePath is provided in the request body (from frontend)
          // This is for backward compatibility with existing resumes
          jobseeker.resume = resumePath;
          console.log('Using provided resumePath:', resumePath);
        }
        
        // Save the updated jobseeker data
        await jobseeker.save();
      }
    }

    // Return the updated profile data
    res.json({
      message: "User data updated successfully",
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        location: jobseeker?.location || "",
        phone: jobseeker?.phone || "",
        designation: jobseeker?.designation || "",
        skills: typeof jobseeker?.skills === "string"
          ? jobseeker.skills.split(",").map(s => s.trim())
          : jobseeker?.skills || [],
        certifications: jobseeker?.certificates || [],
        experience: jobseeker?.jobDetails || [],
        education: jobseeker?.education || [],
        experienceYears: jobseeker?.experienceYears || 0,
        portfolio: {
          resume: jobseeker?.resume || null,
          video: jobseeker?.video || "",
          github: jobseeker?.githubLink || "",
        },
        accessibility: jobseeker?.accessibility || {
          highContrast: false,
          brailleSupport: false,
        },
      },
    });
    
  } catch (error) {
    console.error("Update User Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};


// exports.getUserProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // Get the user ID from the token

//     // Find the user
//     const user = await User.findByPk(userId, {
//       include: [{ model: Jobseeker }], // Include jobseeker data
//     });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Prepare the profile data
//     const profile = {
//       name: user.name,
//       email: user.email,
//       location: user.location,
//       phone: user.phone,
//       skills: user.jobseeker?.skills || [],
//       certifications: user.jobseeker?.certificates || [],
//       experience: user.jobseeker?.experienceYear || [],
//       education: user.jobseeker?.education || [],
//       portfolio: user.jobseeker?.portfolio || {},
//       accessibility: user.jobseeker?.accessibility || {},
//     };

//     res.json(profile);
//   } catch (error) {
//     console.error('Fetch Profile Error:', error);
//     res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// };

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Jobseeker }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jobseeker = user.Jobseeker;

    const profile = {
      name: user.name,
      email: user.email,
      location: jobseeker?.location || user.location || "",
      phone:jobseeker?.phone || user.phone || "",
      designation: jobseeker?.designation || "",
      skills: typeof jobseeker?.skills === "string"
        ? jobseeker.skills.split(",").map(skill => skill.trim())
        : [],
      certifications: jobseeker?.certificates || [],
      experience: jobseeker?.jobDetails || [], // ✅ returns full array of objects
      education: jobseeker?.education || [],
      portfolio: {
        resume: jobseeker?.resume || null,
        video: jobseeker?.video || "",
        github: jobseeker?.githubLink || "",
      },
      accessibility: jobseeker?.accessibility || {
        highContrast: false,
        brailleSupport: false,
      },
    };

    res.json(profile);
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};


exports.updateRecruiterProfile = async (req, res) => {
  const userId = req.user.id; // Get the user ID from the token
  const { company, location, phone,bussinessTag,description } = req.body;
  if(!company || !location || !phone || !bussinessTag || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    let recruiter = await Recruiter.findOne({ where: { userId } });
    // if (!recruiter) {
    //   return res.status(404).json({ error: "Recruiter not found" });
    // }
    if(recruiter){
      recruiter.company = company;
      recruiter.location = location;
      recruiter.phone = phone;
      recruiter.bussinessTag = bussinessTag;
      recruiter.description = description;
  
      await recruiter.save();
    }else{
      const recruiter = await Recruiter.create({
        userId,
        company,
        location,
        phone,
        bussinessTag,
        description
      });
      await recruiter.save();
    }

    res.json({ message: "Recruiter data updated successfully", recruiter });
  } catch (error) {
    console.error("Update Recruiter Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}


exports.getRecruiterProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const recruiter = await User.findOne({
      where: { id },
      include: [{ model: Recruiter }],
    });

    if (!recruiter) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    const profile = {
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.Recruiter?.company || recruiter.name || "Not provided",
      location: recruiter.Recruiter?.location || "Not provided",
      phone: recruiter.Recruiter?.phone || "Not provided",
      bussinessTag: recruiter.Recruiter?.bussinessTag || "Bussiness tag Not provided",
      description: recruiter.Recruiter?.description || "Not provided",
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Fetch Recruiter Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}





// Handle Google Sign-In
exports.googleLogin = async (req, res) => {
  const { credential,role } = req.body;
  //console.log("🔐 Credential received:", credential);


  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    // Check if the user already exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // If the user does not exist, create a new one
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password: "google-ok", // Google login doesn't require a password
        role: role, // Default role, you can adjust this
      });
    }

    if(user.role!== role) {
      return res.status(403).json({ error: "Invalid role registration" });
    }
   
    // Generate JWT token for the user
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
    
    // Send the response with the user info and token
    res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google login error", error);
    res.status(400).json({ error: "Invalid Google token" });
  }
};
