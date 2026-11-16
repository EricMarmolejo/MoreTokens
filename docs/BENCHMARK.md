# Benchmark: did it save anything? / ¿Ahorró algo?

No numbers are shipped on purpose: they depend on your tasks, models and date. Fill the table with your own runs.
No se incluyen cifras a propósito: dependen de tus tareas, modelos y fecha. Rellena la tabla con tus pruebas.

## Method / Método (≈30 min)

1. Pick 5 real tasks: 2 mechanical over lots of text, 1 analysis, 1 decision, 1 short. / Elige 5 tareas reales: 2 mecánicas con mucho texto, 1 de análisis, 1 de decisión, 1 corta.
2. Run each in a **fresh session** without the skill; note the transcript file. / Ejecuta cada una en una **sesión nueva** sin la skill; anota el archivo de registro.
3. Run it again in another fresh session with `/moretokens <task>`. / Repite en otra sesión nueva con `/moretokens <tarea>`.
4. Compare: `node bin/moretokens.mjs compare A.jsonl B.jsonl --prices prices.json`. Transcripts live in `~/.claude/projects/<project>/`.
5. Judge the two answers **blind** (which is better?). / Juzga las dos respuestas **a ciegas**.

Subagent usage is logged in the same project folder, so pass the **folder** (or both files) if you want helpers counted. / El uso de los subagentes se registra en la misma carpeta del proyecto: pasa la **carpeta** si quieres contarlos.

## Results / Resultados

| Task | Words | Cost without | Cost with | Quality (same / worse / better) | Tier chosen |
|---|---|---|---|---|---|
| | | | | | |

Model, date and Claude Code version of the run: …

## Reading it / Cómo leerlo

- A saving counts only if quality is **same or better**. / El ahorro solo cuenta con calidad **igual o mejor**.
- Short tasks should show **no** saving (inline path). If the skill costs more there, tighten Rule 0. / En tareas cortas no debe haber ahorro; si la skill gasta más, endurece la Regla 0.
- Count how often Step 3 caught an error: that is the value of verification. / Cuenta cuántas veces el Paso 3 detectó un error: es el valor de la verificación.
