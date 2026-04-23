const express = require("express");
const router = express.Router();
const ProductionOrder = require("../models/ProductionOrder");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { findOrCreateEntry } = require("./inventory");

router.get("/", async (req, res) => {
  res.json(await ProductionOrder.find().sort({ createdAt: -1 }));
});

router.post("/", async (req, res) => {
  const { productId, producerId, inputMaterials, requiredQuantity } = req.body;
  if (!productId || !producerId || !inputMaterials?.length || !requiredQuantity)
    return res.status(400).json({ error: "All fields are required" });
  if (requiredQuantity <= 0) return res.status(400).json({ error: "Required quantity must be positive" });

  for (const mat of inputMaterials) {
    if (!mat.sourceStoreId) return res.status(400).json({ error: "Each material must have a source store" });
  }

  // Validate stock per material per store
  for (const mat of inputMaterials) {
    const inv = await Inventory.findOne({
      itemType: "RAW", itemId: mat.rawMaterialId, locationType: "STORE", locationId: mat.sourceStoreId,
    });
    if (!inv || inv.quantity < mat.quantitySent)
      return res.status(400).json({ error: `Insufficient stock for material ${mat.rawMaterialId} in selected store` });
  }

  // Deduct from each store, add to producer
  for (const mat of inputMaterials) {
    const storeInv = await Inventory.findOne({
      itemType: "RAW", itemId: mat.rawMaterialId, locationType: "STORE", locationId: mat.sourceStoreId,
    });
    storeInv.quantity -= mat.quantitySent;
    await storeInv.save();
    const prodInv = await findOrCreateEntry("RAW", mat.rawMaterialId, "PRODUCER", producerId);
    prodInv.quantity += mat.quantitySent;
    await prodInv.save();
  }

  const order = await ProductionOrder.create({ productId, producerId, inputMaterials, requiredQuantity: Number(requiredQuantity) });
  res.status(201).json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await ProductionOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "COMPLETED") return res.status(400).json({ error: "Cannot delete a completed order" });

  const { returnStoreId } = req.body;
  if (!returnStoreId) return res.status(400).json({ error: "Return store is required" });

  // Return each material from producer back to selected store
  for (const mat of order.inputMaterials) {
    const prodInv = await Inventory.findOne({
      itemType: "RAW", itemId: mat.rawMaterialId, locationType: "PRODUCER", locationId: order.producerId,
    });
    if (prodInv) {
      prodInv.quantity -= mat.quantitySent;
      await prodInv.save();
    }
    const storeInv = await findOrCreateEntry("RAW", mat.rawMaterialId, "STORE", returnStoreId);
    storeInv.quantity += mat.quantitySent;
    await storeInv.save();
  }

  await ProductionOrder.findByIdAndDelete(req.params.id);
  res.json({ message: "Order cancelled and materials returned" });
});

router.post("/:id/complete", async (req, res) => {
  const order = await ProductionOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "COMPLETED") return res.status(400).json({ error: "Order already completed" });

  const { destinationStoreId } = req.body;
  if (!destinationStoreId) return res.status(400).json({ error: "Destination store is required" });

  const outputQuantity = order.requiredQuantity;
  const product = await Product.findById(order.productId);

  // Validate producer has enough raw materials per BOM
  for (const bom of product.billOfMaterials) {
    const required = bom.quantityRequiredPerUnit * outputQuantity;
    const prodInv = await Inventory.findOne({
      itemType: "RAW", itemId: bom.rawMaterialId, locationType: "PRODUCER", locationId: order.producerId,
    });
    if (!prodInv || prodInv.quantity < required)
      return res.status(400).json({ error: `Producer lacks sufficient material ${bom.rawMaterialId}` });
  }

  // Deduct raw materials from producer
  for (const bom of product.billOfMaterials) {
    const required = bom.quantityRequiredPerUnit * outputQuantity;
    const prodInv = await Inventory.findOne({
      itemType: "RAW", itemId: bom.rawMaterialId, locationType: "PRODUCER", locationId: order.producerId,
    });
    prodInv.quantity -= required;
    await prodInv.save();
  }

  // Add finished products to destination store
  const storeProductInv = await findOrCreateEntry("PRODUCT", order.productId, "STORE", destinationStoreId);
  storeProductInv.quantity += outputQuantity;
  await storeProductInv.save();

  order.outputQuantity = outputQuantity;
  order.destinationStoreId = destinationStoreId;
  order.status = "COMPLETED";
  order.completedAt = new Date();
  await order.save();

  res.json(order);
});

module.exports = router;
