import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { bulkCreateUsersService } from "../../services/adminService";

export default function UploadCSV() {
  const { token } = useAuth();
  const [csv, setCsv] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await bulkCreateUsersService(csv, token);
    alert(`Created ${res.created} users`);
    setCsv("");
  };

  return (
    <div className="container">
      <h2>Bulk Upload Users (CSV)</h2>
      <p>Format: <code>name,email,department,role,password</code></p>
      <form onSubmit={submit} className="card">
        <textarea rows="10" value={csv} onChange={e=>setCsv(e.target.value)} placeholder="Paste CSV here"></textarea>
        <button className="btn btn-primary" type="submit">Upload</button>
      </form>
    </div>
  );
}
