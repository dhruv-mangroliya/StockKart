import { useState } from "react";

const FEATURES = [
  {
    title: "Stores — Warehouse Management",
    logic: "Stores represent your physical locations (warehouses, showrooms, godowns). Each store is a separate entity where inventory is held. When you delete a store, all inventory in that store is also removed to maintain data integrity.",
    details: [
      "Add multiple stores for different locations",
      "Edit store names anytime",
      "Delete stores (with confirmation warning)",
      "All inventory tied to a store is removed on deletion",
    ],
  },
  {
    title: "Raw Materials — Input Inventory",
    logic: "Raw materials are the inputs used in production. Each raw material has a Name and Color — the combination makes it unique. For example, 'Cotton Fabric - White' and 'Cotton Fabric - Red' are two separate items. Deleting a raw material zeros its inventory and removes it from all product Bills of Materials.",
    details: [
      "Name + Color combination creates unique identity",
      "Track quantity across all stores and manufacturers",
      "Used in product Bills of Materials",
      "Deletion cascades to products and inventory",
    ],
  },
  {
    title: "Products & Bill of Materials (BOM)",
    logic: "Products are finished goods. Each product has a Bill of Materials (BOM) — a recipe showing how much of each raw material is needed to produce one unit. When you create a production order, the system automatically deducts the required raw materials based on the BOM.",
    details: [
      "Define multiple raw materials per product",
      "Specify quantity required per unit",
      "Edit BOM anytime",
      "BOM is used to calculate material deductions in production orders",
      "Example: 1 Anarkali Kurti = 2.5m Cotton Fabric + 1 pack Thread",
    ],
  },
  {
    title: "Manufacturers — Producer Management",
    logic: "Manufacturers (Producers) are the tailors or factories you send raw materials to for production. They hold raw materials temporarily during production. When you create a production order, materials are assigned to a manufacturer. After production, finished products are received back into a store.",
    details: [
      "Add manufacturers/tailors/factories",
      "Track raw materials held by each manufacturer",
      "Receive finished products from manufacturers",
      "Return unused materials from manufacturers",
    ],
  },
  {
    title: "Inventory — Stock Management",
    logic: "Inventory tracks quantity of items at specific locations. Each inventory entry has: Item (Raw Material or Product), Location (Store or Manufacturer), and Quantity. The system maintains a global stock view (total across all locations) and warehouse-wise breakdown. You can add stock, edit quantities, and filter by name or item.",
    details: [
      "Add stock for any item at any location",
      "Three tabs: Total Inventory Data, Filter By Name, Filter By Item",
      "Global Stock shows totals across all locations",
      "Warehouse-wise view shows breakdown per location",
      "Edit quantities directly from table",
      "Search by item name or color",
    ],
  },
  {
    title: "Visualise Inventory — Analytics & Charts",
    logic: "Visual dashboards for inventory analysis. By Location: select a warehouse to see pie charts of item breakdown and raw vs product split, plus a heatmap showing stock distribution. By Item: select an item to see which locations hold it. Order Status: shows pending production orders by manufacturer with charts.",
    details: [
      "By Location: Pie charts, bar charts, heatmap",
      "By Item: Distribution across locations",
      "Order Status: Pending orders by manufacturer",
      "Heatmap color intensity shows stock concentration",
      "Charts update in real-time as inventory changes",
    ],
  },
  {
    title: "Alert Manager — Low Stock Alerts",
    logic: "Set threshold quantities for any item. When total stock (across all locations) drops below the threshold, the item becomes an active alert. Alerts are checked every 3 minutes. You get a browser notification the first time an item crosses its threshold. Alerts help prevent stockouts.",
    details: [
      "Create alerts for raw materials or products",
      "Set threshold quantity",
      "Active alerts appear in header ALERTS button",
      "Alerts checked every 3 minutes",
      "Browser notification on first threshold breach",
      "Edit or delete alerts anytime",
    ],
  },
  {
    title: "Warehouse Transfers — Move Stock",
    logic: "Transfer items between two warehouses. Select item, source warehouse, destination warehouse, and quantity. The system shows available stock in the source warehouse before transfer. Each transfer is logged and can be reversed (deleted) to undo the transaction.",
    details: [
      "Transfer raw materials or products",
      "Available quantity shown before transfer",
      "Transfer history is logged",
      "Delete transfer to reverse transaction",
      "Inventory updated immediately on both ends",
    ],
  },
  {
    title: "Manufacturer Return — Get Materials Back",
    logic: "When a manufacturer has unused raw materials after production, use this page to return them to a warehouse. Select the manufacturer — all raw materials they hold are listed. Enter quantities to return or click 'Return All'. Each return is logged and can be reversed.",
    details: [
      "Select manufacturer and destination warehouse",
      "View all raw materials held by manufacturer",
      "Enter return quantities for each material",
      "Return All button for convenience",
      "Return history is logged",
      "Delete return to reverse transaction",
    ],
  },
  {
    title: "Ecom Orders — Dispatch & Returns",
    logic: "Manage product stock changes from ecommerce platforms. Dispatch tab: reduce stock when products are shipped to customers. Returns tab: add stock back when customers return products. Both support multiple products per batch, optional platform tagging (Amazon, Flipkart, etc.), and an activity log with edit support.",
    details: [
      "Two tabs: Dispatch (reduce stock) and Returns (add stock)",
      "Add multiple products per batch",
      "Optional platform tagging",
      "Activity log with edit capability",
      "Correct quantities if needed",
      "Batch history is maintained",
    ],
  },
  {
    title: "Production Orders — Send to Manufacturer",
    logic: "Create orders to send products for manufacturing. Select product, manufacturer, and required output quantity. The system automatically deducts required raw materials (based on BOM) from inventory and assigns them to the manufacturer. Once production is done, mark Complete and select destination warehouse to receive finished products. Orders can be cancelled or deleted.",
    details: [
      "Select product, manufacturer, output quantity",
      "System deducts raw materials based on BOM",
      "Materials assigned to manufacturer",
      "Mark Complete when production done",
      "Select destination warehouse for finished products",
      "Finished products added to warehouse",
      "Cancel or delete orders",
      "Order status: CREATED or COMPLETED",
    ],
  },
  {
    title: "Push Notifications — Alert Notifications",
    logic: "Get browser notifications when stock drops below alert thresholds. Open ALERTS panel in header — if notifications are off, a yellow banner appears with Enable button. Once enabled, you will be notified the first time each item crosses its threshold. Works on desktop and mobile (iOS requires PWA installation + HTTPS in production).",
    details: [
      "Enable from ALERTS panel in header",
      "Browser asks for permission",
      "Notification sent on first threshold breach",
      "Works even when app is in background",
    ],
  },
  {
    title: "Visualise Orders — Order Analytics & Trends",
    logic: "Comprehensive analytics dashboard for ecommerce order tracking. Trends tab shows daily dispatch vs return trends with date range filtering, overall dispatch vs return pie chart, and item-wise breakdown. Item Trends tab lets you select a specific product to view its individual dispatch and return trends over time with a pie chart. Overall Stats tab displays summary metrics, item-wise table with return rates, and key insights about top products and health status.",
    details: [
      "Trends tab: Daily line chart, overall pie chart, item-wise pie charts",
      "Item Trends tab: Select product from dropdown, view trends and dispatch vs return breakdown",
      "Overall Stats tab: Summary cards, item-wise table, key insights",
      "Date range filtering (defaults to last 30 days in IST)",
      "Color-coded charts: Blue for dispatch, Red for return",
      "Return rate calculation and analysis",
      "Identify top dispatched products and highest return rates",
      "Health status based on return rate: Excellent (< 10%), Good (10-15%), Needs attention (> 15%)",
    ],
  },
  {
    title: "Recommendation Engine — Demand Forecasting & Runway Analysis",
    logic: "AI-powered demand forecasting using weighted average of last 10 days order data (dispatch - return). Calculates today's demand adjusted for holiday severity. Provides runway analysis showing how many days current stock can sustain orders. Two scenarios: Worst Case (no new production received) and Best Case (all completed production orders received today). Helps prevent stockouts and optimize ordering.",
    details: [
      "Weighted demand calculation: Last day weight 10, 10 days before weight 1",
      "Holiday severity adjustment: LOW (1x), MEDIUM (1.3x), HIGH/Diwali (1.75x)",
      "Configurable runway days (default 7 days)",
      "Worst Case: Days stock lasts without new production",
      "Best Case: Days stock lasts if all completed orders received today",
      "Item-wise recommendations: URGENT, HIGH, or NORMAL",
      "Color-coded alerts: Red (URGENT), Orange (HIGH), Green (NORMAL)",
      "Real-time calculation based on current inventory and production orders",
    ],
  },
];

export default function AboutFeatures() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="page" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>About Features</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Detailed explanation of all features and how they work together to manage your inventory end-to-end.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {FEATURES.map((feature, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
              background: expandedIndex === idx ? "#f9fafb" : "white",
            }}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: "none",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "600",
                fontSize: "15px",
                color: "#1f2937",
              }}
            >
              <span>{feature.title}</span>
              <span style={{ fontSize: "20px", color: "#6366f1" }}>
                {expandedIndex === idx ? "−" : "+"}
              </span>
            </button>

            {expandedIndex === idx && (
              <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px" }}>Logic:</h4>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: "1.6" }}>
                    {feature.logic}
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px" }}>Key Points:</h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#6b7280", fontSize: "14px" }}>
                    {feature.details.map((detail, i) => (
                      <li key={i} style={{ marginBottom: "6px", lineHeight: "1.5" }}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
