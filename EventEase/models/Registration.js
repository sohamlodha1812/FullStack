const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Registration Schema
// Stores one record for each student-event pair
// ─────────────────────────────────────────────
const registrationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // Email is stored in lowercase to prevent "Alice@test.com" and
    // "alice@test.com" being treated as different users
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true, // Mongoose auto-normalises before saving
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department name is too long"],
    },

    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      enum: {
        values: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
        message: "Academic year must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year",
      },
    },

    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      trim: true,
    },

    eventTitle: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// Compound Unique Index
// Prevents the same email registering for the same event twice.
// The unique constraint is enforced by MongoDB, not just JavaScript,
// so it works even if two requests arrive at the same millisecond.
// ─────────────────────────────────────────────
registrationSchema.index({ email: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
