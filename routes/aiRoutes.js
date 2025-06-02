const express = require('express');
const router = express.Router();
const { generateAssessment, analyzeResume } = require('../services/aiServices');
const multer = require('multer');
const upload = multer();

// Route to generate assessment questions
router.post('/assessment', async (req, res) => {
    try {
        const assessment = await generateAssessment(req.body);
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to analyze resume
router.post('/resume-analysis', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }

        const analysis = await analyzeResume(
            req.file.buffer,
            req.body.jobDescription,
            req.body.jobRole
        );
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 