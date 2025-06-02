const axios = require('axios');
const FormData = require('form-data');

// Configuration
const MCQ_API_URL = process.env.MCQ_API_URL || 'http://localhost:8000';
const RESUME_API_URL = process.env.RESUME_API_URL || 'http://localhost:5000';

/**
 * Generate assessment questions using the MCQ Interview API
 * @param {Object} assessmentData - The assessment data
 * @returns {Promise<Array>} - Array of questions
 */
async function generateAssessment(assessmentData) {
    try {
        const response = await axios.post(`${MCQ_API_URL}/generate-assessment`, {
            full_name: assessmentData.fullName,
            position_applied: assessmentData.position,
            company_applied: assessmentData.company,
            reference_code: assessmentData.referenceCode,
            job_description: assessmentData.jobDescription,
            num_job_questions: assessmentData.numJobQuestions || 30,
            num_soft_questions: assessmentData.numSoftQuestions || 10,
            num_aptitude_questions: assessmentData.numAptitudeQuestions || 10
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to generate assessment: ${error.message}`);
    }
}

/**
 * Analyze resume using the Resume API
 * @param {Buffer} resumeFile - The resume file buffer
 * @param {string} jobDescription - The job description
 * @param {string} jobRole - The job role
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeResume(resumeFile, jobDescription, jobRole) {
    try {
        const formData = new FormData();
        formData.append('resume', resumeFile, {
            filename: 'resume.pdf',
            contentType: 'application/pdf'
        });
        formData.append('job_description', jobDescription);
        formData.append('job_role', jobRole);

        const response = await axios.post(`${RESUME_API_URL}/analyze-resume`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to analyze resume: ${error.message}`);
    }
}

module.exports = {
    generateAssessment,
    analyzeResume
}; 