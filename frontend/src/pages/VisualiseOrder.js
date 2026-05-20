import { useEffect, useState } from "react";
import { api } from "../api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

const getISTDate = (daysOffset = 0) => {
  const d = new Date();
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setDate(istDate.getDate() + daysOffset);
  return istDate.toISOString().split("T")[0];
};

export default function VisualiseOrder() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("trends");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fromDate, setFromDate] = useState(getISTDate(-30));
  const [toDate, setToDate] = useState(getISTDate(0));

  useEffect(() => {
    api.get("/ecom-batches").then(setBatches);
    api.get("/products").then(setProducts);
  }, []);

  const filterByDateRange = (data) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return data.filter((b) => {
      const bDate = new Date(b.createdAt);
      return bDate >= from && bDate <= to;
    });
  };

  const filteredBatches = filterByDateRange(batches);
  const dispatchBatches = filteredBatches.filter((b) => b.type === "dispatch");
  const returnBatches = filteredBatches.filter((b) => b.type === "return");

  // Calculate daily trends
  const dailyTrends = {};
  filteredBatches.forEach((batch) => {
    const date = new Date(batch.createdAt).toLocaleDateString();
    if (!dailyTrends[date]) {
      dailyTrends[date] = { date, dispatch: 0, return: 0 };
    }
    const qty = batch.items.reduce((sum, item) => sum + item.quantity, 0);
    if (batch.type === "dispatch") {
      dailyTrends[date].dispatch += qty;
    } else {
      dailyTrends[date].return += qty;
    }
  });
  const trendData = Object.values(dailyTrends).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Overall stats
  const totalDispatched = dispatchBatches.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0);
  const totalReturned = returnBatches.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0);
  const returnRate = totalDispatched > 0 ? ((totalReturned / totalDispatched) * 100).toFixed(2) : 0;

  // Overall dispatch vs return pie
  const overallData = [
    { name: "Dispatched", value: totalDispatched },
    { name: "Returned", value: totalReturned },
  ].filter((d) => d.value > 0);

  // Item-wise breakdown
  const itemStats = {};
  filteredBatches.forEach((batch) => {
    batch.items.forEach((item) => {
      if (!itemStats[item.productId]) {
        itemStats[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          dispatch: 0,
          return: 0,
        };
      }
      if (batch.type === "dispatch") {
        itemStats[item.productId].dispatch += item.quantity;
      } else {
        itemStats[item.productId].return += item.quantity;
      }
    });
  });

  const itemWiseData = Object.values(itemStats)
    .map((item) => ({
      ...item,
      returnRate: item.dispatch > 0 ? ((item.return / item.dispatch) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.dispatch - a.dispatch);

  // Item-wise dispatch vs return pie
  const itemDispatchData = itemWiseData.map((item) => ({
    name: item.productName,
    value: item.dispatch,
  }));

  const itemReturnData = itemWiseData.map((item) => ({
    name: item.productName,
    value: item.return,
  }));

  // Get selected product trends
  const getSelectedProductTrends = () => {
    if (!selectedProduct) return [];
    const itemTrends = {};
    filteredBatches.forEach((batch) => {
      const batchItem = batch.items.find((i) => i.productId === selectedProduct);
      if (batchItem) {
        const date = new Date(batch.createdAt).toLocaleDateString();
        if (!itemTrends[date]) {
          itemTrends[date] = { date, dispatch: 0, return: 0 };
        }
        if (batch.type === "dispatch") {
          itemTrends[date].dispatch += batchItem.quantity;
        } else {
          itemTrends[date].return += batchItem.quantity;
        }
      }
    });
    return Object.values(itemTrends).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const selectedProductTrends = getSelectedProductTrends();
  const selectedProductName = itemWiseData.find((item) => item.productId === selectedProduct)?.productName || "";
  const selectedItem = itemWiseData.find((item) => item.productId === selectedProduct);
  const selectedProductPieData = selectedItem ? [
    { name: "Dispatched", value: selectedItem.dispatch },
    { name: "Returned", value: selectedItem.return },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="page">
      <h2>Visualise Orders</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setTab("trends")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: tab === "trends" ? "#6366f1" : "transparent",
            color: tab === "trends" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: tab === "trends" ? "bold" : "normal",
            borderBottom: tab === "trends" ? "3px solid #6366f1" : "none",
          }}
        >
          Trends
        </button>
        <button
          onClick={() => setTab("itemTrends")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: tab === "itemTrends" ? "#6366f1" : "transparent",
            color: tab === "itemTrends" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: tab === "itemTrends" ? "bold" : "normal",
            borderBottom: tab === "itemTrends" ? "3px solid #6366f1" : "none",
          }}
        >
          Item Trends
        </button>
        <button
          onClick={() => setTab("stats")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: tab === "stats" ? "#6366f1" : "transparent",
            color: tab === "stats" ? "white" : "#6b7280",
            cursor: "pointer",
            fontWeight: tab === "stats" ? "bold" : "normal",
            borderBottom: tab === "stats" ? "3px solid #6366f1" : "none",
          }}
        >
          Overall Stats
        </button>
      </div>

      {tab === "trends" && (
        <div>
          <div className="form-block">
            <h3>Select Date Range</h3>
            <div className="form-row">
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ padding: "8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ padding: "8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "40px" }}>
            <div style={{ flex: 1, minWidth: "280px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Total Dispatched</div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#6366f1" }}>{totalDispatched.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: "280px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Total Returned</div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#ef4444" }}>{totalReturned.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: "280px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Return Rate</div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#f59e0b" }}>{returnRate}%</div>
            </div>
          </div>

          <h3 style={{ marginBottom: "20px" }}>Daily Trends</h3>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "40px" }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="dispatch" stroke="#6366f1" strokeWidth={2} name="Dispatched" />
                  <Line type="monotone" dataKey="return" stroke="#ef4444" strokeWidth={2} name="Returned" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>No data for selected date range</div>
            )}
          </div>

          <h3 style={{ marginBottom: "20px" }}>Overall Dispatch vs Return</h3>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
            {overallData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={overallData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {overallData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>No data for selected date range</div>
            )}
          </div>

          <h3 style={{ marginBottom: "20px", marginTop: "40px" }}>Item-wise Dispatch vs Return</h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <strong style={{ display: "block", marginBottom: "16px", color: "#1e1b4b" }}>Dispatch by Item</strong>
              {itemDispatchData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={itemDispatchData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {itemDispatchData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>No dispatch data</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: "300px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <strong style={{ display: "block", marginBottom: "16px", color: "#1e1b4b" }}>Return by Item</strong>
              {itemReturnData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={itemReturnData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {itemReturnData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>No return data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "itemTrends" && (
        <div>
          <div className="form-block">
            <h3>Select Date Range and Product</h3>
            <div className="form-row">
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ padding: "8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ padding: "8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ padding: "8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                >
                  <option value="">Select a product</option>
                  {itemWiseData.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedProduct && selectedProductTrends.length > 0 ? (
            <div>
              <h3 style={{ marginBottom: "20px", marginTop: "20px" }}>{selectedProductName} - Trends</h3>
              <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "40px" }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={selectedProductTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dispatch" stroke="#6366f1" strokeWidth={2} name="Dispatched" />
                    <Line type="monotone" dataKey="return" stroke="#ef4444" strokeWidth={2} name="Returned" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3 style={{ marginBottom: "20px" }}>{selectedProductName} - Dispatch vs Return</h3>
              <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
                {selectedProductPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={selectedProductPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {selectedProductPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString()} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>No data available</div>
                )}
              </div>
            </div>
          ) : selectedProduct ? (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px", marginTop: "20px" }}>No data for selected product and date range</div>
          ) : (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "40px", marginTop: "20px" }}>Please select a product to view trends</div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "40px" }}>
            <div style={{ flex: 1, minWidth: "200px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Total Orders</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#6366f1" }}>{filteredBatches.length}</div>
            </div>
            <div style={{ flex: 1, minWidth: "200px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Dispatch Orders</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#10b981" }}>{dispatchBatches.length}</div>
            </div>
            <div style={{ flex: 1, minWidth: "200px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Return Orders</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#ef4444" }}>{returnBatches.length}</div>
            </div>
            <div style={{ flex: 1, minWidth: "200px", background: "rgba(220,225,255,0.45)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Avg Return Rate</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#f59e0b" }}>{returnRate}%</div>
            </div>
          </div>

          <h3 style={{ marginBottom: "20px" }}>Item-wise Overview</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(220,225,255,0.45)", borderRadius: "16px", border: "1px solid rgba(99,102,241,0.2)", overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Product</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Dispatched</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Returned</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", color: "#1e1b4b", borderBottom: "2px solid #e5e7eb" }}>Return Rate</th>
                </tr>
              </thead>
              <tbody>
                {itemWiseData.length > 0 ? (
                  itemWiseData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px", color: "#374151", fontWeight: "600" }}>{item.productName}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#10b981", fontWeight: "600" }}>{item.dispatch.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#ef4444", fontWeight: "600" }}>{item.return.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#f59e0b", fontWeight: "600" }}>{item.returnRate}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginBottom: "20px", marginTop: "40px" }}>Key Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <strong style={{ color: "#1e1b4b" }}>Top Dispatched Product:</strong>
              <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                {itemWiseData.length > 0 ? `${itemWiseData[0].productName} (${itemWiseData[0].dispatch.toLocaleString()} units)` : "No data"}
              </span>
            </div>
            <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <strong style={{ color: "#1e1b4b" }}>Highest Return Rate:</strong>
              <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                {itemWiseData.length > 0
                  ? `${itemWiseData.reduce((max, item) => (parseFloat(item.returnRate) > parseFloat(max.returnRate) ? item : max)).productName} (${itemWiseData.reduce((max, item) => (parseFloat(item.returnRate) > parseFloat(max.returnRate) ? item : max)).returnRate}%)`
                  : "No data"}
              </span>
            </div>
            <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)" }}>
              <strong style={{ color: "#1e1b4b" }}>Overall Health:</strong>
              <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                {returnRate < 5 ? "Excellent - Low return rate" : returnRate < 10 ? "Good - Moderate return rate" : "Needs attention - High return rate"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
