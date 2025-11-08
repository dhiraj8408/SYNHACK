import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { parse } from "csv-parse/sync";
import { emailAllowed } from "../middleware/validateEmail.js";
import crypto from "crypto";

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
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const rows = parse(csvContent, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true,
    });

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      
      try {
        // Validate required fields
        if (!r.name || !r.email || !r.role) {
          errors.push(`Row ${i + 2}: Missing required fields (name, email, role)`);
          skipped++;
          continue;
        }

        // Validate email domain
        if (!emailAllowed(r.email, r.role)) {
          errors.push(`Row ${i + 2}: Email ${r.email} not allowed for role ${r.role}`);
          skipped++;
          continue;
        }

        // Check if user exists
        const exists = await User.findOne({ email: r.email.toLowerCase() });
        if (exists) {
          errors.push(`Row ${i + 2}: User with email ${r.email} already exists`);
          skipped++;
          continue;
        }

        // Generate password if not provided
        let password = r.password;
        if (!password || password.trim() === "") {
          password = crypto.randomBytes(8).toString("hex");
          // TODO: Send email with password to user
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({
          name: r.name.trim(),
          email: r.email.toLowerCase().trim(),
          department: r.department?.trim() || "",
          role: r.role.toLowerCase().trim(),
          passwordHash,
        });

        created++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipped++;
      }
    }

    res.json({ 
      created, 
      skipped,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, semester, department, professorEmail, studentEmails } = req.body;

    // Find professor by email
    let professorId = null;
    if (professorEmail) {
      const professor = await User.findOne({ email: professorEmail.toLowerCase(), role: "professor" });
      if (!professor) {
        return res.status(404).json({ message: `Professor with email ${professorEmail} not found` });
      }
      professorId = professor._id;
    }

    // Create course
    const course = await Course.create({
      courseCode,
      courseName,
      semester,
      department,
      professorId,
    });

    // Enroll students if provided via CSV file
    let enrollmentResult = null;
    if (req.file) {
      const csvContent = req.file.buffer.toString("utf-8");
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const emails = rows.map((row) => {
        return (row.email || row.studentEmail || "").toLowerCase().trim();
      }).filter((email) => email);

      if (emails.length > 0) {
        const students = await User.find({
          email: { $in: emails },
          role: "student",
        });

        const studentIds = students.map((s) => s._id);
        const foundEmails = students.map((s) => s.email.toLowerCase());
        const notFoundEmails = emails.filter((e) => !foundEmails.includes(e));

        if (studentIds.length > 0) {
          course.studentIds = studentIds;
          await course.save();

          await User.updateMany(
            { _id: { $in: studentIds } },
            { $push: { enrolledCourses: course._id } }
          );
        }

        enrollmentResult = {
          enrolled: studentIds.length,
          total: emails.length,
          found: students.length,
          notFound: notFoundEmails,
        };
      }
    } else if (studentEmails && Array.isArray(studentEmails) && studentEmails.length > 0) {
      // Enroll students if provided via email array
      const emails = studentEmails.map((e) => e.toLowerCase().trim()).filter((e) => e);
      
      if (emails.length > 0) {
        const students = await User.find({
          email: { $in: emails },
          role: "student",
        });

        const studentIds = students.map((s) => s._id);
        const foundEmails = students.map((s) => s.email.toLowerCase());
        const notFoundEmails = emails.filter((e) => !foundEmails.includes(e));

        if (studentIds.length > 0) {
          course.studentIds = studentIds;
          await course.save();

          await User.updateMany(
            { _id: { $in: studentIds } },
            { $push: { enrolledCourses: course._id } }
          );
        }

        enrollmentResult = {
          enrolled: studentIds.length,
          total: emails.length,
          found: students.length,
          notFound: notFoundEmails,
        };
      }
    }

    const populatedCourse = await Course.findById(course._id)
      .populate("professorId", "name email")
      .populate("studentIds", "name email");

    res.json({
      course: populatedCourse,
      enrollment: enrollmentResult,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollStudents = async (req, res) => {
  try {
    const { courseId, studentIds } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Remove duplicates
    const uniqueStudentIds = [...new Set(studentIds.map((id) => String(id)))];
    const newStudentIds = uniqueStudentIds.filter(
      (id) => !course.studentIds.map((sid) => String(sid)).includes(id)
    );

    if (newStudentIds.length === 0) {
      return res.json({ message: "No new students to enroll", enrolled: 0 });
    }

    course.studentIds.push(...newStudentIds);
    await course.save();

    await User.updateMany(
      { _id: { $in: newStudentIds } },
      { $push: { enrolledCourses: courseId } }
    );

    res.json({ message: "Students enrolled", enrolled: newStudentIds.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollStudentsByEmail = async (req, res) => {
  try {
    const { courseId, studentEmails } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const students = await User.find({
      email: { $in: studentEmails.map((e) => e.toLowerCase()) },
      role: "student",
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found with provided emails" });
    }

    const studentIds = students.map((s) => s._id);
    const uniqueStudentIds = [...new Set(studentIds.map((id) => String(id)))];
    const newStudentIds = uniqueStudentIds.filter(
      (id) => !course.studentIds.map((sid) => String(sid)).includes(id)
    );

    if (newStudentIds.length === 0) {
      return res.json({ message: "All students are already enrolled", enrolled: 0 });
    }

    course.studentIds.push(...newStudentIds);
    await course.save();

    await User.updateMany(
      { _id: { $in: newStudentIds } },
      { $push: { enrolledCourses: courseId } }
    );

    res.json({
      message: "Students enrolled successfully",
      enrolled: newStudentIds.length,
      total: studentEmails.length,
      found: students.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollStudentsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const studentEmails = rows.map((row) => {
      // Support both 'email' and 'studentEmail' column names
      return (row.email || row.studentEmail || "").toLowerCase().trim();
    }).filter((email) => email);

    if (studentEmails.length === 0) {
      return res.status(400).json({ message: "No valid email addresses found in CSV" });
    }

    const students = await User.find({
      email: { $in: studentEmails },
      role: "student",
    });

    const foundEmails = students.map((s) => s.email.toLowerCase());
    const notFoundEmails = studentEmails.filter((e) => !foundEmails.includes(e));

    const studentIds = students.map((s) => s._id);
    const uniqueStudentIds = [...new Set(studentIds.map((id) => String(id)))];
    const newStudentIds = uniqueStudentIds.filter(
      (id) => !course.studentIds.map((sid) => String(sid)).includes(id)
    );

    if (newStudentIds.length > 0) {
      course.studentIds.push(...newStudentIds);
      await course.save();

      await User.updateMany(
        { _id: { $in: newStudentIds } },
        { $push: { enrolledCourses: courseId } }
      );
    }

    res.json({
      message: "Enrollment completed",
      enrolled: newStudentIds.length,
      total: studentEmails.length,
      found: students.length,
      notFound: notFoundEmails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

export const listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, department, role } = req.body;
    const userId = req.params.id;

    if (role === "admin" && req.user.id !== userId) {
      return res.status(400).json({ message: "Cannot change role to admin" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      if (!emailAllowed(email, role || user.role)) {
        return res.status(400).json({ message: "Email not allowed for this role" });
      }
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.department = department !== undefined ? department : user.department;
    if (role && role !== "admin") user.role = role;

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" && req.user.id !== user._id.toString()) {
      return res.status(400).json({ message: "Cannot deactivate admin account" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? "activated" : "deactivated"} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
