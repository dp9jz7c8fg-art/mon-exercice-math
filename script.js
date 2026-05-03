const wheel = document.getElementById('rotation-wheel');
const wrapper = document.getElementById('cursor-wrapper');
const container = document.getElementById('exercice-container');
const fond = document.getElementById('fond-exercice');
const sizeSlider = document.getElementById('equerre-size');

let rotation = 0;
let zoomLevel = 1;
let isRotating = false;
let lastAngle = 0;

// Position de l'équerre (en % pour rester cohérent avec le zoom)
let equerreX = 50;
let equerreY = 50;

// --- PINCH-TO-ZOOM (deux doigts) ---
let initialPinchDistance = null;
let initialZoom = 1;
let pinchOriginX = 0;
let pinchOriginY = 0;

function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = zoomLevel;

        // Centre du pinch par rapport au container
        const rect = container.getBoundingClientRect();
        pinchOriginX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * 100;
        pinchOriginY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * 100;

        e.preventDefault();
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    if (isRotating) return;

    if (e.touches.length === 2 && initialPinchDistance !== null) {
        // Pinch-to-zoom
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistance;
        zoomLevel = Math.max(1, Math.min(4, initialZoom * scale));

        fond.style.transformOrigin = `${pinchOriginX}% ${pinchOriginY}%`;
        fond.style.transform = `scale(${zoomLevel})`;
        e.preventDefault();
    } else if (e.touches.length === 1) {
        // Déplacer l'équerre
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        equerreX = touch.clientX - rect.left;
        equerreY = touch.clientY - rect.top;
        wrapper.style.left = equerreX + 'px';
        wrapper.style.top = equerreY + 'px';
        e.preventDefault();
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        initialPinchDistance = null;
    }
});

// --- ROTATION VIA LE VOLANT ---
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

    // Affiche l'angle normalisé (0-360)
    const displayAngle = ((rotation % 360) + 360) % 360;
    const angleDisplay = document.getElementById('angle-display');
    if (angleDisplay) angleDisplay.textContent = Math.round(displayAngle) + '°';

    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => { isRotating = false; });

// --- ROTATION À LA SOURIS (PC) ---
let isDraggingWheel = false;
let lastMouseAngle = 0;

wheel.addEventListener('mousedown', (e) => {
    isDraggingWheel = true;
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastMouseAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingWheel) return;
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    rotation += (currentAngle - lastMouseAngle) * (180 / Math.PI);
    lastMouseAngle = currentAngle;

    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    wheel.style.transform = `rotate(${rotation}deg)`;

    const displayAngle = ((rotation % 360) + 360) % 360;
    const angleDisplay = document.getElementById('angle-display');
    if (angleDisplay) angleDisplay.textContent = Math.round(displayAngle) + '°';
});

window.addEventListener('mouseup', () => { isDraggingWheel = false; });

// --- DÉPLACEMENT ÉQUERRE À LA SOURIS (PC) ---
let isDraggingEquerre = false;

container.addEventListener('mousedown', (e) => {
    if (e.target === wheel || wheel.contains(e.target)) return;
    isDraggingEquerre = true;
});

container.addEventListener('mousemove', (e) => {
    if (!isDraggingEquerre) return;
    const rect = container.getBoundingClientRect();
    equerreX = e.clientX - rect.left;
    equerreY = e.clientY - rect.top;
    wrapper.style.left = equerreX + 'px';
    wrapper.style.top = equerreY + 'px';
});

window.addEventListener('mouseup', () => { isDraggingEquerre = false; });

// --- TAILLE DE L'ÉQUERRE ---
if (sizeSlider) {
    sizeSlider.addEventListener('input', () => {
        const size = sizeSlider.value;
        wrapper.style.width = size + 'px';
    });
}

// --- ZOOM BOUTONS (PC) ---
function ajusterZoom(delta) {
    zoomLevel = Math.max(1, Math.min(4, zoomLevel + delta));
    fond.style.transformOrigin = 'center center';
    fond.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    zoomLevel = 1;
    fond.style.transformOrigin = 'center center';
    fond.style.transform = `scale(1)`;
}

// --- ZOOM MOLETTE SOURIS (PC) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const originX = ((e.clientX - rect.left) / rect.width) * 100;
    const originY = ((e.clientY - rect.top) / rect.height) * 100;

    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoomLevel = Math.max(1, Math.min(4, zoomLevel + delta));

    fond.style.transformOrigin = `${originX}% ${originY}%`;
    fond.style.transform = `scale(${zoomLevel})`;
}, { passive: false });

// --- PLEIN ÉCRAN ---
const containerExercice = document.getElementById('exercice-container');

containerExercice.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        containerExercice.requestFullscreen().catch(err => {
            console.warn(`Plein écran impossible : ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

window.addEventListener("orientationchange", () => {
    if (window.orientation === 90 || window.orientation === -90) {
        if (!document.fullscreenElement) containerExercice.requestFullscreen();
    } else {
        if (document.fullscreenElement) document.exitFullscreen();
    }
});

// --- VALIDATION RÉPONSE ---
function verifierReponse() {
    const input = document.getElementById('user-answer');
    const feedback = document.getElementById('feedback');
    const scoreEl = document.getElementById('current-score');
    const totalEl = document.getElementById('total-questions');

    const valeur = parseFloat(input.value);
    if (isNaN(valeur)) {
        feedback.textContent = 'Entrez un nombre valide.';
        feedback.className = 'feedback-error';
        return;
    }

    // Angle normalisé affiché
    const angleActuel = ((rotation % 360) + 360) % 360;
    const tolerance = 5; // degrés de tolérance
    const correct = Math.abs(valeur - Math.round(angleActuel)) <= tolerance;

    let total = parseInt(totalEl.textContent) + 1;
    let score = parseInt(scoreEl.textContent);
    if (correct) score++;

    scoreEl.textContent = score;
    totalEl.textContent = total;

    feedback.textContent = correct ? '✓ Bonne réponse !' : `✗ L'angle était ${Math.round(angleActuel)}°`;
    feedback.className = correct ? 'feedback-correct' : 'feedback-error';

    input.value = '';
    setTimeout(() => { feedback.textContent = ''; feedback.className = ''; }, 2500);
}
