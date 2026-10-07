import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunInput } from '../server/contracts.js';
import { authenticated } from '../server/auth.js';
const input = { specialty: 'Medicina interna', topic: 'Prueba', difficulty: 'básica', count: 2 };
test('reject unbounded jobs and fields outside the contract', () => {
  for (const invalid of [{ ...input, count: 0 }, { ...input, count: 11 }, { ...input, count: 1.5 }, { ...input, instructions: 'a'.repeat(2001) }, { ...input, model: 'unapproved' }]) assert.equal(RunInput.safeParse(invalid).success, false);
  assert.equal(RunInput.safeParse(input).success, true);
});
test('access requires the exact username and password', () => {
  const basic = (value: string) => `Basic ${Buffer.from(value).toString('base64')}`;
  assert.equal(authenticated(undefined, 'test-password'), false);
  assert.equal(authenticated(basic('other:test-password'), 'test-password'), false);
  assert.equal(authenticated(basic('enarm:wrong'), 'test-password'), false);
  assert.equal(authenticated(basic('enarm:test-password'), 'test-password'), true);
});
