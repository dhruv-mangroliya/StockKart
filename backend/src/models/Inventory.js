const mongoose = require("mongoose");

module.exports = mongoose.model("Inventory", new mongoose.Schema({
  itemType: { type: String, enum: ["RAW", "PRODUCT"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationType: { type: String, enum: ["STORE", "PRODUCER"], required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, default: 0 },
}));
