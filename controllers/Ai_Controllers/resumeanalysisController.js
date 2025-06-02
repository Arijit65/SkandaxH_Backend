db = require('../../models');
const { ResumeReport } = db;
exports.saveResumeReport = async (req, res) => {
  try {
    const { userId, jobId,applicationId, report, scores } = req.body;


    // Validate required fields
    if (!userId || !jobId || !report || !scores) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Create new resume report entry
    const newReport = await ResumeReport.create({
      user_id: userId,
      job_id: jobId,
      application_id: applicationId,
      education_match: report.education_match,
      experience_match: report.experience_match,
      percentage_score: report.percentage_score,
      role_match: report.role_match,
      skill_match: report.skill_match,
      total_score: report.total_score,
      years_of_experience: report.years_of_experience,
      full_resume_text: report.full_resume_text,
      resume_summary: report.resume_summary,
      job_role: report.job_role,
      matching_skills: report.matching_skills || [],
      missing_skills: report.missing_skills || [],
      section_scores: report.section_scores,
      scores: scores,
      raw_json: { report, scores }, // Optional: save full response
    });

    return res.status(201).json({
      success: true,
      message: 'Resume report saved successfully',
      data: newReport,
    });
  } catch (error) {
    console.error('Error saving resume report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


exports.getResumeReportByApplicationId = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const report = await ResumeReport.findOne({
      where: { application_id: applicationId }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Resume report not found' });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching resume report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};