// ─── Éléments ───────────────────────────────────────────────────────────────
const wheel        = document.getElementById('rotation-wheel');
const wheelFs      = document.getElementById('rotation-wheel-fs');
const wrapper      = document.getElementById('cursor-wrapper');
const container    = document.getElementById('exercice-container');
const fond         = document.getElementById('fond-exercice');
const sizeSlider   = document.getElementById('equerre-size');
const sizeSliderFs = document.getElementById('equerre-size-fs');

// ─── État ────────────────────────────────────────────────────────────────────
let rotation   = 0;
let zoomLevel  = 1;
let lastAngle  = 0;

let isRotating      = false;   // doigt sur un volant
let activeWheel     = null;    // quel volant est actif (wheel ou wheelFs)

let isDraggingWheel   = false; // souris sur un volant
let activeWheelMouse  = null;

let isDraggingEquerre = false;

let initialPinchDistance = null;
let initialZoom = 1;
let pinchOriginX = 0, pinchOriginY = 0;

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateAngleDisplays() {
    const deg = Math.round(((rotation % 360) + 360) % 360);
    const txt = deg + '°';
    const a   = document.getElementById('angle-display');
    const aFs = document.getElementById('angle-display-fs');
    if (a)   a.textContent   = txt;
    if (aFs) aFs.textContent = txt;
}

function applyRotation() {
    wrapper.style.transform  = `translate(-50%, -50%) rotate(${rotation}deg)`;
    wheel.style.transform    = `rotate(${rotation}deg)`;
    if (wheelFs) wheelFs.style.transform = `rotate(${rotation}deg)`;
    updateAngleDisplays();
}

function getWheelCenter(wheelEl) {
    const rect = wheelEl.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// ─── TOUCH : démarrage sur un volant ─────────────────────────────────────────
function onWheelTouchStart(wheelEl, e) {
    isRotating  = true;
    activeWheel = wheelEl;
    const t = e.touches[0];
    const c = getWheelCenter(wheelEl);
    lastAngle = Math.atan2(t.clientY - c.y, t.clientX - c.x);
    e.preventDefault();
    e.stopPropagation();
}

wheel.addEventListener('touchstart',
    (e) => onWheelTouchStart(wheel, e), { passive: false });

if (wheelFs) wheelFs.addEventListener('touchstart',
    (e) => onWheelTouchStart(wheelFs, e), { passive: false });

// ─── TOUCH : mouvement global ─────────────────────────────────────────────────
window.addEventListener('touchmove', (e) => {
    if (!isRotating || !activeWheel) return;
    const t = e.touches[0];
    const c = getWheelCenter(activeWheel);
    const currentAngle = Math.atan2(t.clientY - c.y, t.clientX - c.x);
    rotation += (currentAngle - lastAngle) * (180 / Math.PI);
    lastAngle = currentAngle;
    applyRotation();
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
    isRotating  = false;
    activeWheel = null;
});

// ─── TOUCH : déplacement équerre + pinch-zoom dans le container ───────────────
container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = zoomLevel;
        const rect = container.getBoundingClientRect();
        pinchOriginX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width  * 100;
        pinchOriginY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top)  / rect.height * 100;
        e.preventDefault();
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    if (isRotating) return; // le volant gère son propre mouvement

    if (e.touches.length === 2 && initialPinchDistance !== null) {
        const dist  = getDistance(e.touches[0], e.touches[1]);
        zoomLevel   = Math.max(1, Math.min(4, initialZoom * dist / initialPinchDistance));
        fond.style.transformOrigin = `${pinchOriginX}% ${pinchOriginY}%`;
        fond.style.transform = `scale(${zoomLevel})`;
        e.preventDefault();
    } else if (e.touches.length === 1) {
        const t    = e.touches[0];
        const rect = container.getBoundingClientRect();
        wrapper.style.left = (t.clientX - rect.left) + 'px';
        wrapper.style.top  = (t.clientY - rect.top)  + 'px';
        e.preventDefault();
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) initialPinchDistance = null;
});

// ─── SOURIS : rotation via un volant ─────────────────────────────────────────
function onWheelMouseDown(wheelEl, e) {
    isDraggingWheel  = true;
    activeWheelMouse = wheelEl;
    const c = getWheelCenter(wheelEl);
    lastAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    e.preventDefault();
    e.stopPropagation();
}

wheel.addEventListener('mousedown',
    (e) => onWheelMouseDown(wheel, e));

if (wheelFs) wheelFs.addEventListener('mousedown',
    (e) => onWheelMouseDown(wheelFs, e));

window.addEventListener('mousemove', (e) => {
    if (isDraggingWheel && activeWheelMouse) {
        const c = getWheelCenter(activeWheelMouse);
        const currentAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x);
        rotation += (currentAngle - lastAngle) * (180 / Math.PI);
        lastAngle = currentAngle;
        applyRotation();
        return;
    }
    if (isDraggingEquerre) {
        const rect = container.getBoundingClientRect();
        wrapper.style.left = (e.clientX - rect.left) + 'px';
        wrapper.style.top  = (e.clientY - rect.top)  + 'px';
    }
});

window.addEventListener('mouseup', () => {
    isDraggingWheel  = false;
    activeWheelMouse = null;
    isDraggingEquerre = false;
});

// ─── SOURIS : déplacement équerre ────────────────────────────────────────────
container.addEventListener('mousedown', (e) => {
    if (e.target === wheel || wheel.contains(e.target)) return;
    if (wheelFs && (e.target === wheelFs || wheelFs.contains(e.target))) return;
    isDraggingEquerre = true;
});

// ─── ZOOM boutons ─────────────────────────────────────────────────────────────
function ajusterZoom(delta) {
    zoomLevel = Math.max(1, Math.min(4, zoomLevel + delta));
    fond.style.transformOrigin = 'center center';
    fond.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    zoomLevel = 1;
    fond.style.transformOrigin = 'center center';
    fond.style.transform = 'scale(1)';
}

// ─── ZOOM molette ─────────────────────────────────────────────────────────────
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect    = container.getBoundingClientRect();
    const originX = ((e.clientX - rect.left) / rect.width)  * 100;
    const originY = ((e.clientY - rect.top)  / rect.height) * 100;
    zoomLevel = Math.max(1, Math.min(4, zoomLevel + (e.deltaY > 0 ? -0.15 : 0.15)));
    fond.style.transformOrigin = `${originX}% ${originY}%`;
    fond.style.transform = `scale(${zoomLevel})`;
}, { passive: false });

// ─── TAILLE ÉQUERRE ───────────────────────────────────────────────────────────
function setEquerreSize(val) {
    wrapper.style.width = val + 'px';
    if (sizeSlider)   sizeSlider.value   = val;
    if (sizeSliderFs) sizeSliderFs.value = val;
}

if (sizeSlider)   sizeSlider.addEventListener('input',   () => setEquerreSize(sizeSlider.value));
if (sizeSliderFs) sizeSliderFs.addEventListener('input', () => setEquerreSize(sizeSliderFs.value));

// ─── PLEIN ÉCRAN ──────────────────────────────────────────────────────────────
container.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => console.warn(err.message));
    } else {
        document.exitFullscreen();
    }
});

window.addEventListener('orientationchange', () => {
    if (window.orientation === 90 || window.orientation === -90) {
        if (!document.fullscreenElement) container.requestFullscreen();
    } else {
        if (document.fullscreenElement) document.exitFullscreen();
    }
});

// ─── VALIDATION RÉPONSE ───────────────────────────────────────────────────────
function verifierReponse() {
    const input    = document.getElementById('user-answer');
    const feedback = document.getElementById('feedback');
    const scoreEl  = document.getElementById('current-score');
    const totalEl  = document.getElementById('total-questions');

    const valeur = parseFloat(input.value);
    if (isNaN(valeur)) {
        feedback.textContent = 'Entrez un nombre valide.';
        feedback.className   = 'feedback-error';
        return;
    }

    const angleActuel = ((rotation % 360) + 360) % 360;
    const correct     = Math.abs(valeur - Math.round(angleActuel)) <= 5;

    scoreEl.textContent = parseInt(scoreEl.textContent) + (correct ? 1 : 0);
    totalEl.textContent = parseInt(totalEl.textContent) + 1;

    feedback.textContent = correct
        ? '✓ Bonne réponse !'
        : `✗ L'angle était ${Math.round(angleActuel)}°`;
    feedback.className = correct ? 'feedback-correct' : 'feedback-error';

    input.value = '';
    setTimeout(() => { feedback.textContent = ''; feedback.className = ''; }, 2500);
}
