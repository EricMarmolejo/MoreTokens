import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { route } from '../src/route.mjs';
import { family, summarize, cost, listTranscripts } from '../src/usage.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('route: every eval case matches the decision table', () => {
  const cases = JSON.parse(readFileSync(join(here, '..', 'evals', 'cases.json'), 'utf8'));
  assert.ok(cases.length >= 10);
  for (const c of cases) assert.deepEqual(route(c.input), c.expect, c.name);
});

test('route: rejects bad input', () => {
  assert.throws(() => route({ words: -1, fullRead: true }), RangeError);
  assert.throws(() => route({ words: NaN, fullRead: true }), RangeError);
  assert.throws(() => route({ words: 10, fullRead: true, judgment: 'x' }), RangeError);
});

test('family: maps model ids', () => {
  assert.equal(family('claude-haiku-5-5'), 'haiku');
  assert.equal(family('claude-sonnet-5-5'), 'sonnet');
  assert.equal(family('claude-opus-5-5'), 'opus');
  assert.equal(family('something-else'), 'other');
});

const line = (id, model, u, ts = '2026-11-16T10:00:00Z') => JSON.stringify({
  type: 'assistant', timestamp: ts,
  message: { id, model, usage: { input_tokens: u[0], output_tokens: u[1], cache_read_input_tokens: u[2], cache_creation_input_tokens: u[3] } },
});

test('summarize: de-duplicates streamed messages, groups by family, filters by date', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mt-'));
  writeFileSync(join(dir, 'a.jsonl'), [
    line('m1', 'claude-opus-5-5', [1, 10, 100, 0]),
    line('m1', 'claude-opus-5-5', [1, 50, 100, 0]), // same id, final count wins
    line('m2', 'claude-haiku-5-5', [5, 20, 0, 30]),
    line('m3', 'claude-haiku-5-5', [9, 9, 9, 9], '2026-01-01T00:00:00Z'),
    '{not json}',
    JSON.stringify({ type: 'user', message: { content: 'hi' } }),
  ].join('\n'));
  const files = listTranscripts(dir);
  assert.equal(files.length, 1);

  const all = summarize(files);
  assert.equal(all.models.opus.output, 50);
  assert.equal(all.models.opus.messages, 1);
  assert.equal(all.models.haiku.messages, 2);
  assert.equal(all.total.output, 50 + 20 + 9);

  const recent = summarize(files, { since: new Date('2026-06-01') });
  assert.equal(recent.models.haiku.messages, 1);
});

test('cost: uses only user-supplied prices', () => {
  const s = { models: { opus: { input: 1e6, output: 1e6, cacheRead: 0, cacheWrite: 0, messages: 1 } }, total: {} };
  assert.equal(cost(s, { opus: { input: 2, output: 3 } }), 5);
  assert.equal(cost(s, {}), 0);
});
