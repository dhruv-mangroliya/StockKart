import { useState, useEffect } from "react";
import { api } from "../api";

export default function Producers() {
  const [producers, setProducers] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/producers").then(setProducers);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/producers", { name });
      setName("");
      load();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (p) => { setEditing(p.id); setEditName(p.name); setError(""); };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/producers/${id}`, { name: editName });
      cancelEdit();
      load();
    } catch (err) { setError(err.message); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/producers/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch (err) { setError(err.message); setConfirmDelete(null); }
  };

  return (
    <div className="page">
      <h2>Producers</h2>
      <form onSubmit={submit} className="form-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Producer name" required />
        <button type="submit">Add Producer</button>
      </form>
      {error && <p className="error">{error}</p>}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Producer</h3>
            <p>Delete <strong>{confirmDelete.name}</strong>? All inventory held by this producer will also be removed.</p>
            <div className="form-row" style={{ marginTop: 16 }}>
              <button style={{ background: "#dc2626" }} onClick={doDelete}>Yes, Delete</button>
              <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Name</th><th>Action</th></tr></thead>
        <tbody>
          {producers.map((p) => (
            <tr key={p.id}>
              <td>
                {editing === p.id
                  ? <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  : p.name}
              </td>
              <td>
                {editing === p.id ? (
                  <div className="form-row">
                    <button onClick={() => saveEdit(p.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <div className="form-row">
                    <button type="button" onClick={() => startEdit(p)}>Edit</button>
                    <button type="button" style={{ background: "#dc2626" }} onClick={() => setConfirmDelete(p)}>Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
