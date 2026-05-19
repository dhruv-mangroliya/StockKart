const express = require("express");
const router = express.Router();
const { Inventory, ProducerReturn, Transfer, Producer, Store, RawMaterial, Product } = require("../models");
const { findOrCreateEntry } = require("./inventory");
const auth = require("../middleware/auth");

router.use(auth);

// Get all warehouse transfers
router.get("/", async (req, res) => {
  const transfers = await Transfer.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const stores = await Store.find({ userId: req.user._id });
  const result = transfers.map((t) => ({
    ...t.toObject(),
    id: t._id,
    fromStore: stores.find((s) => String(s._id) === String(t.fromStoreId))?.name || t.fromStoreId,
    toStore: stores.find((s) => String(s._id) === String(t.toStoreId))?.name || t.toStoreId,
  }));
  res.json(result);
});

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

  // Get item name for logging
  let itemName;
  if (itemType === "RAW") {
    const rawMaterial = await RawMaterial.findById(itemId);
    itemName = rawMaterial ? `${rawMaterial.name} (${rawMaterial.color})` : itemId;
  } else {
    const product = await Product.findById(itemId);
    itemName = product ? product.name : itemId;
  }

  // Create log entry
  const transferLog = await Transfer.create({
    userId: req.user._id,
    itemType,
    itemId,
    itemName,
    fromStoreId,
    toStoreId,
    quantity: Number(quantity)
  });

  const fromStore = await Store.findById(fromStoreId);
  const toStore = await Store.findById(toStoreId);

  res.json({
    ...transferLog.toObject(),
    id: transferLog._id,
    fromStore: fromStore?.name,
    toStore: toStore?.name
  });
});

// Get all producer returns
router.get("/producer-returns", async (req, res) => {
  const returns = await ProducerReturn.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const producers = await Producer.find({ userId: req.user._id });
  const stores = await Store.find({ userId: req.user._id });
  const result = returns.map((r) => ({
    ...r.toObject(),
    id: r._id,
    producer: producers.find((p) => String(p._id) === String(r.producerId))?.name || r.producerId,
    store: stores.find((s) => String(s._id) === String(r.storeId))?.name || r.storeId,
  }));
  res.json(result);
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

  // Get material names for logging
  const rawMaterials = await RawMaterial.find({ userId: req.user._id });
  const materialsWithNames = materials.map(mat => {
    const rm = rawMaterials.find(r => String(r._id) === String(mat.rawMaterialId));
    return {
      rawMaterialId: mat.rawMaterialId,
      rawMaterialName: rm ? `${rm.name} (${rm.color})` : mat.rawMaterialId,
      quantity: mat.quantity
    };
  });

  // Create log entry
  const returnLog = await ProducerReturn.create({
    userId: req.user._id,
    producerId,
    storeId: toStoreId,
    materials: materialsWithNames
  });

  const producer = await Producer.findById(producerId);
  const store = await Store.findById(toStoreId);

  res.json({
    ...returnLog.toObject(),
    id: returnLog._id,
    producer: producer?.name,
    store: store?.name
  });
});

module.exports = router;
