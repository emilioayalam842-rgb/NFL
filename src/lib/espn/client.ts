const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

/**
 * Thin wrapper around ESPN's public (unofficial) NFL JSON endpoints.
 * These are the same feeds ESPN's own site/app consume — there's no
 * official docs or SLA, so every call here fails soft (returns null)
 * instead of throwing, and callers must handle that case.
 */
export async function espnGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  revalidateSeconds = 60
): Promise<T | null> {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
