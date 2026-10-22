import { test } from "node:test";
import assert from "node:assert/strict";
import {
  imageMatchesMime,
  parsePlantAnalysis,
  maxPhotoBytes,
} from "../lib/plant-photo.ts";
const result = {
  imageQuality: "usable",
  urgency: "inspect_soon",
  summary: "Visible leaf yellowing; cause uncertain.",
  observations: ["Yellow patches on leaf."],
  possibleCauses: [
    {
      cause: "Water stress",
      basis: "Visible wilt.",
      check: "Inspect soil manually.",
    },
  ],
  nextSteps: ["Inspect the plant."],
  additionalPhotos: ["Leaf underside."],
};
test("photo files require supported content signatures, not only an extension", () => {
  assert.equal(
    imageMatchesMime(new Uint8Array([255, 216, 255, 1]), "image/jpeg"),
    true,
  );
  assert.equal(
    imageMatchesMime(new TextEncoder().encode("<svg/>"), "image/png"),
    false,
  );
  assert.equal(
    imageMatchesMime(new Uint8Array([255, 216, 255]), "image/webp"),
    false,
  );
  assert.equal(
    imageMatchesMime(new TextEncoder().encode("RIFF0000WEBP"), "image/webp"),
    true,
  );
  assert.equal(maxPhotoBytes, 2000000);
});
test("visual assessment parser accepts the complete bounded contract only", () => {
  assert.deepEqual(parsePlantAnalysis(result), result);
  assert.equal(parsePlantAnalysis({ ...result, summary: 4 }), null);
  assert.equal(
    parsePlantAnalysis({ ...result, urgency: "definitely_diseased" }),
    null,
  );
  assert.equal(
    parsePlantAnalysis({ ...result, possibleCauses: [{ cause: "Disease" }] }),
    null,
  );
  assert.equal(
    parsePlantAnalysis({ ...result, observations: Array(20).fill("text") }),
    null,
  );
  assert.equal(parsePlantAnalysis(null), null);
});
test("unclear or non-crop images cannot return speculative disease causes or urgency", () => {
  for (const imageQuality of ["retake", "not_crop"]) {
    const parsed = parsePlantAnalysis({
      ...result,
      imageQuality,
      urgency: "agronomist",
    });
    assert.equal(parsed.urgency, "routine");
    assert.deepEqual(parsed.possibleCauses, []);
  }
});
test("provider extras are removed and the input object is not mutated", () => {
  const input = { ...result, confidence: 99, diagnosis: "confirmed" };
  assert.equal("confidence" in parsePlantAnalysis(input), false);
  assert.equal("diagnosis" in parsePlantAnalysis(input), false);
  assert.equal(input.confidence, 99);
});
