import { useNavigate } from "react-router-dom";

export default function CourseCard({ course }) {
  const nav = useNavigate();
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => nav(`/course/${course._id}`)}>
      <div className="flex justify-between items-center">
        <div>
          <h3>{course.courseCode} — {course.courseName}</h3>
          <p className="mb-0">Dept: {course.department || "-"}</p>
        </div>
        <span className="badge">{course.semester || "N/A"}</span>
      </div>
    </div>
  );
}
