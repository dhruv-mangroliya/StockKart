import { useEffect, useState, useCallback } from "react";
import { api } from "../api";

export default function RecommendationEngine() {
  const [recommendations, setRecommendations] = useState([]);
  const [runwayDays, setRunwayDays] = useState(7);
  const [holidaySeverity, setHolidaySeverity] = useState("LOW");

  const loadRecommendations = useCallback(async () => {
    try {
      const data = await api.post("/recommendations/calculate", {
        runwayDays: parseInt(runwayDays),
        holidaySeverity,
      });
      setRecommendations(data.recommendations || []);

      const criticalRecs = (data.recommendations || []).filter(
        (rec) => rec.recommendation.includes("HIGH") || rec.recommendation.includes("URGENT")
      );

      for (const rec of criticalRecs) {
        try {
          await api.post("/alerts", {
            itemType: "PRODUCT",
            itemId: rec.productId,
            alertQuantity: rec.todayDemand,
            description: `Reco. engine suggested ${rec.recommendation.split(" - ")[0]} - ${rec.productName} (Best case: ${rec.canSustainDays.bestCase} days)`,
          });
        } catch (err) {
          console.error(`Failed to create alert for ${rec.productName}:`, err);
        }
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommendations([]);
    }
  }, [runwayDays, holidaySeverity]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes("URGENT")) return "#dc2626";
    if (recommendation.includes("HIGH")) return "#f59e0b";
    return "#10b981";
  };

  const getRecommendationBg = (recommendation) => {
    if (recommendation.includes("URGENT")) return "#fee2e2";
    if (recommendation.includes("HIGH")) return "#fef3c7";
    return "#ecfdf5";
  };

  const getMomentumColor = (status) => {
    if (status === "Trending Up") return "#10b981";
    if (status === "Falling") return "#ef4444";
    return "#6b7280";
  };

  return (
    <div className="page">
      <h2>Recommendation Engine</h2>

      <div className="form-block">
        <h3>Configuration</h3>
        <div className="form-row">
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Runway Days (default 7)
            </label>
            <input
              type="number"
              value={runwayDays}
              onChange={(e) => setRunwayDays(e.target.value)}
              min="1"
              max="30"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
              Holiday Severity
            </label>
            <select
              value={holidaySeverity}
              onChange={(e) => setHolidaySeverity(e.target.value)}
            >
              <option value="LOW">LOW (1x demand)</option>
              <option value="MEDIUM">MEDIUM (1.3x demand)</option>
              <option value="HIGH">HIGH - Diwali (1.75x demand)</option>
            </select>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
          No recommendations available. Adjust parameters to generate recommendations.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "right" }}>Today Demand</th>
                <th style={{ textAlign: "right" }}>Momentum</th>
                <th style={{ textAlign: "right" }}>Current Stock</th>
                <th style={{ textAlign: "right" }}>Incoming Stock</th>
                <th style={{ textAlign: "right" }}>Worst Case (Days)</th>
                <th style={{ textAlign: "right" }}>Best Case (Days)</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "600" }}>{rec.productName}</td>
                  <td style={{ textAlign: "right", color: "#6366f1", fontWeight: "600" }}>
                    {rec.todayDemand}
                  </td>
                  <td style={{ textAlign: "right", color: getMomentumColor(rec.momentumStatus), fontWeight: "600" }}>
                    {rec.momentum} ({rec.momentumStatus})
                  </td>
                  <td style={{ textAlign: "right", color: "#10b981", fontWeight: "600" }}>
                    {rec.currentStock}
                  </td>
                  <td style={{ textAlign: "right", color: "#f59e0b", fontWeight: "600" }}>
                    {rec.incomingStock}
                  </td>
                  <td style={{ textAlign: "right", color: "#ef4444", fontWeight: "600" }}>
                    {rec.canSustainDays.worstCase}
                  </td>
                  <td style={{ textAlign: "right", color: "#059669", fontWeight: "600" }}>
                    {rec.canSustainDays.bestCase}
                  </td>
                  <td
                    style={{
                      color: getRecommendationColor(rec.recommendation),
                      fontWeight: "600",
                      background: getRecommendationBg(rec.recommendation),
                      borderRadius: "4px",
                      padding: "13px 16px",
                    }}
                  >
                    {rec.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3>Legend</h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)", flex: 1, minWidth: "250px" }}>
            <strong style={{ color: "#1e1b4b" }}>Today Demand:</strong>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              Calculated using weighted average of last 10 days orders (dispatch - return), adjusted for holiday severity
            </p>
          </div>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)", flex: 1, minWidth: "250px" }}>
            <strong style={{ color: "#1e1b4b" }}>Momentum:</strong>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              Ratio of last 3 days average to last 10 days average. &gt;1.3 = Trending Up, &lt;0.8 = Falling, else Stable
            </p>
          </div>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)", flex: 1, minWidth: "250px" }}>
            <strong style={{ color: "#1e1b4b" }}>Worst Case:</strong>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              Days of stock available if no new products are received from manufacturers
            </p>
          </div>
          <div style={{ background: "rgba(220,225,255,0.45)", borderRadius: "8px", padding: "16px", border: "1px solid rgba(99,102,241,0.2)", flex: 1, minWidth: "250px" }}>
            <strong style={{ color: "#1e1b4b" }}>Best Case:</strong>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              Days of stock available if all in-progress production orders are received today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
