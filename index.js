const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/database");
const connectCloudinary = require ('./config/cloudinary');
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes"); // Import job routes
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const mcqAssesmentRoute = require("./routes/mcqAssesmentRoute");
const interviewRoutes = require('./routes/interviewRoutes');
const formRoutes = require('./routes/formRoutes'); // Import form routes
//const upload = require("./middleware/uploadMiddleware")

const app = express();

// Middleware
app.use(express.json());


// app.use((req, res, next) => {
//   if (req.path.startsWith('/special-secure-area')) {
//     res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//     res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
//   }
//   next();
// });


app.use(cors());
connectCloudinary();

//testing
app.get("/", (req, res)=> {
  res.send("backend is running!");
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Authentication Routes
app.use("/api/auth", authRoutes);


//User Routes
app.use("/api/users", userRoutes);
app.use("/api/resume",resumeRoutes);
app.use("/api/mcq",mcqAssesmentRoute)

// Job Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", jobApplicationRoutes);
app.use("/api/admin", adminRoutes);

app.use('/api/interview', interviewRoutes);

// AI Routes
app.use("/api/ai", aiRoutes);

// Form Routes
app.use("/api/forms", formRoutes);

const PORT = process.env.PORT || 5000;

sequelize
  .sync()
  .then(() => {
    console.log("Database connected...");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.error("Database connection error:", error));
