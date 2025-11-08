import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCourseByIdService } from "../../services/courseService";
import ContentTab from "./ContentTab";
import AssignmentsTab from "./AssignmentsTab";
import ForumTab from "./ForumTab";

export default function CoursePage() {
  const { id } = useParams(); // courseId
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState("content"); // default = CONTENT

  useEffect(() => {
    (async () => {
      const c = await getCourseByIdService(token, id);
      setCourse(c);
    })();
  }, [id]);

  if (!course) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h2>{course.courseCode} — {course.courseName}</h2>
      <p className="mb-3">Dept: {course.department || "-"} | Semester: {course.semester || "-"}</p>

      <div className="tabs mb-3">
        <button className={`tab ${tab==='content'?'active':''}`} onClick={()=>setTab('content')}>Content</button>
        <button className={`tab ${tab==='assignments'?'active':''}`} onClick={()=>setTab('assignments')}>Assignments</button>
        <button className={`tab ${tab==='forum'?'active':''}`} onClick={()=>setTab('forum')}>Forum</button>
      </div>

      {tab === "content" && <ContentTab courseId={course._id} />}
      {tab === "assignments" && <AssignmentsTab courseId={course._id} />}
      {tab === "forum" && <ForumTab courseId={course._id} />}
    </div>
  );
}
