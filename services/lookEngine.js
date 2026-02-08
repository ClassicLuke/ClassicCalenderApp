export async function loadLooks() {
    const response = await fetch("./data/looks.json");
    if (!response.ok) {
        throw new Error("Unable to load looks.");
    }
    return response.json();
}

export function filterLooks(looks, undertone, depthLabel) {
    return looks.filter((look) => {
        const toneMatch = look.tags.undertone.includes(undertone);
        const depthMatch = look.tags.depth.includes(depthLabel);
        return toneMatch && depthMatch;
    });
}
