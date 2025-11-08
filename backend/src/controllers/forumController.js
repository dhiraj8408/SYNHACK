import Thread from "../models/Thread.js";
import Reply from "../models/Reply.js";
import User from "../models/User.js";
import { getIO } from "../config/socket.js";

export const createThread = async (req, res) => {
  try {
    const { courseId, title, message } = req.body;
    
    const t = await Thread.create({
      courseId,
      title,
      message,
      createdBy: req.user.id,
    });

    const populatedThread = await Thread.findById(t._id)
      .populate("createdBy", "name email")
      .populate({
        path: "replies",
        populate: { path: "userId", select: "name email" },
      });

    const io = getIO();
    if (io) {
      io.to(String(courseId)).emit("new-thread", populatedThread);
    }

    res.json(populatedThread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listThreads = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const threads = await Thread.find({ courseId })
      .populate("createdBy", "name email")
      .populate({
        path: "replies",
        populate: { path: "userId", select: "name email" },
        options: { sort: { createdAt: 1 } },
      })
      .sort({ createdAt: -1 });

    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getThreadById = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate({
        path: "replies",
        populate: { path: "userId", select: "name email" },
        options: { sort: { createdAt: 1 } },
      });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyThread = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const r = await Reply.create({
      threadId,
      message,
      userId: req.user.id,
    });

    const populatedReply = await Reply.findById(r._id)
      .populate("userId", "name email");

    const io = getIO();
    if (io) {
      io.to(String(thread.courseId)).emit("new-reply", {
        ...populatedReply.toObject(),
        threadId: thread._id,
      });
    }

    res.json(populatedReply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveThread = async (req, res) => {
  try {
    const updated = await Thread.findByIdAndUpdate(
      req.params.id,
      { isResolved: true },
      { new: true }
    )
      .populate("createdBy", "name email");

    if (!updated) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const io = getIO();
    if (io) {
      io.to(String(updated.courseId)).emit("thread-resolved", updated);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    await Reply.deleteMany({ threadId: thread._id });
    await Thread.findByIdAndDelete(req.params.id);

    const io = getIO();
    if (io) {
      io.to(String(thread.courseId)).emit("thread-deleted", { threadId: thread._id });
    }

    res.json({ message: "Thread deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
