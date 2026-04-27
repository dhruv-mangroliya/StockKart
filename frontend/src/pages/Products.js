import { useState, useEffect } from "react";
import { api } from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [name, setName] = useState("");
  const [bom, setBom] = useState([{ rawMaterialId: "", quantityRequiredPerUnit: 1 }]);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBom, setEditBom] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/products").then(setProducts);
    api.get("/raw-materials").then(setRawMaterials);
  };
  useEffect(() => { load(); }, []);

  const updateBom = (i, field, val) => {
    const updated = [...bom];
    updated[i] = { ...updated[i], [field]: field === "quantityRequiredPerUnit" ? Number(val) : val };
    setBom(updated);
  };

  const updateEditBom = (i, field, val) => {
    const updated = [...editBom];
    updated[i] = { ...updated[i], [field]: field === "quantityRequiredPerUnit" ? Number(val) : val };
    setEditBom(updated);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", { name, billOfMaterials: bom });
      setName("");
      setBom([{ rawMaterialId: "", quantityRequiredPerUnit: 1 }]);
      load();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setEditName(p.name);
    setEditBom(p.billOfMaterials.map((b) => ({ rawMaterialId: b.rawMaterialId, quantityRequiredPerUnit: b.quantityRequiredPerUnit })));
    setError("");
  };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/products/${id}`, { name: editName, billOfMaterials: editBom });
      cancelEdit();
      load();
    } catch (err) { setError(err.message); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/products/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch (err) { setError(err.message); setConfirmDelete(null); }
  };

  const getRmLabel = (id) => {
    const rm = rawMaterials.find((r) => r.id === id);
    return rm ? `${rm.name} (${rm.color})` : id;
  };

  return (
    <div className="page">
      <h2>Products</h2>
      <form onSubmit={submit} className="form-block">
        <div className="form-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name (e.g. P1)" required />
        </div>
        <p><strong>Bill of Materials</strong></p>
        {bom.map((b, i) => (
          <div key={i} className="form-row">
            <select value={b.rawMaterialId} onChange={(e) => updateBom(i, "rawMaterialId", e.target.value)} required>
              <option value="">Select Raw Material</option>
              {rawMaterials.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.color})</option>)}
            </select>
            <input type="number" min="0.001" step="any" value={b.quantityRequiredPerUnit} onChange={(e) => updateBom(i, "quantityRequiredPerUnit", e.target.value)} placeholder="Qty/unit" required />
            {bom.length > 1 && <button type="button" onClick={() => setBom(bom.filter((_, j) => j !== i))}>✕</button>}
          </div>
        ))}
        <div className="form-row">
          <button type="button" onClick={() => setBom([...bom, { rawMaterialId: "", quantityRequiredPerUnit: 1 }])}>+ Add Material</button>
          <button type="submit">Save Product</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Product</h3>
            <p>Delete <strong>{confirmDelete.name}</strong>? All inventory of this product will also be removed.</p>
            <div className="form-row" style={{ marginTop: 16 }}>
              <button style={{ background: "#dc2626" }} onClick={doDelete}>Yes, Delete</button>
              <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Name</th><th>Bill of Materials</th><th>Action</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {editing === p.id
                  ? <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  : p.name}
              </td>
              <td>
                {editing === p.id ? (
                  <div>
                    {editBom.map((b, i) => (
                      <div key={i} className="form-row" style={{ marginBottom: 6 }}>
                        <select value={b.rawMaterialId} onChange={(e) => updateEditBom(i, "rawMaterialId", e.target.value)}>
                          <option value="">Select</option>
                          {rawMaterials.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.color})</option>)}
                        </select>
                        <input type="number" min="0.001" step="any" value={b.quantityRequiredPerUnit} onChange={(e) => updateEditBom(i, "quantityRequiredPerUnit", e.target.value)} style={{ width: 70 }} />
                        {editBom.length > 1 && <button type="button" onClick={() => setEditBom(editBom.filter((_, j) => j !== i))}>✕</button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditBom([...editBom, { rawMaterialId: "", quantityRequiredPerUnit: 1 }])}>+ Add</button>
                  </div>
                ) : (
                  p.billOfMaterials.length > 0
                    ? p.billOfMaterials.map((b, i) => (
                        <span key={i}>{getRmLabel(b.rawMaterialId)} × {b.quantityRequiredPerUnit}{i < p.billOfMaterials.length - 1 ? ", " : ""}</span>
                      ))
                    : <span style={{ color: "#aaa" }}>No materials</span>
                )}
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
