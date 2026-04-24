const express = require("express");
const router = express.Router();
const { Producer, Inventory } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  res.json(await Producer.find({ userId: req.user._id }));
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  res.status(201).json(await Producer.create({ userId: req.user._id, name }));
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const producer = await Producer.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { name }, { new: true });
  if (!producer) return res.status(404).json({ error: "Producer not found" });
  res.json(producer);
});

router.delete("/:id", async (req, res) => {
  const producer = await Producer.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!producer) return res.status(404).json({ error: "Producer not found" });
  await Inventory.deleteMany({ userId: req.user._id, locationType: "PRODUCER", locationId: req.params.id });
  res.json({ message: "Producer deleted" });
});

module.exports = router;
