import React, { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        padding: "16px",
        maxWidth: "300px",
        zIndex: 999,
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold" }}>
        Install InventoryBook
      </h4>
      <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6b7280" }}>
        Install our app for quick access and offline support
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#e5e7eb",
            color: "#1f2937",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
