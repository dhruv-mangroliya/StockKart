import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AlertManager() {
  const [alerts, setAlerts] = useState([]);
  const [stores, setStores] = useState([]);
  const [producers, setProducers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ itemType: "RAW", itemId: "", alertQuantity: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(null);
  const [editQty, setEditQty] = useState("");

  const loadAll = async () => {
    try {
      const [storesData, producersData, rawMatsData, productsData, alertsData] = await Promise.all([
        api.get("/stores"),
        api.get("/producers"),
        api.get("/raw-materials"),
        api.get("/products"),
        api.get("/alerts"),
      ]);
      setStores(storesData);
      setProducers(producersData);
      setRawMaterials(rawMatsData);
      setProducts(productsData);
      setAlerts(alertsData || []);
    } catch (err) {
      setError("Failed to load data");
    }
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

  const itemOptions = form.itemType === "RAW"
    ? rawMaterials.map((r) => ({ id: r.id, label: `${r.name} (${r.color})` }))
    : products.map((p) => ({ id: p.id, label: p.name }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/alerts", {
        itemType: form.itemType,
        itemId: form.itemId,
        alertQuantity: Number(form.alertQuantity),
      });
      setForm({ itemType: "RAW", itemId: "", alertQuantity: "" });
      setSuccess("Alert created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to create alert");
    }
  };

  const startEdit = (alert) => {
    const alertId = alert._id || alert.id;
    setEditing(alertId);
    setEditQty(String(alert.alertQuantity));
    setError("");
  };

  const saveEdit = async (id) => {
    setError("");
    if (!id) {
      setError("Invalid alert ID");
      return;
    }
    try {
      await api.put(`/alerts/${id}`, { alertQuantity: Number(editQty) });
      setEditing(null);
      setSuccess("Alert updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to update alert");
    }
  };

  const deleteAlert = async (id) => {
    if (!id) {
      setError("Invalid alert ID");
      return;
    }
    if (window.confirm("Delete this alert?")) {
      try {
        await api.delete(`/alerts/${id}`);
        setSuccess("Alert deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
        loadAll();
      } catch (err) {
        setError(err.message || "Failed to delete alert");
      }
    }
  };

  return (
    <div className="page">
      <h2>Alert Manager</h2>

      <div className="form-block">
        <h3>Create Alert</h3>
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
            <input
              type="number"
              min="0.001"
              step="any"
              value={form.alertQuantity}
              onChange={(e) => setForm({ ...form, alertQuantity: e.target.value })}
              placeholder="Alert Quantity"
              required
            />
            <button type="submit">Create Alert</button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "#059669", fontWeight: "bold" }}>{success}</p>}
      </div>

      <h3>Active Alerts</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Item Type</th>
            <th>Alert Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const alertId = alert._id || alert.id;
            return (
              <tr key={alertId}>
                <td>{getItemLabel(alert.itemType, alert.itemId)}</td>
                <td>{alert.itemType === "RAW" ? "Raw Material" : "Product"}</td>
                <td>
                  {editing === alertId
                    ? <input type="text" inputMode="numeric" pattern="[0-9.]*" value={editQty} onChange={(e) => setEditQty(e.target.value)} autoFocus style={{ width: 80, padding: "4px 8px" }} />
                    : alert.alertQuantity}
                </td>
                <td>
                  {editing === alertId ? (
                    <div className="form-row">
                      <button onClick={() => saveEdit(alertId)}>Save</button>
                      <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="form-row">
                      <button type="button" onClick={() => startEdit(alert)} style={{ width: "80px" }}>Edit</button>
                      <button type="button" onClick={() => deleteAlert(alertId)} style={{ width: "80px", background: "#dc2626" }}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {alerts.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center" }}>No alerts created</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
