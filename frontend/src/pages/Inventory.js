import { useState, useEffect } from "react";
import { api } from "../api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [producers, setProducers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState({ locationType: "", locationId: "" });
  const [form, setForm] = useState({ itemType: "RAW", itemId: "", locationType: "STORE", locationId: "", quantity: "" });
  const [editing, setEditing] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/stores").then(setStores);
    api.get("/producers").then(setProducers);
    api.get("/raw-materials").then(setRawMaterials);
    api.get("/products").then(setProducts);
  };

  const loadInventory = () => {
    const params = new URLSearchParams();
    if (filter.locationType) params.set("locationType", filter.locationType);
    if (filter.locationId) params.set("locationId", filter.locationId);
    api.get(`/inventory?${params}`).then(setInventory);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadInventory(); }, [filter]);

  const getItemLabel = (type, id) => {
    if (type === "RAW") {
      const r = rawMaterials.find((x) => x.id === id);
      return r ? `${r.name} (${r.color})` : id;
    }
    const p = products.find((x) => x.id === id);
    return p ? p.name : id;
  };

  const getLocationLabel = (type, id) => {
    if (type === "STORE") {
      const s = stores.find((x) => x.id === id);
      return s ? s.name : id;
    }
    const p = producers.find((x) => x.id === id);
    return p ? p.name : id;
  };

  const itemOptions = form.itemType === "RAW"
    ? rawMaterials.map((r) => ({ id: r.id, label: `${r.name} (${r.color})` }))
    : products.map((p) => ({ id: p.id, label: p.name }));

  const locationOptions = form.locationType === "STORE"
    ? stores.map((s) => ({ id: s.id, label: s.name }))
    : producers.map((p) => ({ id: p.id, label: p.name }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/inventory/add", { ...form, quantity: Number(form.quantity) });
      setForm({ itemType: "RAW", itemId: "", locationType: "STORE", locationId: "", quantity: "" });
      loadInventory();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (inv) => { setEditing(inv.id); setEditQty(String(inv.quantity)); setError(""); };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/inventory/${id}`, { quantity: Number(editQty) });
      cancelEdit();
      loadInventory();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h2>Inventory</h2>

      <div className="form-block">
        <h3>Add Stock</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, itemId: "" })}>
              <option value="RAW">Raw Material</option>
              <option value="PRODUCT">Product</option>
            </select>
            <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required>
              <option value="">Select Item</option>
              {itemOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-row">
            <select value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value, locationId: "" })}>
              <option value="STORE">Store</option>
              <option value="PRODUCER">Producer</option>
            </select>
            <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} required>
              <option value="">Select Location</option>
              {locationOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" required />
            <button type="submit">Add Stock</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="form-block">
        <h3>Filter Inventory</h3>
        <div className="form-row">
          <select value={filter.locationType} onChange={(e) => setFilter({ locationType: e.target.value, locationId: "" })}>
            <option value="">All Locations</option>
            <option value="STORE">Stores</option>
            <option value="PRODUCER">Producers</option>
          </select>
          {filter.locationType === "STORE" && (
            <select value={filter.locationId} onChange={(e) => setFilter({ ...filter, locationId: e.target.value })}>
              <option value="">All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {filter.locationType === "PRODUCER" && (
            <select value={filter.locationId} onChange={(e) => setFilter({ ...filter, locationId: e.target.value })}>
              <option value="">All Producers</option>
              {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th>Type</th><th>Location</th><th>Location Type</th><th>Quantity</th><th>Action</th></tr>
        </thead>
        <tbody>
          {inventory.map((inv) => (
            <tr key={inv.id}>
              <td>{getItemLabel(inv.itemType, inv.itemId)}</td>
              <td>{inv.itemType}</td>
              <td>{getLocationLabel(inv.locationType, inv.locationId)}</td>
              <td>{inv.locationType}</td>
              <td>
                {editing === inv.id
                  ? <input type="number" min="0" value={editQty} onChange={(e) => setEditQty(e.target.value)} autoFocus style={{ width: 80 }} />
                  : inv.quantity}
              </td>
              <td>
                {editing === inv.id ? (
                  <div className="form-row">
                    <button onClick={() => saveEdit(inv.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => startEdit(inv)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
          {inventory.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>No inventory found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
