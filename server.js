const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db"); // Import DB connection function
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const projectRoutes = require("./routes/projectRoutes");
const researchRoutes = require("./routes/researchRoutes"); // Corrected import: ensure it's in the routes folder
const clubRoutes = require("./routes/clubRoutes");
const errorHandler = require("./middleware/errorHandler");

// Import Swagger UI and documentation configuration
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger");

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/research", researchRoutes); // Use researchRoutes here
app.use("/api/projects", projectRoutes);
app.use("/api/clubs", clubRoutes); // Added club routes

// TODO: Add new enhanced routes when controllers are created
// app.use("/api/courses", courseRoutes);
// app.use("/api/enrollments", enrollmentRoutes);
// app.use("/api/resources", resourceRoutes);
// app.use("/api/competitions", competitionRoutes);
// app.use("/api/mentors", mentorRoutes);
// app.use("/api/achievements", achievementRoutes);

// Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Swagger JSON spec endpoint
app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocs);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Threat Combat API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Threat Combat API",
    description: "Cybersecurity Education and Research Platform",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      events: "/api/events",
      notifications: "/api/notifications",
      research: "/api/research",
      projects: "/api/projects"
    }
  });
});

// Error Handling Middleware (must be after all routes)
app.use(errorHandler);

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Threat Combat API Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
});
