import express from "express";
import {
  saveBatteryRun,
  getBatteryRun,
  deleteBatteryRun,
  getBatteryResults,
} from "../controllers/battery.controller.js";

export const batteryRouter = express.Router();

batteryRouter.put("/runs/:runId", saveBatteryRun);
batteryRouter.get("/runs/:runId", getBatteryRun);
batteryRouter.delete("/runs/:runId", deleteBatteryRun);
batteryRouter.get("/runs/:runId/results", getBatteryResults);
