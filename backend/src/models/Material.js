import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional since we identify by uploadedBy
    },

    moduleTitle: { type: String, required: true },

    type: {
      type: String,
      enum: ["pdf", "ppt", "link", "image", "video"],
      required: true,
    },

    fileUrl: { type: String, required: true },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Material", materialSchema);
