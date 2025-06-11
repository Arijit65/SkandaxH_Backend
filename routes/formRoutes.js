const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public route for form submission
router.post("/", formController.createForm);

// Protected route for admin to view all form submissions
// router.get("/", protect, authorize("admin", "recruiter"), formController.getAllForms);

module.exports = router;