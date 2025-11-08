import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createUserService } from "../../services/adminService";

export default function CreateUser() {
  const { token } = useAuth();
  const [form, setForm] = useState({ name:"", email:"", department:"", role:"student", password:"" });

  const submit = async (e) => {
    e.preventDefault();
    await createUserService(form, token);
    alert("User created");
    setForm({ name:"", email:"", department:"", role:"student", password:"" });
  };

  return (
    <div className="container">
      <h2>Create User</h2>
      <form onSubmit={submit} className="card">
        <div className="form-row">
          <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </div>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input placeholder="Department (prof only)" value={form.department} onChange={e=>setForm({...form, department:e.target.value})}/>
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        <button className="btn btn-primary" type="submit">Create</button>
      </form>
    </div>
  );
}
