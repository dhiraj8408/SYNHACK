import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createCourseService } from "../../services/adminService";

export default function CreateCourse() {
  const { token } = useAuth();
  const [form, setForm] = useState({ courseCode:"", courseName:"", semester:"", department:"", professorId:"" });

  const submit = async (e) => {
    e.preventDefault();
    await createCourseService(form, token);
    alert("Course created");
    setForm({ courseCode:"", courseName:"", semester:"", department:"", professorId:"" });
  };

  return (
    <div className="container">
      <h2>Create Course</h2>
      <form onSubmit={submit} className="card">
        <div className="form-row">
          <input placeholder="Course Code" value={form.courseCode} onChange={e=>setForm({...form, courseCode:e.target.value})}/>
          <input placeholder="Course Name" value={form.courseName} onChange={e=>setForm({...form, courseName:e.target.value})}/>
        </div>
        <div className="form-row">
          <input placeholder="Semester" value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})}/>
          <input placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})}/>
        </div>
        <input placeholder="Professor ID (Mongo _id)" value={form.professorId} onChange={e=>setForm({...form, professorId:e.target.value})}/>
        <button className="btn btn-primary" type="submit">Create</button>
      </form>
    </div>
  );
}
