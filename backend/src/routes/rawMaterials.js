const express = require("express");
const router = express.Router();
const { RawMaterial, Inventory, Product } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  res.json(await RawMaterial.find({ userId: req.user._id }));
});

router.post("/", async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: "Name and color are required" });
  res.status(201).json(await RawMaterial.create({ userId: req.user._id, name, color }));
});

router.put("/:id", async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: "Name and color are required" });
  const rm = await RawMaterial.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { name, color }, { new: true });
  if (!rm) return res.status(404).json({ error: "Raw material not found" });
  res.json(rm);
});

router.delete("/:id", async (req, res) => {
  const rm = await RawMaterial.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!rm) return res.status(404).json({ error: "Raw material not found" });
  await Inventory.updateMany({ userId: req.user._id, itemType: "RAW", itemId: req.params.id }, { quantity: 0 });
  await Product.updateMany(
    { userId: req.user._id, "billOfMaterials.rawMaterialId": req.params.id },
    { $pull: { billOfMaterials: { rawMaterialId: req.params.id } } }
  );
  res.json({ message: "Raw material deleted" });
});

module.exports = router;
