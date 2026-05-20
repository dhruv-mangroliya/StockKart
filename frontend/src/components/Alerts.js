import React, { useEffect, useState } from "react";
import { api } from "../api";
import { requestNotificationPermission, sendAlertNotification } from "../utils/notificationService";

export default function Alerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [previousAlerts, setPreviousAlerts] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const loadAlerts = async () => {
    try {
      const data = await api.get("/alerts/active/list");
      const newAlerts = Array.isArray(data) ? data : [];
      
      // Check for new alerts and send notifications
      if (notificationEnabled) {
        newAlerts.forEach((alert) => {
          const wasNotified = previousAlerts.some(
            (prev) => (prev._id || prev.id) === (alert._id || alert.id)
          );
          if (!wasNotified) {
            sendAlertNotification(alert);
          }
        });
      }
      
      setActiveAlerts(newAlerts);
      setPreviousAlerts(newAlerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setActiveAlerts([]);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 180000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationEnabled]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      localStorage.setItem("alertNotificationsEnabled", "true");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("alertNotificationsEnabled") === "true";
    const granted = "Notification" in window && Notification.permission === "granted";
    setNotificationEnabled(stored && granted);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          padding: "8px 16px",
          background: activeAlerts.length > 0 ? "#dc2626" : "#059669",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        ALERTS
        {activeAlerts.length > 0 && (
          <span style={{
            background: "white",
            color: "#dc2626",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
          }}>
            {activeAlerts.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          minWidth: "350px",
          maxHeight: "400px",
          overflowY: "auto",
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>Active Alerts</h3>
            <button
              onClick={loadAlerts}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                padding: "4px 8px",
                fontWeight: "bold",
                color: "#6366f1",
              }}
              title="Refresh alerts"
            >
              Refresh
            </button>
          </div>

          {!notificationEnabled && (
            <div style={{
              padding: "12px 16px",
              background: "#fef3c7",
              borderBottom: "1px solid #fcd34d",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "13px", color: "#92400e" }}>
                Enable notifications for alerts
              </span>
              <button
                onClick={handleEnableNotifications}
                style={{
                  padding: "4px 12px",
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Enable
              </button>
            </div>
          )}

          {activeAlerts.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
              No active alerts
            </div>
          ) : (
            <div>
              {activeAlerts.map((alert) => (
                <div
                  key={alert._id || alert.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    background: "#fef2f2",
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#dc2626", marginBottom: "4px" }}>
                    {alert.itemName}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Current: <strong>{alert.currentQuantity}</strong> | Alert: <strong>{alert.alertQuantity}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
