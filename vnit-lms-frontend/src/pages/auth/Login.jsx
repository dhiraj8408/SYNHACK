import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form.email, form.password);

      if (res.user.role === "admin") navigate("/admin");
      if (res.user.role === "student") navigate("/student");
      if (res.user.role === "professor") navigate("/professor");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <h2>Login</h2>

      <form className="card" onSubmit={submit}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button type="submit" className="btn btn-primary">
          Login
        </button>

        <p style={{ marginTop: "10px" }}>
          No account? <a href="/signup">Signup</a>
        </p>
      </form>
    </div>
  );
}
