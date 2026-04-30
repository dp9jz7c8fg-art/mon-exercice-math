const wrapper = document.getElementById('cursor-wrapper');
const container = document.getElementById('exercice-container');
const handle = document.getElementById('rotation-handle');
const fond = document.getElementById('fond-exercice');
const scoreAffichage = document.getElementById('current-score');
const totalAffichage = document.getElementById('total-questions');
const feedback = document.getElementById('feedback');

let rotation = 0;
let zoomLevel = 1;
let score = 0;
let tentatives = 0;
const reponseCorrecte = 45;

// --- 1. DÉPLACEMENT (Souris + Tactile) ---
function move(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    // On applique la rotation actuelle pendant le mouvement
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}

// Événement Souris
container.addEventListener('mousemove', (e) => {
    if (!isRotating) move(e.clientX, e.clientY);
});

// Événement Tactile (Déplacement)
container.addEventListener('touchmove', (e) => {
    if (isRotating) return; // Si on tourne, on ne déplace pas
    e.preventDefault();
    const touch = e.touches[0];
    move(touch.clientX, touch.clientY);
}, { passive: false });


// --- 2. ROTATION PC (Molette) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    rotation += e.deltaY * 0.05;
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}, { passive: false });


// --- 3. ROTATION TACTILE (Poignée Bleue) ---
let isRotating = false;

handle.addEventListener('touchstart', (e) => {
    isRotating = true;
    e.stopPropagation(); // Empêche de déplacer l'équerre en même temps
}, { passive: false });

window.addEventListener('touchend', () => {
    isRotating = false;
});

window.addEventListener('touchmove', (e) => {
    if (!isRotating) return;
    e.preventDefault();

    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // Calcul de l'angle entre le centre et le doigt
    const angle = Math.atan2(touchY - centerY, touchX - centerX);
    rotation = angle * (180 / Math.PI) + 90; 
    
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}, { passive: false });


// --- 4. PLEIN ÉCRAN (Double-clic PC) ---
container.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
});


// --- 5. ZOOM & VALIDATION (Inchangé) ---
function ajusterZoom(delta) {
    zoomLevel = Math.max(1, Math.min(3, zoomLevel + delta));
    fond.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    zoomLevel = 1;
    fond.style.transform = `scale(1)`;
}

function verifierReponse() {
    const input = document.getElementById('user-answer');
    const val = parseInt(input.value);
    if (isNaN(val)) return;

    tentatives++;
    totalAffichage.innerText = tentatives;

    if (Math.abs(val - reponseCorrecte) <= 1) {
        score++;
        scoreAffichage.innerText = score;
        feedback.innerText = "Bravo ! 🎉";
        feedback.style.color = "green";
    } else {
        feedback.innerText = "Réessaye !";
        feedback.style.color = "red";
    }
    input.value = "";
}