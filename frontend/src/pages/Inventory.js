import { useState, useEffect } from "react";
import { api } from "../api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [globalStock, setGlobalStock] = useState([]);
  const [stores, setStores] = useState([]);
  const [producers, setProducers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [tempFilterItemId, setTempFilterItemId] = useState("");
  const [tempFilterItemType, setTempFilterItemType] = useState("");
  const [filterItemId, setFilterItemId] = useState("");
  const [filterItemType, setFilterItemType] = useState("");
  const [sortColumn, setSortColumn] = useState("itemId");
  const [sortOrder, setSortOrder] = useState("asc");
  const [gSortColumn, setGSortColumn] = useState("itemId");
  const [gSortOrder, setGSortOrder] = useState("asc");
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
    if (filterItemType) params.set("itemType", filterItemType);
    if (filterItemId) params.set("itemId", filterItemId);
    api.get(`/inventory?${params}`).then(setInventory);
    api.get("/inventory/global-stock").then(setGlobalStock);
  };

  const handleSearch = () => {
    setFilterItemType(tempFilterItemType);
    setFilterItemId(tempFilterItemId);
  };

  const handleClear = () => {
    setTempFilterItemType("");
    setTempFilterItemId("");
    setFilterItemType("");
    setFilterItemId("");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle sort order if same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and reset to ascending
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const getSortedInventory = () => {
    const sorted = [...inventory].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case "itemId":
          aVal = getItemLabel(a.itemType, a.itemId);
          bVal = getItemLabel(b.itemType, b.itemId);
          break;
        case "itemType":
          aVal = a.itemType;
          bVal = b.itemType;
          break;
        case "locationId":
          aVal = getLocationLabel(a.locationType, a.locationId);
          bVal = getLocationLabel(b.locationType, b.locationId);
          break;
        case "locationType":
          aVal = a.locationType;
          bVal = b.locationType;
          break;
        case "quantity":
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const getSortIndicator = (column) => {
    if (sortColumn !== column) return " ↕";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const handleGSort = (column) => {
    if (gSortColumn === column) {
      setGSortOrder(gSortOrder === "asc" ? "desc" : "asc");
    } else {
      setGSortColumn(column);
      setGSortOrder("asc");
    }
  };

  const getSortedGlobalStock = () =>
    [...globalStock].sort((a, b) => {
      const aVal = gSortColumn === "totalQuantity" ? a.totalQuantity : gSortColumn === "itemType" ? a.itemType : getItemLabel(a.itemType, a.itemId);
      const bVal = gSortColumn === "totalQuantity" ? b.totalQuantity : gSortColumn === "itemType" ? b.itemType : getItemLabel(b.itemType, b.itemId);
      if (aVal < bVal) return gSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return gSortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const getGSortIndicator = (column) => {
    if (gSortColumn !== column) return " ↕";
    return gSortOrder === "asc" ? " ↑" : " ↓";
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadInventory(); }, [filterItemType, filterItemId]);

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

  const getAllItems = () => {
    const allItems = [];
    // Add all raw materials
    rawMaterials.forEach((r) => {
      allItems.push({ type: "RAW", id: r.id, label: `${r.name} (${r.color})` });
    });
    // Add all products
    products.forEach((p) => {
      allItems.push({ type: "PRODUCT", id: p.id, label: p.name });
    });
    return allItems;
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
      setForm((f) => ({ ...f, quantity: "" }));
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
            <input type="number" min="0.001" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" required />
            <button type="submit">Add Stock</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="form-block">
        <h3>Filter by Item</h3>
        <div className="form-row">
          <select value={tempFilterItemId ? `${tempFilterItemType}:${tempFilterItemId}` : ""} onChange={(e) => {
            if (e.target.value) {
              const [type, id] = e.target.value.split(":");
              setTempFilterItemType(type);
              setTempFilterItemId(id);
            } else {
              setTempFilterItemType("");
              setTempFilterItemId("");
            }
          }}>
            <option value="">All Items</option>
            {getAllItems().map((item) => (
              <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleSearch}>Search</button>
          <button type="button" onClick={handleClear}>Clear</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("itemId")}>Item{getSortIndicator("itemId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("itemType")}>Type{getSortIndicator("itemType")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("locationId")}>Location{getSortIndicator("locationId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("locationType")}>Location Type{getSortIndicator("locationType")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("quantity")}>Quantity{getSortIndicator("quantity")}</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {getSortedInventory().map((inv) => (
            <tr key={inv.id}>
              <td>{getItemLabel(inv.itemType, inv.itemId)}</td>
              <td>{inv.itemType}</td>
              <td>{getLocationLabel(inv.locationType, inv.locationId)}</td>
              <td>{inv.locationType}</td>
              <td>
                {editing === inv.id
                  ? <input type="number" min="0" step="any" value={editQty} onChange={(e) => setEditQty(e.target.value)} autoFocus style={{ width: 80 }} />
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

      <h3>Global Stock</h3>
      <table>
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleGSort("itemId")}>Item{getGSortIndicator("itemId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleGSort("itemType")}>Type{getGSortIndicator("itemType")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleGSort("totalQuantity")}>Total Quantity{getGSortIndicator("totalQuantity")}</th>
          </tr>
        </thead>
        <tbody>
          {getSortedGlobalStock().map((g) => (
            <tr key={`${g.itemType}:${g.itemId}`}>
              <td>{getItemLabel(g.itemType, g.itemId)}</td>
              <td>{g.itemType}</td>
              <td>{g.totalQuantity}</td>
            </tr>
          ))}
          {globalStock.length === 0 && <tr><td colSpan="3" style={{ textAlign: "center" }}>No stock found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
