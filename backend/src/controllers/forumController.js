import Thread from "../models/Thread.js";
import Reply from "../models/Reply.js";
import { getIO } from "../config/socket.js";

export const createThread = async (req, res) => {
  const t = await Thread.create({
    ...req.body,
    createdBy: req.user.id,
  });

  getIO().to(String(t.courseId)).emit("new-thread", t);
  res.json(t);
};

export const listThreads = async (req, res) => {
  const threads = await Thread.find({ courseId: req.query.courseId });
  res.json(threads);
};

export const replyThread = async (req, res) => {
  const r = await Reply.create({
    ...req.body,
    userId: req.user.id,
  });

  const thread = await Thread.findById(req.body.threadId);
  getIO().to(String(thread.courseId)).emit("new-reply", r);

  res.json(r);
};

export const resolveThread = async (req, res) => {
  const updated = await Thread.findByIdAndUpdate(
    req.params.id,
    { isResolved: true },
    { new: true }
  );

  res.json(updated);
};
