export function initTrendingLooks(navigate) {
    document.querySelectorAll("#screen-trending [data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}

export function renderLooks(looks) {
    const grid = document.getElementById("looksGrid");
    grid.innerHTML = "";
    looks.forEach((look) => {
        const card = document.createElement("div");
        card.className = "look-card";
        const title = document.createElement("h3");
        title.textContent = look.name;
        const tags = document.createElement("div");
        tags.className = "look-tags";
        look.tags.vibe.forEach((tag) => {
            const pill = document.createElement("span");
            pill.className = "tag";
            pill.textContent = tag;
            tags.appendChild(pill);
        });
        const steps = document.createElement("ol");
        look.steps.forEach((step) => {
            const li = document.createElement("li");
            li.textContent = step;
            steps.appendChild(li);
        });
        const swatches = document.createElement("div");
        swatches.className = "swatch-grid";
        look.swatches.forEach((swatch) => {
            const chip = document.createElement("div");
            chip.className = "swatch";
            const span = document.createElement("span");
            span.style.background = swatch.hex;
            const label = document.createElement("div");
            label.textContent = swatch.name;
            chip.append(span, label);
            swatches.appendChild(chip);
        });
        const meta = document.createElement("p");
        meta.className = "small-text";
        meta.textContent = `Difficulty: ${look.difficulty} · ${look.vibe}`;
        card.append(title, tags, steps, swatches, meta);
        grid.appendChild(card);
    });
}
