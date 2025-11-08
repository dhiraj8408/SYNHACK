import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const linksByRole = {
    admin: [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/users", label: "Create User" },
      { to: "/admin/upload-csv", label: "Bulk Upload" },
      { to: "/admin/create-course", label: "Create Course" },
    ],
    student: [
      { to: "/student", label: "Dashboard" },
      { to: "/chatbot", label: "Chatbot" },
    ],
    professor: [{ to: "/professor", label: "Dashboard" }],
  };

  const items = linksByRole[user?.role] || [];

  return (
    <div className="navbar">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>VNIT-LMS</strong>
        {items.map((i) => (
          <Link key={i.to} to={i.to}>
            {i.label}
          </Link>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
        <span>{user?.name} ({user?.role})</span>
        <button className="btn" onClick={() => { logout(); nav("/login"); }}>
          Logout
        </button>
      </div>
    </div>
  );
}
