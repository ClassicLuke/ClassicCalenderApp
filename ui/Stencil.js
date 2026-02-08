export function initStencil({ onLayerToggle, onOpacityChange, navigate }) {
    document.querySelectorAll("#screen-stencil [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
    document.querySelectorAll("#screen-stencil input[type='checkbox']").forEach((input) => {
        input.addEventListener("change", () => onLayerToggle(input.dataset.layer, input.checked));
    });
    document.getElementById("overlayOpacity").addEventListener("input", onOpacityChange);
}

export function renderStencilOverlay(faceBox) {
    const overlay = document.getElementById("stencilOverlay");
    overlay.innerHTML = "";
    const base = faceBox ?? { x: 60, y: 70, width: 280, height: 360 };

    const layers = [
        { id: "brows", path: `M${base.x + 40},${base.y + 110} Q${base.x + 90},${base.y + 80} ${base.x + 140},${base.y + 110}` },
        { id: "brows", path: `M${base.x + 140},${base.y + 110} Q${base.x + 190},${base.y + 80} ${base.x + 240},${base.y + 110}` },
        { id: "eyes", path: `M${base.x + 80},${base.y + 150} Q${base.x + 110},${base.y + 140} ${base.x + 140},${base.y + 150}` },
        { id: "eyes", path: `M${base.x + 160},${base.y + 150} Q${base.x + 190},${base.y + 140} ${base.x + 220},${base.y + 150}` },
        { id: "blush", path: `M${base.x + 60},${base.y + 210} Q${base.x + 110},${base.y + 230} ${base.x + 140},${base.y + 210}` },
        { id: "blush", path: `M${base.x + 160},${base.y + 210} Q${base.x + 210},${base.y + 230} ${base.x + 240},${base.y + 210}` },
        { id: "contour", path: `M${base.x + 90},${base.y + 300} Q${base.x + 140},${base.y + 320} ${base.x + 170},${base.y + 300}` },
        { id: "lips", path: `M${base.x + 120},${base.y + 260} Q${base.x + 140},${base.y + 250} ${base.x + 160},${base.y + 260}` }
    ];

    layers.forEach((layer) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", layer.path);
        path.setAttribute("data-layer", layer.id);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(245,195,139,0.7)");
        path.setAttribute("stroke-width", "6");
        path.setAttribute("stroke-linecap", "round");
        overlay.appendChild(path);
    });
}

export function setOverlayOpacity(value) {
    document.getElementById("stencilOverlay").style.opacity = value;
}

export function toggleLayer(layerId, enabled) {
    document.querySelectorAll(`#stencilOverlay [data-layer='${layerId}']`).forEach((path) => {
        path.style.display = enabled ? "block" : "none";
    });
}
