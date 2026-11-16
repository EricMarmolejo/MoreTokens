# MoreTokens

**EN** · [ES](#español)

A Claude Code skill plus a small Node CLI. The skill hands bulk reading to a cheaper model, keeps decisions on the strongest one, and verifies what matters. The CLI **measures** whether it actually saved anything, from your own Claude Code transcripts.

- **It is** a workflow skill: classify → delegate reading → verify → escalate once → answer.
- **It is not** a proxy or an automatic router. The model makes the call; the verification step is the safety net.
- **It does not promise** a saving percentage. Measure yours: [docs/BENCHMARK.md](docs/BENCHMARK.md).

## Install

```bash
git clone https://github.com/EricMarmolejo/MoreTokens.git
```

Copy one skill folder to your Claude Code skills directory, then restart the session:

| Language | Copy | To |
|---|---|---|
| English | `skills/moretokens` | `~/.claude/skills/moretokens` |
| Español | `skills/moretokens-es` | `~/.claude/skills/moretokens-es` |

Use it: `/moretokens summarize the 6 contracts in C:\docs\contracts into a table of dates and penalties`.

The CLI needs Node 18+ and has no dependencies: `node bin/moretokens.mjs --help` (or `npm link` to get `moretokens`).

## How it decides

Four questions, answered without opening the material: how many words, does it need a full read, how much judgment, does it end in a decision.

| Full read & ≥ 3,000 words | Judgment | Reading goes to |
|---|---|---|
| yes | none | Haiku |
| yes | some / high | Sonnet |
| no, or fewer words | any | nobody (inline) |

A decision (plan, recommendation, choice) is always made by Opus, on the helper's extract. Below 3,000 words delegating costs more than it saves, so the skill stays inline. The table lives in [src/route.mjs](src/route.mjs) and is tested against [evals/cases.json](evals/cases.json).

```bash
node bin/moretokens.mjs route --words 40000 --full-read --judgment none
# {"helper":"lean","decider":"current"}
```

## Measure it

```bash
node bin/moretokens.mjs report                      # all your sessions, per model
node bin/moretokens.mjs compare A.jsonl B.jsonl     # session without vs with the skill
node bin/moretokens.mjs report --prices prices.json # add cost with YOUR prices
```

Transcripts are read locally from `~/.claude/projects`; nothing is sent anywhere. No prices are bundled because they change: copy them from the official pricing page into a file shaped like [prices.example.json](prices.example.json).

## Develop

```bash
npm test
```

## Credits and license

MIT, see [LICENSE](LICENSE). Written from scratch. The general idea of using cheaper models for bulk work is common practice; related projects exist (for example `model-router`) and this one shares no code or text with them.

---

## Español

Una skill de Claude Code y una pequeña CLI en Node. La skill entrega la lectura masiva a un modelo más barato, deja las decisiones al más fuerte y verifica lo importante. La CLI **mide** si de verdad ahorró algo, con tus propios registros de Claude Code.

- **Es** una skill de flujo de trabajo: clasificar → delegar la lectura → verificar → escalar una vez → responder.
- **No es** un proxy ni un enrutador automático. Decide el modelo; la verificación es la red de seguridad.
- **No promete** un porcentaje de ahorro. Mide el tuyo: [docs/BENCHMARK.md](docs/BENCHMARK.md).

### Instalación

```bash
git clone https://github.com/EricMarmolejo/MoreTokens.git
```

Copia **una** carpeta de skill al directorio de skills de Claude Code y reinicia la sesión: `skills/moretokens-es` → `~/.claude/skills/moretokens-es` (en Windows: `C:\Users\<tú>\.claude\skills\`).

Uso: `/moretokens resume los 6 contratos de C:\docs\contratos en una tabla de fechas y penalizaciones`.

La CLI requiere Node 18+ y no tiene dependencias: `node bin/moretokens.mjs --help`.

### Cómo decide

Cuatro preguntas, respondidas sin abrir el material: cuántas palabras, si exige lectura completa, cuánto criterio, si termina en una decisión.

| Lectura completa y ≥ 3.000 palabras | Criterio | La lectura va a |
|---|---|---|
| sí | ninguno | Haiku |
| sí | algo / alto | Sonnet |
| no, o menos palabras | cualquiera | nadie (directo) |

Una decisión (plan, recomendación, elección) la toma siempre Opus sobre el extracto del ayudante. Por debajo de 3.000 palabras delegar cuesta más de lo que ahorra, así que la skill trabaja directamente. La tabla está en [src/route.mjs](src/route.mjs) y se prueba con [evals/cases.json](evals/cases.json).

### Medir

```bash
node bin/moretokens.mjs report                      # todas tus sesiones, por modelo
node bin/moretokens.mjs compare A.jsonl B.jsonl     # sesión sin la skill frente a con ella
node bin/moretokens.mjs report --prices prices.json # añade el coste con TUS precios
```

Los registros se leen en local desde `~/.claude/projects`; no se envía nada. No se incluyen precios porque cambian: cópialos de la página oficial a un archivo con la forma de [prices.example.json](prices.example.json).

### Licencia

MIT, ver [LICENSE](LICENSE). Escrita desde cero; no comparte código ni texto con otros proyectos.
