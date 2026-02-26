import { BatteryRun } from "../models/batteryRun.model.js";

/* ---------- Color math (Lab + DeltaE76) ---------- */

function rgbToXyz({ r, g, b }) {
  let rr = r / 255, gg = g / 255, bb = b / 255;

  rr = rr <= 0.04045 ? rr / 12.92 : Math.pow((rr + 0.055) / 1.055, 2.4);
  gg = gg <= 0.04045 ? gg / 12.92 : Math.pow((gg + 0.055) / 1.055, 2.4);
  bb = bb <= 0.04045 ? bb / 12.92 : Math.pow((bb + 0.055) / 1.055, 2.4);

  const x = rr * 0.4124 + gg * 0.3576 + bb * 0.1805;
  const y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  const z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505;

  return { x: x * 100, y: y * 100, z: z * 100 };
}

function xyzToLab(x, y, z) {
  const refX = 95.047, refY = 100.0, refZ = 108.883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / refX), fy = f(y / refY), fz = f(z / refZ);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function deltaE76(a, b) {
  return Math.sqrt(
    Math.pow(a.L - b.L, 2) +
    Math.pow(a.a - b.a, 2) +
    Math.pow(a.b - b.b, 2)
  );
}

function rgbToLab(rgb) {
  const { x, y, z } = rgbToXyz(rgb);
  return xyzToLab(x, y, z);
}

/* ---------- Controller Functions ---------- */

export async function saveBatteryRun(req, res) {
  const { runId } = req.params;
  if (!runId) return res.status(400).json({ ok: false, error: "Missing runId" });

  const payload = req.body;
  if (!payload || typeof payload !== "object")
    return res.status(400).json({ ok: false, error: "Invalid payload" });

  const doc = await BatteryRun.findOneAndUpdate(
    { runId },
    { runId, payload },
    { upsert: true, new: true }
  );

  res.json({ ok: true, runId: doc.runId });
}

export async function getBatteryRun(req, res) {
  const { runId } = req.params;
  const doc = await BatteryRun.findOne({ runId }).lean();
  if (!doc) return res.status(404).json({ ok: false, error: "Not found" });

  res.json({ ok: true, payload: doc.payload });
}

export async function deleteBatteryRun(req, res) {
  const { runId } = req.params;
  await BatteryRun.deleteOne({ runId });
  res.json({ ok: true });
}

export async function getBatteryResults(req, res) {
  const { runId } = req.params;
  const repeats = Number(req.query.repeats ?? 3);

  const doc = await BatteryRun.findOne({ runId }).lean();
  if (!doc) return res.status(404).json({ ok: false, error: "Not found" });

  const payload = doc.payload;
  const picker = payload?.pickerResponses || [];
  const congr = payload?.congruencyResponses || [];

  // ---- Picker scoring ----
  const byG = new Map();
  for (const r of picker) {
    if (!byG.has(r.grapheme)) byG.set(r.grapheme, []);
    byG.get(r.grapheme).push(r);
  }

  const rows = [];

  for (const [g, rs] of byG.entries()) {
    const colors = rs
      .filter((r) => !r.isNoColor && r.rgb)
      .map((r) => r.rgb);

    let deltas = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        deltas.push(
          deltaE76(rgbToLab(colors[i]), rgbToLab(colors[j]))
        );
      }
    }

    const meanDeltaE = deltas.length
      ? deltas.reduce((a, b) => a + b, 0) / deltas.length
      : 0;

    rows.push({ grapheme: g, meanDeltaE });
  }

  const pickerScore = rows.length
    ? rows.reduce((a, r) => a + r.meanDeltaE, 0) / rows.length
    : 0;

  // ---- Congruency scoring ----
  const correct = congr.filter((c) => c.correct).length;
  const accuracy = congr.length ? (correct / congr.length) * 100 : 0;
  const meanRt =
    congr.length
      ? congr.reduce((a, r) => a + r.rtMs, 0) / congr.length / 1000
      : 0;

  res.json({
    ok: true,
    results: {
      pickerScore,
      congruencyAccuracyPct: accuracy,
      congruencyMeanRtSec: meanRt,
    },
  });
}
