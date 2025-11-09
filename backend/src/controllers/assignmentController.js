import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

export const createAssignment = async (req, res) => {
  try {
    let fileUrl = null;
    let fileName = null;

    // Handle file upload if present
    if (req.file) {
      fileUrl = `/api/assignments/files/${req.file.filename}`;
      fileName = req.file.originalname;
    } else if (req.body.fileUrl) {
      // Handle Google Drive link
      fileUrl = req.body.fileUrl.trim();
      // Extract filename from drive link if possible, or use a default
      fileName = req.body.fileName || "Assignment File";
    }

    if (!req.body.title || !req.body.courseId || !req.body.dueDate) {
      return res.status(400).json({ message: "title, courseId, and dueDate are required" });
    }

    const created = await Assignment.create({
      title: req.body.title,
      description: req.body.description || "",
      instructions: req.body.instructions || "",
      type: req.body.type || "assignment",
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
      maxScore: req.body.maxScore || 100,
      fileUrl: fileUrl,
      fileName: fileName,
      createdBy: req.user.id,
    });

    // Populate createdBy for response
    await created.populate("createdBy", "name email");
    res.json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("courseId", "courseCode courseName");
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listAssignments = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = courseId ? { courseId } : {};
    
    const list = await Assignment.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    
    res.json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const files = [];
    
    // Handle multiple files from req.files (array) or req.file (single)
    const uploadedFiles = req.files || (req.file ? [req.file] : []);
    
    // Process uploaded files
    uploadedFiles.forEach((file) => {
      files.push({
        fileUrl: `/api/assignments/submissions/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype?.split('/')[1] || 'file',
      });
    });

    // Handle multiple file URLs from body (for links)
    if (req.body.fileUrls) {
      const fileUrls = Array.isArray(req.body.fileUrls) ? req.body.fileUrls : [req.body.fileUrls];
      const fileNames = Array.isArray(req.body.fileNames) ? req.body.fileNames : (req.body.fileNames ? [req.body.fileNames] : []);
      const fileTypes = Array.isArray(req.body.fileTypes) ? req.body.fileTypes : (req.body.fileTypes ? [req.body.fileTypes] : []);
      
      fileUrls.forEach((url, index) => {
        if (url && url.trim()) {
          files.push({
            fileUrl: url.trim(),
            fileName: fileNames[index] || "Submission File",
            fileType: fileTypes[index] || "link",
          });
        }
      });
    }

    // Backward compatibility: Handle single fileUrl
    let submissionUrl = null;
    let fileName = null;
    if (req.body.fileUrl && files.length === 0) {
      submissionUrl = req.body.fileUrl;
      fileName = req.body.fileName || "Submission from Google Drive";
    }
    
    if (files.length === 0 && !submissionUrl) {
      return res.status(400).json({ message: "Either file upload(s) or Google Drive link(s) are required" });
    }

    if (!req.body.assignmentId) {
      return res.status(400).json({ message: "assignmentId is required" });
    }

    console.log(`[submitAssignment] Creating submission for assignmentId: ${req.body.assignmentId}, studentId: ${req.user.id}`);

    // Import mongoose to ensure proper ObjectId handling
    const mongoose = (await import("mongoose")).default;
    
    // Ensure assignmentId is ObjectId
    const assignmentId = mongoose.Types.ObjectId.isValid(req.body.assignmentId)
      ? new mongoose.Types.ObjectId(req.body.assignmentId)
      : req.body.assignmentId;
    
    const studentId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.log(`[submitAssignment] Assignment not found: ${assignmentId}`);
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if due date has passed
    if (new Date(assignment.dueDate) < new Date()) {
      return res.status(400).json({ message: "Assignment due date has passed" });
    }

    // Check if student already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId: assignmentId,
      studentId: studentId,
    });

    const submissionData = {
      assignmentId: assignmentId,
      studentId: studentId,
    };

    // Add files array if we have files, otherwise use legacy fields
    if (files.length > 0) {
      submissionData.files = files;
      // Also set first file for backward compatibility
      submissionData.submissionUrl = files[0].fileUrl;
      submissionData.fileName = files[0].fileName;
    } else if (submissionUrl) {
      submissionData.submissionUrl = submissionUrl;
      submissionData.fileName = fileName;
    }

    if (existingSubmission) {
      console.log(`[submitAssignment] Updating existing submission`);
      // Update existing submission
      if (files.length > 0) {
        existingSubmission.files = files;
        existingSubmission.submissionUrl = files[0].fileUrl;
        existingSubmission.fileName = files[0].fileName;
      } else {
        existingSubmission.submissionUrl = submissionUrl;
        existingSubmission.fileName = fileName;
      }
      await existingSubmission.save();
      await existingSubmission.populate("studentId", "name email");
      console.log(`[submitAssignment] Updated submission:`, existingSubmission._id);
      return res.json(existingSubmission);
    }

    // Create new submission
    console.log(`[submitAssignment] Creating new submission`);
    const created = await Submission.create(submissionData);

    console.log(`[submitAssignment] Created submission:`, created._id);
    await created.populate("studentId", "name email");
    res.json(created);
  } catch (error) {
    console.error(`[submitAssignment] Error:`, error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.query;
    if (!assignmentId) {
      return res.status(400).json({ message: "assignmentId is required" });
    }

    const submission = await Submission.findOne({
      assignmentId: assignmentId,
      studentId: req.user.id,
    }).populate("gradedBy", "name email");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    if (!req.body.submissionId || req.body.score === undefined) {
      return res.status(400).json({ message: "submissionId and score are required" });
    }

    const updated = await Submission.findByIdAndUpdate(
      req.body.submissionId,
      {
        score: req.body.score,
        feedback: req.body.feedback || "",
        gradedBy: req.user.id,
      },
      { new: true }
    )
      .populate("studentId", "name email")
      .populate("gradedBy", "name email");

    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.query;
    if (!assignmentId) {
      return res.status(400).json({ message: "assignmentId is required" });
    }

    console.log(`[listSubmissions] Fetching submissions for assignmentId: ${assignmentId}`);
    console.log(`[listSubmissions] assignmentId type: ${typeof assignmentId}`);
    
    // Import mongoose for ObjectId conversion
    const mongoose = (await import("mongoose")).default;
    
    // Try to find all submissions first (for debugging)
    const allSubmissions = await Submission.find({}).limit(10);
    console.log(`[listSubmissions] Total submissions in DB: ${allSubmissions.length}`);
    if (allSubmissions.length > 0) {
      console.log(`[listSubmissions] Sample submissions:`);
      allSubmissions.forEach((sub, idx) => {
        console.log(`  [${idx}] assignmentId: ${sub.assignmentId} (${sub.assignmentId?.toString()}), studentId: ${sub.studentId}`);
      });
    }
    
    // Convert assignmentId to ObjectId for consistent querying
    let queryAssignmentId = assignmentId;
    if (mongoose.Types.ObjectId.isValid(assignmentId)) {
      queryAssignmentId = new mongoose.Types.ObjectId(assignmentId);
      console.log(`[listSubmissions] Converted to ObjectId: ${queryAssignmentId}`);
    }
    
    // Query submissions
    const list = await Submission.find({ assignmentId: queryAssignmentId })
      .populate("studentId", "name email")
      .populate("gradedBy", "name email")
      .sort({ createdAt: -1 });

    console.log(`[listSubmissions] Found ${list.length} submissions for assignment ${assignmentId}`);
    if (list.length > 0) {
      console.log(`[listSubmissions] First submission:`, {
        id: list[0]._id,
        assignmentId: list[0].assignmentId?.toString(),
        studentId: list[0].studentId?.name || list[0].studentId,
        fileName: list[0].fileName
      });
    }
    
    res.json(list);
  } catch (error) {
    console.error(`[listSubmissions] Error:`, error);
    res.status(400).json({ message: error.message });
  }
};
