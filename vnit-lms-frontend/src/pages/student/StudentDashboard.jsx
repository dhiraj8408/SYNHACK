import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCoursesService } from "../../services/courseService";
import CourseCard from "../../components/CourseCard";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const data = await getCoursesService(token);
      // show only courses student is in
      const mine = data.filter(c => (c.studentIds || []).some(id => id === user.id || id?._id === user.id));
      setCourses(mine);
    })();
  }, []);

  return (
    <div className="container">
      <h2>Student Dashboard</h2>
      <p>Welcome, {user?.name}</p>
      <div className="grid grid-2 mt-3">
        {courses.map(c => <CourseCard key={c._id} course={c} />)}
      </div>
      <div className="mt-3">
        <button className="btn btn-primary" onClick={() => nav("/chatbot")}>Ask AI Chatbot</button>
      </div>
    </div>
  );
}
