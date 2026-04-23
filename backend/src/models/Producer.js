const mongoose = require("mongoose");

module.exports = mongoose.model("Producer", new mongoose.Schema({
  name: { type: String, required: true },
}));
