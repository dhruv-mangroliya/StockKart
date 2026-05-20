const express = require("express");
const router = express.Router();
const { Inventory, RawMaterial, Product, EcomBatch, ProductionOrder } = require("../models");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

router.use(auth);

router.post("/calculate", async (req, res) => {
  try {
    const { runwayDays = 7, holidaySeverity = "LOW" } = req.body;

    // Holiday multipliers
    const holidayMultipliers = {
      LOW: 1,
      MEDIUM: 1.3,
      HIGH: 1.75,
    };
    const demandMultiplier = holidayMultipliers[holidaySeverity] || 1;

    // Get last 10 days of order data
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const batches = await EcomBatch.find({
      userId: req.user._id,
      createdAt: { $gte: tenDaysAgo },
    });

    // Calculate weighted demand for each item
    const itemDemand = {};
    const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // Last day: 10, 10 days before: 1

    batches.forEach((batch) => {
      const daysAgo = Math.floor((Date.now() - new Date(batch.createdAt)) / (1000 * 60 * 60 * 24));
      const weight = weights[Math.min(daysAgo, 9)] || 0;

      batch.items.forEach((item) => {
        const key = item.productId.toString();
        if (!itemDemand[key]) {
          itemDemand[key] = {
            productId: item.productId,
            productName: item.productName,
            totalWeightedQty: 0,
            totalWeight: 0,
            last3DaysQty: 0,
            last3DaysWeight: 0,
            dispatch: 0,
            return: 0,
          };
        }

        if (batch.type === "dispatch") {
          itemDemand[key].dispatch += item.quantity;
          itemDemand[key].totalWeightedQty += item.quantity * weight;
          itemDemand[key].totalWeight += weight;
          if (daysAgo <= 2) {
            itemDemand[key].last3DaysQty += item.quantity;
            itemDemand[key].last3DaysWeight += weight;
          }
        } else {
          itemDemand[key].return += item.quantity;
        }
      });
    });

    // Fetch all CREATED production orders once
    const allProductionOrders = await ProductionOrder.find({
      userId: req.user._id,
      status: "CREATED",
    });

    // Calculate today's demand and runway
    const inventory = await Inventory.find({ userId: req.user._id });
    const recommendations = [];

    for (const key in itemDemand) {
      const item = itemDemand[key];
      const weightedAverage = item.totalWeight > 0 ? item.totalWeightedQty / item.totalWeight : 0;
      const last3DaysAverage = item.last3DaysWeight > 0 ? item.last3DaysQty / item.last3DaysWeight : 0;
      const momentum = weightedAverage > 0 ? last3DaysAverage / weightedAverage : 1;
      const todayDemand = Math.ceil(weightedAverage * demandMultiplier);
      const netDemand = item.dispatch - item.return;

      // Current stock
      const currentStock = inventory
        .filter((inv) => inv.itemId.toString() === key && inv.itemType === "PRODUCT")
        .reduce((sum, inv) => sum + inv.quantity, 0);

      // Worst case: no new production
      const runwayWorstCase = currentStock > 0 ? Math.floor(currentStock / Math.max(todayDemand, 1)) : 0;

      // Best case: all ongoing production orders received (status CREATED, not yet completed)
      const incomingStock = allProductionOrders
        .filter((order) => order.productId.toString() === key)
        .reduce((sum, order) => sum + order.requiredQuantity, 0);

      const bestCaseStock = currentStock + incomingStock;
      const runwayBestCase = bestCaseStock > 0 ? Math.floor(bestCaseStock / Math.max(todayDemand, 1)) : 0;

      let momentumStatus = "Stable";
      if (momentum > 1.3) momentumStatus = "Trending Up";
      else if (momentum < 0.8) momentumStatus = "Falling";

      recommendations.push({
        productId: item.productId,
        productName: item.productName,
        todayDemand,
        netDemand,
        currentStock,
        incomingStock,
        runwayDays: runwayDays,
        canSustainDays: {
          worstCase: runwayWorstCase,
          bestCase: runwayBestCase,
        },
        momentum: parseFloat(momentum.toFixed(2)),
        momentumStatus,
        recommendation:
          runwayBestCase < runwayDays
            ? "URGENT - Order immediately"
            : runwayBestCase < runwayDays * 1.5
              ? "HIGH - Order soon"
              : "NORMAL - Monitor stock",
      });
    }

    res.json({
      holidaySeverity,
      demandMultiplier,
      runwayDays,
      recommendations: recommendations.sort((a, b) => a.canSustainDays.bestCase - b.canSustainDays.bestCase),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
