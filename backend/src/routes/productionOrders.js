const express = require("express");
const router = express.Router();
const { ProductionOrder, Product, Inventory, RawMaterial } = require("../models");
const { findOrCreateEntry } = require("./inventory");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  res.json(await ProductionOrder.find({ userId: req.user._id }).sort({ createdAt: -1 }));
});

router.post("/", async (req, res) => {
  const { productId, producerId, requiredQuantity } = req.body;
  if (!productId || !producerId || !requiredQuantity)
    return res.status(400).json({ error: "All fields are required" });
  if (requiredQuantity <= 0) return res.status(400).json({ error: "Required quantity must be positive" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  // Check producer has enough of every BOM material
  for (const bom of product.billOfMaterials) {
    const required = bom.quantityRequiredPerUnit * requiredQuantity;
    const prodInv = await Inventory.findOne({ userId: req.user._id, itemType: "RAW", itemId: bom.rawMaterialId, locationType: "PRODUCER", locationId: producerId });
    if (!prodInv || prodInv.quantity < required) {
      const rawMaterial = await RawMaterial.findById(bom.rawMaterialId);
      const materialName = rawMaterial ? `${rawMaterial.name} (${rawMaterial.color})` : bom.rawMaterialId;
      return res.status(400).json({ error: `Producer has insufficient stock for material ${materialName} (needs ${required}, has ${prodInv?.quantity ?? 0})` });
    }
  }

  const order = await ProductionOrder.create({ userId: req.user._id, productId, producerId, requiredQuantity: Number(requiredQuantity) });
  res.status(201).json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await ProductionOrder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "COMPLETED") return res.status(400).json({ error: "Cannot delete a completed order" });
  await ProductionOrder.findByIdAndDelete(req.params.id);
  res.json({ message: "Order cancelled" });
});

router.post("/:id/complete", async (req, res) => {
  const order = await ProductionOrder.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "COMPLETED") return res.status(400).json({ error: "Order already completed" });

  const { destinationStoreId } = req.body;
  if (!destinationStoreId) return res.status(400).json({ error: "Destination store is required" });

  const outputQuantity = order.requiredQuantity;
  const product = await Product.findById(order.productId);

  for (const bom of product.billOfMaterials) {
    const required = bom.quantityRequiredPerUnit * outputQuantity;
    const prodInv = await Inventory.findOne({ userId: req.user._id, itemType: "RAW", itemId: bom.rawMaterialId, locationType: "PRODUCER", locationId: order.producerId });
    if (!prodInv || prodInv.quantity < required) {
      const rawMaterial = await RawMaterial.findById(bom.rawMaterialId);
      const materialName = rawMaterial ? `${rawMaterial.name} (${rawMaterial.color})` : bom.rawMaterialId;
      return res.status(400).json({ error: `Producer lacks sufficient material ${materialName}` });
    }
  }

  for (const bom of product.billOfMaterials) {
    const required = bom.quantityRequiredPerUnit * outputQuantity;
    const prodInv = await Inventory.findOne({ userId: req.user._id, itemType: "RAW", itemId: bom.rawMaterialId, locationType: "PRODUCER", locationId: order.producerId });
    prodInv.quantity -= required;
    await prodInv.save();
  }

  const storeProductInv = await findOrCreateEntry(req.user._id, "PRODUCT", order.productId, "STORE", destinationStoreId);
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
