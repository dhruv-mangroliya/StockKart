import { useEffect, useState } from "react";
import { api } from "../api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const PIE_COLORS = [
  "#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6",
  "#ec4899","#14b8a6","#f97316","#84cc16","#06b6d4","#a855f7",
  "#e11d48","#0ea5e9","#22c55e","#d97706","#7c3aed","#059669",
];

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.04) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

function PieCard({ title, data }) {
  if (!data.length) return (
    <div style={{ flex: 1, minWidth: 280, background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)", textAlign: "center", color: "#6b7280" }}>
      <strong style={{ display: "block", marginBottom: 12, color: "#1e1b4b" }}>{title}</strong>
      No stock data
    </div>
  );
  return (
    <div style={{ flex: 1, minWidth: 280, background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)" }}>
      <strong style={{ display: "block", marginBottom: 16, color: "#1e1b4b", fontSize: "0.95rem" }}>{title}</strong>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={<CustomLabel />}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "0.78rem" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarCard({ title, data, dataKey1, dataKey2 }) {
  if (!data.length) return (
    <div style={{ flex: 1, minWidth: 300, background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)", textAlign: "center", color: "#6b7280" }}>
      <strong style={{ display: "block", marginBottom: 12, color: "#1e1b4b" }}>{title}</strong>
      No stock data
    </div>
  );
  return (
    <div style={{ flex: 1, minWidth: 300, background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)" }}>
      <strong style={{ display: "block", marginBottom: 16, color: "#1e1b4b", fontSize: "0.95rem" }}>{title}</strong>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => v.toLocaleString()} />
          {dataKey2 ? (
            <>
              <Bar dataKey={dataKey1} fill="#6366f1" />
              <Bar dataKey={dataKey2} fill="#f59e0b" />
              <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
            </>
          ) : (
            <Bar dataKey={dataKey1} fill="#6366f1" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeatmapCard({ title, data, locations }) {
  if (!data.length) return (
    <div style={{ width: "100%", background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)", textAlign: "center", color: "#6b7280" }}>
      <strong style={{ display: "block", marginBottom: 12, color: "#1e1b4b" }}>{title}</strong>
      No stock data
    </div>
  );

  const maxValue = Math.max(...data.map(d => d.quantity), 1);
  const getColor = (value) => {
    const ratio = value / maxValue;
    if (ratio === 0) return "#f3f4f6";
    if (ratio < 0.25) return "#fef3c7";
    if (ratio < 0.5) return "#fde047";
    if (ratio < 0.75) return "#fbbf24";
    return "#f59e0b";
  };

  const itemsByLocation = {};
  data.forEach(d => {
    if (!itemsByLocation[d.locationName]) itemsByLocation[d.locationName] = {};
    itemsByLocation[d.locationName][d.itemName] = d.quantity;
  });

  const allItems = [...new Set(data.map(d => d.itemName))];
  const allLocations = locations;

  return (
    <div style={{ width: "100%", background: "rgba(220,225,255,0.45)", borderRadius: 16, padding: 24, border: "1px solid rgba(99,102,241,0.2)" }}>
      <strong style={{ display: "block", marginBottom: 16, color: "#1e1b4b", fontSize: "0.95rem" }}>{title}</strong>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Item</th>
              {allLocations.map(loc => (
                <th key={loc} style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>{loc}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allItems.map(item => (
              <tr key={item}>
                <td style={{ padding: "8px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{item}</td>
                {allLocations.map(loc => {
                  const qty = itemsByLocation[loc]?.[item] || 0;
                  return (
                    <td
                      key={`${item}-${loc}`}
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        background: getColor(qty),
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: 600,
                        color: qty > maxValue * 0.6 ? "white" : "#374151",
                      }}
                      title={`${qty.toLocaleString()} units`}
                    >
                      {qty > 0 ? qty.toLocaleString() : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 12, fontSize: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#f3f4f6", borderRadius: 2 }} />
          <span>Empty</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#fef3c7", borderRadius: 2 }} />
          <span>Low</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#fde047", borderRadius: 2 }} />
          <span>Medium</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#fbbf24", borderRadius: 2 }} />
          <span>High</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "#f59e0b", borderRadius: 2 }} />
          <span>Very High</span>
        </div>
      </div>
    </div>
  );
}

export default function VisualiseInventory() {
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [producers, setProducers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [productionOrders, setProductionOrders] = useState([]);

  const [mode, setMode] = useState("location");
  const [locationType, setLocationType] = useState("STORE");
  const [locationId, setLocationId] = useState("");
  const [vizItemType, setVizItemType] = useState("RAW");
  const [vizItemId, setVizItemId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    api.get("/stores").then(setStores);
    api.get("/producers").then(setProducers);
    api.get("/raw-materials").then(setRawMaterials);
    api.get("/products").then(setProducts);
    api.get("/inventory").then(setInventory);
    api.get("/production-orders").then(setProductionOrders);
  }, []);

  const getItemLabel = (type, id) => {
    if (type === "RAW") {
      const r = rawMaterials.find((x) => x.id === id);
      return r ? `${r.name} (${r.color})` : id;
    }
    const p = products.find((x) => x.id === id);
    return p ? p.name : id;
  };

  const createdOrders = productionOrders.filter(o => o.status === "CREATED");
  
  const filteredOrders = selectedProductId 
    ? createdOrders.filter(o => o.productId === selectedProductId)
    : createdOrders;

  const ordersByProducer = {};
  filteredOrders.forEach(order => {
    if (!ordersByProducer[order.producerId]) {
      ordersByProducer[order.producerId] = 0;
    }
    ordersByProducer[order.producerId] += order.requiredQuantity || 0;
  });

  const producerOrderData = producers
    .filter(p => ordersByProducer[p.id])
    .map(p => ({
      name: p.name,
      quantity: ordersByProducer[p.id],
    }));

  const totalPendingQuantity = producerOrderData.reduce((sum, d) => sum + d.quantity, 0);

  const locationList = locationType === "STORE" ? stores : producers;

  const selectedLocInv = locationId
    ? inventory.filter(i => i.locationType === locationType && i.locationId === locationId && i.quantity > 0)
    : [];

  const itemBreakdownData = selectedLocInv.map(i => ({
    name: getItemLabel(i.itemType, i.itemId),
    value: i.quantity,
  }));

  const rawTotal = selectedLocInv.filter(i => i.itemType === "RAW").reduce((s, i) => s + i.quantity, 0);
  const productTotal = selectedLocInv.filter(i => i.itemType === "PRODUCT").reduce((s, i) => s + i.quantity, 0);
  const typeBreakdownData = [
    rawTotal > 0 && { name: "Raw Material", value: rawTotal },
    productTotal > 0 && { name: "Product", value: productTotal },
  ].filter(Boolean);

  const allLocationsBarData = locationList.map(loc => {
    const locInv = inventory.filter(i => i.locationType === locationType && i.locationId === loc.id && i.quantity > 0);
    const raw = locInv.filter(i => i.itemType === "RAW").reduce((s, i) => s + i.quantity, 0);
    const prod = locInv.filter(i => i.itemType === "PRODUCT").reduce((s, i) => s + i.quantity, 0);
    return { name: loc.name, "Raw Material": raw, "Product": prod };
  }).filter(d => d["Raw Material"] > 0 || d["Product"] > 0);

  const heatmapData = [];
  locationList.forEach(loc => {
    inventory.filter(i => i.locationType === locationType && i.locationId === loc.id && i.quantity > 0).forEach(inv => {
      heatmapData.push({
        locationName: loc.name,
        itemName: getItemLabel(inv.itemType, inv.itemId),
        quantity: inv.quantity,
      });
    });
  });

  const allItems = [
    ...rawMaterials.map(r => ({ type: "RAW", id: r.id, label: `${r.name} (${r.color})` })),
    ...products.map(p => ({ type: "PRODUCT", id: p.id, label: p.name })),
  ];

  const selectedItemInv = vizItemId
    ? inventory.filter(i => i.itemType === vizItemType && i.itemId === vizItemId && i.quantity > 0)
    : [];

  const itemLocationData = selectedItemInv.map(i => {
    const locName = i.locationType === "STORE"
      ? (stores.find(s => s.id === i.locationId)?.name || i.locationId)
      : (producers.find(p => p.id === i.locationId)?.name || i.locationId);
    return { name: locName, value: i.quantity };
  });

  const whTotal = selectedItemInv.filter(i => i.locationType === "STORE").reduce((s, i) => s + i.quantity, 0);
  const mfrTotal = selectedItemInv.filter(i => i.locationType === "PRODUCER").reduce((s, i) => s + i.quantity, 0);
  const itemTypeData = [
    whTotal > 0 && { name: "Warehouse", value: whTotal },
    mfrTotal > 0 && { name: "Manufacturer", value: mfrTotal },
  ].filter(Boolean);

  const itemLocationsBarData = selectedItemInv.map(i => {
    const locName = i.locationType === "STORE"
      ? (stores.find(s => s.id === i.locationId)?.name || i.locationId)
      : (producers.find(p => p.id === i.locationId)?.name || i.locationId);
    return { name: locName, quantity: i.quantity };
  });

  const modeTab = (active, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 20px", border: "none", cursor: "pointer",
        fontWeight: active ? "bold" : "normal",
        background: active ? "#6366f1" : "transparent",
        color: active ? "white" : "#6b7280",
        borderBottom: active ? "3px solid #6366f1" : "3px solid transparent",
        borderRadius: 0,
      }}
    >{label}</button>
  );

  const subTab = (active, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 18px", border: "none", cursor: "pointer",
        fontWeight: active ? "bold" : "normal",
        background: active ? "#e0e7ff" : "transparent",
        color: active ? "#4338ca" : "#6b7280",
        borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
        borderRadius: 0,
        fontSize: "0.875rem",
      }}
    >{label}</button>
  );

  return (
    <div className="page">
      <h2>Visualise Inventory</h2>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e5e7eb" }}>
        {modeTab(mode === "location", () => setMode("location"), "By Location")}
        {modeTab(mode === "item", () => setMode("item"), "By Item")}
        {modeTab(mode === "orders", () => setMode("orders"), "Order Status")}
      </div>

      {mode === "location" && (
        <div>
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
            {subTab(locationType === "STORE", () => { setLocationType("STORE"); setLocationId(""); }, "Warehouse")}
            {subTab(locationType === "PRODUCER", () => { setLocationType("PRODUCER"); setLocationId(""); }, "Manufacturer")}
          </div>

          {locationList.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No {locationType === "STORE" ? "warehouses" : "manufacturers"} found.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
              {locationList.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocationId(loc.id)}
                  style={{
                    padding: "7px 18px", borderRadius: 20, border: "1.5px solid",
                    borderColor: locationId === loc.id ? "#6366f1" : "#e5e7eb",
                    background: locationId === loc.id ? "#6366f1" : "white",
                    color: locationId === loc.id ? "white" : "#374151",
                    fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                  }}
                >{loc.name}</button>
              ))}
            </div>
          )}

          {!locationId && locationList.length > 0 && (
            <>
              <h3 style={{ marginBottom: 20 }}>Overview Charts</h3>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40 }}>
                <BarCard title="Stock by Location" data={allLocationsBarData} dataKey1="Raw Material" dataKey2="Product" />
              </div>
              {heatmapData.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 20 }}>Heatmap View</h3>
                  <HeatmapCard title="Item Distribution Across Locations" data={heatmapData} locations={locationList.map(l => l.name)} />
                </>
              )}
            </>
          )}

          {locationId && selectedLocInv.length === 0 && (
            <p style={{ color: "#6b7280" }}>No stock in this location.</p>
          )}

          {locationId && selectedLocInv.length > 0 && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <PieCard title="Item Breakdown" data={itemBreakdownData} />
              <PieCard title="Product vs Raw Material" data={typeBreakdownData} />
            </div>
          )}
        </div>
      )}

      {mode === "item" && (
        <div>
          <div className="form-block">
            <h3>Select Item</h3>
            <div className="form-row">
              <select
                value={vizItemId ? `${vizItemType}:${vizItemId}` : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    const [type, id] = e.target.value.split(":");
                    setVizItemType(type);
                    setVizItemId(id);
                  } else {
                    setVizItemId("");
                  }
                }}
              >
                <option value="">Select Item</option>
                {allItems.map(item => (
                  <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => setVizItemId("")}>Clear</button>
            </div>
          </div>

          {!vizItemId && <p style={{ color: "#6b7280" }}>Select an item above to view charts.</p>}
          {vizItemId && selectedItemInv.length === 0 && (
            <p style={{ color: "#6b7280" }}>No stock found for this item.</p>
          )}
          {vizItemId && selectedItemInv.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40 }}>
                <PieCard title="Stock by Location" data={itemLocationData} />
                <PieCard title="Warehouse vs Manufacturer" data={itemTypeData} />
              </div>
              <h3 style={{ marginBottom: 20 }}>Quantity by Location</h3>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <BarCard title="Item Stock Across Locations" data={itemLocationsBarData} dataKey1="quantity" />
              </div>
            </>
          )}
        </div>
      )}

      {mode === "orders" && (
        <div>
          <div className="form-block">
            <h3>Select Product</h3>
            <div className="form-row">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setSelectedProductId("")}>Clear</button>
            </div>
          </div>

          <div className="form-block">
            <h3>Pending Orders Summary</h3>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Total Pending Quantity:</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#6366f1", marginTop: 4 }}>{totalPendingQuantity.toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Manufacturers with Pending Orders:</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#059669", marginTop: 4 }}>{producerOrderData.length}</div>
              </div>
            </div>
          </div>

          {producerOrderData.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>No pending orders {selectedProductId ? "for this product" : "from manufacturers"}.</p>
          ) : (
            <>
              <h3 style={{ marginBottom: 20 }}>Pending Orders by Manufacturer</h3>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40 }}>
                <BarCard title="Pending Quantity by Manufacturer" data={producerOrderData} dataKey1="quantity" />
                <PieCard title="Order Distribution" data={producerOrderData.map(d => ({ name: d.name, value: d.quantity }))} />
              </div>

              <h3 style={{ marginBottom: 20 }}>Detailed Breakdown</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(220,225,255,0.45)", borderRadius: 16, border: "1px solid rgba(99,102,241,0.2)", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Manufacturer</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Pending Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {producerOrderData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#6366f1", fontWeight: 700 }}>{item.quantity.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
                    <td style={{ padding: "12px 16px", color: "#1e1b4b" }}>Total</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#6366f1" }}>{totalPendingQuantity.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
