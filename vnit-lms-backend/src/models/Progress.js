import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    completedModules: [{ type: String }],
  },
  { timestamps: true }
);

// Prevent duplicate progress entries
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
