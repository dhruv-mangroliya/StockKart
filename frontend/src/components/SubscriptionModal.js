import { useState } from "react";

const PLANS = [
  { id: "1m", label: "1 Month", price: 99, description: "₹99 / month" },
  { id: "6m", label: "6 Months", price: 499, description: "₹499 / 6 months  •  Save ₹95" },
  { id: "1y", label: "1 Year", price: 799, description: "₹799 / year  •  Save ₹389" },
];

export default function SubscriptionModal({ user, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState("6m");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Inventory Manager",
        description: PLANS.find((p) => p.id === selectedPlan)?.label,
        order_id: data.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#6c63ff" },
        handler: async (response) => {
          const verifyRes = await fetch("http://localhost:3001/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ...response, plan: selectedPlan }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
          onSuccess();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setError("Payment failed. Please try again."));
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-overlay">
      <div className="subscription-modal">
        <div className="subscription-header">
          <span className="subscription-icon">🔒</span>
          <h2>Your free trial has ended</h2>
          <p>Choose a plan to continue using Inventory Manager</p>
        </div>

        <div className="subscription-plans">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`subscription-plan ${selectedPlan === plan.id ? "selected" : ""} ${plan.id === "6m" ? "popular" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.id === "6m" && <span className="popular-badge">Most Popular</span>}
              <div className="plan-label">{plan.label}</div>
              <div className="plan-price">₹{plan.price}</div>
              <div className="plan-desc">{plan.description}</div>
            </div>
          ))}
        </div>

        {error && <p className="subscription-error">{error}</p>}

        <button className="subscription-btn" onClick={handleSubscribe} disabled={loading}>
          {loading ? "Processing..." : "Subscribe Now"}
        </button>
      </div>
    </div>
  );
}
