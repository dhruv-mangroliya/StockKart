import { useState, useEffect } from "react";
import { api } from "../api";

export default function ProducerReturn() {
  const [producers, setProducers] = useState([]);
  const [stores, setStores] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [producerStock, setProducerStock] = useState([]);
  const [producerId, setProducerId] = useState("");
  const [toStoreId, setToStoreId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAll = () => {
    api.get("/producers").then(setProducers);
    api.get("/stores").then(setStores);
    api.get("/raw-materials").then(setRawMaterials);
    api.get("/transfers/producer-returns").then(setReturns);
  };

  useEffect(() => { loadAll(); }, []);

  // Load producer's current raw material stock when producer changes
  useEffect(() => {
    if (!producerId) { setProducerStock([]); setMaterials([]); return; }
    api.get(`/inventory?locationType=PRODUCER&locationId=${producerId}`)
      .then((inv) => {
        const stock = inv.filter((i) => i.itemType === "RAW" && i.quantity > 0);
        setProducerStock(stock);
        setMaterials(stock.map((s) => ({ rawMaterialId: s.itemId, quantity: 0, max: s.quantity })));
      });
  }, [producerId]);

  const updateQty = (i, val) => {
    const updated = [...materials];
    updated[i] = { ...updated[i], quantity: Number(val) };
    setMaterials(updated);
  };

  const getRmLabel = (id) => {
    const r = rawMaterials.find((x) => x.id === id);
    return r ? `${r.name} (${r.color})` : id;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const toReturn = materials.filter((m) => m.quantity > 0);
    if (!toReturn.length) return setError("Enter quantity for at least one material");
    try {
      const returnLog = await api.post("/transfers/producer-return", { producerId, toStoreId, materials: toReturn });
      setReturns(prev => [returnLog, ...prev]);
      setSuccess("Materials returned to store successfully");
      setProducerId("");
      setToStoreId("");
      setMaterials([]);
      setProducerStock([]);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h2>Manufacturer Return</h2>
      <div className="form-block">
        <h3>Return Raw Materials from Manufacturer to Store</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <select value={producerId} onChange={(e) => { setProducerId(e.target.value); setError(""); setSuccess(""); }} required>
              <option value="">Select Manufacturer</option>
              {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)} required>
              <option value="">Return to Store</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {producerId && producerStock.length === 0 && (
            <p style={{ color: "#888", fontSize: "0.875rem" }}>This producer has no raw materials in inventory.</p>
          )}

          {producerStock.length > 0 && (
            <>
              <p style={{ marginBottom: 10 }}><strong>Materials held by producer</strong></p>
              <table>
                <thead><tr><th>Material</th><th>Available</th><th>Return Qty</th></tr></thead>
                <tbody>
                  {materials.map((m, i) => (
                    <tr key={m.rawMaterialId}>
                      <td>{getRmLabel(m.rawMaterialId)}</td>
                      <td>{m.max}</td>
                      <td>
                        <input
                          type="number" min="0" max={m.max}
                          value={m.quantity}
                          onChange={(e) => updateQty(i, e.target.value)}
                          style={{ width: 90 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="form-row" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setMaterials(materials.map((m) => ({ ...m, quantity: m.max })))}
                >
                  Return All
                </button>
                <button type="submit">Confirm Return</button>
              </div>
            </>
          )}
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "0.875rem", marginTop: 8 }}>✓ {success}</p>}
      </div>

      {returns.length > 0 && (
        <>
          <h3>Return History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {returns.map((r) => (
              <div key={r.id} className="form-block" style={{ margin: 0 }}>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>From Manufacturer</th>
                      <th>To Store</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.materials.map((mat, i) => (
                      <tr key={i}>
                        <td>{mat.rawMaterialName}</td>
                        <td>{mat.quantity}</td>
                        <td>{r.producer}</td>
                        <td>{r.store}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
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
