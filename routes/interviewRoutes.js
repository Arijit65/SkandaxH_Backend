const express = require('express');
const router = express.Router();
const interviewApiController = require('../controllers/Ai_Controllers/interviewAPiController');

router.post('/create-interview', interviewApiController.createInterview);
router.post(
  '/save-interview', 
  interviewApiController.saveInterview
);

router.get('/get-interviews/:email', interviewApiController.getInterviewsByEmail);
router.get('/get-latest-interview/:email', interviewApiController.getLatestInterviewByEmail);
router.get('/get-interviews-by-job/:jobRole', interviewApiController.getInterviewsByJobRole);
router.get('/get-interview-by-email-job/:email/:jobRole', interviewApiController.getInterviewByEmailAndJobRole);

module.exports = router;