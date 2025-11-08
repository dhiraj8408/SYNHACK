import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: { type: String, required: true },

    description: { type: String, default: "" },

    instructions: { type: String, default: "" },

    type: { type: String, enum: ["quiz", "assignment"], required: true },

    fileUrl: String,

    fileName: String, // Original filename

    dueDate: { type: Date, required: true },

    maxScore: { type: Number, default: 100 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
