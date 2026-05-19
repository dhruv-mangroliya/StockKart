const mongoose = require("mongoose");
const uid = { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } };

module.exports.Store = mongoose.model("Store", new mongoose.Schema({ ...uid, name: { type: String, required: true } }));
module.exports.RawMaterial = mongoose.model("RawMaterial", new mongoose.Schema({ ...uid, name: { type: String, required: true }, color: { type: String, required: true } }));
module.exports.Producer = mongoose.model("Producer", new mongoose.Schema({ ...uid, name: { type: String, required: true } }));
module.exports.Product = mongoose.model("Product", new mongoose.Schema({
  ...uid,
  name: { type: String, required: true },
  billOfMaterials: [{ rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: "RawMaterial", required: true }, quantityRequiredPerUnit: { type: Number, required: true } }],
}));
module.exports.Inventory = mongoose.model("Inventory", new mongoose.Schema({
  ...uid,
  itemType: { type: String, enum: ["RAW", "PRODUCT"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationType: { type: String, enum: ["STORE", "PRODUCER"], required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, default: 0 },
}));
module.exports.ProductionOrder = mongoose.model("ProductionOrder", new mongoose.Schema({
  ...uid,
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
module.exports.EcomBatch = mongoose.model("EcomBatch", new mongoose.Schema({
  ...uid,
  type: { type: String, enum: ["return", "dispatch"], required: true },
  platform: { type: String, default: "" },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
  }],
  createdAt: { type: Date, default: Date.now },
}));
module.exports.ProducerReturn = mongoose.model("ProducerReturn", new mongoose.Schema({
  ...uid,
  producerId: { type: mongoose.Schema.Types.ObjectId, ref: "Producer", required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  materials: [{
    rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: "RawMaterial", required: true },
    rawMaterialName: { type: String, required: true },
    quantity: { type: Number, required: true },
  }],
  createdAt: { type: Date, default: Date.now },
}));
module.exports.Transfer = mongoose.model("Transfer", new mongoose.Schema({
  ...uid,
  itemType: { type: String, enum: ["RAW", "PRODUCT"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemName: { type: String, required: true },
  fromStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  toStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}));
