const express = require("express");
const router = express.Router();
const Store = require("../models/Store");

router.get("/", async (req, res) => {
  res.json(await Store.find());
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  res.status(201).json(await Store.create({ name }));
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const store = await Store.findByIdAndUpdate(req.params.id, { name }, { new: true });
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(store);
});

router.delete("/:id", async (req, res) => {
  const store = await Store.findByIdAndDelete(req.params.id);
  if (!store) return res.status(404).json({ error: "Store not found" });
  await require("../models/Inventory").deleteMany({ locationType: "STORE", locationId: req.params.id });
  res.json({ message: "Store deleted" });
});

module.exports = router;
