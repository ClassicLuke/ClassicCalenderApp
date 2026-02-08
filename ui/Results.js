export function initResults(navigate) {
    document.querySelectorAll("#screen-results [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}

export function renderResults(result) {
    document.getElementById("toneDepthValue").textContent = `${result.depth} (${result.depthLabel})`;
    document.getElementById("undertoneValue").textContent = result.undertone;
    document.getElementById("confidenceValue").textContent = `${result.confidence}%`;
    document.getElementById("resultsSummary").textContent =
        `Your photo suggests a ${result.undertone} undertone with ${result.depthLabel.toLowerCase()} depth.`;
}

export function renderSwatches(swatchGrid, colors) {
    swatchGrid.innerHTML = "";
    colors.forEach((color) => {
        const div = document.createElement("div");
        div.className = "swatch";
        const chip = document.createElement("span");
        chip.style.background = color.hex;
        div.appendChild(chip);
        const label = document.createElement("div");
        label.textContent = color.name;
        div.appendChild(label);
        swatchGrid.appendChild(div);
    });
}
