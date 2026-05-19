const express = require("express");
const router = express.Router();
const passport = require("../passport");

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    console.log("=== AUTH CALLBACK DEBUG ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("User:", req.user ? req.user.email : "NO USER");
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("Cookie settings:", req.session.cookie);
    console.log("===========================");
    res.redirect(process.env.FRONTEND_URL || process.env.CLIENT_URL);
  }
);

router.get("/me", (req, res) => {
  console.log("=== /auth/me DEBUG ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session:", req.session);
  console.log("User:", req.user ? req.user.email : "NO USER");
  console.log("Cookie:", req.headers.cookie);
  console.log("======================");
  if (!req.user) return res.status(200).json({ user: null });
  const { googleId, name, email, avatar, trialStartedAt, createdAt, subscription } = req.user;
  const trialStart = trialStartedAt || createdAt || new Date();
  const trialExpired = Date.now() - new Date(trialStart).getTime() > 5 * 24 * 60 * 60 * 1000;
  const subscriptionActive = !!(subscription?.active && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date());
  res.json({ user: { googleId, name, email, avatar, trialStartedAt: trialStart, trialExpired, subscriptionActive, subscription } });
});

router.post("/logout", (req, res) => {
  req.logout(() => res.json({ message: "Logged out" }));
});

module.exports = router;
