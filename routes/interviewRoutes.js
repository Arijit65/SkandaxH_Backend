const express = require('express');
const router = express.Router();
const interviewApiController = require('../controllers/Ai_Controllers/interviewAPiController');

router.post('/create-interview', interviewApiController.createInterview);
router.post(
  '/save-interview', 
  interviewApiController.saveInterview
);

router.get('/get-interviews/:email', interviewApiController.getInterviewsByEmail);


module.exports = router;