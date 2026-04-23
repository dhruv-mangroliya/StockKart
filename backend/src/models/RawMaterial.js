const mongoose = require("mongoose");

module.exports = mongoose.model("RawMaterial", new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
}));
