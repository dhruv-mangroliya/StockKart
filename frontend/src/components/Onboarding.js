import { useState } from "react";

const STEPS = [
  {
    title: "👋 Welcome to Inventory Manager!",
    desc: "This quick guide will walk you through the key features. You can skip at any time.",
    tip: null,
  },
  {
    title: "🏪 Step 1 — Add Stores",
    desc: "Start by creating your stores or warehouses. These are the physical locations where your inventory lives.",
    tip: "Example: Add stores like \"Surat Main Warehouse\", \"Mumbai Showroom\" or \"Delhi Godown\".",
  },
  {
    title: "🧵 Step 2 — Add Raw Materials",
    desc: "Add the raw materials you use for production. Each color variant is treated as a separate item.",
    tip: "Example: \"Cotton Fabric - White\", \"Cotton Fabric - Red\", \"Embroidery Thread - Gold\".",
  },
  {
    title: "📦 Step 3 — Add Products & BOM",
    desc: "Create finished products and define their Bill of Materials — how much of each raw material is needed per unit.",
    tip: "Example: Product \"Anarkali Kurti\" needs 2.5m Cotton Fabric - Blue + 1 pack Embroidery Thread - Silver.",
  },
  {
    title: "🏭 Step 4 — Add Producers",
    desc: "Producers are the manufacturers or tailors you send raw materials to for stitching and production.",
    tip: "Example: Add producers like \"Rohit Mishra\", \"Sunita Devi Tailors\" or \"Patel Garment Works\".",
  },
  {
    title: "📊 Step 5 — Manage Inventory",
    desc: "Add stock to your stores. You can also filter inventory by store or producer to see what's where.",
    tip: "Example: Add 500m of \"Cotton Fabric - White\" to \"Surat Main Warehouse\".",
  },
  {
    title: "🔄 Step 6 — Transfers & Returns",
    desc: "Move stock between stores using Transfers. Use Producer Return to get unused raw materials back from a producer.",
    tip: "Example: Transfer 100m Cotton Fabric from \"Surat Warehouse\" to \"Mumbai Showroom\". Or ask Rohit Mishra to return leftover fabric.",
  },
  {
    title: "🛒 Step 7 — Ecom Orders",
    desc: "Log product returns from platforms like Amazon or Flipkart, and dispatch products to customers.",
    tip: "Example: 3 units of \"Anarkali Kurti\" returned from Meesho → add back to \"Delhi Godown\". Dispatch 10 units to a Flipkart order.",
  },
  {
    title: "⚙️ Step 8 — Production Orders",
    desc: "Send raw materials to a producer for stitching. Once done, mark it complete to receive finished products back into a store.",
    tip: "Example: Send 50m Cotton Fabric + 10 Thread packs to Rohit Mishra to produce 20 Anarkali Kurtis → receive them into Mumbai Showroom.",
  },
  {
    title: "✅ You're all set!",
    desc: "You now know everything to manage your inventory end-to-end. You can reopen this guide anytime from the sidebar.",
    tip: null,
  },
];

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const [hiding, setHiding] = useState(false);

  const close = (permanent) => {
    setHiding(true);
    setTimeout(() => {
      if (permanent) localStorage.setItem("onboarding_done", "1");
      onClose();
    }, 300);
  };

  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className={`onboarding-overlay ${hiding ? "hiding" : ""}`}>
      <div className="onboarding-card">
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-step-count">{step + 1} / {STEPS.length}</div>

        <div className="onboarding-body">
          <h2>{STEPS[step].title}</h2>
          <p>{STEPS[step].desc}</p>
          {STEPS[step].tip && (
            <div className="onboarding-tip">
              <span className="tip-icon">💡</span>
              <span>{STEPS[step].tip}</span>
            </div>
          )}
        </div>

        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button key={i} className={`dot ${i === step ? "active" : i < step ? "done" : ""}`} onClick={() => setStep(i)} />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="skip-btn" onClick={() => close(false)}>Skip for now</button>
          <div className="onboarding-nav">
            {step > 0 && <button className="prev-btn" onClick={() => setStep(step - 1)}>← Back</button>}
            {isLast
              ? <button className="next-btn" onClick={() => close(true)}>Get Started 🚀</button>
              : <button className="next-btn" onClick={() => setStep(step + 1)}>Next →</button>
            }
          </div>
        </div>

        {isLast && (
          <p className="onboarding-dismiss" onClick={() => close(true)}>Don't show this again</p>
        )}
      </div>
    </div>
  );
}
