const express = require("express");
const { JobApplication, User, Job } = require("../models/JobApplication");
const { authenticateUser, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all job applications (Admin only)
router.get("/applications", authenticateUser, isAdmin, async (req, res) => {
  try {
    const applications = await JobApplication.findAll({
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Job, attributes: ["id", "title", "company"] },
      ],
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching applications", details: error.message });
  }
});

// Approve or reject job application (Admin only)
router.put("/applications/:id", authenticateUser, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["reviewed", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application = await JobApplication.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    application.status = status;
    await application.save();
    res.json({ message: "Application status updated", application });
  } catch (error) {
    res.status(500).json({ error: "Error updating application", details: error.message });
  }
});

module.exports = router;
