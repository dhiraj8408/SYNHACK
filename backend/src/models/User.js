import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true },

    department: String,

    role: {
      type: String,
      enum: ["admin", "professor", "student"],
      required: true,
    },

    passwordHash: { type: String, required: true },

    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
