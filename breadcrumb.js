// ═══════════════════════════════════════════════════════════
//  BREADCRUMB.JS — Fil d'Ariane automatique
//  Inclure sur chaque page après theme.js
// ═══════════════════════════════════════════════════════════

const SITEMAP = {
    'index.html':              { label: '🏠 Accueil', parent: null },
    'eleve.html':              { label: '🎓 Espace Élève', parent: 'index.html' },
    'parent.html':             { label: '🤝 Partenaires', parent: 'index.html' },
    'profil.html':             { label: '👤 Mon profil', parent: 'eleve.html' },
    'badges.html':             { label: '🏆 Succès', parent: 'eleve.html' },
    'avatar-creator.html':     { label: '🎨 Avatar', parent: 'profil.html' },
    'profil-edit.html':        { label: '✏️ Modifier profil', parent: 'profil.html' },
    'objectifs.html':          { label: '🎯 Mes objectifs', parent: 'eleve.html' },
    'tableau.html':            { label: '🖊️ Tableau blanc', parent: 'eleve.html' },
    'agenda.html':             { label: '📅 Mon Agenda', parent: 'eleve.html' },
    'tableau.html':            { label: '🖊️ Tableau', parent: 'eleve.html' },
    'methodologie.html':       { label: '🧠 Méthodologie', parent: 'eleve.html' },
    'dev-soi.html':            { label: '🌱 Développement', parent: 'eleve.html' },
    'atelier-cerveau.html':    { label: '🧠 Cerveau', parent: 'methodologie.html' },
    'atelier-organisation.html': { label: '📋 Organisation', parent: 'methodologie.html' },
    'atelier-planification.html': { label: '📅 Planification', parent: 'methodologie.html' },
    'atelier-synthese.html':   { label: '📝 Synthèse', parent: 'methodologie.html' },
    'atelier-memorisation.html': { label: '🔄 Mémorisation', parent: 'methodologie.html' },
    'atelier-consignes.html':  { label: '📖 Consignes', parent: 'methodologie.html' },
    'atelier-orientation.html': { label: '🧭 Orientation', parent: 'dev-soi.html' },
    'atelier-emotions.html':   { label: '💚 Émotions', parent: 'dev-soi.html' },
    'atelier-profil.html':     { label: '🔍 Profil apprentissage', parent: 'dev-soi.html' },
    'exercices-en-ligne.html': { label: '💻 Exercices', parent: 'eleve.html' },
    '6eme-primaire.html':      { label: '6️⃣ 6ème primaire', parent: 'exercices-en-ligne.html' },
    '5eme-annee.html':         { label: '5️⃣ 5ème année', parent: 'exercices-en-ligne.html' },
    'trigonometrie.html':      { label: '📐 Trigonométrie', parent: '5eme-annee.html' },
    'memo-trig.html':          { label: '🧠 Mémorisation', parent: 'trigonometrie.html' },
    '1ere-annee.html':         { label: '1️⃣ 1ère année', parent: 'exercices-en-ligne.html' },
    '2eme-annee.html':         { label: '2️⃣ 2ème année', parent: 'exercices-en-ligne.html' },
    'exercices.html':          { label: '📐 Angles', parent: '2eme-annee.html' },
    'fractions.html':          { label: '½ Fractions', parent: '2eme-annee.html' },
    'algebre.html':            { label: '𝑥 Algèbre', parent: '2eme-annee.html' },
};

function getCurrentPage() {
    const path = window.location.pathname;
    const file = path.split('/').pop() || 'index.html';
    return file;
}

function buildBreadcrumb() {
    const current = getCurrentPage();
    const info = SITEMAP[current];
    if (!info) return;

    // Construire la chaîne de parents
    const crumbs = [];
    let page = current;
    while (page && SITEMAP[page]) {
        crumbs.unshift({ file: page, label: SITEMAP[page].label });
        page = SITEMAP[page].parent;
    }

    // Ne pas afficher si on est à l'accueil
    if (crumbs.length <= 1) return;

    // Créer le HTML
    const nav = document.createElement('nav');
    nav.id = 'breadcrumb';

    // Style
    const style = document.createElement('style');
    style.textContent = `
        #breadcrumb {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 500;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            background: rgba(4,8,4,0.85);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.04);
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: none;
        }
        #breadcrumb::-webkit-scrollbar { display: none; }
        #breadcrumb a {
            color: rgba(255,255,255,0.35);
            text-decoration: none;
            transition: color 0.15s;
            flex-shrink: 0;
        }
        #breadcrumb a:hover { color: rgba(255,255,255,0.7); }
        #breadcrumb .bc-sep {
            color: rgba(255,255,255,0.15);
            font-size: 10px;
            flex-shrink: 0;
        }
        #breadcrumb .bc-current {
            color: rgba(255,255,255,0.7);
            font-weight: 700;
            flex-shrink: 0;
        }
        /* Décaler le contenu de la page pour ne pas être caché */
        body { padding-top: 36px !important; }
    `;
    document.head.appendChild(style);

    // Construire les liens
    crumbs.forEach((crumb, i) => {
        if (i === crumbs.length - 1) {
            // Page actuelle (pas de lien)
            const span = document.createElement('span');
            span.className = 'bc-current';
            span.textContent = crumb.label;
            nav.appendChild(span);
        } else {
            const a = document.createElement('a');
            a.href = crumb.file;
            a.textContent = crumb.label;
            nav.appendChild(a);

            const sep = document.createElement('span');
            sep.className = 'bc-sep';
            sep.textContent = '›';
            nav.appendChild(sep);
        }
    });

    document.body.insertBefore(nav, document.body.firstChild);

    // Supprimer les anciens liens "← Retour" / nav
    document.querySelectorAll('.nav').forEach(el => {
        // Vérifier que c'est bien un nav avec un lien retour
        const links = el.querySelectorAll('a');
        if (links.length > 0 && links[0].textContent.includes('←')) {
            // Garder les autres liens (comme "Mon profil")
            const otherLinks = Array.from(links).filter(a => !a.textContent.includes('←'));
            if (otherLinks.length === 0) {
                el.style.display = 'none';
            } else {
                links[0].style.display = 'none';
            }
        }
    });

    // Aussi supprimer le top-bar si il ne contient qu'un lien retour
    document.querySelectorAll('.top-bar').forEach(el => {
        const navInside = el.querySelector('.nav');
        if (navInside) {
            const link = navInside.querySelector('a');
            if (link && link.textContent.includes('←')) {
                link.style.display = 'none';
            }
        }
    });
}

// Lancer au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBreadcrumb);
} else {
    buildBreadcrumb();
}
