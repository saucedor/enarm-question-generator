export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}
export const QUEUE = 'enarm-pipeline';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
