const express = require("express");
const router = express.Router();
const { Inventory } = require("../models");
const { findOrCreateEntry } = require("./inventory");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", async (req, res) => {
  const { itemType, itemId, fromStoreId, toStoreId, quantity } = req.body;
  if (!itemType || !itemId || !fromStoreId || !toStoreId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (fromStoreId === toStoreId)
    return res.status(400).json({ error: "Source and destination store must be different" });
  if (quantity <= 0)
    return res.status(400).json({ error: "Quantity must be positive" });

  const source = await Inventory.findOne({ userId: req.user._id, itemType, itemId, locationType: "STORE", locationId: fromStoreId });
  if (!source || source.quantity < quantity)
    return res.status(400).json({ error: "Insufficient stock in source store" });

  source.quantity -= Number(quantity);
  await source.save();

  const dest = await findOrCreateEntry(req.user._id, itemType, itemId, "STORE", toStoreId);
  dest.quantity += Number(quantity);
  await dest.save();

  res.json({ message: "Transfer successful", from: source, to: dest });
});

// Return raw materials from producer back to a store
router.post("/producer-return", async (req, res) => {
  const { producerId, toStoreId, materials } = req.body;
  // materials: [{ rawMaterialId, quantity }]
  if (!producerId || !toStoreId || !materials?.length)
    return res.status(400).json({ error: "All fields are required" });

  // Validate producer has enough of each material
  for (const mat of materials) {
    if (!mat.quantity || mat.quantity <= 0) return res.status(400).json({ error: "Quantity must be positive" });
    const prodInv = await Inventory.findOne({ userId: req.user._id, itemType: "RAW", itemId: mat.rawMaterialId, locationType: "PRODUCER", locationId: producerId });
    if (!prodInv || prodInv.quantity < mat.quantity)
      return res.status(400).json({ error: `Producer does not have enough of material ${mat.rawMaterialId}` });
  }

  // Deduct from producer, add to store
  for (const mat of materials) {
    const prodInv = await Inventory.findOne({ userId: req.user._id, itemType: "RAW", itemId: mat.rawMaterialId, locationType: "PRODUCER", locationId: producerId });
    prodInv.quantity -= Number(mat.quantity);
    await prodInv.save();
    const storeInv = await findOrCreateEntry(req.user._id, "RAW", mat.rawMaterialId, "STORE", toStoreId);
    storeInv.quantity += Number(mat.quantity);
    await storeInv.save();
  }

  res.json({ message: "Materials returned successfully" });
});

module.exports = router;
