export function initAdjust({ onUndertoneChange, onDepthChange, navigate }) {
    document.querySelectorAll("#undertoneOptions button").forEach((button) => {
        button.addEventListener("click", () => onUndertoneChange(button.dataset.undertone));
    });
    document.getElementById("depthSlider").addEventListener("input", onDepthChange);
    document.querySelectorAll("#screen-adjust [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}

export function updateUndertoneSelection(undertone) {
    document.querySelectorAll("#undertoneOptions button").forEach((button) => {
        button.classList.toggle("active", button.dataset.undertone === undertone);
    });
}

export function updateDepthLabel(label) {
    document.getElementById("depthLabel").textContent = label;
}

export function updateDepthSlider(value) {
    document.getElementById("depthSlider").value = value;
}
