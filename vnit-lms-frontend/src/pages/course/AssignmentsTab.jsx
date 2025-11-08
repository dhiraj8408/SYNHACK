import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { createAssignment, gradeSubmission, listAssignments, listSubmissions, submitAssignment } from "../../services/assignmentService";

export default function AssignmentsTab({ courseId }) {
  const { token, user } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title:"", type:"assignment", fileUrl:"", dueDate:"" });
  const [submitUrl, setSubmitUrl] = useState("");
  const [submissions, setSubmissions] = useState({}); // map assignmentId -> array

  const load = async () => {
    const data = await listAssignments(token, courseId);
    setList(data);
  };

  useEffect(()=>{ load(); }, [courseId]);

  const create = async (e) => {
    e.preventDefault();
    await createAssignment(token, { ...form, courseId });
    setForm({ title:"", type:"assignment", fileUrl:"", dueDate:"" });
    load();
  };

  const submit = async (assignmentId) => {
    await submitAssignment(token, { assignmentId, submissionUrl: submitUrl });
    alert("Submitted");
    setSubmitUrl("");
  };

  const openSubs = async (assignmentId) => {
    const arr = await listSubmissions(token, assignmentId);
    setSubmissions(prev => ({ ...prev, [assignmentId]: arr }));
  };

  const grade = async (assignmentId, submissionId) => {
    const score = +prompt("Enter score (0-100):", "100");
    if (Number.isNaN(score)) return;
    await gradeSubmission(token, submissionId, score);
    openSubs(assignmentId);
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Assignments</h3>
        <ul className="list mt-2">
          {list.map(a => (
            <li key={a._id} className="list-item">
              <div>
                <strong>{a.title}</strong> <span className="badge">{a.type}</span><br/>
                {a.fileUrl && <a href={a.fileUrl} target="_blank">View</a>}
                {a.dueDate && <p className="mb-0">Due: {new Date(a.dueDate).toLocaleString()}</p>}
              </div>

              {user.role === "student" && (
                <div>
                  <input placeholder="Submission URL" value={submitUrl} onChange={e=>setSubmitUrl(e.target.value)} />
                  <button className="btn" onClick={()=>submit(a._id)}>Submit</button>
                </div>
              )}

              {(user.role === "professor" || user.role === "admin") && (
                <div>
                  <button className="btn" onClick={()=>openSubs(a._id)}>View Submissions</button>
                  {(submissions[a._id] || []).length > 0 && (
                    <div className="mt-2">
                      {(submissions[a._id] || []).map(s => (
                        <div key={s._id} className="card" style={{ marginBottom: 8 }}>
                          <div className="flex justify-between items-center">
                            <div>
                              <a href={s.submissionUrl} target="_blank">Open submission</a>
                              <p className="mb-0">Score: {s.score ?? "-"}</p>
                            </div>
                            <button className="btn" onClick={()=>grade(a._id, s._id)}>Grade</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {(user.role === "professor" || user.role === "admin") && (
        <form className="card" onSubmit={create}>
          <h3>Create Assignment</h3>
          <input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
          </select>
          <input placeholder="File URL (optional)" value={form.fileUrl} onChange={e=>setForm({...form, fileUrl:e.target.value})}/>
          <input type="datetime-local" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})}/>
          <button className="btn btn-primary" type="submit">Create</button>
        </form>
      )}
    </div>
  );
}
