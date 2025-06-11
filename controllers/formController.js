const db = require("../models");
const { FormData } = db;
const nodemailer = require("nodemailer");

/**
 * Create a new form submission
 * @route POST /api/forms
 * @access Public
 */
exports.createForm = async (req, res) => {
  try {
    const { name, email, mobileNo, message } = req.body;

    // Validate required fields
    if (!name || !email || !mobileNo || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, mobileNo, and message",
      });
    }

    // Create new form submission
    const formSubmission = await FormData.create({
      name,
      email,
      mobileNo,
      message,
    });

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "exampleadmin@mail.com";
      
      // Create email transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Format the date
      const submissionDate = new Date().toLocaleString();

      // Prepare email content
      const mailOptions = {
        from: `"Skandax Hire" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: "New Request on Skandax Hire",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4a6cf7; text-align: center;">New Request Submitted</h2>
            <p style="margin-bottom: 20px;">A new form has been submitted on the Skandax Hire website. Here are the details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Name:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">
                  <a href="mailto:${email}" style="color: #4a6cf7; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Mobile Number:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${mobileNo}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Message:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${message}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Submitted On:</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${submissionDate}</td>
              </tr>
            </table>
            
            <p style="text-align: center; color: #666;">This is an automated email from the Skandax Hire system.</p>
          </div>
        `,
      };

      // Send the email
      await transporter.sendMail(mailOptions);
      console.log("Form submission notification email sent to admin");
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending email notification:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: formSubmission,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    
    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map(e => ({ field: e.path, message: e.message })),
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting the form",
    });
  }
};

/**
 * Get all form submissions
 * @route GET /api/forms
 * @access Private (Admin only)
 */
exports.getAllForms = async (req, res) => {
  try {
    const forms = await FormData.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching form submissions",
    });
  }
};