export async function detectFace(image) {
    if (!("FaceDetector" in window)) {
        return { faces: [], support: "unsupported" };
    }

    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    try {
        const faces = await detector.detect(image);
        return { faces, support: "native" };
    } catch (error) {
        return { faces: [], support: "failed" };
    }
}
