import { useState } from "react";
import { useAuth } from "../api/AuthContext";

const PLANS = [
  { id: "1m", label: "1 Month", price: 99, description: "Billed monthly", saving: null },
  { id: "6m", label: "6 Months", price: 499, description: "₹83.2 / month", saving: "Save ₹95", popular: true },
  { id: "1y", label: "1 Year", price: 799, description: "₹66.6 / month", saving: "Save ₹389" },
];

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const trialStart = user?.trialStartedAt || user?.createdAt;
  const trialExpiresAt = trialStart ? new Date(new Date(trialStart).getTime() + 5 * 24 * 60 * 60 * 1000) : null;
  const trialDaysLeft = trialExpiresAt ? Math.max(0, Math.ceil((trialExpiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const isSubscribed = user?.subscriptionActive;
  const subExpiresAt = user?.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : null;
  const subDaysLeft = subExpiresAt ? Math.max(0, Math.ceil((subExpiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:3001/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const plan = PLANS.find((p) => p.id === planId);
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Inventory Manager",
        description: plan.label,
        order_id: data.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#6366f1" },
        handler: async (response) => {
          const verifyRes = await fetch("http://localhost:3001/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ...response, plan: planId }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
          setSuccess("🎉 Subscription activated successfully!");
          refreshUser();
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
    <div className="page subscription-page">
      <h2>💳 Subscription</h2>

      {/* Current Status Card */}
      <div className="sub-status-card">
        {isSubscribed ? (
          <>
            <div className="sub-status-badge active">✅ Active Subscription</div>
            <div className="sub-status-info">
              <span>Plan: <strong>{PLANS.find(p => p.id === user.subscription?.plan)?.label || user.subscription?.plan}</strong></span>
              <span>Expires: <strong>{subExpiresAt?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              <span className="sub-days-left">{subDaysLeft} days remaining</span>
            </div>
          </>
        ) : user?.trialExpired ? (
          <>
            <div className="sub-status-badge expired">⚠️ Free Trial Expired</div>
            <div className="sub-status-info">
              <span>Your 5-day free trial has ended. Subscribe to continue.</span>
            </div>
          </>
        ) : (
          <>
            <div className="sub-status-badge trial">🕐 Free Trial Active</div>
            <div className="sub-status-info">
              <span>Trial expires: <strong>{trialExpiresAt?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              <span className="sub-days-left">{trialDaysLeft} days remaining</span>
            </div>
          </>
        )}
      </div>

      {error && <p className="subscription-error" style={{ marginTop: 16 }}>{error}</p>}
      {success && <p className="sub-success">{success}</p>}

      {/* Plans */}
      {!isSubscribed && (
        <>
          <h3 style={{ marginBottom: "16px", color: "#1e1b4b", fontWeight: 700 }}>Choose a Plan</h3>
          <div className="sub-plans-grid">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`sub-plan-card ${plan.popular ? "popular" : ""}`}>
                {plan.popular && <div className="sub-popular-badge">Most Popular</div>}
                <div className="sub-plan-label">{plan.label}</div>
                <div className="sub-plan-price">₹{plan.price}</div>
                <div className="sub-plan-desc">{plan.description}</div>
                {plan.saving && <div className="sub-plan-saving">{plan.saving}</div>}
                <button
                  className="sub-plan-btn"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? "Processing..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {isSubscribed && (
        <p className="sub-renew-note">You can subscribe to a new plan after your current plan expires on <strong>{subExpiresAt?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
      )}
    </div>
  );
}
