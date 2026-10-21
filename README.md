# Carnet de voyage — @luca_ncl

Site perso de photos de voyage : un globe 3D à faire tourner, chaque point est un voyage (album, légende, année), et en bas le matériel photo en liens affiliés. Astro statique, déployé sur Vercel.

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # vérifie les types puis génère dist/
```

Node >= 22.12 requis.

## Ajouter un voyage

1. Créer `src/content/trips/<slug>.md` :

   ```yaml
   ---
   name: Prague
   code: PRG        # libellé court sur le globe mobile
   year: 2026
   order: 3         # ordre chronologique (tracé pointillé + liste)
   lat: 50.08
   lon: 14.43
   caption: "Brouillard sur la Vltava, ponts à six heures du matin, personne d'autre."
   cover: ./prague/01.jpg
   photos: [./prague/01.jpg, ./prague/02.jpg, ./prague/03.jpg, ./prague/04.jpg]
   ---
   ```

2. Déposer les photos dans `src/content/trips/<slug>/` (4 à 8, JPEG, 2000px de large max).
3. Un lien direct vers un voyage : `/?v=<slug>`.

Les photos actuelles sont des placeholders (`npm run generate-placeholders`). Les liens du matériel sont dans `src/data/gear.json`.

## Déployer

Importer le dépôt dans Vercel (preset Astro détecté, aucune variable d'environnement), puis rattacher le domaine.

## Design

Référence : `docs/design-handoff.md` et `docs/maquette/` (écrans 2a mobile, 3a desktop).
