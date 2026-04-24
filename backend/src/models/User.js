const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  trialStartedAt: { type: Date, default: Date.now },
  subscription: {
    active: { type: Boolean, default: false },
    plan: { type: String, enum: ["1m", "6m", "1y"], default: null },
    expiresAt: { type: Date, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
  },
}));
