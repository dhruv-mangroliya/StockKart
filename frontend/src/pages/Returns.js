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

  // Edit state
  const [editingBatch, setEditingBatch] = useState(null);
  const [editItems, setEditItems] = useState([]);

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
    setEditingBatch(null);
    setEditItems([]);
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

  const startEdit = (batch) => {
    setEditingBatch(batch.id);
    setEditItems(batch.items.map((item, index) => ({
      id: index,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      newQuantity: ""
    })));
    setError("");
  };

  const cancelEdit = () => {
    setEditingBatch(null);
    setEditItems([]);
    setError("");
  };

  const updateEditItem = (id, newQuantity) => {
    setEditItems(prev => prev.map(item => 
      item.id === id ? { ...item, newQuantity } : item
    ));
  };

  const saveEdit = async () => {
    setError("");
    
    const itemsToUpdate = editItems.filter(item => item.newQuantity !== "");
    if (itemsToUpdate.length === 0) {
      return setError("Enter at least one new quantity to update.");
    }

    for (const item of itemsToUpdate) {
      if (Number(item.newQuantity) < 0) {
        return setError("Quantities cannot be negative.");
      }
    }

    try {
      const batch = batches.find(b => b.id === editingBatch);
      
      const updatedBatch = await api.put(`/ecom-batches/${editingBatch}`, {
        type: batch.type,
        storeId: batch.storeId,
        updates: itemsToUpdate.map(item => ({
          productId: item.productId,
          oldQuantity: item.quantity,
          newQuantity: Number(item.newQuantity)
        }))
      });

      setBatches(prev => prev.map(b => b.id === editingBatch ? updatedBatch : b));
      
      setEditingBatch(null);
      setEditItems([]);
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter batches by current tab
  const filteredBatches = batches.filter(b => b.type === tab);
  const isAnyEditing = editingBatch !== null;

  return (
    <div className="page">
      <h2>Ecom Orders</h2>

      <div className="tab-bar">
        <button type="button" className={isDispatch ? "tab active" : "tab"} onClick={() => switchTab("dispatch")}>
          Dispatch (Reduce Stock)
        </button>
        <button type="button" className={!isDispatch ? "tab active" : "tab"} onClick={() => switchTab("return")}>
          Returns (Add Stock)
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
            <option value="">{isDispatch ? "Dispatch from Warehouse" : "Add to Warehouse"}</option>
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
            <button type="submit" style={{ width: "80px" }}>Add</button>
          </div>
          {isDispatch && storeId && item.productId && (
            <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 4 }}>
              Available in warehouse: <strong>{availableQty(item.productId)}</strong>
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

      {/* Activity log as single table */}
      {filteredBatches.length > 0 && (
        <>
          <h3>Activity Log - {isDispatch ? "Dispatch" : "Returns"}</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                {isAnyEditing && <th>New Quantity</th>}
                <th>Platform</th>
                <th>Warehouse</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => {
                const visibleItems = b.items.filter(item => item.quantity > 0);
                const isEditing = editingBatch === b.id;
                
                return visibleItems.map((it, i) => {
                  const editItem = isEditing ? editItems.find(ei => ei.productId === it.productId) : null;
                  
                  return (
                    <tr key={`${b.id}-${i}`}>
                      <td>{it.productName}</td>
                      <td>{it.quantity}</td>
                      {isAnyEditing && (
                        <td>
                          {isEditing && editItem ? (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={editItem.newQuantity}
                              onChange={(e) => updateEditItem(editItem.id, e.target.value)}
                              placeholder="Enter new qty"
                              style={{ width: "100px" }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      <td>{b.platform || "—"}</td>
                      <td>{b.store}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      {i === 0 && (
                        <td rowSpan={visibleItems.length}>
                          {isEditing ? (
                            <div className="form-row" style={{ gap: "8px" }}>
                              <button 
                                type="button" 
                                onClick={saveEdit}
                                style={{ background: "#16a34a" }}
                              >
                                Save
                              </button>
                              <button 
                                type="button" 
                                onClick={cancelEdit}
                                style={{ background: "#6b7280" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => startEdit(b)}
                              style={{ width: "80px" }}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        </>
      )}
    </div>
  );
}
