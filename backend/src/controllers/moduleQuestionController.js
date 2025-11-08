import ModuleQuestion from "../models/ModuleQuestion.js";
import ModuleQuestionAnswer from "../models/ModuleQuestionAnswer.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

// Professor: Add question to a module
export const addQuestion = async (req, res) => {
  try {
    const { courseId, module, questionText, questionType, options, correctAnswer, correctAnswers, points, explanation } = req.body;

    if (!courseId || !module || !questionText || !questionType) {
      return res.status(400).json({ message: "courseId, module, questionText, and questionType are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify professor owns the course
    if ((!course.professorId || course.professorId.toString() !== req.user.id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course professor can add questions" });
    }

    // Validate question type specific fields
    if (questionType === "multiple_choice") {
      if (!options || options.length < 2) {
        return res.status(400).json({ message: "Multiple choice questions require at least 2 options" });
      }
      if (!correctAnswer && (!correctAnswers || correctAnswers.length === 0)) {
        return res.status(400).json({ message: "Correct answer(s) required for multiple choice" });
      }
    }

    if ((questionType === "true_false" || questionType === "short_answer") && !correctAnswer) {
      return res.status(400).json({ message: "Correct answer required for this question type" });
    }

    const question = await ModuleQuestion.create({
      courseId,
      module,
      questionText,
      questionType,
      options: questionType === "multiple_choice" ? options : undefined,
      correctAnswer,
      correctAnswers: questionType === "multiple_choice" && correctAnswers ? correctAnswers : undefined,
      points: points || 1,
      explanation: explanation || "",
      createdBy: req.user.id,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all questions for a module
export const getModuleQuestions = async (req, res) => {
  try {
    const { courseId, module } = req.query;

    if (!courseId || !module) {
      return res.status(400).json({ message: "courseId and module are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user is enrolled (student) or professor/admin
    const isEnrolled = req.user.role === "student" &&
      course.studentIds && course.studentIds.some(id => id.toString() === req.user.id.toString());
    const isProfessor = course.professorId && course.professorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isEnrolled && !isProfessor && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to view questions for this module" });
    }

    const questions = await ModuleQuestion.find({ courseId, module })
      .populate("createdBy", "name email")
      .sort({ createdAt: 1 });

    // For students, hide correct answers if they haven't answered yet
    if (req.user.role === "student") {
      const questionIds = questions.map(q => q._id);
      const answers = await ModuleQuestionAnswer.find({
        questionId: { $in: questionIds },
        studentId: req.user.id,
      });

      const answersMap = {};
      answers.forEach(answer => {
        answersMap[answer.questionId.toString()] = answer;
      });

      const questionsWithAnswers = questions.map(question => {
        const questionObj = question.toObject();
        const answer = answersMap[question._id.toString()];
        
        // Hide correct answer if not answered yet
        if (!answer) {
          delete questionObj.correctAnswer;
          delete questionObj.correctAnswers;
        }
        
        return {
          ...questionObj,
          studentAnswer: answer || null,
        };
      });

      return res.json(questionsWithAnswers);
    }

    // For professors/admins, show all questions with answer statistics
    const questionsWithStats = await Promise.all(
      questions.map(async (question) => {
        const questionObj = question.toObject();
        const totalAnswers = await ModuleQuestionAnswer.countDocuments({ questionId: question._id });
        const correctAnswers = await ModuleQuestionAnswer.countDocuments({
          questionId: question._id,
          isCorrect: true,
        });

        return {
          ...questionObj,
          stats: {
            totalAnswers,
            correctAnswers,
            accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
          },
        };
      })
    );

    res.json(questionsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: Submit answer to a question
export const submitAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined || answer === null || answer === "") {
      return res.status(400).json({ message: "questionId and answer are required" });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit answers" });
    }

    const question = await ModuleQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(question.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.studentIds || !course.studentIds.some(id => id.toString() === req.user.id.toString())) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Check if already answered
    const existingAnswer = await ModuleQuestionAnswer.findOne({
      questionId,
      studentId: req.user.id,
    });

    if (existingAnswer) {
      return res.status(400).json({ message: "You have already answered this question" });
    }

    // Evaluate answer
    let isCorrect = false;
    let pointsEarned = 0;

    const normalizedAnswer = answer.toString().trim().toLowerCase();
    
    switch (question.questionType) {
      case "true_false":
        const correctTF = question.correctAnswer.toString().trim().toLowerCase();
        isCorrect = normalizedAnswer === correctTF;
        break;
      
      case "short_answer":
        const correctSA = question.correctAnswer.toString().trim().toLowerCase();
        isCorrect = normalizedAnswer === correctSA;
        break;
      
      case "multiple_choice":
        if (question.correctAnswers && question.correctAnswers.length > 0) {
          // Multiple correct answers
          const studentAnswers = Array.isArray(answer) ? answer : [answer];
          const correctAnswers = question.correctAnswers.map(a => a.toString().trim().toLowerCase());
          const studentAnswersNormalized = studentAnswers.map(a => a.toString().trim().toLowerCase());
          isCorrect = correctAnswers.length === studentAnswersNormalized.length &&
            correctAnswers.every(ans => studentAnswersNormalized.includes(ans));
        } else {
          // Single correct answer
          const correctMC = question.correctAnswer.toString().trim().toLowerCase();
          isCorrect = normalizedAnswer === correctMC;
        }
        break;
      
      case "long_answer":
        // For long answers, we'll mark as correct if answer is provided (manual grading can be added later)
        isCorrect = answer.trim().length > 10; // Basic check, can be enhanced
        break;
    }

    if (isCorrect) {
      pointsEarned = question.points || 1;
    }

    const questionAnswer = await ModuleQuestionAnswer.create({
      questionId,
      studentId: req.user.id,
      answer: answer.toString(),
      isCorrect,
      pointsEarned,
    });

    res.status(201).json({
      ...questionAnswer.toObject(),
      question: {
        correctAnswer: question.correctAnswer,
        correctAnswers: question.correctAnswers,
        explanation: question.explanation,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already answered this question" });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete a question (professor only)
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await ModuleQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const course = await Course.findById(question.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify professor owns the course
    if ((!course.professorId || course.professorId.toString() !== req.user.id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course professor can delete questions" });
    }

    // Delete all answers for this question
    await ModuleQuestionAnswer.deleteMany({ questionId });
    
    // Delete the question
    await ModuleQuestion.findByIdAndDelete(questionId);

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

