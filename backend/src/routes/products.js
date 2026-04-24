const express = require("express");
const router = express.Router();
const { Product, Inventory } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  res.json(await Product.find({ userId: req.user._id }));
});

router.post("/", async (req, res) => {
  const { name, billOfMaterials } = req.body;
  if (!name || !billOfMaterials?.length)
    return res.status(400).json({ error: "Name and BOM are required" });
  res.status(201).json(await Product.create({ userId: req.user._id, name, billOfMaterials }));
});

router.put("/:id", async (req, res) => {
  const { name, billOfMaterials } = req.body;
  if (!name || !billOfMaterials?.length)
    return res.status(400).json({ error: "Name and BOM are required" });
  const product = await Product.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { name, billOfMaterials }, { new: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!product) return res.status(404).json({ error: "Product not found" });
  await Inventory.deleteMany({ userId: req.user._id, itemType: "PRODUCT", itemId: req.params.id });
  res.json({ message: "Product deleted" });
});

module.exports = router;
