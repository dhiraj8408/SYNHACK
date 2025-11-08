import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

async function createAdmin() {
  try {
    await connectDB();

    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminData = {
      name: "Root Admin",
      email: "admin@vnit.ac.in",
      department: "ADMIN",
      role: "admin",
      passwordHash: hashedPassword,
    };

    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists.");
    } else {
      await User.create(adminData);
      console.log("✅ Admin created successfully!");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
