const express = require("express");
const router = express.Router();
const { Inventory } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

async function findOrCreateEntry(userId, itemType, itemId, locationType, locationId) {
  let entry = await Inventory.findOne({ userId, itemType, itemId, locationType, locationId });
  if (!entry) entry = await Inventory.create({ userId, itemType, itemId, locationType, locationId, quantity: 0 });
  return entry;
}

router.get("/global-stock", async (req, res) => {
  const result = await Inventory.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: { itemType: "$itemType", itemId: "$itemId" }, totalQuantity: { $sum: "$quantity" } } },
    { $project: { _id: 0, itemType: "$_id.itemType", itemId: { $toString: "$_id.itemId" }, totalQuantity: 1 } },
  ]);
  res.json(result);
});

router.get("/", async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.locationType) filter.locationType = req.query.locationType;
  if (req.query.locationId) filter.locationId = req.query.locationId;
  res.json(await Inventory.find(filter));
});

router.post("/add", async (req, res) => {
  const { itemType, itemId, locationType, locationId, quantity } = req.body;
  if (!itemType || !itemId || !locationType || !locationId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (quantity <= 0) return res.status(400).json({ error: "Quantity must be positive" });
  const entry = await findOrCreateEntry(req.user._id, itemType, itemId, locationType, locationId);
  entry.quantity += Number(quantity);
  await entry.save();
  res.json(entry);
});

router.post("/dispatch", async (req, res) => {
  const { itemId, locationId, quantity } = req.body;
  if (!itemId || !locationId || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  if (quantity <= 0) return res.status(400).json({ error: "Quantity must be positive" });
  const entry = await Inventory.findOne({ userId: req.user._id, itemType: "PRODUCT", itemId, locationType: "STORE", locationId });
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
  const entry = await Inventory.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { quantity: Number(quantity) }, { new: true });
  if (!entry) return res.status(404).json({ error: "Inventory entry not found" });
  res.json(entry);
});

module.exports = router;
module.exports.findOrCreateEntry = findOrCreateEntry;
