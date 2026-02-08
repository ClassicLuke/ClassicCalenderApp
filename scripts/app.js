import { detectFace } from "../services/faceDetect.js";
import { runQualityChecks } from "../services/qualityCheck.js";
import { analyzeTone, getImageData, depthToLabel } from "../services/toneAnalyze.js";
import { loadPalettes, selectPalette } from "../services/paletteEngine.js";
import { loadLooks, filterLooks } from "../services/lookEngine.js";
import { initOnboarding } from "../ui/Onboarding.js";
import { initCapture, updateQualityList, updateQualityTip } from "../ui/Capture.js";
import { initResults, renderResults, renderSwatches } from "../ui/Results.js";
import { initAdjust, updateUndertoneSelection, updateDepthLabel, updateDepthSlider } from "../ui/Adjust.js";
import { initPaletteDetail, renderPaletteDetail } from "../ui/PaletteDetail.js";
import { initTrendingLooks, renderLooks } from "../ui/TrendingLooks.js";
import { initStencil, renderStencilOverlay, setOverlayOpacity, toggleLayer } from "../ui/Stencil.js";

const state = {
    image: null,
    imageData: null,
    faceBox: null,
    toneResult: null,
    palette: null,
    palettes: [],
    looks: [],
    cameraStream: null
};

const screens = document.querySelectorAll(".screen");

function navigate(target) {
    screens.forEach((screen) => {
        screen.classList.toggle("active", screen.id === `screen-${target}`);
    });
}

async function initData() {
    try {
        state.palettes = await loadPalettes();
        state.looks = await loadLooks();
    } catch (error) {
        console.error(error);
    }
}

function setPhoto(image) {
    state.image = image;
    const preview = document.getElementById("photoPreview");
    preview.src = image.src;
    preview.style.display = "block";
    document.getElementById("stencilPhoto").src = image.src;
}

async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const image = new Image();
    image.src = URL.createObjectURL(file);
    await image.decode();
    setPhoto(image);
    updateQuality();
}

async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        updateQualityTip("Camera access is not supported. Upload a photo instead.");
        return;
    }
    try {
        state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        const video = document.getElementById("cameraPreview");
        video.srcObject = state.cameraStream;
        await video.play();
    } catch (error) {
        updateQualityTip("Camera permission denied. Upload a photo instead.");
    }
}

function takePhoto() {
    const video = document.getElementById("cameraPreview");
    if (!video.videoWidth) {
        updateQualityTip("Camera not ready yet.");
        return;
    }
    const canvas = document.getElementById("captureCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = new Image();
    image.src = canvas.toDataURL("image/jpeg", 0.9);
    image.onload = () => {
        setPhoto(image);
        updateQuality();
    };
}

function updateQuality() {
    if (!state.image) return;
    const canvas = document.getElementById("captureCanvas");
    const checks = runQualityChecks(state.image, canvas);
    updateQualityList(checks);
    const warning = checks.find((check) => check.status === "warn");
    updateQualityTip(warning ? warning.message : "Looks good! Ready to analyze.");
}

async function analyze() {
    if (!state.image) {
        updateQualityTip("Please capture or upload a photo first.");
        return;
    }
    const canvas = document.getElementById("captureCanvas");
    state.imageData = getImageData(state.image, canvas, 420);

    const detection = await detectFace(state.image);
    state.faceBox = detection.faces[0]?.boundingBox ?? null;
    const checks = runQualityChecks(state.image, canvas).map((check) => {
        if (check.key !== "face") return check;
        const hasFace = Boolean(state.faceBox);
        return {
            ...check,
            status: hasFace ? "pass" : "warn",
            message: hasFace
                ? "Face detected."
                : "Face detection unavailable. We will use a centered sample."
        };
    });
    updateQualityList(checks);
    const faceTip = checks.find((check) => check.key === "face");
    updateQualityTip(faceTip?.message ?? "");

    const tone = analyzeTone(state.imageData, state.faceBox);
    state.toneResult = tone;

    if (state.palettes.length === 0) {
        await initData();
    }
    state.palette = selectPalette(state.palettes, tone.undertone, tone.depth);

    renderResults(tone);
    renderSwatches(document.getElementById("swatchGrid"), state.palette.recommendedColors.slice(0, 6));
    renderPaletteDetail(state.palette);
    renderLooks(filterLooks(state.looks, tone.undertone, tone.depthLabel));
    updateAdjustScreen();
    renderStencilOverlay(state.faceBox ? mapFaceBox(state.faceBox) : null);
    navigate("results");
}

function mapFaceBox(faceBox) {
    return {
        x: (faceBox.x / state.image.width) * 400,
        y: (faceBox.y / state.image.height) * 500,
        width: (faceBox.width / state.image.width) * 400,
        height: (faceBox.height / state.image.height) * 500
    };
}

function updateAdjustScreen() {
    if (!state.toneResult) return;
    updateUndertoneSelection(state.toneResult.undertone);
    updateDepthSlider(state.toneResult.depth);
    updateDepthLabel(`${state.toneResult.depth} (${state.toneResult.depthLabel})`);
    const palette = selectPalette(state.palettes, state.toneResult.undertone, state.toneResult.depth);
    renderSwatches(document.getElementById("adjustSwatches"), palette.recommendedColors.slice(0, 6));
}

function handleUndertoneChange(undertone) {
    if (!state.toneResult) return;
    state.toneResult.undertone = undertone;
    updateUndertoneSelection(undertone);
    updateAdjustScreen();
}

function handleDepthChange(event) {
    if (!state.toneResult) return;
    const depth = Number(event.target.value);
    state.toneResult.depth = depth;
    state.toneResult.depthLabel = depthToLabel(depth);
    updateDepthLabel(`${depth} (${state.toneResult.depthLabel})`);
    updateAdjustScreen();
}

function handleStencilOpacity(event) {
    setOverlayOpacity(event.target.value);
}

function initNavigation() {
    initOnboarding(navigate);
    initCapture({
        onStartCamera: startCamera,
        onTakePhoto: takePhoto,
        onAnalyze: analyze,
        onUpload: handleUpload,
        navigate
    });
    initResults(navigate);
    initAdjust({ onUndertoneChange: handleUndertoneChange, onDepthChange: handleDepthChange, navigate });
    initPaletteDetail(navigate);
    initTrendingLooks(navigate);
    initStencil({
        onLayerToggle: toggleLayer,
        onOpacityChange: handleStencilOpacity,
        navigate
    });
}

initNavigation();
initData();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((error) => {
            console.warn("Service worker registration failed", error);
        });
    });
}
