import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Reply", replySchema);
