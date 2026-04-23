import { useState, useEffect } from "react";
import { api } from "../api";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/stores").then(setStores);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/stores", { name });
      setName("");
      load();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (s) => { setEditing(s.id); setEditName(s.name); setError(""); };
  const cancelEdit = () => { setEditing(null); setEditName(""); };

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/stores/${id}`, { name: editName });
      cancelEdit();
      load();
    } catch (err) { setError(err.message); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/stores/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch (err) { setError(err.message); setConfirmDelete(null); }
  };

  return (
    <div className="page">
      <h2>Stores</h2>
      <form onSubmit={submit} className="form-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" required />
        <button type="submit">Add Store</button>
      </form>
      {error && <p className="error">{error}</p>}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Store</h3>
            <p>Delete <strong>{confirmDelete.name}</strong>? All inventory in this store will also be removed.</p>
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
          {stores.map((s) => (
            <tr key={s.id}>
              <td>
                {editing === s.id
                  ? <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  : s.name}
              </td>
              <td>
                {editing === s.id ? (
                  <div className="form-row">
                    <button onClick={() => saveEdit(s.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <div className="form-row">
                    <button type="button" onClick={() => startEdit(s)}>Edit</button>
                    <button type="button" style={{ background: "#dc2626" }} onClick={() => setConfirmDelete(s)}>Delete</button>
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
