import mongoose from "mongoose";
import Course from "../models/Course.js";

export const listCourses = async (req, res) => {
  const courses = await Course.find().populate("professorId", "name");
  res.json(courses);
};

export const getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id);
  res.json(course);
};

export const getCoursesByStudent = async (req, res) => {
  try {
    // Convert studentId to ObjectId and query courses where studentId is in studentIds array
    const studentId = new mongoose.Types.ObjectId(req.params.studentId);
    
    const courses = await Course.find({ 
      studentIds: studentId
    })
      .populate("professorId", "name email")
      .populate("studentIds", "name email");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCoursesByProfessor = async (req, res) => {
  try {
    const courses = await Course.find({ professorId: req.params.professorId })
      .populate("professorId", "name email")
      .populate("studentIds", "name email");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  const { title, description, department, professorId } = req.body;
  const newCourse = new Course({ title, description, department, professorId });
  await newCourse.save();
  res.status(201).json(newCourse);
};

export const updateCourse = async (req, res) => {
  const { title, description, department } = req.body;
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    { title, description, department },
    { new: true }
  );
  res.json(updatedCourse);
}; 
export const deleteCourse = async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.status(204).send();
};

export const enrollStudent = async (req, res) => {
  const { studentId } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course.enrolledStudents.includes(studentId)) {
    course.enrolledStudents.push(studentId);
    await course.save();
  }
  res.json(course);
};

export const unenrollStudent = async (req, res) => {
  const { studentId } = req.body;
  const course = await Course.findById(req.params.id);
  if (course.enrolledStudents.includes(studentId)) {
    course.enrolledStudents.pull(studentId);
    await course.save();
  }
  res.json(course);
};

