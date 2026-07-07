# Tableau visio — Guide d'installation (5 minutes)

Le tableau collaboratif (`tableau-visio.html`) est prêt. Il utilise **les comptes
Firebase de ton site** : l'élève se connecte, et il arrive automatiquement sur le
tableau de **son année** (lue dans son profil `learningProfile.annee`). Le prof
entre le mot de passe enseignant (`stef2026`) et choisit l'année.

Il ne reste qu'à **activer la base temps réel** de Firebase (elle sert à synchroniser
le dessin, le chat et l'audio en direct). C'est gratuit pour cet usage.

## Étape 1 — Activer la Realtime Database

1. Va sur https://console.firebase.google.com → projet **classe-de-stef**.
2. Menu de gauche → **Realtime Database** → bouton **Créer une base de données**.
3. Emplacement : choisis **Belgium (europe-west1)** (ou l'Europe la plus proche).
4. Mode de démarrage : **mode verrouillé** (on met les règles à l'étape 3).
5. Une fois créée, **copie l'URL** affichée en haut, du type :
   `https://classe-de-stef-default-rtdb.europe-west1.firebasedatabase.app`

## Étape 2 — Coller l'URL dans la page

Ouvre `tableau-visio.html`, trouve la ligne `databaseURL:` (vers le début, dans le
bloc `firebase.initializeApp`) et **remplace la valeur par l'URL exacte** copiée à
l'étape 1. C'est le seul réglage à faire.

## Étape 3 — Coller les règles de sécurité

Dans la console, onglet **Realtime Database → Règles**, colle ceci puis **Publier** :

```json
{
  "rules": {
    "boards": {
      "$room": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

(Seuls les utilisateurs connectés peuvent lire/écrire. On pourra durcir plus tard
pour qu'un élève n'accède qu'à son année — dis-le-moi si tu le souhaites.)

## Étape 4 — Publier sur le site

Commit + push du repo (GitHub Desktop). GitHub Pages met le site à jour tout seul.
La page est alors accessible à l'adresse `…/tableau-visio.html`.

## Étape 5 — Ajouter un bouton vers le tableau (optionnel)

Pour que l'élève y accède facilement, ajoute ce lien où tu veux (ex. dans `eleve.html`) :

```html
<a href="tableau-visio.html">🎥 Tableau en visio</a>
```

Dis-moi si tu veux que je l'intègre proprement dans le menu.

## Tester à deux

1. **Toi (prof)** : ouvre `tableau-visio.html?prof=1`, mot de passe `stef2026`, choisis
   l'année de l'élève.
2. **L'élève** : se connecte normalement et ouvre `tableau-visio.html` → il arrive sur
   le tableau de son année.
3. Dessinez chacun de votre côté : les traits, le chat et les curseurs apparaissent en
   direct. Cliquez « Rejoindre l'audio » des deux côtés (casque conseillé).

> Le micro fonctionne car GitHub Pages est en HTTPS — rien à héberger de plus.
