import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional - null means global announcement
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isGlobal: {
      type: Boolean,
      default: false, // True for announcements visible to all students
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);

