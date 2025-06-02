const axios = require('axios');
const nodemailer = require('nodemailer');
const { Interview } = require('../../models');

// Flask API URL (update as needed)
const INTERVIEW_API_URL = process.env.INTERVIEW_API_URL || 'http://127.0.0.1:5001';

// Email transporter config
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Start interview and send email
exports.createInterview = async (req, res) => {
  try {
    const { full_name, email, job_role } = req.body;

    if (!full_name || !email || !job_role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Call Flask API to start interview
    const response = await axios.post(`${INTERVIEW_API_URL}/start_interview`, { job_role });

    if (!response.data || !response.data.questions) {
      throw new Error('Failed to generate interview');
    }
      // Extract the new session ID
    const sessionId = response.data.session_id;
    const questions = response.data.questions;

     // Persist the interview in our DB
     await Interview.create({
      sessionId,
      fullName: full_name,email,
      jobRole: job_role,
      questions
     })

    // You can generate a unique interview link or token here if needed
    // For example, you might want to store the interview session in your DB and generate a link

    // Example interview link (customize as needed)
       const base = process.env.INTERVIEW_API_URL || 'http://127.0.0.1:5001';
      // const interviewLink = `${base}/interview?interview_id=${sessionId}&email=${encodeURIComponent(email)}`;
       const interviewLink = `${base}/?interview_id=${sessionId}&email=${encodeURIComponent(email)}`;

    // Send email to candidate
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Interview Invitation for ${job_role}`,
      html: `
        <div>
          <h2>Interview Invitation</h2>
          <p>Hello ${full_name},</p>
          <p>You have been invited to take an AI-powered interview for the <b>${job_role}</b> position.</p>
          <p>Please click the link below to start your interview:</p>
          <a href="${interviewLink}" style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Start Interview</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${interviewLink}</p>
          <p>Good luck!</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'Interview created and email sent successfully',
      data: {
        questions: response.data.questions,
        interview_link: interviewLink,
        questions,
        session_id: sessionId,
        interview_link: interviewLink
      }
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create interview',
      error: error.message
    });
  }
  

};


 exports.saveInterview = async (req, res) => {
  const { session_id, responses, report_url, analysis, rawLog } = req.body;

  try {
    await Interview.update(
      {
        responses,
        reportUrl:  report_url,
        status:     'completed',
        scoring: analysis,   // your per-question JSON scores
        interpretation: rawLog      // full console log string
      },
      { where: { sessionId: session_id } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getInterviewsByEmail = async (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const interviews = await Interview.findAll({ where: { email } });
    return res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

