const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  "1m":  { amount: 9900,  duration: 30 },
  "6m":  { amount: 49900,  duration: 180 },
  "1y":  { amount: 79900,  duration: 365 },
};

router.post("/create-order", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { plan } = req.body;
  console.log("create-order called, user:", req.user?._id, "plan:", plan);
  if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

  try {
    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

router.post("/verify", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature)
    return res.status(400).json({ error: "Invalid signature" });

  if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PLANS[plan].duration);

  await User.findByIdAndUpdate(req.user._id, {
    subscription: {
      active: true,
      plan,
      expiresAt,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    },
  });

  res.json({ success: true, expiresAt });
});

module.exports = router;
