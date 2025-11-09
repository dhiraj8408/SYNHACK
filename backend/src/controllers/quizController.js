import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

export const createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, instructions, questions, timeLimit, showResults } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ message: "courseId and title are required" });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionType) {
        return res.status(400).json({ message: `Question ${i + 1}: questionText and questionType are required` });
      }

      if (q.questionType === "mcq_single" || q.questionType === "mcq_multiple") {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: `Question ${i + 1}: At least 2 options are required for MCQ` });
        }
        if (q.questionType === "mcq_single") {
          if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
            return res.status(400).json({ message: `Question ${i + 1}: correctAnswer must be one of the options` });
          }
        } else {
          if (!q.correctAnswers || !Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
            return res.status(400).json({ message: `Question ${i + 1}: At least one correct answer is required for multiple choice` });
          }
          const allCorrect = q.correctAnswers.every(ans => q.options.includes(ans));
          if (!allCorrect) {
            return res.status(400).json({ message: `Question ${i + 1}: All correctAnswers must be in options` });
          }
        }
      } else if (q.questionType === "numerical") {
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          return res.status(400).json({ message: `Question ${i + 1}: correctAnswer is required for numerical question` });
        }
        if (typeof q.correctAnswer !== "number") {
          return res.status(400).json({ message: `Question ${i + 1}: correctAnswer must be a number for numerical question` });
        }
      }
    }

    // Verify course exists and user is the professor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if ((!course.professorId || course.professorId.toString() !== req.user.id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course professor can create quizzes" });
    }

    const quiz = await Quiz.create({
      courseId,
      title,
      description: description || "",
      instructions: instructions || "",
      questions,
      timeLimit: timeLimit || null,
      showResults: showResults !== undefined ? showResults : true,
      isPublished: false,
      createdBy: req.user.id,
    });

    const populated = await Quiz.findById(quiz._id)
      .populate("createdBy", "name email")
      .populate("courseId", "courseName courseCode");

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listQuizzes = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check access
    const isEnrolled = req.user.role === "student" &&
      course.studentIds && course.studentIds.some(id => id.toString() === req.user.id.toString());
    const isProfessor = course.professorId && course.professorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isEnrolled && !isProfessor && !isAdmin) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Students see only published quizzes, professors see all
    const query = { courseId };
    if (req.user.role === "student") {
      query.isPublished = true;
    }

    const quizzes = await Quiz.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // For students, include attempt status
    if (req.user.role === "student") {
      const quizIds = quizzes.map(q => q._id);
      const attempts = await QuizAttempt.find({
        quizId: { $in: quizIds },
        studentId: req.user.id,
      });

      const attemptsMap = {};
      attempts.forEach(attempt => {
        attemptsMap[attempt.quizId.toString()] = {
          _id: attempt._id,
          totalScore: attempt.totalScore,
          percentage: attempt.percentage,
          submittedAt: attempt.submittedAt,
          isGraded: attempt.isGraded,
        };
      });

      const quizzesWithAttempts = quizzes.map(quiz => ({
        ...quiz.toObject(),
        attempt: attemptsMap[quiz._id.toString()] || null,
      }));

      return res.json(quizzesWithAttempts);
    }

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeAnswers } = req.query; // Only professors can request answers

    const quiz = await Quiz.findById(id)
      .populate("createdBy", "name email")
      .populate("courseId", "courseName courseCode");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check access
    const isEnrolled = req.user.role === "student" &&
      course.studentIds && course.studentIds.some(id => id.toString() === req.user.id.toString());
    const isProfessor = course.professorId && course.professorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isEnrolled && !isProfessor && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Students can only see published quizzes
    if (req.user.role === "student" && !quiz.isPublished) {
      return res.status(403).json({ message: "Quiz not published yet" });
    }

    // For students, check if they've already attempted
    if (req.user.role === "student") {
      const attempt = await QuizAttempt.findOne({
        quizId: id,
        studentId: req.user.id,
      });

      const quizObj = quiz.toObject();

      // Remove correct answers for students (unless they've submitted)
      if (!attempt || !attempt.isGraded) {
        quizObj.questions = quizObj.questions.map(q => {
          const question = { ...q };
          delete question.correctAnswer;
          delete question.correctAnswers;
          return question;
        });
      }

      return res.json({
        ...quizObj,
        attempt: attempt || null,
      });
    }

    // For professors, include answers if requested
    const quizObj = quiz.toObject();
    if (includeAnswers !== "true") {
      // By default, don't show answers in the quiz object for professors either
      // They can request it explicitly
      quizObj.questions = quizObj.questions.map(q => {
        const question = { ...q };
        delete question.correctAnswer;
        delete question.correctAnswers;
        return question;
      });
    }

    res.json(quizObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if ((!course.professorId || course.professorId.toString() !== req.user.id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course professor can publish quizzes" });
    }

    quiz.isPublished = isPublished;
    await quiz.save();

    const populated = await Quiz.findById(quiz._id)
      .populate("createdBy", "name email")
      .populate("courseId", "courseName courseCode");

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "quizId and answers array are required" });
    }

    // Verify quiz exists and is published
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: "Quiz is not published yet" });
    }

    // Verify student is enrolled
    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!Array.isArray(course.studentIds)) {
      course.studentIds = [];
    }

    const isEnrolled = course.studentIds.some(id => id.toString() === req.user.id.toString());
    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Check if already attempted
    const existingAttempt = await QuizAttempt.findOne({
      quizId,
      studentId: req.user.id,
    });

    if (existingAttempt && existingAttempt.isGraded) {
      return res.status(400).json({ message: "Quiz has already been submitted" });
    }

    // Grade the quiz
    const gradedAnswers = [];
    let totalScore = 0;

    for (const answer of answers) {
      const questionIndex = answer.questionIndex;
      if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
        continue; // Skip invalid question indices
      }

      const question = quiz.questions[questionIndex];
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.questionType === "mcq_single") {
        isCorrect = answer.answer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.questionType === "mcq_multiple") {
        // For multiple choice, all correct answers must be selected and no incorrect ones
        const studentAnswers = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
        const correctAnswers = question.correctAnswers || [];
        
        if (studentAnswers.length === correctAnswers.length) {
          const allCorrect = correctAnswers.every(correct => studentAnswers.includes(correct));
          const noIncorrect = studentAnswers.every(ans => correctAnswers.includes(ans));
          isCorrect = allCorrect && noIncorrect;
        }
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.questionType === "numerical") {
        // For numerical, allow small tolerance (0.01 by default)
        const studentAnswer = parseFloat(answer.answer);
        const correctAnswer = parseFloat(question.correctAnswer);
        const tolerance = 0.01;
        isCorrect = !isNaN(studentAnswer) && Math.abs(studentAnswer - correctAnswer) <= tolerance;
        pointsEarned = isCorrect ? question.points : 0;
      }

      totalScore += pointsEarned;

      gradedAnswers.push({
        questionIndex,
        answer: answer.answer,
        isCorrect,
        pointsEarned,
      });
    }

    const percentage = quiz.totalPoints > 0 ? (totalScore / quiz.totalPoints) * 100 : 0;

    // Create or update attempt
    let attempt;
    if (existingAttempt) {
      existingAttempt.answers = gradedAnswers;
      existingAttempt.totalScore = totalScore;
      existingAttempt.percentage = percentage;
      existingAttempt.timeSpent = timeSpent || 0;
      existingAttempt.submittedAt = new Date();
      existingAttempt.isGraded = true;
      await existingAttempt.save();
      attempt = existingAttempt;
    } else {
      attempt = await QuizAttempt.create({
        quizId,
        studentId: req.user.id,
        answers: gradedAnswers,
        totalScore,
        percentage,
        timeSpent: timeSpent || 0,
        submittedAt: new Date(),
        isGraded: true,
      });
    }

    // Populate and return
    const populated = await QuizAttempt.findById(attempt._id)
      .populate("studentId", "name email")
      .populate("quizId", "title totalPoints");

    // Include quiz questions with correct answers for review
    const quizWithAnswers = await Quiz.findById(quizId);
    const questionsWithAnswers = quizWithAnswers.questions.map((q, idx) => {
      const question = q.toObject ? q.toObject() : q;
      const studentAnswer = gradedAnswers.find(a => a.questionIndex === idx);
      return {
        ...question,
        studentAnswer: studentAnswer ? studentAnswer.answer : null,
        isCorrect: studentAnswer ? studentAnswer.isCorrect : false,
        pointsEarned: studentAnswer ? studentAnswer.pointsEarned : 0,
      };
    });

    res.json({
      attempt: populated,
      questions: questionsWithAnswers,
      totalScore,
      percentage,
      totalPoints: quiz.totalPoints,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Quiz has already been submitted" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if ((!course.professorId || course.professorId.toString() !== req.user.id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course professor can view quiz attempts" });
    }

    const attempts = await QuizAttempt.find({ quizId })
      .populate("studentId", "name email")
      .sort({ submittedAt: -1, createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user is enrolled in the course (student) or is professor/admin
    const isEnrolled = course.studentIds?.some(id => id.toString() === req.user.id.toString());
    const isProfessor = course.professorId?.toString() === req.user.id.toString() || req.user.role === "admin";

    if (!isEnrolled && !isProfessor) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ 
      quizId,
      isGraded: true 
    })
      .populate("studentId", "name email");

    // Sort attempts: by score (descending), then by time spent (ascending), then by submission time (ascending)
    attempts.sort((a, b) => {
      // First sort by total score (descending)
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // If scores are equal, sort by percentage (descending)
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      // If scores and percentages are equal, sort by time spent (ascending - faster is better)
      if (a.timeSpent !== b.timeSpent) {
        return a.timeSpent - b.timeSpent;
      }
      // If everything is equal, sort by submission time (ascending - earlier is better)
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

    // Add ranking to each attempt (handle ties properly)
    let currentRank = 1;
    const leaderboard = attempts.map((attempt, index) => {
      // If this is not the first attempt and scores are different from previous, update rank
      if (index > 0) {
        const prevAttempt = attempts[index - 1];
        if (prevAttempt.totalScore !== attempt.totalScore || 
            prevAttempt.percentage !== attempt.percentage) {
          currentRank = index + 1;
        }
        // If scores are same but time is different, keep same rank (tie)
      }

      return {
        rank: currentRank,
        studentId: attempt.studentId._id,
        studentName: attempt.studentId.name,
        studentEmail: attempt.studentId.email,
        totalScore: attempt.totalScore,
        totalPoints: quiz.totalPoints,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        submittedAt: attempt.submittedAt,
        isCurrentUser: attempt.studentId._id.toString() === req.user.id.toString(),
      };
    });

    res.json({
      quizTitle: quiz.title,
      totalPoints: quiz.totalPoints,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

