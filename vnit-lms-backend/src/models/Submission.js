import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submissionUrl: { type: String, required: true },

    score: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
