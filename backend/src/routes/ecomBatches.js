const express = require("express");
const router = express.Router();
const { EcomBatch, Inventory, Store } = require("../models");
const { findOrCreateEntry } = require("./inventory");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  const batches = await EcomBatch.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const stores = await Store.find({ userId: req.user._id });
  const result = batches.map((b) => ({
    ...b.toObject(),
    id: b._id,
    store: stores.find((s) => String(s._id) === String(b.storeId))?.name || b.storeId,
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const { type, platform, storeId, items } = req.body;
  if (!type || !storeId || !items?.length)
    return res.status(400).json({ error: "All fields are required" });

  try {
    for (const item of items) {
      if (type === "dispatch") {
        const entry = await Inventory.findOne({ userId: req.user._id, itemType: "PRODUCT", itemId: item.productId, locationType: "STORE", locationId: storeId });
        if (!entry || entry.quantity < item.quantity)
          return res.status(400).json({ error: `Insufficient stock for ${item.productName}` });
        entry.quantity -= Number(item.quantity);
        await entry.save();
      } else {
        const entry = await findOrCreateEntry(req.user._id, "PRODUCT", item.productId, "STORE", storeId);
        entry.quantity += Number(item.quantity);
        await entry.save();
      }
    }

    const batch = await EcomBatch.create({ userId: req.user._id, type, platform: platform || "", storeId, items });
    const store = await Store.findById(storeId);
    res.status(201).json({ ...batch.toObject(), id: batch._id, store: store?.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
