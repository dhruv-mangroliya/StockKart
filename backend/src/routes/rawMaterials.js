const express = require("express");
const router = express.Router();
const RawMaterial = require("../models/RawMaterial");

router.get("/", async (req, res) => {
  res.json(await RawMaterial.find());
});

router.post("/", async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: "Name and color are required" });
  res.status(201).json(await RawMaterial.create({ name, color }));
});

router.put("/:id", async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: "Name and color are required" });
  const rm = await RawMaterial.findByIdAndUpdate(req.params.id, { name, color }, { new: true });
  if (!rm) return res.status(404).json({ error: "Raw material not found" });
  res.json(rm);
});

router.delete("/:id", async (req, res) => {
  const rm = await RawMaterial.findByIdAndDelete(req.params.id);
  if (!rm) return res.status(404).json({ error: "Raw material not found" });
  // Zero out all inventory for this raw material
  await require("../models/Inventory").updateMany({ itemType: "RAW", itemId: req.params.id }, { quantity: 0 });
  // Remove from all product BOMs
  await require("../models/Product").updateMany(
    { "billOfMaterials.rawMaterialId": req.params.id },
    { $pull: { billOfMaterials: { rawMaterialId: req.params.id } } }
  );
  res.json({ message: "Raw material deleted" });
});

module.exports = router;
