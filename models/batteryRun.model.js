import mongoose from "mongoose";

const BatteryRunSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAtMs: { type: Number, default: () => Date.now() },
    updatedAtMs: { type: Number, default: () => Date.now() },
  },
  { minimize: false }
);

BatteryRunSchema.pre("save", function (next) {
  this.updatedAtMs = Date.now();
  next();
});

export const BatteryRun =
  mongoose.models.BatteryRun || mongoose.model("BatteryRun", BatteryRunSchema);
