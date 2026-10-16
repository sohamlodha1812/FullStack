// ============================================================
// EventEase — Main Server
// ============================================================
// Load environment variables FIRST (before anything else uses them)
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const Registration = require("./models/Registration");
const adminAuth = require("./middleware/adminAuth");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 1. SAMPLE EVENTS DATA
// In a real app these would come from a database.
// For this student project they are hardcoded here for simplicity.
// ============================================================
const events = [
  {
    id: "evt001",
    title: "TechFest 2026",
    category: "Technology",
    date: "2026-11-15",
    time: "10:00 AM",
    venue: "Main Auditorium",
    description:
      "The biggest annual technology festival showcasing innovations, hackathons, robotics, and cutting-edge tech demos from students across the country.",
    registrationOpen: true,
  },
  {
    id: "evt002",
    title: "AI & Machine Learning Workshop",
    category: "Workshop",
    date: "2026-11-22",
    time: "09:00 AM",
    venue: "Computer Lab 3",
    description:
      "A hands-on workshop covering the fundamentals of Artificial Intelligence and Machine Learning with Python. No prior AI experience needed.",
    registrationOpen: true,
  },
  {
    id: "evt003",
    title: "Coding Competition",
    category: "Competition",
    date: "2026-12-05",
    time: "11:00 AM",
    venue: "IT Block, Room 201",
    description:
      "Test your problem-solving skills in this inter-college competitive programming contest. Prizes worth ₹50,000 to be won. Individual and team entries welcome.",
    registrationOpen: true,
  },
  {
    id: "evt004",
    title: "Entrepreneurship Seminar",
    category: "Seminar",
    date: "2026-12-10",
    time: "02:00 PM",
    venue: "Seminar Hall B",
    description:
      "Industry leaders and successful alumni share their startup journeys. Learn about ideation, fundraising, and scaling a business from scratch.",
    registrationOpen: true,
  },
  {
    id: "evt005",
    title: "Cultural Night",
    category: "Cultural",
    date: "2026-12-20",
    time: "06:00 PM",
    venue: "Open Air Amphitheatre",
    description:
      "An unforgettable evening of music, dance, drama, and art performances celebrating the rich cultural diversity of our campus community.",
    registrationOpen: true,
  },
  {
    id: "evt006",
    title: "Web Development Workshop",
    category: "Workshop",
    date: "2027-01-08",
    time: "10:00 AM",
    venue: "Computer Lab 1",
    description:
      "Build real-world websites from scratch using HTML, CSS, JavaScript, and Node.js. Perfect for beginners who want to start their web development journey.",
    registrationOpen: true,
  },
];

// ============================================================
// 2. MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all files inside /public directly (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// 3. SESSION CONFIGURATION
// Sessions are used to remember that an admin is logged in.
// If a valid MONGO_URI is present we use connect-mongo so sessions
// survive a server restart. Otherwise we fall back to the default
// in-memory store (which resets on every restart — fine for dev).
// ============================================================
function buildSessionConfig() {
  const uri = process.env.MONGO_URI || "";
  const isValidUri = uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");

  const config = {
    secret: process.env.SESSION_SECRET || "fallback-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,       // JavaScript cannot read this cookie (XSS protection)
      secure: false,        // Set to true in production when using HTTPS
      maxAge: 1000 * 60 * 60 * 2, // 2 hours in milliseconds
      sameSite: "lax",
    },
    name: "eventease.sid", // Custom name instead of default "connect.sid"
  };

  if (isValidUri) {
    // Use MongoDB-backed session store — sessions survive restarts
    config.store = MongoStore.create({
      mongoUrl: uri,
      ttl: 60 * 60 * 2,        // Sessions expire after 2 hours
      autoRemove: "native",
      touchAfter: 24 * 3600,   // Only update session once per 24h unless data changes
    });
    console.log("📦 Using MongoDB session store (connect-mongo)");
  } else {
    // Fall back to in-memory store — sessions reset on server restart
    console.warn("⚠️  Using in-memory session store (sessions will reset on restart).");
    console.warn("   Set a valid MONGO_URI in .env to use persistent sessions.");
  }

  return config;
}

const sessionMiddleware = session(buildSessionConfig());
app.use(sessionMiddleware);

// ============================================================
// 4. DATABASE CONNECTION
// ============================================================
let dbConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn(
      "\n⚠️  MONGO_URI is not set in .env. The server will start but database features will be unavailable.\n"
    );
    return;
  }

  try {
    await mongoose.connect(uri);
    dbConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn("   The server will run without a database. Registration will not work.");
  }
}

// ============================================================
// 5. HELPER — check if DB is ready before using it
// ============================================================
function requireDB(req, res, next) {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message:
        "Database is currently unavailable. Please try again later or contact the administrator.",
    });
  }
  next();
}

// ============================================================
// 6. API ROUTES
// ============================================================

// ── GET /api/events ─────────────────────────────────────────
// Returns the list of all sample events.
// Anyone can call this — no authentication needed.
app.get("/api/events", (req, res) => {
  res.json({ success: true, data: events });
});

// ── POST /api/registrations ──────────────────────────────────
// Submit a new student registration.
// Validates all fields on the server before saving.
app.post("/api/registrations", requireDB, async (req, res) => {
  try {
    const { studentName, email, department, academicYear, eventId } = req.body;

    // ── Server-side validation ──────────────────────────────
    // Never trust the client — always validate on the server too.
    const errors = [];

    if (!studentName || studentName.trim().length < 2) {
      errors.push("Student name must be at least 2 characters.");
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push("Please provide a valid email address.");
    }

    if (!department || department.trim().length === 0) {
      errors.push("Department is required.");
    }

    const validYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    if (!academicYear || !validYears.includes(academicYear)) {
      errors.push("Academic year must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year.");
    }

    if (!eventId || eventId.trim().length === 0) {
      errors.push("Event ID is required.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(" ") });
    }

    // Check that the eventId actually exists in our events list
    const event = events.find((e) => e.id === eventId.trim());
    if (!event) {
      return res.status(400).json({ success: false, message: "Selected event does not exist." });
    }

    // ── Save to database ────────────────────────────────────
    const registration = new Registration({
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(), // Normalise before saving
      department: department.trim(),
      academicYear,
      eventId: eventId.trim(),
      eventTitle: event.title,
    });

    await registration.save();

    return res.status(201).json({
      success: true,
      message: `You have successfully registered for "${event.title}"! See you there 🎉`,
      data: {
        studentName: registration.studentName,
        email: registration.email,
        eventTitle: registration.eventTitle,
      },
    });
  } catch (err) {
    // MongoDB duplicate key error code is 11000
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already registered for this event with this email address.",
      });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(" ") });
    }

    // Unknown server error — log it but don't expose details to client
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong on the server. Please try again.",
    });
  }
});

// ── GET /api/registrations ───────────────────────────────────
// Admin-only: returns all registrations.
app.get("/api/registrations", adminAuth, requireDB, async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .sort({ createdAt: -1 }) // Newest first
      .select("-__v");         // Hide Mongoose internal field

    return res.json({ success: true, data: registrations });
  } catch (err) {
    console.error("Fetch registrations error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch registrations." });
  }
});

// ── POST /api/admin/login ────────────────────────────────────
// Authenticates admin with password from .env
//
// ⚠️  EDUCATIONAL NOTE: This is a simple password check suitable for
// a student project. For a real production app, you would use proper
// user accounts with hashed passwords (bcrypt), JWTs, or OAuth.
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required." });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({
      success: false,
      message: "Admin password is not configured on the server.",
    });
  }

  // Simple string comparison (fine for a student project)
  if (password !== adminPassword) {
    return res.status(401).json({ success: false, message: "Incorrect password. Try again." });
  }

  // Mark this session as authenticated
  req.session.isAdmin = true;
  return res.json({ success: true, message: "Logged in successfully." });
});

// ── POST /api/admin/logout ───────────────────────────────────
// Destroys the session so the admin is logged out.
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed." });
    }
    res.clearCookie("eventease.sid");
    return res.json({ success: true, message: "Logged out successfully." });
  });
});

// ── GET /api/admin/stats ─────────────────────────────────────
// Admin-only: returns total count + breakdown by event.
app.get("/api/admin/stats", adminAuth, requireDB, async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();

    // Group registrations by event using MongoDB aggregation
    const byEvent = await Registration.aggregate([
      {
        $group: {
          _id: "$eventId",
          eventTitle: { $first: "$eventTitle" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }, // Most popular first
    ]);

    return res.json({
      success: true,
      data: {
        totalRegistrations,
        byEvent,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch statistics." });
  }
});

// ── GET /api/health ──────────────────────────────────────────
// Simple health check — useful for debugging
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "running",
    dbConnected,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 7. CATCH-ALL — Serve index.html for unknown routes
// (Allows direct navigation to any frontend page)
// ============================================================
app.use((req, res) => {
  // Only redirect non-API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found." });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================
// 8. GLOBAL ERROR HANDLER
// Catches any unhandled errors thrown inside route handlers
// ============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred.",
  });
});

// ============================================================
// 9. START SERVER
// ============================================================
async function startServer() {
  await connectDB(); // Try to connect to DB first

  app.listen(PORT, () => {
    console.log(`\n🎉 EventEase server is running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Admin:   http://localhost:${PORT}/admin.html`);
    console.log(`   DB:      ${dbConnected ? "✅ Connected" : "❌ Not connected"}\n`);
  });
}

startServer();
