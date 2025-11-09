import Announcement from "../models/Announcement.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { courseId, title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        message: "title and message are required" 
      });
    }

    // If no courseId provided, it's a global announcement
    const isGlobal = !courseId;

    const announcement = await Announcement.create({
      courseId: courseId || null,
      title,
      message,
      createdBy: req.user.id,
      isGlobal: isGlobal,
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
    const { courseId, global } = req.query;

    let query = {};
    
    if (global === 'true') {
      // Get only global announcements (no courseId)
      query = { isGlobal: true, courseId: null };
    } else if (courseId) {
      // Get course-specific announcements
      query = { courseId };
    } else {
      // Get all announcements (both global and course-specific)
      // This is useful for admin views
      query = {};
    }

    const announcements = await Announcement.find(query)
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

