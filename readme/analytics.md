# Analytics — reproduire le dashboard Vercel Web Analytics dans un autre projet

Cette feature affiche les statistiques Vercel Web Analytics (visiteurs, pages vues, top pages/sources/pays/appareils/OS, tendance quotidienne) dans une page protégée du dashboard, pour que le client n'ait pas besoin d'un compte Vercel. Tous les appels à `api.vercel.com` se font **côté serveur uniquement** — le `VERCEL_TOKEN` ne quitte jamais le serveur, jamais dans un composant client, jamais dans une réponse API.

La page réutilise le système d'auth/rôles déjà en place dans le projet hôte plutôt que d'ajouter une couche Basic Auth séparée. Dans ce repo, c'est Supabase + `Role.ADMIN` (`assertCurrentUserIsAdmin()`) ; dans un autre projet, il faut brancher la feature sur l'équivalent local (page protégée + vérification côté serveur).

## Mise en place dans un nouveau projet

1. **Activer Web Analytics** sur le projet Vercel cible : dashboard Vercel → onglet Analytics → Enable.
2. **Installer les dépendances** : `npm i @vercel/analytics recharts server-only`.
3. **Variables d'environnement** (aucune ne doit être préfixée `NEXT_PUBLIC_` — c'est ce qui les garde hors du bundle client) :
   ```
   VERCEL_TOKEN=
   VERCEL_TEAM_ID=
   VERCEL_PROJECT_ID=
   ```
   À définir dans le `.env` local et dans les Environment Variables du projet Vercel (le token se crée dans Account Settings → Tokens, scopé sur la team).
4. **Activer le tracking** : ajouter `<Analytics />` de `@vercel/analytics/next` dans le layout racine, en dehors de tout provider dont il ne dépend pas :
   ```tsx
   import { Analytics } from '@vercel/analytics/next';
   // ...
   <body>
     {children}
     <Analytics />
   </body>
   ```
5. **Brancher la page sur l'auth du projet cible** — créer la route dans une zone déjà protégée par le middleware/l'auth du projet, avec en plus une vérification serveur explicite en haut de la page (voir `src/app/[locale]/dashboard/analytics/page.tsx` dans ce repo : `assertCurrentUserIsAdmin()` dans un `try/catch`, page qui retourne un message d'accès refusé sur `ForbiddenError`). Cette étape est spécifique à chaque projet — il n'y a pas de code générique à copier ici.

## Fichiers à porter

| Fichier (référence dans ce repo) | Rôle |
|---|---|
| `src/lib/analytics.ts` | Couche fetch : `getVisits` (breakdown par dimension), `getVisitsTrend` (tendance quotidienne), `getVisitsCount` (totaux), calcul des périodes courante/précédente, mappers ligne → donnée de graphique. **Agnostique du stack**, portable tel quel. |
| `src/types/Analytics.ts` | Types partagés, dont `AnalyticsResult<T>` (union `success`/`error`). |
| `src/utils/format.ts` | Formatage `Intl` (nombres compacts, pourcentages signés, noms de pays, dates courtes). |
| `src/components/core/analytics/*` | Couche UI (stat tiles/header, graphique de tendance, panneaux en barres, sélecteur de période + wrapper de transition, empty state, carte de panneau, palette). **Spécifique à Chakra UI** — c'est la seule couche à reconstruire si le projet cible utilise une autre lib UI (ex. shadcn/Tailwind, comme le prévoyait la spec initiale de cette feature). |
| `src/app/[locale]/dashboard/analytics/page.tsx` | Server Component qui orchestre tout : vérif d'accès, lecture de `?period=`, `Promise.all` des fetchs, mapping vers les composants. À adapter à la route et à l'auth du projet cible. |

## Points d'architecture et pièges à connaître

Ces points ne sont pas évidents et ont coûté du temps de debug lors de la construction initiale — l'intérêt de ce doc est justement d'éviter de les re-découvrir.

- **`import 'server-only';`** en première ligne de `src/lib/analytics.ts` : transforme un import accidentel depuis un composant client en erreur de build, plutôt que de compter sur un grep manuel du bundle.
- **Chaque fonction de fetch publique catch ses propres erreurs** et retourne un `AnalyticsResult<T>` (`{status: 'success', data}` ou `{status: 'error', message}`) au lieu de throw. C'est ce qui permet d'utiliser un seul `Promise.all` dans la page sans qu'un panneau en échec ne fasse planter les autres (fail-fast de `Promise.all` évité puisqu'aucune promesse ne rejette jamais).
- **Piège API réel #1 — enveloppe de réponse** : l'API Vercel Web Analytics renvoie toujours `{ version, query, data }`. Le corps JSON brut n'est **pas** directement le tableau/objet attendu — oublier de déballer `.data` produit une erreur runtime "not iterable" qui ne se déclenche qu'une fois de vrais identifiants branchés (donc invisible en dev sans token). C'est un bug réel rencontré en prod sur cette feature.
- **Piège API réel #2 — clé des lignes temporelles** : un breakdown par granularité temporelle (`by=day`) nomme sa clé `timestamp` (datetime ISO), **pas** `day`. Seuls les breakdowns par dimension (`country`, `deviceType`, ...) utilisent le nom de la dimension comme clé. C'est pourquoi `getVisits` (dimensions) et `getVisitsTrend` (temps) sont deux fonctions séparées avec deux types de ligne différents.
- **Contrainte RSC** : un Server Component ne peut pas passer une prop-fonction (ex. un callback `hrefForPeriod`) à un Client Component — une fonction n'est pas sérialisable à travers cette frontière. C'est pourquoi le sélecteur de période construit son URL lui-même / utilise `router.push` en interne plutôt que de recevoir un callback du parent serveur.
- **Loader qui n'efface pas la page** : le changement de période enveloppe `router.push` dans `useTransition` (`src/components/core/analytics/period-transition/index.tsx`), ce qui garde le contenu précédent monté (juste assombri + spinner par-dessus) au lieu de le remplacer par un fallback `loading.tsx`. Choix délibéré — ne pas le "simplifier" vers un `<Link>` classique plus tard, ça ferait régresser l'UX.
- `visits/count` renvoie un seul objet avec `pageviews` **et** `visitors` — 2 appels (période courante + précédente) suffisent pour un en-tête avec comparaison, pas besoin de 4.

## Limites connues

- L'historique disponible dépend de la fenêtre de rétention du plan Vercel.
- Les Core Web Vitals (Speed Insights) ne sont pas exposés par cette API.
- Données agrégées uniquement — pas d'accès aux visites individuelles.
- Le tracking ne fonctionne qu'en production : la page affichera des valeurs vides/à zéro en local (c'est géré comme un état "vide", pas une erreur).

## Vérifier

- `npm run lint:check`
- `npm run build` — doit passer sans erreur TypeScript, et confirme que `VERCEL_TOKEN` n'apparaît jamais dans `.next/static` (le `server-only` du fetch layer fait déjà échouer le build si un composant client l'importe).
- Une fois déployé avec de vrais identifiants Vercel : vérifier que les 5 panneaux + le graphique affichent des données réelles, que le changement de période (7/30/90j) met à jour tout le contenu, et qu'une page/route sans données récentes affiche l'empty state plutôt qu'un crash.
