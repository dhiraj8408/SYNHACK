import mongoose from "mongoose";

const threadSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true },

    message: { type: String, required: true },

    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual populate for replies
threadSchema.virtual("replies", {
  ref: "Reply",
  localField: "_id",
  foreignField: "threadId",
});

threadSchema.set("toJSON", { virtuals: true });
threadSchema.set("toObject", { virtuals: true });

export default mongoose.model("Thread", threadSchema);
