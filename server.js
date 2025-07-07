const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db"); // Import DB connection function
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const projectRoutes = require("./routes/projectRoutes");
const researchRoutes = require("./routes/researchRoutes"); // Corrected import: ensure it's in the routes folder
const clubRoutes = require("./routes/clubRoutes");
const testRoutes = require("./routes/testRoutes");

// Security middleware imports
const {
  securityHeaders,
  mongoSanitization,
  corsOptions,
  requestLogger,
  errorHandler,
  notFound,
  authLimiter,
  apiLimiter,
  speedLimiter,
  passwordResetLimiter,
  registrationLimiter
} = require("./middleware/securityMiddleware");

// Import Swagger UI and documentation configuration
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger");

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Security Middleware (order matters!)
app.use(securityHeaders);
app.use(mongoSanitization);
app.use(cors(corsOptions));
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use("/api/auth", authLimiter);
app.use("/api/auth/forgot-password", passwordResetLimiter);
app.use("/api/auth/register", registrationLimiter);
app.use("/api", speedLimiter);
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/research", researchRoutes); // Use researchRoutes here
app.use("/api/projects", projectRoutes);
app.use("/api/clubs", clubRoutes); // Added club routes
app.use("/api/test", testRoutes); // Test routes for email configuration

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

// 404 handler (must be before error handler)
app.use(notFound);

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
