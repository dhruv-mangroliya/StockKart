import { useState, useEffect } from "react";
import { api } from "../api";

export default function RawMaterials() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", color: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", color: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/raw-materials").then(setItems);
    api.get("/products").then(setProducts);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/raw-materials", form);
      setForm({ name: "", color: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (r) => { setEditing(r.id); setEditForm({ name: r.name, color: r.color }); setError(""); };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/raw-materials/${id}`, editForm);
      cancelEdit();
      load();
    } catch (err) { setError(err.message); }
  };

  const affectedProducts = (id) =>
    products.filter((p) => p.billOfMaterials.some((b) => b.rawMaterialId === id));

  const confirmAndDelete = (r) => {
    setConfirmDelete(r);
    setError("");
  };

  const doDelete = async () => {
    try {
      await api.delete(`/raw-materials/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch (err) { setError(err.message); setConfirmDelete(null); }
  };

  return (
    <div className="page">
      <h2>Raw Materials</h2>
      <form onSubmit={submit} className="form-row">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. W1)" required />
        <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Color (e.g. Red)" required />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Raw Material</h3>
            <p>You are about to delete <strong>{confirmDelete.name} ({confirmDelete.color})</strong>.</p>
            <p>This will:</p>
            <ul>
              <li>Set all its inventory to <strong>zero</strong></li>
              <li>Remove it from all product BOMs</li>
            </ul>
            {affectedProducts(confirmDelete.id).length > 0 && (
              <p className="error">
                ⚠️ Affected products whose BOM will change:{" "}
                <strong>{affectedProducts(confirmDelete.id).map((p) => p.name).join(", ")}</strong>
              </p>
            )}
            <div className="form-row" style={{ marginTop: 16 }}>
              <button style={{ background: "#dc2626" }} onClick={doDelete}>Yes, Delete</button>
              <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Name</th><th>Color</th><th>Action</th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>
                {editing === r.id
                  ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
                  : r.name}
              </td>
              <td>
                {editing === r.id
                  ? <input value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                  : r.color}
              </td>
              <td>
                {editing === r.id ? (
                  <div className="form-row">
                    <button onClick={() => saveEdit(r.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <div className="form-row">
                    <button type="button" onClick={() => startEdit(r)}>Edit</button>
                    <button type="button" style={{ background: "#dc2626" }} onClick={() => confirmAndDelete(r)}>Delete</button>
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
