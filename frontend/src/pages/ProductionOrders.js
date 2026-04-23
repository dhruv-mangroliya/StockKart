import { useState, useEffect } from "react";
import { api } from "../api";

const EMPTY_FORM = { productId: "", producerId: "", requiredQuantity: 1, inputMaterials: [{ rawMaterialId: "", sourceStoreId: "", quantitySent: 1 }] };

export default function ProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [stores, setStores] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [destStore, setDestStore] = useState({});
  const [returnStore, setReturnStore] = useState({});
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/production-orders").then(setOrders);
    api.get("/products").then(setProducts);
    api.get("/producers").then(setProducers);
    api.get("/stores").then(setStores);
    api.get("/raw-materials").then(setRawMaterials);
  };
  useEffect(() => { loadAll(); }, []);

  const updateMat = (i, field, val) => {
    const mats = [...form.inputMaterials];
    mats[i] = { ...mats[i], [field]: field === "quantitySent" ? Number(val) : val };
    setForm({ ...form, inputMaterials: mats });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/production-orders", form);
      setForm(EMPTY_FORM);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const complete = async (orderId) => {
    setError("");
    const storeId = destStore[orderId];
    if (!storeId) return setError("Select a destination store to complete the order");
    try {
      await api.post(`/production-orders/${orderId}/complete`, { destinationStoreId: storeId });
      setDestStore({ ...destStore, [orderId]: "" });
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const cancelOrder = async (orderId) => {
    setError("");
    const storeId = returnStore[orderId];
    if (!storeId) return setError("Select a return store to cancel the order");
    if (!window.confirm("Cancel this order and return materials to selected store?")) return;
    try {
      await api.delete(`/production-orders/${orderId}`, { returnStoreId: storeId });
      setReturnStore({ ...returnStore, [orderId]: "" });
      loadAll();
    } catch (err) { setError(err.message); }
  };
  const getLabel = (arr, id) => arr.find((x) => x.id === id)?.name || id;
  const getRmLabel = (id) => {
    const r = rawMaterials.find((x) => x.id === id);
    return r ? `${r.name} (${r.color})` : id;
  };

  return (
    <div className="page">
      <h2>Production Orders</h2>

      <div className="form-block">
        <h3>Create Production Order</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={form.producerId} onChange={(e) => setForm({ ...form, producerId: e.target.value })} required>
              <option value="">Select Producer</option>
              {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min="1" value={form.requiredQuantity} onChange={(e) => setForm({ ...form, requiredQuantity: Number(e.target.value) })} placeholder="Required output qty" required />
          </div>
          <p><strong>Input Materials to Send</strong></p>
          {form.inputMaterials.map((m, i) => (
            <div key={i} className="form-row">
              <select value={m.rawMaterialId} onChange={(e) => updateMat(i, "rawMaterialId", e.target.value)} required>
                <option value="">Select Material</option>
                {rawMaterials.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.color})</option>)}
              </select>
              <select value={m.sourceStoreId} onChange={(e) => updateMat(i, "sourceStoreId", e.target.value)} required>
                <option value="">From Store</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="number" min="1" value={m.quantitySent} onChange={(e) => updateMat(i, "quantitySent", e.target.value)} placeholder="Qty to send" required />
              {form.inputMaterials.length > 1 && (
                <button type="button" onClick={() => setForm({ ...form, inputMaterials: form.inputMaterials.filter((_, j) => j !== i) })}>✕</button>
              )}
            </div>
          ))}
          <div className="form-row">
            <button type="button" onClick={() => setForm({ ...form, inputMaterials: [...form.inputMaterials, { rawMaterialId: "", sourceStoreId: "", quantitySent: 1 }] })}>+ Add Material</button>
            <button type="submit">Create Order</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <h3>All Orders</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Product</th><th>Producer</th><th>Materials Sent</th><th>Required Qty</th><th>Output Qty</th><th>Destination Store</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{orders.indexOf(o) + 1}</td>
              <td>{getLabel(products, o.productId)}</td>
              <td>{getLabel(producers, o.producerId)}</td>
              <td>
                {o.inputMaterials.map((m, i) => (
                  <span key={i}>{getRmLabel(m.rawMaterialId)} × {m.quantitySent} <em style={{ color: "#888" }}>from {getLabel(stores, m.sourceStoreId)}</em>{i < o.inputMaterials.length - 1 ? ", " : ""}</span>
                ))}
              </td>
              <td>{o.requiredQuantity}</td>
              <td>{o.outputQuantity || "-"}</td>
              <td>{o.destinationStoreId ? getLabel(stores, o.destinationStoreId) : "-"}</td>
              <td><span className={`badge ${o.status === "COMPLETED" ? "badge-green" : "badge-yellow"}`}>{o.status}</span></td>
              <td>
                {o.status === "CREATED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="form-row">
                      <select value={destStore[o.id] || ""} onChange={(e) => setDestStore({ ...destStore, [o.id]: e.target.value })}>
                        <option value="">To Store</option>
                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button onClick={() => complete(o.id)}>Complete</button>
                    </div>
                    <div className="form-row">
                      <select value={returnStore[o.id] || ""} onChange={(e) => setReturnStore({ ...returnStore, [o.id]: e.target.value })}>
                        <option value="">Return to Store</option>
                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button type="button" style={{ background: "#dc2626" }} onClick={() => cancelOrder(o.id)}>Cancel Order</button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="9" style={{ textAlign: "center" }}>No orders yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
