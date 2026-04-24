import { useState, useEffect } from "react";
import { api } from "../api";

const PLATFORMS = ["Amazon", "Flipkart", "Meesho", "Myntra", "Shopify", "Other"];
const EMPTY_FORM = { storeId: "", productId: "", quantity: "", platform: "" };

export default function Returns() {
  const [tab, setTab] = useState("return");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/stores").then(setStores);
    api.get("/products").then(setProducts);
  }, []);

  useEffect(() => {
    if (form.storeId) {
      api.get(`/inventory?locationType=STORE&locationId=${form.storeId}`).then(setInventory);
    } else {
      setInventory([]);
    }
  }, [form.storeId]);

  const availableQty = () => {
    const entry = inventory.find((i) => i.itemType === "PRODUCT" && i.itemId === form.productId);
    return entry ? entry.quantity : 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const store = stores.find((s) => s.id === form.storeId);
    const product = products.find((p) => p.id === form.productId);
    try {
      if (tab === "return") {
        await api.post("/inventory/add", {
          itemType: "PRODUCT", itemId: form.productId,
          locationType: "STORE", locationId: form.storeId,
          quantity: Number(form.quantity),
        });
      } else {
        await api.post("/inventory/dispatch", {
          itemId: form.productId, locationId: form.storeId, quantity: Number(form.quantity),
        });
      }
      setLog((prev) => [{
        id: Date.now(),
        type: tab,
        time: new Date().toLocaleString(),
        platform: form.platform || "—",
        product: product?.name,
        store: store?.name,
        quantity: form.quantity,
      }, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) { setError(err.message); }
  };

  const isDispatch = tab === "dispatch";

  return (
    <div className="page">
      <h2>Ecom Orders</h2>

      <div className="tab-bar">
        <button type="button" className={!isDispatch ? "tab active" : "tab"} onClick={() => { setTab("return"); setForm(EMPTY_FORM); setError(""); }}>
          📦 Returns (Add Stock)
        </button>
        <button type="button" className={isDispatch ? "tab active" : "tab"} onClick={() => { setTab("dispatch"); setForm(EMPTY_FORM); setError(""); }}>
          🚚 Dispatch (Reduce Stock)
        </button>
      </div>

      <div className="form-block">
        <h3>{isDispatch ? "Dispatch Products to Customer" : "Add Returned Products to Store"}</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option value="">Select Platform (optional)</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value, quantity: "" })} required>
              <option value="">{isDispatch ? "Dispatch from Store" : "Add to Store"}</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              type="number" min="1"
              max={isDispatch && form.productId ? availableQty() : undefined}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder={isDispatch ? "Quantity to dispatch" : "Quantity returned"}
              required
            />
            <button type="submit">{isDispatch ? "Dispatch" : "Add Return"}</button>
          </div>
          {isDispatch && form.storeId && form.productId && (
            <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 4 }}>
              Available in store: <strong>{availableQty()}</strong>
            </p>
          )}
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      {log.length > 0 && (
        <>
          <h3>Activity Log (this session)</h3>
          <table>
            <thead>
              <tr><th>Time</th><th>Type</th><th>Platform</th><th>Product</th><th>Store</th><th>Qty</th></tr>
            </thead>
            <tbody>
              {log.map((l) => (
                <tr key={l.id}>
                  <td>{l.time}</td>
                  <td><span className={`badge ${l.type === "return" ? "badge-green" : "badge-yellow"}`}>{l.type === "return" ? "Return" : "Dispatch"}</span></td>
                  <td>{l.platform}</td>
                  <td>{l.product}</td>
                  <td>{l.store}</td>
                  <td>{l.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
