import test from "node:test";
import assert from "node:assert/strict";
import { rgbToLab, depthToLabel, estimateUndertone } from "../services/toneAnalyze.js";

test("rgbToLab returns expected ranges", () => {
    const lab = rgbToLab(255, 224, 189);
    assert.ok(lab.l > 60 && lab.l < 100);
    assert.ok(typeof lab.a === "number");
    assert.ok(typeof lab.b === "number");
});

test("depthToLabel maps depth buckets", () => {
    assert.equal(depthToLabel(10), "Very Fair");
    assert.equal(depthToLabel(35), "Light");
    assert.equal(depthToLabel(55), "Medium");
    assert.equal(depthToLabel(80), "Deep");
});

test("estimateUndertone returns confidence percent", () => {
    const result = estimateUndertone({ a: 2, b: 14 }, [{ a: 2, b: 14 }]);
    assert.ok(["warm", "neutral", "cool", "olive"].includes(result.undertone));
    assert.ok(result.confidence >= 35 && result.confidence <= 95);
});
