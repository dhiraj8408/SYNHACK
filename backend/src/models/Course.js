import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    semester: String,
    department: String,

    professorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },

    enableCodingPlatform: {
      type: Boolean,
      default: false,
    },

    duration: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
