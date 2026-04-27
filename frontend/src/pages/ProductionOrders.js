import { useState, useEffect } from "react";
import { api } from "../api";

const EMPTY_FORM = { productId: "", producerId: "", requiredQuantity: 1 };

export default function ProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [destStore, setDestStore] = useState({});
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/production-orders").then(setOrders);
    api.get("/products").then(setProducts);
    api.get("/producers").then(setProducers);
    api.get("/stores").then(setStores);
  };
  useEffect(() => { loadAll(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/production-orders", form);
      setForm((f) => ({ ...f, requiredQuantity: 1 }));
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
    if (!window.confirm("Cancel this production order?")) return;
    try {
      await api.delete(`/production-orders/${orderId}`);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const getLabel = (arr, id) => arr.find((x) => x.id === id)?.name || id;

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
            <input type="number" min="0.001" step="any" value={form.requiredQuantity} onChange={(e) => setForm({ ...form, requiredQuantity: Number(e.target.value) })} placeholder="Required output qty" required />
            <button type="submit">Create Order</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <h3>All Orders</h3>
      <div className="orders-table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Producer</th><th>Required Qty</th><th>Output Qty</th><th>Destination Store</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => (
              <tr key={o.id}>
                <td>{idx + 1}</td>
                <td>{getLabel(products, o.productId)}</td>
                <td>{getLabel(producers, o.producerId)}</td>
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
                      <button type="button" style={{ background: "#dc2626" }} onClick={() => cancelOrder(o.id)}>Cancel Order</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center" }}>No orders yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="orders-cards">
        {orders.length === 0 && <p style={{ color: "#888", textAlign: "center", padding: "24px 0" }}>No orders yet</p>}
        {orders.map((o, idx) => (
          <div key={o.id} className="order-card">
            <div className="order-card-header">
              <span className="order-card-num">#{idx + 1}</span>
              <span className={`badge ${o.status === "COMPLETED" ? "badge-green" : "badge-yellow"}`}>{o.status}</span>
            </div>
            <div className="order-card-row"><span>Product</span><strong>{getLabel(products, o.productId)}</strong></div>
            <div className="order-card-row"><span>Producer</span><strong>{getLabel(producers, o.producerId)}</strong></div>
            <div className="order-card-row"><span>Required Qty</span><strong>{o.requiredQuantity}</strong></div>
            <div className="order-card-row"><span>Output Qty</span><strong>{o.outputQuantity || "-"}</strong></div>
            <div className="order-card-row"><span>Destination</span><strong>{o.destinationStoreId ? getLabel(stores, o.destinationStoreId) : "-"}</strong></div>
            {o.status === "CREATED" && (
              <div className="order-card-actions">
                <div className="form-row">
                  <select value={destStore[o.id] || ""} onChange={(e) => setDestStore({ ...destStore, [o.id]: e.target.value })}>
                    <option value="">To Store</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={() => complete(o.id)}>Complete</button>
                </div>
                <button type="button" style={{ background: "#dc2626" }} onClick={() => cancelOrder(o.id)}>Cancel Order</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
