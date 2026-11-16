---
name: moretokens-es
description: Gasta menos tokens caros sin bajar la calidad de la respuesta. Úsala cuando el usuario escriba /moretokens <tarea> o pida ahorrar tokens/uso en un trabajo que implica leer mucho material (resúmenes, extracción, traducción, análisis, revisión de documentos). Delega la lectura a un modelo más barato (Haiku o Sonnet) en un subagente, verifica lo importante y deja las decisiones al modelo más fuerte. Lo corto se hace directamente.
---

# MoreTokens (español)

Misma respuesta, menos tokens caros. Los tokens se van leyendo; la calidad se juega decidiendo. Que el modelo barato lea y el fuerte decida.

## Regla 0: delegar tiene un coste fijo

Un subagente carga sus propias instrucciones y tú relees la conversación en cada paso. Con menos de ~3.000 palabras de material, o si una búsqueda encuentra la respuesta, **hazlo directamente**. No delegues para aparentar rigor.

## Paso 1: clasifica antes de leer

No abras el material para decidir: leerlo ya es el coste. Usa el texto de la tarea y, como mucho, un `wc -w`. Responde cuatro preguntas:

| Pregunta | Valores |
|---|---|
| **Palabras** de material | número |
| **¿Lectura completa?** ¿La respuesta necesita todo o basta buscar? | sí / no |
| **Criterio** necesario al leer | ninguno / algo / alto |
| **¿Decisión?** ¿Termina en una decisión, plan o recomendación? | sí / no |

Después:

- Lectura completa **y** palabras ≥ 3.000 → delega la lectura.
  - criterio **ninguno** (resumir, extraer, tabla, traducir, contrastar con una lista) → **ayudante Lean** (`model: "haiku"`).
  - criterio **algo/alto** (análisis, riesgos, informe desde varios documentos) → **ayudante Mid** (`model: "sonnet"`). Si ya eres Sonnet, hazlo tú.
- Si no → sin ayudante.
- **Decisión = sí** → decide el modelo fuerte (Opus) sobre el extracto del ayudante. Si no eres Opus, pasa la decisión a un subagente Opus (`model: "opus"`) con el extracto y la pregunta.
- Decisión = no → respondes tú, tras verificar.

`moretokens route --words N --full-read --judgment none|some|high [--decision]` imprime lo que dice esta tabla, y `evals/cases.json` es su conjunto de pruebas.

## Paso 2: encarga el trabajo (un solo mensaje)

Pasa siempre `model` de forma explícita; sin él, el ayudante hereda tu modelo y no ahorras nada. Usa `effort: "low"` para Lean, `"medium"` para Mid, ninguno para Opus.

Un buen encargo tiene exactamente:

1. **Objetivo** en una frase.
2. **Rutas absolutas** y «lee cada archivo completo; no busques solo palabras clave».
3. **Formato de salida** y un tope firme («una línea por cláusula: número + lo que dice, máx. 25 líneas»). Nunca el texto entero.
4. **Salida larga a un archivo**: pide solo la ruta, el nº de líneas y los totales.
5. **Restricciones que le afectan**: idioma, términos fijos, tono. No pegues el historial.
6. **Cláusula de honestidad**: «Si no lo encuentras o dudas, dilo. No inventes. Informa, no recomiendes.»

Troceado (puntos de partida; ajústalos con el benchmark): Lean ≈ 15.000 palabras por ayudante, Mid ≈ 40.000. Más material → varios ayudantes **en el mismo mensaje**, cada uno con su archivo o rango de líneas.

## Paso 3: verifica y escala una vez

Un solo paso, como mucho tres comprobaciones en paralelo, solo de lo que sostiene tu respuesta:

- las 2–3 citas o cifras decisivas → grep del texto exacto en el original;
- un archivo escrito por el ayudante → que exista, `wc -l -w`;
- cualquier suma o total → recalcúlalo con un script.

Si una comprobación falla o el ayudante dudó, rehaz **solo esa parte** tú o con el nivel siguiente (Lean → Mid → Fuerte). Un escalado por tarea; si vuelve a fallar, díselo al usuario sin rodeos. No releas todo el material: es el coste que querías evitar.

## Paso 4: responde

Empieza con una línea de estado y sigue con la respuesta, tan completa como sin esta skill:

```
[moretokens] haiku leyó 14 archivos · opus verificó y respondió
[moretokens] directo: 1.200 palabras, delegar costaría más
```

Usa el idioma del usuario aunque el material esté en otro. Nunca digas cuántos tokens se ahorraron: no puedes saberlo. Remite a `moretokens report` / `moretokens compare`.

## Sin subagentes (apps de chat)

Clasifica igualmente. Si el trabajo es de tamaño Lean y grande, dilo antes de hacer nada: «Esto es trabajo de Haiku: cambia el selector de modelo y reenvía, o dime que continúe.» Si no, hazlo tú e imprime la línea de estado.

## Límites conocidos

- La clasificación es juicio del modelo; el Paso 3 es la red de seguridad.
- Requiere poder lanzar subagentes con un modelo elegido (Claude Code). En otros entornos solo aplica el Paso 1.
- El ahorro depende de la tarea y no está garantizado: mídelo.
