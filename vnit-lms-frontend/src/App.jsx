import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CreateUser from "./pages/admin/CreateUser.jsx";
import UploadCSV from "./pages/admin/UploadCSV.jsx";
import CreateCourse from "./pages/admin/CreateCourse.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import ProfessorDashboard from "./pages/professor/ProfessorDashboard.jsx";
import CoursePage from "./pages/course/CoursePage.jsx";
import Chatbot from "./pages/student/Chatbot.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><CreateUser /></ProtectedRoute>} />
        <Route path="/admin/upload-csv" element={<ProtectedRoute role="admin"><UploadCSV /></ProtectedRoute>} />
        <Route path="/admin/create-course" element={<ProtectedRoute role="admin"><CreateCourse /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute role="student"><Chatbot /></ProtectedRoute>} />

        <Route path="/professor" element={<ProtectedRoute role="professor"><ProfessorDashboard /></ProtectedRoute>} />

        <Route path="/course/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
