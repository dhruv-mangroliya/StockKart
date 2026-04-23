import { useState, useEffect } from "react";
import { api } from "../api";

export default function Transfers() {
  const [stores, setStores] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ itemType: "RAW", itemId: "", fromStoreId: "", toStoreId: "", quantity: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/stores").then(setStores);
    api.get("/raw-materials").then(setRawMaterials);
    api.get("/products").then(setProducts);
  }, []);

  // Load available stock when fromStore or itemType changes
  useEffect(() => {
    if (form.fromStoreId) {
      api.get(`/inventory?locationType=STORE&locationId=${form.fromStoreId}`).then(setInventory);
    } else {
      setInventory([]);
    }
  }, [form.fromStoreId]);

  const itemOptions = form.itemType === "RAW"
    ? rawMaterials.map((r) => ({ id: r.id, label: `${r.name} (${r.color})` }))
    : products.map((p) => ({ id: p.id, label: p.name }));

  const availableQty = () => {
    const entry = inventory.find((i) => i.itemType === form.itemType && i.itemId === form.itemId);
    return entry ? entry.quantity : 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/transfers", { ...form, quantity: Number(form.quantity) });
      setSuccess(`Successfully transferred ${form.quantity} unit(s)`);
      setForm({ itemType: "RAW", itemId: "", fromStoreId: "", toStoreId: "", quantity: "" });
      setInventory([]);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h2>Internal Transfer</h2>
      <div className="form-block">
        <h3>Transfer Stock Between Stores</h3>
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
            <select value={form.fromStoreId} onChange={(e) => setForm({ ...form, fromStoreId: e.target.value, itemId: "", quantity: "" })} required>
              <option value="">From Store</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.toStoreId} onChange={(e) => setForm({ ...form, toStoreId: e.target.value })} required>
              <option value="">To Store</option>
              {stores.filter((s) => s.id !== form.fromStoreId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {form.fromStoreId && form.itemId && (
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 8 }}>
              Available in source store: <strong>{availableQty()}</strong>
            </p>
          )}
          <div className="form-row">
            <input
              type="number" min="1" max={availableQty() || undefined}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Quantity to transfer" required
            />
            <button type="submit">Transfer</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "#16a34a", marginTop: 8, fontSize: "0.875rem" }}>✓ {success}</p>}
      </div>
    </div>
  );
}
