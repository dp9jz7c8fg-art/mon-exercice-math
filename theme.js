// ═══════════════════════════════════════════════════════════
//  THEME.JS — Système de thème global
//  Inclure sur CHAQUE page après auth.js
// ═══════════════════════════════════════════════════════════

const THEMES = {
    green: {
        name: 'Forêt',
        bg1: '#040804', bg2: '#061008', bg3: '#081a0e', bg4: '#0a2414',
        card: 'rgba(10,30,16,0.55)',
        surface: 'rgba(12,30,18,0.8)',
        border: 'rgba(40,100,55,0.25)',
        accent: '#2ecc71',
        accent2: '#27ae60',
        accentDim: 'rgba(46,204,113,0.12)',
        accentRGB: '46,204,113',
        muted: 'rgba(46,204,113,0.5)',
    },
    blue: {
        name: 'Océan',
        bg1: '#040810', bg2: '#061028', bg3: '#081a3a', bg4: '#0a2448',
        card: 'rgba(10,16,40,0.55)',
        surface: 'rgba(12,20,50,0.8)',
        border: 'rgba(40,80,140,0.25)',
        accent: '#3498db',
        accent2: '#2980b9',
        accentDim: 'rgba(52,152,219,0.12)',
        accentRGB: '52,152,219',
        muted: 'rgba(52,152,219,0.5)',
    },
    purple: {
        name: 'Cosmos',
        bg1: '#0a0418', bg2: '#120828', bg3: '#1a0a38', bg4: '#220e48',
        card: 'rgba(18,10,40,0.55)',
        surface: 'rgba(24,14,55,0.8)',
        border: 'rgba(100,60,160,0.25)',
        accent: '#9b59b6',
        accent2: '#8e44ad',
        accentDim: 'rgba(155,89,182,0.12)',
        accentRGB: '155,89,182',
        muted: 'rgba(155,89,182,0.5)',
    },
    red: {
        name: 'Lave',
        bg1: '#0a0404', bg2: '#180808', bg3: '#280a0a', bg4: '#380e0e',
        card: 'rgba(30,10,10,0.55)',
        surface: 'rgba(40,14,14,0.8)',
        border: 'rgba(140,50,50,0.25)',
        accent: '#e74c3c',
        accent2: '#c0392b',
        accentDim: 'rgba(231,76,60,0.12)',
        accentRGB: '231,76,60',
        muted: 'rgba(231,76,60,0.5)',
    },
};

// Appliquer un thème au document
function applyTheme(themeName) {
    const t = THEMES[themeName] || THEMES.green;
    const root = document.documentElement;

    // Gradient du body
    document.body.style.background = `linear-gradient(135deg, ${t.bg1} 0%, ${t.bg2} 25%, ${t.bg3} 50%, ${t.bg4} 75%, ${t.bg1} 100%)`;
    document.body.style.backgroundSize = '400% 400%';

    // CSS custom properties pour tout le reste
    root.style.setProperty('--theme-card', t.card);
    root.style.setProperty('--theme-surface', t.surface);
    root.style.setProperty('--theme-border', t.border);
    root.style.setProperty('--theme-accent', t.accent);
    root.style.setProperty('--theme-accent2', t.accent2);
    root.style.setProperty('--theme-accent-dim', t.accentDim);
    root.style.setProperty('--theme-accent-rgb', t.accentRGB);
    root.style.setProperty('--theme-muted', t.muted);

    // Mettre à jour tous les éléments qui utilisent les couleurs en dur
    // Bordures des cartes
    document.querySelectorAll('.space-card,.card,.chapter-card,.p-card,.section,.option-section,.day-group,.my-bookings,.avis-wrap,.eleve-profile,.stat-box,.progress-item').forEach(el => {
        el.style.borderColor = t.border;
        el.style.background = t.card;
    });

    // Boutons d'accent
    document.querySelectorAll('.badge-ready,.btn-submit,.add-btn,.btn-save,.id-btn,.note-submit,.btn-submit-avis,.agenda-btn,.agenda-float,.tbtn-ge,.btn-avis-submit').forEach(el => {
        el.style.background = t.accent;
    });

    // Texte accent
    document.querySelectorAll('.ep-badges a,.section-title,.tab.active,.card-badge.badge-ready,.chapter-badge.badge-ready,.badge.badge-ready,.p-card-badge.badge-ready').forEach(el => {
        el.style.color = t.accent;
        el.style.borderColor = t.border;
    });

    // Titres shimmer
    document.querySelectorAll('.welcome-title,.page-title,.profile-name').forEach(el => {
        el.style.background = `linear-gradient(135deg, ${t.accent} 0%, ${lighten(t.accent)} 40%, ${t.accent} 70%, ${lighten(t.accent)} 100%)`;
        el.style.backgroundSize = '300% 300%';
        el.style.webkitBackgroundClip = 'text';
        el.style.webkitTextFillColor = 'transparent';
        el.style.backgroundClip = 'text';
    });

    // Symboles flottants
    document.querySelectorAll('.math-sym').forEach(el => {
        el.style.color = `rgba(${t.accentRGB},0.06)`;
    });

    // Stats
    document.querySelectorAll('.stat-value,.stat-val,.g-stat-val,.ps-val,.s-val').forEach(el => {
        if (!el.classList.contains('blue') && !el.classList.contains('orange') && !el.classList.contains('red')) {
            el.style.color = t.accent;
        }
    });

    // Progress bars
    document.querySelectorAll('.progress-bar-fill,.prog-bar-fill,.bar-fill,.fill-green,.fill-blue,.fill-orange').forEach(el => {
        el.style.background = `linear-gradient(90deg, ${t.accent}, ${t.accent2})`;
    });

    // Stef button
    document.querySelectorAll('.stef-inline,.stef-btn').forEach(el => {
        el.style.background = t.accentDim;
        el.style.borderColor = t.border;
    });

    // Social links
    document.querySelectorAll('.social-link').forEach(el => {
        el.style.borderColor = t.border;
    });

    // Footer
    document.querySelectorAll('.footer').forEach(el => {
        el.style.color = `rgba(${t.accentRGB},0.18)`;
    });

    // Logo wrap
    document.querySelectorAll('.logo-wrap').forEach(el => {
        el.style.borderColor = t.border;
        el.style.background = t.card;
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(el => {
        el.style.borderColor = t.border;
        if (el.classList.contains('active')) {
            el.style.background = t.accentDim;
            el.style.borderColor = t.accent;
            el.style.color = t.accent;
        } else {
            el.style.color = `rgba(${t.accentRGB},0.5)`;
        }
    });

    // Rotation wheel
    document.querySelectorAll('#rotation-wheel,#rotation-wheel-ge,.obj-status-btn.completed').forEach(el => {
        el.style.borderColor = t.accent;
    });

    // ALL text that uses accent color
    document.querySelectorAll('#app-title,.section-title .dot,.ep-name,.chart-title,.section-title,.opt-title,.day-name,.my-title,.modal-name,.page-sub,.prog-title').forEach(el => {
        el.style.color = t.accent;
    });

    // Muted text
    document.querySelectorAll('.subtitle,.nav a,.back-link,.avis-author,.obj-meta,.q-date,.note-role,.prog-bar-name,.bar-label,.ph-role').forEach(el => {
        el.style.color = t.muted;
    });

    // Score display
    document.querySelectorAll('#sc-bon,#score-display strong,.stat-value,.ep-badges a').forEach(el => {
        el.style.color = t.accent;
    });

    // All links with accent
    document.querySelectorAll('.nav a,.back-link').forEach(el => {
        el.style.color = t.muted;
    });

    // Inputs focus color via CSS variable
    document.querySelectorAll('input,textarea,select,.ans-input,.add-input,.note-textarea,.id-input,.form-row input,.form-row textarea').forEach(el => {
        el.style.borderColor = t.border;
    });

    // Feedback correct
    document.querySelectorAll('.fb-ok,.fb-correct,.feedback-correct,.af-ok,.pct-high').forEach(el => {
        el.style.color = t.accent;
    });

    // Dashed sections
    document.querySelectorAll('.section-dashed').forEach(el => {
        el.style.borderColor = `rgba(${t.accentRGB},0.45)`;
        el.style.background = t.card;
    });

    // Agenda button
    document.querySelectorAll('.agenda-btn,.agenda-float').forEach(el => {
        el.style.background = `linear-gradient(135deg,${t.accent},${t.accent2})`;
    });

    // Avatar border
    document.querySelectorAll('.avatar-big,.ep-avatar').forEach(el => {
        el.style.borderColor = `rgba(${t.accentRGB},0.3)`;
    });

    // Angle readout
    document.querySelectorAll('#angle-readout,#angle-readout-ge,#angle-display,#angle-display-ge').forEach(el => {
        el.style.color = t.accent;
    });

    // Consigne strong
    document.querySelectorAll('#consigne strong,.consigne strong').forEach(el => {
        el.style.color = t.accent;
    });

    // Question mark in SVG exercises
    document.querySelectorAll('.op-sign,.eq-sign').forEach(el => {
        el.style.color = t.accent;
    });

    // Btn valider
    document.querySelectorAll('#btn-valider,.btn-submit,.add-btn,.note-submit,.id-btn,.btn-avis-submit,.btn-save,.mbtn-confirm,.btn-submit-avis,.zoom-btn-ge,.tbtn-ge').forEach(el => {
        el.style.background = t.accent;
    });

    // Btn suivant border
    document.querySelectorAll('#btn-suivant').forEach(el => {
        el.style.borderColor = t.accent;
        el.style.color = t.accent;
    });

    // Zoom buttons
    document.querySelectorAll('.zoom-btn,.tbtn').forEach(el => {
        el.style.borderColor = t.border;
    });

    // Exercice container
    document.querySelectorAll('#exercice-container,#figure-zone,.exercice-box,#exercice-box').forEach(el => {
        el.style.borderColor = t.border;
        el.style.background = t.card;
    });

    // Answer inputs
    document.querySelectorAll('#user-answer,#angle-input,.ans-input,.answer-frac-stack input').forEach(el => {
        el.style.borderColor = t.border;
    });

    // Frac bar
    document.querySelectorAll('.frac-bar,.answer-frac-bar').forEach(el => {
        el.style.background = t.accent;
    });

    // Header bar
    document.querySelectorAll('#app-header,.dash-header').forEach(el => {
        el.style.borderColor = t.border;
        el.style.background = t.card;
    });

    // Variante badge dot
    document.querySelectorAll('.dot').forEach(el => {
        el.style.background = t.accent;
    });

    // Store locally for instant load
    try { localStorage.setItem('stef-theme', themeName); } catch(e) {}
}

function lighten(hex) {
    let r = Math.min(255, parseInt(hex.slice(1,3),16) + 100);
    let g = Math.min(255, parseInt(hex.slice(3,5),16) + 100);
    let b = Math.min(255, parseInt(hex.slice(5,7),16) + 100);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Auto-apply theme on load
(function() {
    // 1. Try localStorage for instant load (no flash)
    const saved = localStorage.getItem('stef-theme');
    if (saved && THEMES[saved]) {
        applyTheme(saved);
    }

    // 2. Then check Firebase for the real value (may override)
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(async user => {
            if (!user) return;
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const theme = doc.data().theme || 'green';
                    applyTheme(theme);
                    try { localStorage.setItem('stef-theme', theme); } catch(e) {}
                }
            } catch(e) {}
        });
    }
})();

// Change theme and save to Firebase
async function changeTheme(themeName) {
    applyTheme(themeName);
    try { localStorage.setItem('stef-theme', themeName); } catch(e) {}
    if (typeof auth !== 'undefined' && auth.currentUser) {
        try {
            await db.collection('users').doc(auth.currentUser.uid).update({ theme: themeName });
        } catch(e) {}
    }
}
