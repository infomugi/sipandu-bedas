/**
 * iOS 17 Style UI/UX Interactions & Accessibility
 * Handles dynamic ARIA attributes, keyboard navigation, and interactions
 * for custom iOS components in Vanilla JS.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. iOS Toggle Switches
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        // Initialize ARIA and Accessibility attributes
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('tabindex', '0');
        const isActive = toggle.classList.contains('active');
        toggle.setAttribute('aria-checked', isActive ? 'true' : 'false');

        // Handle Keyboard interaction (Enter / Space)
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click(); // Trigger the existing onclick handler
            }
        });

        // Use MutationObserver to watch for class changes caused by inline onclicks
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const updatedState = toggle.classList.contains('active');
                    toggle.setAttribute('aria-checked', updatedState ? 'true' : 'false');
                }
            });
        });

        observer.observe(toggle, { attributes: true });
    });

    // 2. iOS Sliders
    const sliders = document.querySelectorAll('.ios-slider, input[type="range"]');
    sliders.forEach(slider => {
        // Initialize
        slider.setAttribute('role', 'slider');
        slider.setAttribute('aria-valuemin', slider.min || '0');
        slider.setAttribute('aria-valuemax', slider.max || '100');
        slider.setAttribute('aria-valuenow', slider.value || '0');

        // Update on change
        slider.addEventListener('input', (e) => {
            slider.setAttribute('aria-valuenow', e.target.value);
        });
    });
});
