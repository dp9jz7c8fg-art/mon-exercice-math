// ═══════════════════════════════════════════════════════════
//  AUTH.JS — Module partagé pour toutes les pages
//  Inclure Firebase SDK + ce fichier sur chaque page protégée
// ═══════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyB0djV_ZDOsYngnUeceNiTUt60IEKP_Qvg",
    authDomain: "classe-de-stef.firebaseapp.com",
    projectId: "classe-de-stef",
    storageBucket: "classe-de-stef.firebasestorage.app",
    messagingSenderId: "16372668790",
    appId: "1:16372668790:web:b1bfed825bfb36111b0257"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Vérifie que l'utilisateur est connecté, sinon redirige vers login
function requireAuth(callback) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Charger le profil Firestore
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            const profile = doc.exists ? doc.data() : { name: user.displayName || 'Élève', avatar: '🦊' };
            if (callback) callback(user, profile);
        } catch (e) {
            console.error('Erreur profil:', e);
            if (callback) callback(user, { name: user.displayName || 'Élève', avatar: '🦊' });
        }
    });
}

// Déconnexion
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}

// Sauvegarder un score
async function saveScore(category, subcategory, isCorrect) {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection('users').doc(user.uid);
    const inc = firebase.firestore.FieldValue.increment(1);

    const updates = {
        totalExercises: inc,
    };

    if (isCorrect) {
        updates.totalCorrect = inc;
    }

    if (subcategory) {
        updates[`scores.${category}.${subcategory}.done`] = inc;
        if (isCorrect) updates[`scores.${category}.${subcategory}.correct`] = inc;
    } else {
        updates[`scores.${category}.done`] = inc;
        if (isCorrect) updates[`scores.${category}.correct`] = inc;
    }

    try {
        await ref.update(updates);
    } catch (e) {
        console.error('Erreur sauvegarde score:', e);
    }
}

// Injecter la barre utilisateur en haut d'une page
function injectUserBar(user, profile) {
    const existing = document.getElementById('user-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.id = 'user-bar';
    bar.innerHTML = `
        <a href="profil.html" class="ub-left" style="text-decoration:none;color:inherit;">
            <span class="ub-avatar">${profile.avatar || '🦊'}</span>
            <span class="ub-name">${profile.name || 'Élève'}</span>
        </a>
        <div class="ub-right">
            <span class="ub-stats">${profile.totalCorrect || 0} ⭐</span>
            <button class="ub-logout" onclick="logout()">Déconnexion</button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        #user-bar {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 20px;
            background: rgba(0,0,0,0.3);
            border-bottom: 1px solid rgba(255,255,255,0.08);
            font-family: 'DM Sans', 'Syne', sans-serif;
            font-size: 14px;
            backdrop-filter: blur(10px);
            z-index: 100;
        }
        .ub-left { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .ub-left:hover .ub-name { color: #f8d56e; }
        .ub-avatar { font-size: 26px; }
        .ub-name { font-weight: 600; color: #f0f0f8; }
        .ub-right { display: flex; align-items: center; gap: 14px; }
        .ub-stats { color: #f8d56e; font-weight: 600; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .ub-logout {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 8px;
            padding: 6px 12px;
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            transition: all 0.15s;
        }
        .ub-logout:hover { background: rgba(255,107,107,0.15); border-color: rgba(255,107,107,0.3); color: #ff6b6b; }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(bar, document.body.firstChild);
}
