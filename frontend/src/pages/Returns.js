import { useState, useEffect } from "react";
import { api } from "../api";

const PLATFORMS = ["Amazon", "Flipkart", "Meesho", "Myntra", "Shopify", "Other"];
const EMPTY_ITEM = { productId: "", quantity: "" };

export default function Returns() {
  const [tab, setTab] = useState("return");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Batch header
  const [platform, setPlatform] = useState("");
  const [storeId, setStoreId] = useState("");

  // Current item row being filled
  const [item, setItem] = useState(EMPTY_ITEM);

  // Pending list for this batch
  const [pending, setPending] = useState([]);

  // Confirmed session log (list of batches)
  const [batches, setBatches] = useState([]);

  const [error, setError] = useState("");
  const isDispatch = tab === "dispatch";

  useEffect(() => {
    api.get("/stores").then(setStores);
    api.get("/products").then(setProducts);
    api.get("/ecom-batches").then(setBatches);
  }, []);

  useEffect(() => {
    if (storeId) {
      api.get(`/inventory?locationType=STORE&locationId=${storeId}`).then(setInventory);
    } else {
      setInventory([]);
    }
  }, [storeId]);

  const availableQty = (productId) => {
    const entry = inventory.find((i) => i.itemType === "PRODUCT" && i.itemId === productId);
    return entry ? entry.quantity : 0;
  };

  const switchTab = (t) => {
    setTab(t);
    setPlatform("");
    setStoreId("");
    setItem(EMPTY_ITEM);
    setPending([]);
    setError("");
  };

  const addToPending = (e) => {
    e.preventDefault();
    setError("");
    if (!storeId) return setError("Select a store first.");
    if (!item.productId || !item.quantity) return setError("Select a product and enter quantity.");
    const product = products.find((p) => p.id === item.productId);
    setPending((prev) => [...prev, {
      id: Date.now(),
      productId: item.productId,
      productName: product?.name,
      quantity: Number(item.quantity),
    }]);
    setItem(EMPTY_ITEM);
  };

  const removePending = (id) => setPending((prev) => prev.filter((p) => p.id !== id));

  const confirm = async () => {
    setError("");
    if (!pending.length) return setError("Add at least one item before confirming.");
    try {
      const batch = await api.post("/ecom-batches", { type: tab, platform, storeId, items: pending });
      setBatches((prev) => [batch, ...prev]);
      setPending([]);
      setItem(EMPTY_ITEM);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h2>Ecom Orders</h2>

      <div className="tab-bar">
        <button type="button" className={!isDispatch ? "tab active" : "tab"} onClick={() => switchTab("return")}>
          📦 Returns (Add Stock)
        </button>
        <button type="button" className={isDispatch ? "tab active" : "tab"} onClick={() => switchTab("dispatch")}>
          🚚 Dispatch (Reduce Stock)
        </button>
      </div>

      <div className="form-block">
        <h3>{isDispatch ? "Dispatch Products to Customer" : "Add Returned Products to Store"}</h3>

        {/* Batch header */}
        <div className="form-row">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Select Platform (optional)</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setItem(EMPTY_ITEM); }} required>
            <option value="">{isDispatch ? "Dispatch from Store" : "Add to Store"}</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Per-item row */}
        <form onSubmit={addToPending}>
          <div className="form-row" style={{ marginTop: 8 }}>
            <select value={item.productId} onChange={(e) => setItem({ ...item, productId: e.target.value })} required>
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              type="number" min="0.001" step="any"
              max={isDispatch && item.productId ? availableQty(item.productId) : undefined}
              value={item.quantity}
              onChange={(e) => setItem({ ...item, quantity: e.target.value })}
              placeholder={isDispatch ? "Qty to dispatch" : "Qty returned"}
              required
            />
            <button type="submit">Add</button>
          </div>
          {isDispatch && storeId && item.productId && (
            <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 4 }}>
              Available in store: <strong>{availableQty(item.productId)}</strong>
            </p>
          )}
        </form>

        {error && <p className="error">{error}</p>}

        {/* Pending list */}
        {pending.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Pending ({pending.length} item{pending.length > 1 ? "s" : ""})</strong>
            <table style={{ marginTop: 6 }}>
              <thead>
                <tr><th>Product</th><th>Quantity</th><th></th></tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td>{p.productName}</td>
                    <td>{p.quantity}</td>
                    <td><button type="button" style={{ background: "#dc2626" }} onClick={() => removePending(p.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={confirm} style={{ background: "#16a34a" }}>
                ✓ Confirm {isDispatch ? "Dispatch" : "Return"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session log as cards */}
      {batches.length > 0 && (
        <>
          <h3>Activity Log (this session)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {batches.map((b) => (
              <div key={b.id} className="form-block" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className={`badge ${b.type === "return" ? "badge-green" : "badge-yellow"}`}>
                    {b.type === "return" ? "Return" : "Dispatch"}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{b.time || new Date(b.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: 8 }}>
                  <strong>{b.type === "return" ? "Returned to" : "Dispatched from"}:</strong> {b.store} {(b.platform && b.platform !== "—") && <> &nbsp;|&nbsp; <strong>Platform:</strong> {b.platform}</>}
                </div>
                <table style={{ margin: 0 }}>
                  <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
                  <tbody>
                    {b.items.map((it, i) => (
                      <tr key={i}><td>{it.productName}</td><td>{it.quantity}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
