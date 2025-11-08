import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";

export const createAssignment = async (req, res) => {
  const created = await Assignment.create({
    ...req.body,
    createdBy: req.user.id,
  });

  res.json(created);
};

export const listAssignments = async (req, res) => {
  const { courseId } = req.query;
  const list = await Assignment.find({ courseId });
  res.json(list);
};

export const submitAssignment = async (req, res) => {
  const created = await Submission.create({
    ...req.body,
    studentId: req.user.id,
  });

  res.json(created);
};

export const gradeSubmission = async (req, res) => {
  const updated = await Submission.findByIdAndUpdate(
    req.body.submissionId,
    { score: req.body.score },
    { new: true }
  );

  res.json(updated);
};

export const listSubmissions = async (req, res) => {
  const { assignmentId } = req.query;
  const list = await Submission.find({ assignmentId });
  res.json(list);
};
