const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const { findOrCreateEntry } = require("./inventory");

router.post("/", async (req, res) => {
  const { itemType, itemId, fromStoreId, toStoreId, quantity } = req.body;
  if (!itemType || !itemId || !fromStoreId || !toStoreId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (fromStoreId === toStoreId)
    return res.status(400).json({ error: "Source and destination store must be different" });
  if (quantity <= 0)
    return res.status(400).json({ error: "Quantity must be positive" });

  const source = await Inventory.findOne({ itemType, itemId, locationType: "STORE", locationId: fromStoreId });
  if (!source || source.quantity < quantity)
    return res.status(400).json({ error: "Insufficient stock in source store" });

  source.quantity -= Number(quantity);
  await source.save();

  const dest = await findOrCreateEntry(itemType, itemId, "STORE", toStoreId);
  dest.quantity += Number(quantity);
  await dest.save();

  res.json({ message: "Transfer successful", from: source, to: dest });
});

module.exports = router;
