import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { addMaterial, deleteMaterial, listMaterials } from "../../services/materialService";

export default function ContentTab({ courseId }) {
  const { token, user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ moduleTitle:"", type:"pdf", fileUrl:"" });

  const load = async () => {
    const data = await listMaterials(token, courseId);
    setMaterials(data);
  };

  useEffect(() => { load(); }, [courseId]);

  const add = async (e) => {
    e.preventDefault();
    await addMaterial(token, { ...form, courseId });
    setForm({ moduleTitle:"", type:"pdf", fileUrl:"" });
    load();
  };

  const remove = async (id) => {
    await deleteMaterial(token, id);
    load();
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Materials</h3>
        <ul className="list mt-2">
          {materials.map(m => (
            <li key={m._id} className="list-item">
              <div>
                <strong>{m.moduleTitle}</strong> <span className="badge">{m.type}</span><br />
                <a href={m.fileUrl} target="_blank">Open</a>
              </div>
              {(user.role === "professor" || user.role === "admin") && (
                <button className="btn" onClick={()=>remove(m._id)}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {(user.role === "professor" || user.role === "admin") && (
        <form className="card" onSubmit={add}>
          <h3>Add Material</h3>
          <input placeholder="Module Title" value={form.moduleTitle} onChange={e=>setForm({...form, moduleTitle:e.target.value})}/>
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
            <option value="pdf">PDF</option>
            <option value="ppt">PPT</option>
            <option value="link">Link</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input placeholder="File URL" value={form.fileUrl} onChange={e=>setForm({...form, fileUrl:e.target.value})}/>
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      )}
    </div>
  );
}
