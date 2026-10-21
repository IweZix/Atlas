# CLAUDE.md

Ce fichier guide Claude Code (claude.ai/code) pour travailler dans ce dépôt.

## Commandes

```bash
npm run dev                   # Serveur de développement Astro
npm run build                 # astro check (types) + build statique dans dist/
npm run preview               # Sert dist/ en local
npm run lint:check            # Biome (lint + organisation des imports)
npm run format                # Formate avec Biome
npm run generate-placeholders # Régénère les photos factices de src/content/trips/<slug>/
```

> Pas de suite de tests pour l'instant — `npm test` est un placeholder (la CI l'appelle).

## Architecture

Site perso statique **Astro** (TypeScript strict, Node >= 22.12) : un globe 3D (d3-geo sur `<canvas>`) pour naviguer entre les voyages de @luca_ncl. Une seule page responsive : layout mobile < 900px, desktop >= 900px. La référence de design est dans `docs/design-handoff.md` et `docs/maquette/` (écrans 2a mobile et 3a desktop).

**Linting/Formatage** : Biome uniquement (pas d'ESLint/Prettier). Guillemets simples, indentation 2 espaces. Biome ignore les fichiers `.astro` ; ils sont vérifiés par `astro check`.

### Contenu

- `src/content.config.ts` — collection `trips` (loader `glob` sur `src/content/trips/*.md`). Un fichier par voyage, frontmatter : `name`, `code` (3 lettres, libellé du globe mobile), `year`, `order` (ordre chronologique, aussi utilisé pour le tracé pointillé), `lat`, `lon`, `caption`, `cover`, `photos` (images relatives, traitées par `astro:assets`).
- Les photos de `src/content/trips/<slug>/` sont des **placeholders** générés par `scripts/gen-placeholders.mjs` ; les remplacer par les vraies photos (JPEG, 2000px max) sans changer le code.
- `src/data/gear.json` — matériel affiché `{ name, kind }` (simples cartes, pas de liens).
- `public/data/land-110m.json` — carte du monde (copie de `world-atlas@2`), servie localement.

### Page

- `src/pages/index.astro` rend tous les voyages dans le HTML (un seul visible, les autres `hidden`) et passe les données du globe via `<script type="application/json" id="trips-data">`.
- Un script inline applique `?v=<slug>` avant le premier rendu ; le voyage par défaut est le plus récent.
- `src/components/` : `Globe`, `TripNav` (une seule liste de boutons `aria-pressed`, restylée en pastilles mobile / lignes desktop), `TripPanel`, `Photos` (`<Picture>` AVIF/WebP), `Gear`, `Lightbox` (`<dialog>`).
- `src/scripts/trips.ts` — état `activeTrip` partagé (boutons, panneaux, coordonnées, URL, globe). `src/scripts/globe.ts` — globe canvas, chargé paresseusement (`import()` + `IntersectionObserver`). `src/scripts/lightbox.ts`.
- Le globe est un port de la classe `Component` de la maquette : voir les constantes en tête de `globe.ts` (rotation initiale, vitesse, durée d'animation, rayon de tap). Zoom ×1 à ×8 (molette, pincement trackpad, pincement à deux doigts) centré sur le globe ; la vitesse de rotation au drag est divisée par le zoom. La boucle rAF s'arrête au repos et hors écran ; `prefers-reduced-motion` coupe l'auto-rotation et rend les transitions instantanées.

### Style

CSS scopé dans les composants Astro, tokens en variables CSS dans `src/styles/global.css` (couleurs, rayons, `--gutter`). Polices Geist / Geist Mono auto-hébergées via `@fontsource-variable`. Pas de Tailwind.

### Déploiement

Vercel détecte Astro (sortie statique, aucun adaptateur). `vercel.json` ajoute le cache long sur `/_astro/*` et `/data/*`. Pas de variable d'environnement requise.

### CI/CD

GitHub Actions (`.github/workflows/main.yaml`) à chaque push : lint → format → test → build.
