import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true }, // Index of question in quiz.questions array
  answer: mongoose.Schema.Types.Mixed, // Can be string, array of strings, or number
  isCorrect: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answers: [answerSchema],

    totalScore: { type: Number, default: 0 },

    percentage: { type: Number, default: 0 }, // Percentage score

    timeSpent: { type: Number, default: 0 }, // Time spent in seconds

    submittedAt: { type: Date, default: null },

    isGraded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure one attempt per student per quiz
quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("QuizAttempt", quizAttemptSchema);

