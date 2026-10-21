/**
 * Feature-flag registry, backed by Vercel Global Config (formerly "Edge
 * Config"). The connection string lives in the `GLOBAL_CONFIG` env var
 * (falling back to the legacy `EDGE_CONFIG` name), which
 * `@vercel/global-config` reads automatically.
 *
 * Flags are read fresh on every call — no caching beyond the current
 * request (no `unstable_cache`, no module-level variable) — so flipping a
 * flag in the Vercel dashboard is reflected within seconds, without a
 * redeploy. Any ambiguity (missing key, non-boolean value, store
 * unreachable or misconfigured) resolves to `false`. This system is
 * default-closed and must never throw or surface a 500.
 *
 * --- Adding a new feature later ---
 * 1. Add the key to the `Feature` union and `ALL_FEATURES` array below.
 * 2. In the Vercel dashboard, add the key (boolean) to the `features` item
 *    in the project's Global Config store.
 * 3. If it gates a whole route, add an entry to `GATED_PATHS` mapping the
 *    locale-stripped pathname (e.g. '/dashboard/reports') to the key —
 *    this wires up both the middleware redirect (src/proxy.ts) and is
 *    also checked directly inside the page itself.
 * 4. If it has a sidebar nav item, set `feature: '<key>'` on that item in
 *    src/components/core/dashboard/sidebar-content/index.tsx.
 * 5. Add `upgrade.features.<key>.body` to both locale files
 *    (src/localization/locales/{en,fr}.json), then run
 *    `npm run generate-translation`.
 */
import 'server-only';
import { get } from '@vercel/global-config';

export type Feature = 'analytics' | 'banner';

export const ALL_FEATURES: readonly Feature[] = ['analytics', 'banner'];

/** Locale-stripped route pathnames gated behind a feature flag. */
export const GATED_PATHS: Record<string, Feature> = {
  '/dashboard/analytics': 'analytics',
  '/dashboard/annonces': 'banner',
};

type FeatureMap = Record<Feature, boolean>;

const CLOSED: FeatureMap = Object.fromEntries(
  ALL_FEATURES.map((feature) => [feature, false]),
) as FeatureMap;

export async function getFeatures(): Promise<FeatureMap> {
  try {
    const stored = await get<Record<string, unknown>>('features');
    if (!stored || typeof stored !== 'object') {
      return CLOSED;
    }

    const result = {} as FeatureMap;
    for (const feature of ALL_FEATURES) {
      result[feature] = stored[feature] === true;
    }
    return result;
  } catch (err) {
    console.error('[features] lecture Global Config impossible', err);
    return CLOSED;
  }
}

export async function isEnabled(feature: Feature): Promise<boolean> {
  const features = await getFeatures();
  return features[feature];
}

/** Which known feature (if any) gates this locale-stripped pathname. */
export function featureForPath(pathname: string): Feature | undefined {
  return Object.entries(GATED_PATHS).find(([path]) =>
    pathname.startsWith(path),
  )?.[1];
}

/** Currently-disabled features — the only shape the sidebar nav needs. */
export async function getLockedFeatures(): Promise<Feature[]> {
  const features = await getFeatures();
  return ALL_FEATURES.filter((feature) => !features[feature]);
}
