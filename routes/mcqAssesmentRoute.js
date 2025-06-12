const express = require('express');
const mcqAssessmentController = require('../controllers/Ai_Controllers/mcq-assignController');

const router = express.Router();

// MCQ Assessment routes
router.post('/mcq-assessment', mcqAssessmentController.createMCQAssessment);
router.get('/mcq-assessment/:session_id', mcqAssessmentController.getAssessmentStatus);

// New routes to proxy requests to Python API
router.get('/question/:session_id', mcqAssessmentController.getQuestion);
router.post('/submit-answer/:session_id', mcqAssessmentController.submitAnswer);
router.get('/results/:session_id', mcqAssessmentController.getResults);
router.get('/report/:email', mcqAssessmentController.getAssessmentsByEmail);
router.get('/latest-report/:email', mcqAssessmentController.getLatestAssessmentByEmail);
router.get('/report-by-position/:position', mcqAssessmentController.getAssessmentsByPosition);
router.get('/report-by-email-position/:email/:position', mcqAssessmentController.getAssessmentByEmailAndPosition);

module.exports = router;