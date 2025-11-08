import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { parse } from "csv-parse/sync";
import { emailAllowed } from "../middleware/validateEmail.js";

export const createUser = async (req, res) => {
  const { name, email, department, role, password } = req.body;

  if (role === "admin") return res.status(400).json({ message: "Admin must be created manually" });
  if (!emailAllowed(email, role)) return res.status(400).json({ message: "Email not allowed" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, department, role, passwordHash });

  res.json({ id: user._id });
};

export const bulkCreateUsers = async (req, res) => {
  try {
    const { csv } = req.body;
    const rows = parse(csv, { columns: true, skip_empty_lines: true });

    let created = 0;

    for (const r of rows) {
      if (!emailAllowed(r.email, r.role)) continue;

      const exists = await User.findOne({ email: r.email });
      if (exists) continue;

      const passwordHash = await bcrypt.hash(r.password, 10);

      await User.create({
        name: r.name,
        email: r.email,
        department: r.department,
        role: r.role,
        passwordHash,
      });

      created++;
    }

    res.json({ created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  const course = await Course.create(req.body);
  res.json(course);
};

export const enrollStudents = async (req, res) => {
  const { courseId, studentIds } = req.body;

  const course = await Course.findById(courseId);
  course.studentIds.push(...studentIds);
  await course.save();

  await User.updateMany({ _id: { $in: studentIds } }, { $push: { enrolledCourses: courseId } });

  res.json({ message: "Students enrolled" });
};

export const dropStudents = async (req, res) => {
  const { courseId, studentIds } = req.body;

  const course = await Course.findById(courseId);
  course.studentIds = course.studentIds.filter((id) => !studentIds.includes(String(id)));
  await course.save();

  await User.updateMany(
    { _id: { $in: studentIds } },
    { $pull: { enrolledCourses: courseId } }
  );

  res.json({ message: "Students removed" });
};
