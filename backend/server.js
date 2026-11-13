const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const speechRoutes = require("./routes/speechRoutes");
const mriRoutes = require("./routes/mriRoutes");
const reportRoutes = require("./routes/reportRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const doctorPortalRoutes = require("./routes/doctorPortalRoutes");
const mlRoutes           = require("./routes/mlRoutes");

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Static Files for Uploads ─────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
const mriUploadsDir = path.join(uploadsDir, "mri");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(mriUploadsDir)) fs.mkdirSync(mriUploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ─── HTTP Request Logger ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", globalLimiter);

// ─── Auth-Specific Rate Limiter (stricter) ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message:
      "Too many login/signup attempts. Please try again after 15 minutes.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ CogniFusion API is running.",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/tests",         testRoutes);
app.use("/api/speech",        speechRoutes);
app.use("/api/mri",           mriRoutes);
app.use("/api/reports",       reportRoutes);
app.use("/api/doctors",       doctorRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/doctor-portal", doctorPortalRoutes);
app.use("/api/ml",            mlRoutes);


// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Global Error]", err);

  // CORS error
  if (err.message && err.message.startsWith("CORS policy")) {
    return res.status(403).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong. Please try again.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║    CogniFusion Backend API v1.0        ║
  ╠════════════════════════════════════════╣
  ║  🚀 Running on  : http://localhost:${PORT}  ║
  ║  🌍 Environment : ${process.env.NODE_ENV?.padEnd(16)}  ║
  ╠════════════════════════════════════════╣
  ║  📡 Endpoints:                         ║
  ║    POST  /api/auth/signup              ║
  ║    POST  /api/auth/login               ║
  ║    GET   /api/dashboard                ║
  ║    POST  /api/tests/mmse               ║
  ║    POST  /api/tests/moca               ║
  ║    POST  /api/speech/upload            ║
  ║    POST  /api/mri/upload               ║
  ║    GET   /api/reports/summary          ║
  ║    GET   /api/doctors                  ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
