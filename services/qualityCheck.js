import { getImageData } from "./toneAnalyze.js";

export function calculateLaplacianVariance(imageData) {
    const { width, height, data } = imageData;
    let sum = 0;
    let sumSq = 0;
    const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    const gray = new Float32Array(width * height);

    for (let i = 0; i < width * height; i += 1) {
        const idx = i * 4;
        gray[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
    }

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            let value = 0;
            let k = 0;
            for (let ky = -1; ky <= 1; ky += 1) {
                for (let kx = -1; kx <= 1; kx += 1) {
                    value += gray[idx + ky * width + kx] * kernel[k];
                    k += 1;
                }
            }
            sum += value;
            sumSq += value * value;
        }
    }

    const count = (width - 2) * (height - 2);
    const mean = sum / count;
    return sumSq / count - mean * mean;
}

export function evaluateLighting(imageData) {
    const { data } = imageData;
    let totalLuma = 0;
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    const count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        totalR += r;
        totalG += g;
        totalB += b;
    }

    const avgLuma = totalLuma / count;
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;
    const cast = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);

    return {
        avgLuma,
        cast,
        avgChannels: { r: avgR, g: avgG, b: avgB }
    };
}

export function runQualityChecks(image, canvas) {
    const imageData = getImageData(image, canvas, 320);
    const lighting = evaluateLighting(imageData);
    const blur = calculateLaplacianVariance(imageData);

    const results = [
        {
            key: "face",
            label: "Face detected & large enough",
            status: "pending",
            message: "Face detection will run during analysis."
        },
        {
            key: "lighting",
            label: "Lighting & exposure",
            status: lighting.avgLuma > 70 && lighting.avgLuma < 190 ? "pass" : "warn",
            message:
                lighting.avgLuma < 70
                    ? "Image is too dark. Try facing a window."
                    : lighting.avgLuma > 190
                        ? "Image is too bright. Avoid harsh light."
                        : lighting.cast > 25
                            ? "Strong color cast detected. Use neutral lighting."
                            : "Lighting looks balanced."
        },
        {
            key: "blur",
            label: "Sharpness",
            status: blur > 70 ? "pass" : "warn",
            message: blur > 70 ? "Looks sharp enough." : "Image looks blurry. Hold steady."
        }
    ];

    return results;
}
