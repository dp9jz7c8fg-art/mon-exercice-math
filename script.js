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

// --- DÉPLACEMENT (Souris + Tactile) ---
function move(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}

container.addEventListener('mousemove', move);
container.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Empêche le défilement de la page
    move(e);
}, { passive: false });

// --- ROTATION SOURIS (MOLETTE) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    rotation += e.deltaY * 0.05;
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}, { passive: false });

// --- ROTATION TACTILE (VIA LA POIGNÉE) ---
let isRotating = false;
handle.addEventListener('touchstart', () => isRotating = true);
window.addEventListener('touchend', () => isRotating = false);

window.addEventListener('touchmove', (e) => {
    if (!isRotating) return;
    
    // On calcule l'angle entre le centre de l'équerre et le doigt
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const angle = Math.atan2(touchY - centerY, touchX - centerX);
    rotation = angle * (180 / Math.PI) + 90; // +90 pour compenser la position de la poignée
    
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}, { passive: false });

// --- ZOOM ---
function ajusterZoom(delta) {
    zoomLevel = Math.max(1, Math.min(3, zoomLevel + delta));
    fond.style.transform = `scale(${zoomLevel})`;
}

function resetZoom() {
    zoomLevel = 1;
    fond.style.transform = `scale(1)`;
}

// --- VÉRIFICATION ---
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