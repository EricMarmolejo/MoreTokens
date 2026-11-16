// Reads Claude Code transcripts (.jsonl) and totals token usage per model family.
// Lee los registros de Claude Code (.jsonl) y suma el uso de tokens por familia de modelo.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function family(model = '') {
  const m = String(model).toLowerCase();
  for (const f of ['haiku', 'sonnet', 'opus', 'fable']) if (m.includes(f)) return f;
  return 'other';
}

export function listTranscripts(path) {
  const st = statSync(path);
  if (st.isFile()) return [path];
  const out = [];
  for (const name of readdirSync(path)) {
    const p = join(path, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listTranscripts(p));
    else if (name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

const empty = () => ({ messages: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });

/**
 * Totals usage across transcripts. Streaming writes the same message several
 * times, so entries are de-duplicated by message id (last one wins).
 * @param {string[]} files
 * @param {{since?: Date}} [opts]
 */
export function summarize(files, { since } = {}) {
  const byId = new Map();
  for (const file of files) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      if (!line.includes('"usage"')) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      const msg = o.message;
      if (!msg || !msg.usage || o.type !== 'assistant') continue;
      if (since && o.timestamp && new Date(o.timestamp) < since) continue;
      byId.set(msg.id || `${file}:${byId.size}`, { model: msg.model, usage: msg.usage });
    }
  }
  const models = {};
  const total = empty();
  for (const { model, usage } of byId.values()) {
    const key = family(model);
    const row = (models[key] ||= empty());
    const add = {
      messages: 1,
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
      cacheRead: usage.cache_read_input_tokens || 0,
      cacheWrite: usage.cache_creation_input_tokens || 0,
    };
    for (const k of Object.keys(add)) { row[k] += add[k]; total[k] += add[k]; }
  }
  return { models, total };
}

/**
 * Cost from a user-supplied price table (USD per million tokens, per family).
 * No prices are bundled: copy them from the official pricing page.
 */
export function cost(summary, prices) {
  let usd = 0;
  for (const [fam, row] of Object.entries(summary.models)) {
    const p = prices[fam];
    if (!p) continue;
    usd += (row.input * (p.input || 0) + row.output * (p.output || 0)
      + row.cacheRead * (p.cacheRead || 0) + row.cacheWrite * (p.cacheWrite || 0)) / 1e6;
  }
  return usd;
}
