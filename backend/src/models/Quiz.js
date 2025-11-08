import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["mcq_single", "mcq_multiple", "numerical"],
    required: true,
  },
  options: [String], // For MCQ questions
  correctAnswer: mongoose.Schema.Types.Mixed, // Can be string (for MCQ) or number (for numerical)
  correctAnswers: [String], // For multiple correct MCQ
  points: { type: Number, default: 1 },
  explanation: { type: String, default: "" }, // Optional explanation shown after submission
});

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: { type: String, required: true },

    description: { type: String, default: "" },

    instructions: { type: String, default: "" },

    questions: [questionSchema],

    totalPoints: { type: Number, default: 0 }, // Calculated from sum of question points

    timeLimit: { type: Number, default: null }, // Time limit in minutes (null = no limit)

    isPublished: { type: Boolean, default: false },

    showResults: { type: Boolean, default: true }, // Whether to show results immediately after submission

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Calculate total points before saving
quizSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  } else {
    this.totalPoints = 0;
  }
  next();
});

export default mongoose.model("Quiz", quizSchema);

