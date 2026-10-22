export const maxPhotoBytes = 2_000_000;
export const imageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export interface PlantPhotoAnalysis {
  imageQuality: "usable" | "retake" | "not_crop";
  urgency: "routine" | "inspect_soon" | "agronomist";
  summary: string;
  observations: string[];
  possibleCauses: { cause: string; basis: string; check: string }[];
  nextSteps: string[];
  additionalPhotos: string[];
}
export function imageMatchesMime(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg")
    return (
      bytes.length >= 3 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    );
  if (mime === "image/png")
    return (
      bytes.length >= 24 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
    );
  if (mime === "image/webp")
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}
export function parsePlantAnalysis(value: unknown): PlantPhotoAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const str = (s: unknown, max = 1000): s is string =>
    typeof s === "string" && s.trim().length > 0 && s.length <= max;
  const list = (s: unknown, max = 6): s is string[] =>
    Array.isArray(s) && s.length <= max && s.every((x) => str(x, 700));
  if (
    !["usable", "retake", "not_crop"].includes(String(v.imageQuality)) ||
    !["routine", "inspect_soon", "agronomist"].includes(String(v.urgency)) ||
    !str(v.summary) ||
    !list(v.observations) ||
    !list(v.nextSteps) ||
    !list(v.additionalPhotos, 4) ||
    !Array.isArray(v.possibleCauses) ||
    v.possibleCauses.length > 4 ||
    !v.possibleCauses.every(
      (c) =>
        c &&
        typeof c === "object" &&
        str(c.cause, 250) &&
        str(c.basis, 600) &&
        str(c.check, 600),
    )
  )
    return null;
  const result = v as unknown as PlantPhotoAnalysis;
  return {
    imageQuality: result.imageQuality,
    urgency: result.imageQuality === "usable" ? result.urgency : "routine",
    summary: result.summary,
    observations: result.observations,
    possibleCauses:
      result.imageQuality === "usable" ? result.possibleCauses : [],
    nextSteps: result.nextSteps,
    additionalPhotos: result.additionalPhotos,
  };
}
