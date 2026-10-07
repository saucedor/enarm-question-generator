import { createHash, timingSafeEqual } from 'node:crypto';
export function authenticated(header: string | undefined, password: string) {
  if (!header?.startsWith('Basic ')) return false;
  const actual = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(actual), hash(`enarm:${password}`));
}

export function accessPassword(env: NodeJS.ProcessEnv): string | null {
  const mode = env.POC_ACCESS_MODE ?? 'private';
  if (mode === 'public') return null;
  if (mode !== 'private') throw new Error('POC_ACCESS_MODE must be public or private');
  if (!env.POC_PASSWORD) throw new Error('POC_PASSWORD is required in private mode');
  return env.POC_PASSWORD;
}
