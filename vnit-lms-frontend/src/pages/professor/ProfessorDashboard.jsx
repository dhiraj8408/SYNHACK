import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCoursesService } from "../../services/courseService";
import CourseCard from "../../components/CourseCard";

export default function ProfessorDashboard() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getCoursesService(token);
      const mine = data.filter(c => c.professorId?._id === user.id || c.professorId === user.id);
      setCourses(mine);
    })();
  }, []);

  return (
    <div className="container">
      <h2>Professor Dashboard</h2>
      <p>Welcome, {user?.name}</p>
      <div className="grid grid-2 mt-3">
        {courses.map(c => <CourseCard key={c._id} course={c} />)}
      </div>
    </div>
  );
}
