const express = require("express");
const router = express.Router();
const { Store, Inventory } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
  res.json(await Store.find({ userId: req.user._id }));
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  res.status(201).json(await Store.create({ userId: req.user._id, name }));
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const store = await Store.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { name }, { new: true });
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(store);
});

router.delete("/:id", async (req, res) => {
  const store = await Store.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!store) return res.status(404).json({ error: "Store not found" });
  await Inventory.deleteMany({ userId: req.user._id, locationType: "STORE", locationId: req.params.id });
  res.json({ message: "Store deleted" });
});

module.exports = router;
