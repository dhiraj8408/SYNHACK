import Course from "../models/Course.js";

export const listCourses = async (req, res) => {
  const courses = await Course.find().populate("professorId", "name");
  res.json(courses);
};

export const getCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  res.json(course);
};
