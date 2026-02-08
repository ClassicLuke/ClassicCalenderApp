export function initCapture({
    onStartCamera,
    onTakePhoto,
    onAnalyze,
    onUpload,
    navigate
}) {
    document.getElementById("startCamera").addEventListener("click", onStartCamera);
    document.getElementById("takePhoto").addEventListener("click", onTakePhoto);
    document.getElementById("analyzeButton").addEventListener("click", onAnalyze);
    document.getElementById("photoInput").addEventListener("change", onUpload);
    document.querySelectorAll("#screen-capture [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}

export function updateQualityList(items) {
    const list = document.getElementById("qualityList");
    list.innerHTML = "";
    items.forEach((item) => {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = item.label;
        const status = document.createElement("span");
        status.className = "status-pill small";
        status.textContent =
            item.status === "pass" ? "Pass" : item.status === "warn" ? "Needs work" : "Pending";
        status.style.color = item.status === "pass" ? "var(--success)" : "var(--warning)";
        status.style.background =
            item.status === "pass"
                ? "rgba(130,214,163,0.15)"
                : "rgba(246,195,116,0.15)";
        li.append(label, status);
        list.appendChild(li);
    });
}

export function updateQualityTip(message) {
    const tip = document.getElementById("qualityTip");
    tip.textContent = message;
}
