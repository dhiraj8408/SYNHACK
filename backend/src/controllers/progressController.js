import Progress from "../models/Progress.js";
import Material from "../models/Material.js";
import ModuleQuestion from "../models/ModuleQuestion.js";
import ModuleQuestionAnswer from "../models/ModuleQuestionAnswer.js";
import mongoose from "mongoose";

// Get progress for a student in a course
export const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Get or create progress
    let progress = await Progress.findOne({
      studentId,
      courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        studentId,
        courseId,
        completedModules: [],
      });
    }

    // Get all unique modules for this course
    const materials = await Material.find({ courseId }).distinct("module");
    
    // Get all questions for all modules
    const allQuestions = await ModuleQuestion.find({ courseId });
    const moduleQuestionsMap = {};
    allQuestions.forEach(q => {
      if (!moduleQuestionsMap[q.module]) {
        moduleQuestionsMap[q.module] = [];
      }
      moduleQuestionsMap[q.module].push(q._id);
    });

    // Get all answered questions for this student
    const answeredQuestions = await ModuleQuestionAnswer.find({
      studentId,
      questionId: { $in: allQuestions.map(q => q._id) },
    });

    const answeredQuestionIds = new Set(answeredQuestions.map(a => a.questionId.toString()));

    // Calculate module completion based on questions
    const moduleCompletion = {};
    for (const module of materials) {
      const moduleQIds = moduleQuestionsMap[module] || [];
      const totalQuestions = moduleQIds.length;
      const answeredCount = moduleQIds.filter(qId => answeredQuestionIds.has(qId.toString())).length;
      
      // Module is complete if all questions are answered (or no questions exist)
      const isComplete = totalQuestions === 0 || answeredCount === totalQuestions;
      
      moduleCompletion[module] = {
        totalQuestions,
        answeredQuestions: answeredCount,
        isComplete,
      };
    }
    
    // Calculate overall progress
    const totalModules = materials.length;
    const completedModules = progress.completedModules || [];
    
    // Also count modules where all questions are answered
    const modulesWithAllQuestionsAnswered = Object.entries(moduleCompletion)
      .filter(([_, data]) => data.totalQuestions > 0 && data.isComplete)
      .map(([module, _]) => module);
    
    // Combine manual completion and question-based completion
    const allCompletedModules = [...new Set([...completedModules, ...modulesWithAllQuestionsAnswered])];
    const completedCount = allCompletedModules.length;
    
    const percentage = totalModules > 0 
      ? Math.round((completedCount / totalModules) * 100) 
      : 0;

    res.json({
      courseId,
      studentId,
      totalModules,
      completedCount,
      completedModules: allCompletedModules,
      percentage,
      allModules: materials.sort(),
      moduleCompletion,
      totalQuestions: allQuestions.length,
      answeredQuestions: answeredQuestions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a module as complete
export const markModuleComplete = async (req, res) => {
  try {
    const { courseId, module } = req.body;
    const studentId = req.user.id;

    if (!courseId || !module) {
      return res.status(400).json({ message: "courseId and module are required" });
    }

    // Verify the module exists in the course
    const materialExists = await Material.findOne({ courseId, module });
    if (!materialExists) {
      return res.status(404).json({ message: "Module not found in this course" });
    }

    // Get or create progress
    let progress = await Progress.findOne({
      studentId,
      courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        studentId,
        courseId,
        completedModules: [],
      });
    }

    // Add module if not already completed
    if (!progress.completedModules.includes(module)) {
      progress.completedModules.push(module);
      await progress.save();
    }

    // Calculate updated progress
    const materials = await Material.find({ courseId }).distinct("module");
    const totalModules = materials.length;
    const completedCount = progress.completedModules.length;
    const percentage = totalModules > 0 
      ? Math.round((completedCount / totalModules) * 100) 
      : 0;

    res.json({
      courseId,
      studentId,
      totalModules,
      completedCount,
      completedModules: progress.completedModules,
      percentage,
      message: "Module marked as complete",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a module as incomplete
export const markModuleIncomplete = async (req, res) => {
  try {
    const { courseId, module } = req.body;
    const studentId = req.user.id;

    if (!courseId || !module) {
      return res.status(400).json({ message: "courseId and module are required" });
    }

    const progress = await Progress.findOne({
      studentId,
      courseId,
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    // Remove module from completed list
    progress.completedModules = progress.completedModules.filter(
      (m) => m !== module
    );
    await progress.save();

    // Calculate updated progress
    const materials = await Material.find({ courseId }).distinct("module");
    const totalModules = materials.length;
    const completedCount = progress.completedModules.length;
    const percentage = totalModules > 0 
      ? Math.round((completedCount / totalModules) * 100) 
      : 0;

    res.json({
      courseId,
      studentId,
      totalModules,
      completedCount,
      completedModules: progress.completedModules,
      percentage,
      message: "Module marked as incomplete",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

