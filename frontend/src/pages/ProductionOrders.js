import { useState, useEffect } from "react";
import { api } from "../api";

const EMPTY_FORM = { productId: "", producerId: "", requiredQuantity: "" };

export default function ProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, setPending] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [selectedStore, setSelectedStore] = useState("");
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/production-orders").then(setOrders);
    api.get("/products").then(setProducts);
    api.get("/producers").then(setProducers);
    api.get("/stores").then(setStores);
  };
  useEffect(() => { loadAll(); }, []);

  const addToPending = (e) => {
    e.preventDefault();
    setError("");
    if (!form.productId || !form.producerId || !form.requiredQuantity) {
      return setError("Fill all fields before adding to pending list.");
    }
    const product = products.find((p) => p.id === form.productId);
    const producer = producers.find((p) => p.id === form.producerId);
    setPending((prev) => [...prev, {
      id: Date.now(),
      productId: form.productId,
      productName: product?.name,
      producerId: form.producerId,
      producerName: producer?.name,
      requiredQuantity: Number(form.requiredQuantity),
    }]);
    setForm(EMPTY_FORM);
  };

  const removePending = (id) => setPending((prev) => prev.filter((p) => p.id !== id));

  const submitAll = async () => {
    setError("");
    if (!pending.length) return setError("Add at least one order before submitting.");
    try {
      for (const item of pending) {
        await api.post("/production-orders", {
          productId: item.productId,
          producerId: item.producerId,
          requiredQuantity: item.requiredQuantity,
        });
      }
      setPending([]);
      setForm(EMPTY_FORM);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const openCompleteModal = (orderId) => {
    setShowModal(orderId);
    setSelectedStore("");
    setError("");
  };

  const closeModal = () => {
    setShowModal(null);
    setSelectedStore("");
    setError("");
  };

  const complete = async () => {
    setError("");
    if (!selectedStore) return setError("Select a destination warehouse");
    try {
      await api.post(`/production-orders/${showModal}/complete`, { destinationStoreId: selectedStore });
      closeModal();
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

  const deleteCompletedOrder = async (order) => {
    setError("");
    if (!window.confirm("Delete this completed order? This will reverse the inventory transaction.")) return;
    try {
      await api.delete(`/production-orders/${order.id}/completed`);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const getLabel = (arr, id) => arr.find((x) => x.id === id)?.name || id;

  return (
    <div className="page">
      <h2>Production Orders</h2>

      <div className="form-block">
        <h3>Create Production Order</h3>
        <form onSubmit={addToPending}>
          <div className="form-row">
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={form.producerId} onChange={(e) => setForm({ ...form, producerId: e.target.value })} required>
              <option value="">Select Manufacturer</option>
              {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              type="number"
              min="0.001"
              step="any"
              value={form.requiredQuantity}
              onChange={(e) => setForm({ ...form, requiredQuantity: e.target.value })}
              placeholder="Required output qty"
              required
            />
            <button type="submit">Add to List</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}

        {/* Pending list */}
        {pending.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Pending Orders ({pending.length} order{pending.length > 1 ? "s" : ""})</strong>
            <table style={{ marginTop: 6 }}>
              <thead>
                <tr><th>Product</th><th>Manufacturer</th><th>Required Qty</th><th></th></tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td>{p.productName}</td>
                    <td>{p.producerName}</td>
                    <td>{p.requiredQuantity}</td>
                    <td><button type="button" style={{ background: "#dc2626" }} onClick={() => removePending(p.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={submitAll} style={{ background: "#16a34a" }}>
                ✓ Submit All Orders
              </button>
            </div>
          </div>
        )}
      </div>

      <h3>All Orders</h3>
      <div className="orders-table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Manufacturer</th><th>Required Qty</th><th>Output Qty</th><th>Destination Warehouse</th><th>Created Date</th><th>Completed Date</th><th>Status</th><th>Action</th></tr>
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
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.completedAt ? new Date(o.completedAt).toLocaleDateString() : "-"}</td>
                <td><span className={`badge ${o.status === "COMPLETED" ? "badge-green" : "badge-yellow"}`}>{o.status}</span></td>
                <td>
                  {o.status === "CREATED" && (
                    <div className="form-row">
                      <button type="button" onClick={() => openCompleteModal(o.id)} style={{ background: "#16a34a" }}>Complete</button>
                      <button type="button" style={{ background: "#dc2626" }} onClick={() => cancelOrder(o.id)}>Cancel</button>
                    </div>
                  )}
                  {o.status === "COMPLETED" && (
                    <button type="button" style={{ background: "#dc2626", width: "80px" }} onClick={() => deleteCompletedOrder(o)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="10" style={{ textAlign: "center" }}>No orders yet</td></tr>}
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
            <div className="order-card-row"><span>Manufacturer</span><strong>{getLabel(producers, o.producerId)}</strong></div>
            <div className="order-card-row"><span>Required Qty</span><strong>{o.requiredQuantity}</strong></div>
            <div className="order-card-row"><span>Output Qty</span><strong>{o.outputQuantity || "-"}</strong></div>
            <div className="order-card-row"><span>Destination</span><strong>{o.destinationStoreId ? getLabel(stores, o.destinationStoreId) : "-"}</strong></div>
            <div className="order-card-row"><span>Created Date</span><strong>{new Date(o.createdAt).toLocaleDateString()}</strong></div>
            <div className="order-card-row"><span>Completed Date</span><strong>{o.completedAt ? new Date(o.completedAt).toLocaleDateString() : "-"}</strong></div>
            {o.status === "CREATED" && (
              <div className="order-card-actions">
                <button type="button" onClick={() => openCompleteModal(o.id)} style={{ background: "#16a34a" }}>Complete</button>
                <button type="button" style={{ background: "#dc2626" }} onClick={() => cancelOrder(o.id)}>Cancel</button>
              </div>
            )}
            {o.status === "COMPLETED" && (
              <div className="order-card-actions">
                <button type="button" style={{ background: "#dc2626", width: "100%" }} onClick={() => deleteCompletedOrder(o)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for selecting destination store */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Select Destination Warehouse</h3>
            <p>Choose the warehouse where this product will be delivered:</p>
            <div className="form-row" style={{ marginTop: 16 }}>
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} required>
                <option value="">Select Warehouse</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-row" style={{ marginTop: 16 }}>
              <button onClick={complete} style={{ background: "#16a34a" }}>Confirm</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
