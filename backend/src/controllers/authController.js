import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { emailAllowed } from "../middleware/validateEmail.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

export const signup = async (req, res) => {
  try {
    const { name, email, department, role, password } = req.body;

    if (role === "admin")
      return res.status(400).json({ message: "Admin cannot signup" });

    if (!emailAllowed(email, role))
      return res.status(400).json({ message: "Email not allowed for signup" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      department,
      role,
      passwordHash,
    });

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive)
      return res.status(400).json({ message: "Invalid credentials" });

    const verified = await bcrypt.compare(password, user.passwordHash);
    if (!verified)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json(user);
};
