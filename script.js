const wheel = document.getElementById('rotation-wheel');
const wrapper = document.getElementById('cursor-wrapper');
const container = document.getElementById('exercice-container');
const fond = document.getElementById('fond-exercice');

let rotation = 0;
let zoomLevel = 1;
let isRotating = false;
let lastAngle = 0;

// 1. DÉPLACER L'ÉQUERRE (En touchant la zone de l'exercice)
container.addEventListener('touchmove', (e) => {
    if (isRotating) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
}, { passive: false });

// 2. FAIRE PIVOTER (En touchant le volant)
wheel.addEventListener('touchstart', (e) => {
    isRotating = true;
    const touch = e.touches[0];
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (!isRotating) return;
    const touch = e.touches[0];
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
    rotation += (currentAngle - lastAngle) * (180 / Math.PI);
    lastAngle = currentAngle;

    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    wheel.style.transform = `rotate(${rotation}deg)`;
}, { passive: false });

window.addEventListener('touchend', () => { isRotating = false; });

// 3. ZOOM
function ajusterZoom(delta) {
    zoomLevel = Math.max(1, Math.min(3, zoomLevel + delta));
    fond.style.transform = `scale(${zoomLevel})`;
}
function resetZoom() {
    zoomLevel = 1;
    fond.style.transform = `scale(1)`;
}
// --- GESTION DU PLEIN ÉCRAN ---

const containerExercice = document.getElementById('exercice-container');

// 1. Double-clic sur PC
containerExercice.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        containerExercice.requestFullscreen().catch(err => {
            alert(`Erreur : ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// 2. Mode Paysage sur Smartphone
window.addEventListener("orientationchange", () => {
    // Si l'écran passe à 90 ou -90 degrés (paysage)
    if (window.orientation === 90 || window.orientation === -90) {
        if (!document.fullscreenElement) {
            containerExercice.requestFullscreen();
        }
    } else {
        // Si on revient en portrait, on quitte le plein écran
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
});