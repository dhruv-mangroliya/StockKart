const mongoose = require("mongoose");

module.exports = mongoose.model("Store", new mongoose.Schema({
  name: { type: String, required: true },
}));
