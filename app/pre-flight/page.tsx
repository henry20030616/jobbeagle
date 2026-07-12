import { redirect } from 'next/navigation';

/** Legacy URL — server redirect to /confirm (canonical). */
export default async function LegacyPreFlightRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') q.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) q.append(key, item);
    }
  }
  const qs = q.toString();
  redirect(qs ? `/confirm?${qs}` : '/confirm');
}
