import { useState, useEffect } from "react";
import { api } from "../api";

export default function Transfers() {
  const [stores, setStores] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ itemType: "RAW", itemId: "", fromStoreId: "", toStoreId: "", quantity: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/stores").then(setStores);
    api.get("/raw-materials").then(setRawMaterials);
    api.get("/products").then(setProducts);
    api.get("/transfers").then(setTransfers);
  };

  useEffect(() => { loadAll(); }, []);

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
      const transferLog = await api.post("/transfers", { ...form, quantity: Number(form.quantity) });
      setTransfers(prev => [transferLog, ...prev]);
      setSuccess(`Successfully transferred ${form.quantity} unit(s)`);
      setForm((f) => ({ ...f, quantity: "" }));
    } catch (err) { setError(err.message); }
  };

  const deleteTransfer = async (transfer) => {
    if (!window.confirm("Delete this transfer? This will reverse the transaction.")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/transfers/${transfer.id}`);
      setTransfers(prev => prev.filter(t => t.id !== transfer.id));
      setSuccess(`Transfer reversed: ${transfer.quantity} unit(s) transferred from ${transfer.toStore} to ${transfer.fromStore}`);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h2>Warehouse Transfer</h2>
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
              <option value="">From Warehouse</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.toStoreId} onChange={(e) => setForm({ ...form, toStoreId: e.target.value })} required>
              <option value="">To Warehouse</option>
              {stores.filter((s) => s.id !== form.fromStoreId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {form.fromStoreId && form.itemId && (
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 8 }}>
              Available in source warehouse: <strong>{availableQty()}</strong>
            </p>
          )}
          <div className="form-row">
            <input
              type="number" min="0.001" step="any" max={availableQty() || undefined}
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

      {transfers.length > 0 && (
        <>
          <h3>Transfer History</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>From Warehouse</th>
                <th>To Warehouse</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td>{t.itemName}</td>
                  <td>{t.itemType === "RAW" ? "Raw Material" : "Product"}</td>
                  <td>{t.quantity}</td>
                  <td>{t.fromStore}</td>
                  <td>{t.toStore}</td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => deleteTransfer(t)}
                      style={{ background: "#dc2626", width: "80px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
