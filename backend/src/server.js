require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/stores", require("./routes/stores"));
app.use("/raw-materials", require("./routes/rawMaterials"));
app.use("/products", require("./routes/products"));
app.use("/producers", require("./routes/producers"));
app.use("/inventory", require("./routes/inventory"));
app.use("/transfers", require("./routes/transfers"));
app.use("/production-orders", require("./routes/productionOrders"));

mongoose
  .connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
