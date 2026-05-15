const express = require("express");
const router = express.Router();
const passport = require("../passport");

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => res.redirect(process.env.FRONTEND_URL || process.env.CLIENT_URL)
);

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
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
