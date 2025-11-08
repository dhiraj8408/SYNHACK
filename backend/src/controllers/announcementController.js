import Announcement from "../models/Announcement.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { courseId, title, message } = req.body;

    if (!courseId || !title || !message) {
      return res.status(400).json({ 
        message: "courseId, title, and message are required" 
      });
    }

    const announcement = await Announcement.create({
      courseId,
      title,
      message,
      createdBy: req.user.id,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("createdBy", "name email")
      .populate("courseId", "courseName courseCode");

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ 
        message: "courseId parameter is required" 
      });
    }

    const announcements = await Announcement.find({ courseId })
      .populate("createdBy", "name email")
      .populate("courseId", "courseName courseCode")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Check if user is the creator or admin
    if (
      announcement.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this announcement" });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

