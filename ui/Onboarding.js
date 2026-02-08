export function initOnboarding(navigate) {
    const screen = document.getElementById("screen-onboarding");
    screen.querySelectorAll("[data-nav]").forEach((button) => {
        button.addEventListener("click", () => navigate(button.dataset.nav));
    });
}
