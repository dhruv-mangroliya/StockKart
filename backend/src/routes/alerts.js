const express = require("express");
const router = express.Router();
const { Alert, Inventory, RawMaterial, Product } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/active/list", async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id });
    const inventory = await Inventory.find({ userId: req.user._id });
    
    const activeAlerts = [];
    for (const alert of alerts) {
      const totalQty = inventory
        .filter((inv) => inv.itemType === alert.itemType && inv.itemId.toString() === alert.itemId.toString())
        .reduce((sum, inv) => sum + inv.quantity, 0);
      
      if (totalQty < alert.alertQuantity) {
        let itemName = "";
        if (alert.itemType === "RAW") {
          const rm = await RawMaterial.findById(alert.itemId);
          itemName = rm ? `${rm.name} (${rm.color})` : alert.itemId;
        } else {
          const p = await Product.findById(alert.itemId);
          itemName = p ? p.name : alert.itemId;
        }
        activeAlerts.push({
          _id: alert._id,
          itemType: alert.itemType,
          itemId: alert.itemId,
          itemName,
          alertQuantity: alert.alertQuantity,
          currentQuantity: totalQty,
        });
      }
    }
    res.json(activeAlerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await Alert.find({ userId: req.user._id }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { itemType, itemId, alertQuantity } = req.body;
    if (!itemType || !itemId || alertQuantity === undefined) {
      return res.status(400).json({ error: "itemType, itemId, and alertQuantity are required" });
    }
    const existing = await Alert.findOne({ userId: req.user._id, itemType, itemId });
    if (existing) {
      return res.status(400).json({ error: "Alert already exists for this item" });
    }
    res.status(201).json(await Alert.create({ userId: req.user._id, itemType, itemId, alertQuantity }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { alertQuantity } = req.body;
    if (alertQuantity === undefined) {
      return res.status(400).json({ error: "alertQuantity is required" });
    }
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { alertQuantity },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
