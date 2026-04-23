const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

async function findOrCreateEntry(itemType, itemId, locationType, locationId) {
  let entry = await Inventory.findOne({ itemType, itemId, locationType, locationId });
  if (!entry) entry = await Inventory.create({ itemType, itemId, locationType, locationId, quantity: 0 });
  return entry;
}

router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.locationType) filter.locationType = req.query.locationType;
  if (req.query.locationId) filter.locationId = req.query.locationId;
  res.json(await Inventory.find(filter));
});

router.post("/add", async (req, res) => {
  const { itemType, itemId, locationType, locationId, quantity } = req.body;
  if (!itemType || !itemId || !locationType || !locationId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (quantity <= 0) return res.status(400).json({ error: "Quantity must be positive" });
  const entry = await findOrCreateEntry(itemType, itemId, locationType, locationId);
  entry.quantity += Number(quantity);
  await entry.save();
  res.json(entry);
});

router.post("/dispatch", async (req, res) => {
  const { itemId, locationId, quantity } = req.body;
  if (!itemId || !locationId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (quantity <= 0) return res.status(400).json({ error: "Quantity must be positive" });
  const entry = await Inventory.findOne({ itemType: "PRODUCT", itemId, locationType: "STORE", locationId });
  if (!entry || entry.quantity < quantity)
    return res.status(400).json({ error: "Insufficient stock in selected store" });
  entry.quantity -= Number(quantity);
  await entry.save();
  res.json(entry);
});

router.put("/:id", async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 0)
    return res.status(400).json({ error: "Valid quantity is required" });
  const entry = await Inventory.findByIdAndUpdate(req.params.id, { quantity: Number(quantity) }, { new: true });
  if (!entry) return res.status(404).json({ error: "Inventory entry not found" });
  res.json(entry);
});

module.exports = router;
module.exports.findOrCreateEntry = findOrCreateEntry;
