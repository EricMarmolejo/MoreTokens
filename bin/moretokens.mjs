#!/usr/bin/env node
// MoreTokens CLI: measure token usage per model and decide when to delegate.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { listTranscripts, summarize, cost } from '../src/usage.mjs';
import { route } from '../src/route.mjs';

const HELP = `moretokens <command>

  report  [path] [--since YYYY-MM-DD] [--prices file.json] [--json]
          Token usage per model family. path = a .jsonl file or a folder
          (default: ~/.claude/projects).
  compare <A> <B> [--prices file.json] [--json]
          Usage of two sessions/folders side by side (e.g. without vs with the skill).
  route   --words N [--full-read] [--judgment none|some|high] [--decision]
          Which helper tier the decision table recommends.

moretokens <comando>   (report, compare, route; mismas opciones / same options)
`;

function parse(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[key] = true;
    else { flags[key] = next; i++; }
  }
  return { pos, flags };
}

const n = (x) => x.toLocaleString('en-US');

function table(s, usd) {
  const rows = Object.entries(s.models).sort((a, b) => b[1].output - a[1].output);
  const lines = ['model     msgs     input    output  cacheRead  cacheWrite'];
  for (const [m, r] of [...rows, ['TOTAL', s.total]]) {
    lines.push(`${m.padEnd(8)} ${String(n(r.messages)).padStart(5)} ${String(n(r.input)).padStart(9)} ${String(n(r.output)).padStart(9)} ${String(n(r.cacheRead)).padStart(10)} ${String(n(r.cacheWrite)).padStart(11)}`);
  }
  if (usd !== undefined) lines.push(`cost (your prices): $${usd.toFixed(4)}`);
  return lines.join('\n');
}

function load(path, flags) {
  const files = listTranscripts(path);
  if (!files.length) throw new Error(`no .jsonl transcripts under ${path}`);
  const since = flags.since ? new Date(flags.since) : undefined;
  if (since && Number.isNaN(since.getTime())) throw new Error('--since must be YYYY-MM-DD');
  return summarize(files, { since });
}

function prices(flags) {
  return flags.prices ? JSON.parse(readFileSync(flags.prices, 'utf8')) : null;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parse(rest);
  switch (cmd) {
    case 'report': {
      const s = load(pos[0] || join(homedir(), '.claude', 'projects'), flags);
      const p = prices(flags);
      const usd = p ? cost(s, p) : undefined;
      console.log(flags.json ? JSON.stringify({ ...s, usd }, null, 2) : table(s, usd));
      break;
    }
    case 'compare': {
      if (pos.length < 2) throw new Error('compare needs two paths');
      const [a, b] = [load(pos[0], flags), load(pos[1], flags)];
      const p = prices(flags);
      const ua = p ? cost(a, p) : undefined, ub = p ? cost(b, p) : undefined;
      if (flags.json) { console.log(JSON.stringify({ a, b, usdA: ua, usdB: ub }, null, 2)); break; }
      console.log('A:', pos[0], '\n' + table(a, ua), '\n\nB:', pos[1], '\n' + table(b, ub));
      if (ua !== undefined && ua > 0) console.log(`\nB vs A: ${(((ub - ua) / ua) * 100).toFixed(1)}% cost (quality must be compared by hand)`);
      break;
    }
    case 'route': {
      const r = route({
        words: Number(flags.words),
        fullRead: Boolean(flags['full-read']),
        judgment: flags.judgment || 'none',
        decision: Boolean(flags.decision),
      });
      console.log(JSON.stringify(r));
      break;
    }
    default:
      console.log(HELP);
      if (cmd && cmd !== '--help' && cmd !== 'help') process.exitCode = 1;
  }
}

try { main(); } catch (e) { console.error(`moretokens: ${e.message}`); process.exitCode = 1; }
