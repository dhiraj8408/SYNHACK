import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive)
      return res.status(401).json({ message: "Invalid user" });

    req.user = { id: user._id, role: user.role };

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: "Access denied" });

  next();
};
