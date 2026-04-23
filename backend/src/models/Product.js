const mongoose = require("mongoose");

module.exports = mongoose.model("Product", new mongoose.Schema({
  name: { type: String, required: true },
  billOfMaterials: [{
    rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: "RawMaterial", required: true },
    quantityRequiredPerUnit: { type: Number, required: true },
  }],
}));
