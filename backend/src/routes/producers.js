const express = require("express");
const router = express.Router();
const Producer = require("../models/Producer");

router.get("/", async (req, res) => {
  res.json(await Producer.find());
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  res.status(201).json(await Producer.create({ name }));
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const producer = await Producer.findByIdAndUpdate(req.params.id, { name }, { new: true });
  if (!producer) return res.status(404).json({ error: "Producer not found" });
  res.json(producer);
});

router.delete("/:id", async (req, res) => {
  const producer = await Producer.findByIdAndDelete(req.params.id);
  if (!producer) return res.status(404).json({ error: "Producer not found" });
  await require("../models/Inventory").deleteMany({ locationType: "PRODUCER", locationId: req.params.id });
  res.json({ message: "Producer deleted" });
});

module.exports = router;
