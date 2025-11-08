import mongoose from "mongoose";

const moduleQuestionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: { type: String, required: true }, // e.g., "Module 1", "Module 2"
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["short_answer", "long_answer", "multiple_choice", "true_false"],
      required: true,
    },
    options: [{ type: String }], // For multiple choice questions
    correctAnswer: { type: String }, // For multiple choice, true/false, or short answer
    correctAnswers: [{ type: String }], // For multiple correct answers
    points: { type: Number, default: 1 },
    explanation: { type: String, default: "" }, // Explanation shown after answering
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ModuleQuestion", moduleQuestionSchema);

