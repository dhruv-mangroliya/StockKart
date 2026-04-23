const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/", async (req, res) => {
  res.json(await Product.find());
});

router.post("/", async (req, res) => {
  const { name, billOfMaterials } = req.body;
  if (!name || !billOfMaterials?.length)
    return res.status(400).json({ error: "Name and BOM are required" });
  res.status(201).json(await Product.create({ name, billOfMaterials }));
});

router.put("/:id", async (req, res) => {
  const { name, billOfMaterials } = req.body;
  if (!name || !billOfMaterials?.length)
    return res.status(400).json({ error: "Name and BOM are required" });
  const product = await Product.findByIdAndUpdate(req.params.id, { name, billOfMaterials }, { new: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await require("../models/Inventory").deleteMany({ itemType: "PRODUCT", itemId: req.params.id });
  res.json({ message: "Product deleted" });
});

module.exports = router;
