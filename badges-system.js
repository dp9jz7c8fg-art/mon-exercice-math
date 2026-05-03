// ═══════════════════════════════════════════════════════════
//  BADGES-SYSTEM.JS — Système de succès
//  Inclure APRÈS auth.js sur chaque page d'exercice
// ═══════════════════════════════════════════════════════════

const ALL_BADGES = [
    // ── Premiers pas ──
    { id: 'first_step',       emoji: '🌱', name: 'Premier pas',         desc: 'Complète ton premier exercice',               check: p => p.totalExercises >= 1 },
    { id: 'first_correct',    emoji: '✨', name: 'Première étoile',     desc: 'Obtiens ta première bonne réponse',            check: p => p.totalCorrect >= 1 },
    { id: 'five_correct',     emoji: '🎯', name: 'Dans le mille',       desc: 'Obtiens 5 bonnes réponses',                    check: p => p.totalCorrect >= 5 },

    // ── Volume ──
    { id: 'ten_ex',           emoji: '📝', name: 'Échauffement',        desc: 'Complète 10 exercices',                        check: p => p.totalExercises >= 10 },
    { id: 'twenty_five_ex',   emoji: '💪', name: 'En forme',            desc: 'Complète 25 exercices',                        check: p => p.totalExercises >= 25 },
    { id: 'fifty_ex',         emoji: '🔥', name: 'En feu',              desc: 'Complète 50 exercices',                        check: p => p.totalExercises >= 50 },
    { id: 'hundred_ex',       emoji: '💯', name: 'Centurion',           desc: 'Complète 100 exercices',                       check: p => p.totalExercises >= 100 },
    { id: 'two_hundred_ex',   emoji: '🏔️', name: 'Sommet',              desc: 'Complète 200 exercices',                       check: p => p.totalExercises >= 200 },
    { id: 'five_hundred_ex',  emoji: '👑', name: 'Légende',             desc: 'Complète 500 exercices',                       check: p => p.totalExercises >= 500 },

    // ── Précision ──
    { id: 'ten_correct',      emoji: '⭐', name: 'Étoile montante',     desc: '10 bonnes réponses au total',                  check: p => p.totalCorrect >= 10 },
    { id: 'fifty_correct',    emoji: '🌟', name: 'Super étoile',        desc: '50 bonnes réponses au total',                  check: p => p.totalCorrect >= 50 },
    { id: 'hundred_correct',  emoji: '💎', name: 'Diamant',             desc: '100 bonnes réponses au total',                 check: p => p.totalCorrect >= 100 },

    // ── Angles ──
    { id: 'angle_first',      emoji: '📐', name: 'Apprenti géomètre',   desc: 'Complète ton premier exercice d\'angles',      check: p => (p.scores?.angles?.done || 0) >= 1 },
    { id: 'angle_ten',        emoji: '🔺', name: 'Œil de lynx',         desc: '10 exercices d\'angles complétés',             check: p => (p.scores?.angles?.done || 0) >= 10 },
    { id: 'angle_master',     emoji: '🏛️', name: 'Maître des angles',   desc: '25 exercices d\'angles avec 80%+ de réussite', check: p => { const s = p.scores?.angles; return s && s.done >= 25 && s.correct / s.done >= 0.8; } },

    // ── Fractions ──
    { id: 'frac_first',       emoji: '🍕', name: 'Part du gâteau',      desc: 'Complète ton premier exercice de fractions',   check: p => { const f = p.scores?.fractions; if (!f) return false; return Object.values(f).some(s => s.done >= 1); } },
    { id: 'frac_comparer',    emoji: '⚖️', name: 'Juge de paix',        desc: '10 comparaisons de fractions réussies',        check: p => (p.scores?.fractions?.comparer?.correct || 0) >= 10 },
    { id: 'frac_simplifier',  emoji: '✂️', name: 'Ciseaux d\'or',       desc: '10 simplifications réussies',                  check: p => (p.scores?.fractions?.simplifier?.correct || 0) >= 10 },
    { id: 'frac_convertir',   emoji: '🔄', name: 'Caméléon',            desc: '10 conversions réussies',                      check: p => (p.scores?.fractions?.convertir?.correct || 0) >= 10 },
    { id: 'frac_arrondir',    emoji: '🎯', name: 'Précision chirurgicale', desc: '10 arrondis réussis',                       check: p => (p.scores?.fractions?.arrondir?.correct || 0) >= 10 },
    { id: 'frac_addsub',      emoji: '➕', name: 'Équilibriste',        desc: '10 additions/soustractions réussies',          check: p => (p.scores?.fractions?.['add-sub']?.correct || 0) >= 10 },
    { id: 'frac_multiplier',  emoji: '✖️', name: 'Multiplicateur',      desc: '10 multiplications réussies',                  check: p => (p.scores?.fractions?.multiplier?.correct || 0) >= 10 },
    { id: 'frac_diviser',     emoji: '➗', name: 'Divisionnaire',       desc: '10 divisions réussies',                        check: p => (p.scores?.fractions?.diviser?.correct || 0) >= 10 },
    { id: 'frac_all_ten',     emoji: '🏆', name: 'Champion des fractions', desc: '10 réussites dans CHAQUE objectif fractions', check: p => { const f = p.scores?.fractions; if (!f) return false; const keys = ['comparer','convertir','arrondir','simplifier','add-sub','multiplier','diviser']; return keys.every(k => (f[k]?.correct || 0) >= 10); } },

    // ── Perfection ──
    { id: 'perfectionist',    emoji: '🎓', name: 'Perfectionniste',     desc: 'Atteins 90% de réussite sur 20+ exercices',    check: p => p.totalExercises >= 20 && p.totalCorrect / p.totalExercises >= 0.9 },
];

// ── Notification pop-up ──
function injectBadgeNotifStyle() {
    if (document.getElementById('badge-notif-style')) return;
    const style = document.createElement('style');
    style.id = 'badge-notif-style';
    style.textContent = `
        #badge-notif {
            display: none;
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-120px);
            z-index: 10000;
            background: linear-gradient(135deg, #1a1a4e, #302b63);
            border: 2px solid #f8d56e;
            border-radius: 18px;
            padding: 18px 28px;
            box-shadow: 0 8px 40px rgba(248,213,110,0.3);
            backdrop-filter: blur(12px);
            text-align: center;
            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 90vw;
        }
        #badge-notif.show {
            display: block;
            transform: translateX(-50%) translateY(0);
        }
        #badge-notif.hide {
            transform: translateX(-50%) translateY(-120px);
        }
        .bn-emoji { font-size: 42px; display: block; margin-bottom: 8px; animation: bnBounce 0.6s ease; }
        .bn-title { font-size: 11px; color: #f8d56e; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 4px; font-family: 'DM Sans', 'Syne', sans-serif; }
        .bn-name { font-size: 18px; font-weight: 800; color: #f0f0f8; font-family: 'DM Sans', 'Syne', sans-serif; }
        .bn-desc { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; font-family: 'DM Sans', 'Syne', sans-serif; }
        @keyframes bnBounce { 0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    const notif = document.createElement('div');
    notif.id = 'badge-notif';
    notif.innerHTML = '<span class="bn-emoji" id="bn-emoji"></span><div class="bn-title">Nouveau succès !</div><div class="bn-name" id="bn-name"></div><div class="bn-desc" id="bn-desc"></div>';
    document.body.appendChild(notif);
}

function showBadgeNotif(badge) {
    injectBadgeNotifStyle();
    const el = document.getElementById('badge-notif');
    document.getElementById('bn-emoji').textContent = badge.emoji;
    document.getElementById('bn-name').textContent = badge.name;
    document.getElementById('bn-desc').textContent = badge.desc;

    el.classList.remove('hide');
    el.style.display = 'block';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.classList.add('show');
        });
    });

    setTimeout(() => {
        el.classList.remove('show');
        el.classList.add('hide');
        setTimeout(() => { el.style.display = 'none'; el.classList.remove('hide'); }, 500);
    }, 3500);
}

// ── Vérification des badges ──
async function checkBadges() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) return;
        const profile = doc.data();
        const currentBadges = profile.badges || [];

        const newBadges = [];

        for (const badge of ALL_BADGES) {
            if (currentBadges.includes(badge.id)) continue;
            try {
                if (badge.check(profile)) {
                    newBadges.push(badge);
                }
            } catch (e) {
                // Ignore check errors
            }
        }

        if (newBadges.length > 0) {
            const badgeIds = newBadges.map(b => b.id);
            await db.collection('users').doc(user.uid).update({
                badges: firebase.firestore.FieldValue.arrayUnion(...badgeIds)
            });

            // Afficher les notifications une par une
            let delay = 0;
            for (const badge of newBadges) {
                setTimeout(() => showBadgeNotif(badge), delay);
                delay += 4000;
            }
        }
    } catch (e) {
        console.error('Erreur badges:', e);
    }
}
