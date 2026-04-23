const mongoose = require("mongoose");

module.exports = mongoose.model("ProductionOrder", new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  producerId: { type: mongoose.Schema.Types.ObjectId, ref: "Producer", required: true },
  inputMaterials: [{
    rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: "RawMaterial", required: true },
    sourceStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    quantitySent: { type: Number, required: true },
  }],
  requiredQuantity: { type: Number, required: true },
  outputQuantity: { type: Number, default: 0 },
  destinationStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
  status: { type: String, enum: ["CREATED", "COMPLETED"], default: "CREATED" },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}));
