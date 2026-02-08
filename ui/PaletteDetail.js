import { renderSwatches } from "./Results.js";

export function initPaletteDetail(navigate) {
    document.querySelectorAll("#screen-palette [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}

export function renderPaletteDetail(palette) {
    const clothingGroups = document.getElementById("clothingGroups");
    clothingGroups.innerHTML = "";
    const categories = ["neutral", "accent", "bold"];
    categories.forEach((category) => {
        const group = document.createElement("div");
        group.className = "card";
        const title = document.createElement("h4");
        title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        group.appendChild(title);
        const swatchGrid = document.createElement("div");
        swatchGrid.className = "swatch-grid";
        renderSwatches(swatchGrid, palette.recommendedColors.filter((color) => color.category === category));
        group.appendChild(swatchGrid);
        clothingGroups.appendChild(group);
    });

    const makeupFamilies = document.getElementById("makeupFamilies");
    makeupFamilies.innerHTML = "";
    Object.entries(palette.makeupFamilies).forEach(([family, colors]) => {
        const block = document.createElement("div");
        block.className = "card";
        const title = document.createElement("h4");
        title.textContent = family.charAt(0).toUpperCase() + family.slice(1);
        block.appendChild(title);
        const swatchGrid = document.createElement("div");
        swatchGrid.className = "swatch-grid";
        renderSwatches(swatchGrid, colors);
        block.appendChild(swatchGrid);
        makeupFamilies.appendChild(block);
    });
}
