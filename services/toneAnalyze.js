export function getImageData(image, canvas, targetSize = 512) {
    const ctx = canvas.getContext("2d");
    const scale = Math.min(targetSize / image.width, targetSize / image.height, 1);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function rgbToXyz(r, g, b) {
    const srgb = [r, g, b].map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    const [rl, gl, bl] = srgb;
    const x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
    const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
    const z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;

    return { x, y, z };
}

export function xyzToLab(x, y, z) {
    const refX = 0.95047;
    const refY = 1.0;
    const refZ = 1.08883;

    const normalize = (value) => {
        const v = value > 0.008856 ? Math.cbrt(value) : (7.787 * value) + 16 / 116;
        return v;
    };

    const fx = normalize(x / refX);
    const fy = normalize(y / refY);
    const fz = normalize(z / refZ);

    return {
        l: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz)
    };
}

export function rgbToLab(r, g, b) {
    const { x, y, z } = rgbToXyz(r, g, b);
    return xyzToLab(x, y, z);
}

export function computeIqr(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    return { q1, q3, iqr: q3 - q1 };
}

export function filterOutliers(values) {
    if (values.length < 8) {
        return values;
    }
    const { q1, q3, iqr } = computeIqr(values);
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return values.filter((value) => value >= lower && value <= upper);
}

export function sampleRegions(imageData, faceBox) {
    const { width, height, data } = imageData;
    const regions = [];
    const box = faceBox ?? { x: width * 0.2, y: height * 0.1, width: width * 0.6, height: height * 0.7 };

    const regionSize = Math.min(box.width * 0.22, box.height * 0.22);
    const leftCheek = {
        x: box.x + box.width * 0.18,
        y: box.y + box.height * 0.45,
        size: regionSize
    };
    const rightCheek = {
        x: box.x + box.width * 0.6,
        y: box.y + box.height * 0.45,
        size: regionSize
    };
    const jaw = {
        x: box.x + box.width * 0.35,
        y: box.y + box.height * 0.72,
        size: regionSize
    };

    [leftCheek, rightCheek, jaw].forEach((region) => {
        const pixels = [];
        for (let y = region.y; y < region.y + region.size; y += 1) {
            for (let x = region.x; x < region.x + region.size; x += 1) {
                if (x < 0 || y < 0 || x >= width || y >= height) continue;
                const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const lab = rgbToLab(r, g, b);
                pixels.push(lab);
            }
        }
        regions.push(pixels);
    });

    return regions.flat();
}

export function analyzeTone(imageData, faceBox) {
    const samples = sampleRegions(imageData, faceBox);
    const lValues = samples.map((pixel) => pixel.l);
    const filteredL = filterOutliers(lValues);

    const trimmedSamples = samples.filter((pixel) => filteredL.includes(pixel.l));
    const mean = trimmedSamples.reduce((acc, pixel) => {
        acc.l += pixel.l;
        acc.a += pixel.a;
        acc.b += pixel.b;
        return acc;
    }, { l: 0, a: 0, b: 0 });

    const count = Math.max(trimmedSamples.length, 1);
    mean.l /= count;
    mean.a /= count;
    mean.b /= count;

    const depth = Math.max(0, Math.min(100, 100 - mean.l));
    const depthLabel = depthToLabel(depth);
    const { undertone, confidence } = estimateUndertone(mean, samples);

    return {
        depth: Math.round(depth),
        depthLabel,
        undertone,
        confidence,
        labMean: mean
    };
}

export function depthToLabel(depth) {
    if (depth < 15) return "Very Fair";
    if (depth < 30) return "Fair";
    if (depth < 45) return "Light";
    if (depth < 60) return "Medium";
    if (depth < 75) return "Tan";
    if (depth < 90) return "Deep";
    return "Very Deep";
}

export function estimateUndertone(meanLab, samples) {
    const { a, b } = meanLab;
    let undertone = "neutral";
    let signal = 0;

    if (a < 2 && b >= 6 && b <= 14) {
        undertone = "olive";
        signal = 0.65;
    } else if (b > 12 && b - a > 5) {
        undertone = "warm";
        signal = 0.7;
    } else if (b < 7 && a > 6) {
        undertone = "cool";
        signal = 0.7;
    } else if (b >= 7 && b <= 12) {
        undertone = "neutral";
        signal = 0.6;
    } else {
        undertone = "neutral";
        signal = 0.5;
    }

    const variability = computeVariability(samples);
    const confidence = Math.max(0.35, Math.min(0.95, signal - variability));

    return { undertone, confidence: Math.round(confidence * 100) };
}

function computeVariability(samples) {
    if (samples.length === 0) return 0.4;
    const mean = samples.reduce((acc, pixel) => {
        acc.a += pixel.a;
        acc.b += pixel.b;
        return acc;
    }, { a: 0, b: 0 });
    mean.a /= samples.length;
    mean.b /= samples.length;

    const variance = samples.reduce((acc, pixel) => {
        acc += Math.pow(pixel.a - mean.a, 2) + Math.pow(pixel.b - mean.b, 2);
        return acc;
    }, 0) / samples.length;

    return Math.min(0.4, Math.sqrt(variance) / 50);
}
