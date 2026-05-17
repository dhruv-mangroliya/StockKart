import React, { useEffect, useState } from "react";
import { api } from "../api";

const styles = `
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [globalStock, setGlobalStock] = useState([]);
  const [stores, setStores] = useState([]);
  const [producers, setProducers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("total");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempFilterItemId, setTempFilterItemId] = useState("");
  const [tempFilterItemType, setTempFilterItemType] = useState("");
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
    api.get("/inventory").then(setInventory);
    api.get("/inventory/global-stock").then(setGlobalStock);
  };

  const getFilteredItems = () => {
    const allItems = [];
    rawMaterials.forEach((r) => {
      allItems.push({ type: "RAW", id: r.id, label: `${r.name} (${r.color})`, name: r.name, color: r.color });
    });
    products.forEach((p) => {
      allItems.push({ type: "PRODUCT", id: p.id, label: p.name, name: p.name, color: "" });
    });
    
    if (!searchQuery.trim()) return allItems;
    
    const query = searchQuery.toLowerCase().replace(/[()]/g, "").trim();
    return allItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const colorMatch = item.color && item.color.toLowerCase().includes(query);
      return nameMatch || colorMatch;
    });
  };

  const getFilteredInventoryByItem = () => {
    if (!tempFilterItemId || !tempFilterItemType) return inventory;
    
    return inventory.filter((inv) =>
      inv.itemType === tempFilterItemType && inv.itemId === tempFilterItemId
    );
  };

  const getFilteredGlobalStockByItem = () => {
    if (!tempFilterItemId || !tempFilterItemType) return globalStock;
    
    return globalStock.filter((g) =>
      g.itemType === tempFilterItemType && g.itemId === tempFilterItemId
    );
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const getSortedInventory = (data) => {
    const sorted = [...data].sort((a, b) => {
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

  const getSortedGlobalStock = (data) =>
    [...data].sort((a, b) => {
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
    rawMaterials.forEach((r) => {
      allItems.push({ type: "RAW", id: r.id, label: `${r.name} (${r.color})` });
    });
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
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const startEdit = (inv) => { setEditing(inv.id); setEditQty(String(inv.quantity)); setError(""); };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.put(`/inventory/${id}`, { quantity: Number(editQty) });
      cancelEdit();
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const renderInventoryTable = (data) => (
    <table>
      <thead>
        <tr>
          <th style={{ cursor: "pointer" }} onClick={() => handleSort("itemId")}>Item{getSortIndicator("itemId")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleSort("itemType")}>Item Type{getSortIndicator("itemType")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleSort("locationId")}>Location{getSortIndicator("locationId")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleSort("locationType")}>Warehouse Type{getSortIndicator("locationType")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleSort("quantity")}>Quantity{getSortIndicator("quantity")}</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((inv) => (
          <tr key={inv.id}>
            <td>{getItemLabel(inv.itemType, inv.itemId)}</td>
            <td>{inv.itemType === "RAW" ? "Raw Material" : "Product"}</td>
            <td>{getLocationLabel(inv.locationType, inv.locationId)}</td>
            <td>{inv.locationType === "STORE" ? "Warehouse" : "Manufacturer"}</td>
            <td>
              {editing === inv.id
                ? <input type="text" inputMode="numeric" pattern="[0-9.]*" value={editQty} onChange={(e) => setEditQty(e.target.value)} autoFocus style={{ width: 80, padding: "4px 8px" }} />
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
        {data.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>No inventory found</td></tr>}
      </tbody>
    </table>
  );

  const renderGlobalStockTable = (data) => (
    <table>
      <thead>
        <tr>
          <th style={{ cursor: "pointer" }} onClick={() => handleGSort("itemId")}>Item{getGSortIndicator("itemId")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleGSort("itemType")}>Item Type{getGSortIndicator("itemType")}</th>
          <th style={{ cursor: "pointer" }} onClick={() => handleGSort("totalQuantity")}>Total Quantity{getGSortIndicator("totalQuantity")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((g) => (
          <tr key={`${g.itemType}:${g.itemId}`}>
            <td>{getItemLabel(g.itemType, g.itemId)}</td>
            <td>{g.itemType === "RAW" ? "Raw Material" : "Product"}</td>
            <td>{g.totalQuantity}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan="3" style={{ textAlign: "center" }}>No stock found</td></tr>}
      </tbody>
    </table>
  );

  return (
    <>
      <style>{styles}</style>
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
              <option value="STORE">Warehouse</option>
              <option value="PRODUCER">Manufacturer</option>
            </select>
            <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} required>
              <option value="">Select Warehouse</option>
              {locationOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input type="number" min="0.001" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" required />
            <button type="submit">Add Stock</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => {
            setActiveTab("total");
            setSearchQuery("");
            setTempFilterItemType("");
            setTempFilterItemId("");
          }}
          style={{
            padding: "10px 20px",
            border: "none",
            background: activeTab === "total" ? "#3b82f6" : "transparent",
            color: activeTab === "total" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: activeTab === "total" ? "bold" : "normal",
            borderBottom: activeTab === "total" ? "3px solid #3b82f6" : "none"
          }}
        >
          Total Inventory Data
        </button>
        <button
          onClick={() => {
            setActiveTab("name");
            setTempFilterItemType("");
            setTempFilterItemId("");
          }}
          style={{
            padding: "10px 20px",
            border: "none",
            background: activeTab === "name" ? "#3b82f6" : "transparent",
            color: activeTab === "name" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: activeTab === "name" ? "bold" : "normal",
            borderBottom: activeTab === "name" ? "3px solid #3b82f6" : "none"
          }}
        >
          Filter By Name
        </button>
        <button
          onClick={() => {
            setActiveTab("item");
            setSearchQuery("");
          }}
          style={{
            padding: "10px 20px",
            border: "none",
            background: activeTab === "item" ? "#3b82f6" : "transparent",
            color: activeTab === "item" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: activeTab === "item" ? "bold" : "normal",
            borderBottom: activeTab === "item" ? "3px solid #3b82f6" : "none"
          }}
        >
          Filter by Item
        </button>
      </div>

      {activeTab === "total" && (
        <div>
          <h3>Warehouse-wise Stock</h3>
          {renderInventoryTable(getSortedInventory(inventory))}
          <h3 style={{ marginTop: "30px" }}>Global Stock</h3>
          {renderGlobalStockTable(getSortedGlobalStock(globalStock))}
        </div>
      )}

      {activeTab === "name" && (
        <div>
          <div className="form-block">
            <h3>Search by Item Name or Color</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Enter item name or color (e.g., jaam, Red)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={handleClearSearch}>Clear</button>
            </div>
            {searchQuery && getFilteredItems().length > 0 && (
              <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#6b7280" }}>
                Found {getFilteredItems().length} item(s) matching "{searchQuery}"
              </div>
            )}
            {searchQuery && getFilteredItems().length === 0 && (
              <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#dc2626" }}>
                No items found matching "{searchQuery}"
              </div>
            )}
          </div>
          {searchQuery && (
            <div>
              <h3>Warehouse-wise Stock</h3>
              {renderInventoryTable(getSortedInventory(inventory.filter((inv) =>
                getFilteredItems().some((item) => item.type === inv.itemType && item.id === inv.itemId)
              )))}
              <h3 style={{ marginTop: "30px" }}>Global Stock</h3>
              {renderGlobalStockTable(getSortedGlobalStock(globalStock.filter((g) =>
                getFilteredItems().some((item) => item.type === g.itemType && item.id === g.itemId)
              )))}
            </div>
          )}
        </div>
      )}

      {activeTab === "item" && (
        <div>
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
                <option value="">Select Item</option>
                {getAllItems().map((item) => (
                  <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => {
                setTempFilterItemType("");
                setTempFilterItemId("");
              }}>Clear</button>
            </div>
          </div>
          {(tempFilterItemType || tempFilterItemId) ? (
            <div>
              <h3>Warehouse-wise Stock</h3>
              {renderInventoryTable(getSortedInventory(getFilteredInventoryByItem()))}
              <h3 style={{ marginTop: "30px" }}>Global Stock</h3>
              {renderGlobalStockTable(getSortedGlobalStock(getFilteredGlobalStockByItem()))}
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
              Select an item from the dropdown above to filter
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}