import mongoose from "mongoose";

const moduleQuestionAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModuleQuestion",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answer: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure one answer per student per question
moduleQuestionAnswerSchema.index({ questionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("ModuleQuestionAnswer", moduleQuestionAnswerSchema);

