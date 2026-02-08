import { depthToLabel } from "./toneAnalyze.js";

export async function loadPalettes() {
    const response = await fetch("./data/palettes.json");
    if (!response.ok) {
        throw new Error("Unable to load palettes.");
    }
    return response.json();
}

export function selectPalette(palettes, undertone, depth) {
    const depthLabel = depthToLabel(depth);
    const matches = palettes.filter((palette) => palette.undertone === undertone);
    const exact = matches.find((palette) => palette.depthBucket === depthLabel);
    return exact ?? matches[0] ?? palettes[0];
}
