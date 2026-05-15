require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("./passport");

const app = express();

const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
console.log("CORS Origin:", FRONTEND_URL);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", require("./routes/auth"));
app.use("/payment", require("./routes/payment"));

const auth = require("./middleware/auth");
app.use("/stores", require("./routes/stores"));
app.use("/raw-materials", require("./routes/rawMaterials"));
app.use("/products", require("./routes/products"));
app.use("/producers", require("./routes/producers"));
app.use("/inventory", require("./routes/inventory"));
app.use("/transfers", require("./routes/transfers"));
app.use("/production-orders", require("./routes/productionOrders"));
app.use("/ecom-batches", require("./routes/ecomBatches"));

mongoose
  .connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Server running on https://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
