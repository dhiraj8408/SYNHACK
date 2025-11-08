import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listUsersService } from "../../services/adminService";
import { getCoursesService } from "../../services/courseService";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [counts, setCounts] = useState({ users: 0, courses: 0 });

  useEffect(() => {
    (async () => {
      const users = await listUsersService(token);
      const courses = await getCoursesService(token);
      setCounts({ users: users.length, courses: courses.length });
    })();
  }, []);

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user?.name}</p>

      <div className="grid grid-3 mt-3">
        <div className="card"><h3>Users</h3><p>Total: {counts.users}</p></div>
        <div className="card"><h3>Courses</h3><p>Total: {counts.courses}</p></div>
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="flex gap-2 mt-2">
            <Link className="btn" to="/admin/users">Create User</Link>
            <Link className="btn" to="/admin/upload-csv">Bulk Upload</Link>
            <Link className="btn btn-primary" to="/admin/create-course">Create Course</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
