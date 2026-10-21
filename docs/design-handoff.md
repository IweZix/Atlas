# Handoff : Carnet de voyage — @luca_ncl

## Vue d'ensemble
Site perso de photos de voyage, lié depuis la bio Instagram de @luca_ncl. Navigation principale : un **globe 3D** que l'on fait tourner ; chaque point = un voyage (album photo + légende + année). Pied de page : matériel photo en liens affiliés + lien Instagram.

Voyages actuels : Maroc 2025, Grèce 2025, Prague 2026, Ardèche 2026, Londres 2026.

## À propos des fichiers
`maquette/Carnet de voyage.dc.html` est une **référence de design en HTML** (prototype), pas du code de production. Il faut **recréer** ces écrans dans une vraie stack. Ouvrir le fichier dans un navigateur (avec `support.js` à côté). Les directions retenues sont **2a (mobile)** et **3a (desktop)** ; 1a/1b/1c sont des explorations antérieures, à ignorer.

## Fidélité
**Haute fidélité** pour la mise en page, couleurs, typo et interactions du globe. Photos = placeholders rayés, textes matériel/liens = provisoires.

## Stack recommandée
- **Astro** (site statique), TypeScript.
- Globe : **d3-geo** (`geoOrthographic`) + **topojson-client** + `world-atlas@2/land-110m.json`, rendu sur `<canvas>`. Le globe est un îlot client (`client:visible`) ; tout le reste est statique.
- Contenu : **Astro Content Collections**, un fichier par voyage dans `src/content/trips/*.md` (frontmatter ci-dessous).
- Images : `astro:assets` (`<Image>`, formats AVIF/WebP, `sizes` responsive). Cloudinary si le volume devient important.
- Déploiement : Vercel ou Netlify (gratuit), domaine perso (ex. luca-ncl.com).
- Une seule page responsive : layout mobile < 900px, layout desktop ≥ 900px. URL par voyage optionnelle (`/?v=prague` ou `/prague`) pour partager un album en story.

### Schéma d'un voyage
```yaml
name: Prague
code: PRG          # libellé court sur le globe mobile
year: 2026
lat: 50.08
lon: 14.43
caption: "Brouillard sur la Vltava, ponts à six heures du matin, personne d'autre."
cover: ./prague/01.jpg
photos: [./prague/01.jpg, ./prague/02.jpg, ./prague/03.jpg, ./prague/04.jpg]
```
Ordre d'affichage = chronologique (sert aussi au tracé pointillé entre voyages).

Matériel (`src/data/gear.json`) : `{ name, kind, url }` — kinds actuels : APPAREIL, OPTIQUE, SAC, RETOUCHE. Liens `rel="sponsored noopener"`, `target="_blank"`.

## Écrans

### Mobile (2a) — 390px de large
Fond `#000`, texte `#fff`. Scroll vertical, padding latéral 22px.
1. **Globe** — zone 470px de haut, canvas plein cadre.
   - Overlay haut (top 56px) : `luca_ncl` (17px, 500) à gauche ; `INSTAGRAM ↗` (Geist Mono 11px, `#bdbcb7`) à droite.
   - Overlay bas (bottom 16px) : coordonnées du voyage actif (`50.08°N  14.43°E`, mono 10px `#6c6b67`) + `← glisse →`.
   - Globe centré horizontalement, centre décalé de +14px vers le bas, rayon = `min(W,H) × 0.45`.
2. **Chips voyages** — rangée scroll horizontal, gap 6px. Pill padding 8×14px, 13px, radius 999px. Actif : fond `#fff`, texte `#000`. Inactif : bordure 1px `#333`, texte `#bdbcb7`.
3. **Titre voyage** — padding-top 28px ; nom 40px/500, letter-spacing −0.03em ; année à droite mono 12px `#8f8e89`.
4. **Légende** — 14px, line-height 1.45, `#a9a8a3`, `text-wrap: pretty`.
5. **Bande photos** — scroll horizontal avec scroll-snap (center), cartes 260px de large, ratio 4:5, radius 4px, gap 6px.
6. **Matériel** — label `MATÉRIEL` mono 11px, letter-spacing .1em, `#8f8e89` ; grille 2 colonnes gap 6px ; carte fond `#111110`, padding 14px, radius 6px, kind (mono 10px `#77766f`) au-dessus du nom (14px) + `↗`.
7. **Mention** — « Liens affiliés — merci de soutenir le carnet. » 11px `#5e5d59`, padding-bottom 48px.

### Desktop (3a) — exemple à 1280×820
Grille 2 colonnes : `minmax(0,1fr) 460px`, hauteur 100vh, pas de scroll global.
- **Gauche** : canvas globe plein cadre, rayon = `min(W,H) × 0.40`, centré. Overlay haut-gauche (36px/40px) : `luca_ncl` 20px/500 + `CARNET DE ROUTE · 2025 — 2026` mono 11px `#77766f`. Overlay bas (28px/40px) : coordonnées + « Glisse pour faire tourner · clique un point ». Les libellés sur le globe sont le nom complet en majuscules (mono 11px).
- **Droite** : `border-left: 1px solid #1c1c1b`, scroll interne, padding 36px.
  - `INSTAGRAM ↗` aligné à droite.
  - Liste des voyages : rangées grille `40px 1fr auto`, padding 12px 0, `border-top: 1px solid #1c1c1b`. Numéro (mono 11px), nom (18px), année (mono 11px). Actif : tout en `#fff`. Inactif : numéro/année `#5e5d59`, nom `#8f8e89`, hover `#fff`.
  - Nom du voyage 52px/500, letter-spacing −0.035em ; année à droite.
  - Légende 15px, line-height 1.5, `#a9a8a3`.
  - Photos : grille 2 colonnes gap 6px, ratio 4:5, radius 4px. Clic → lightbox plein écran (à ajouter, non maquetté).
  - Matériel + mention identiques au mobile.

## Globe — comportement (voir la classe `Component` dans la maquette : `initGlobe`, `tick`, `draw`, `selectG`)
- Projection orthographique d3, `clipAngle(90)`, `precision(0.4)`. Canvas mis à l'échelle `devicePixelRatio`. Redimensionner au `ResizeObserver`.
- **Rotation initiale** : `[-14.4, -38, 0]` (Europe).
- **Auto-rotation** au repos : +0.07°/frame en longitude, **jusqu'à la première interaction** (puis désactivée). Respecter `prefers-reduced-motion` (pas d'auto-rotation, transitions instantanées).
- **Drag** (pointer events, `touch-action: none`) : `λ = λ0 + dx × 0.4`, `φ = clamp(φ0 − dy × 0.4, −85, 85)`.
- **Tap/clic** (déplacement < 4px) : sélectionne le point visible le plus proche dans un rayon de 24px.
- **Sélection** (point, chip ou rangée) : anime la rotation vers `[-lon, -lat, 0]` en **1000ms, easeCubicInOut** ; normaliser λ pour prendre le chemin le plus court (±180°).
- Un point est visible si `geoDistance(point, centre) < π/2 − 0.05`.
- **Rendu par frame** (dans l'ordre) :
  1. Halo : gradient radial du centre, de `r×0.95` (`rgba(255,255,255,.08)`) à `r×1.3` (transparent).
  2. Sphère : fond `#0a0a09`, contour `#2c2c2a` 1px.
  3. Graticule 10° : `#191918`, 0.6px.
  4. Terres (land-110m) : fond `#272725`, contour `#3d3d3a` 0.5px.
  5. Tracé entre voyages (ordre chrono) : pointillé `[2,3]`, `#6a6964`, 1px.
  6. Points : inactif = disque r 3.5 `#bdbcb7` ; actif = halo r 14 `rgba(255,255,255,.12)` + disque r 5.5 `#fff`. Libellé à +9px/+3.5px, Geist Mono 500, `#9a9994` (actif `#fff`).
- Mettre en pause la boucle `requestAnimationFrame` quand le globe est hors écran (`IntersectionObserver`) ou au repos sans animation.
- Accessibilité : la liste de chips/rangées est l'alternative clavier au globe ; canvas en `aria-hidden`, chips en `<button aria-pressed>`.

## État
- `activeTrip` (index ou slug) — partagé globe / chips / liste / contenu. Défaut : le voyage le plus récent ou celui de l'URL.
- Globe : `rot`, `drag`, `anim`, `touched` (internes, hors framework).

## Design tokens
- Couleurs : `#000` fond · `#0a0a09` océan · `#111110` cartes · `#161615`/`#1d1d1c` placeholders · `#1c1c1b` séparateurs · `#272725` terres · `#333` bordure chip · `#5e5d59` texte discret · `#6c6b67` · `#77766f` · `#8f8e89` · `#a9a8a3` texte secondaire · `#bdbcb7` · `#fff`.
- Typo : **Geist** (300/400/500/600) pour le texte, **Geist Mono** (400/500) pour labels, années, coordonnées. Google Fonts ou paquet `geist`.
- Tailles : 10, 11, 12, 13, 14, 15, 17/18, 20, 40, 52px.
- Espacements : 6 (gaps), 14, 22 (marge mobile), 28, 36 (marge desktop), 44, 48px.
- Rayons : 4px (photos), 6px (cartes), 999px (chips).

## Assets
- Photos : à fournir par Luca (4 à 8 par voyage, export 2000px de large max, JPEG qualité 85).
- Carte : `https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json` (à copier dans `public/` pour ne pas dépendre du CDN).
- Pas d'icônes ; flèches `↗` `←` `→` en caractères texte.
- Liens matériel affiliés : à fournir.

## Fichiers
- `maquette/Carnet de voyage.dc.html` — prototype (sections 2a mobile, 3a desktop ; logique du globe dans la classe JS en bas du fichier).
- `maquette/support.js` — runtime nécessaire pour ouvrir la maquette.

## Prompt de départ pour Claude Code
> Lis `README.md` et ouvre la maquette. Crée un projet Astro qui implémente les écrans 2a (mobile) et 3a (desktop) en une seule page responsive, avec le globe d3 décrit, les voyages en Content Collections et le déploiement Vercel.
