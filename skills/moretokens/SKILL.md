---
name: moretokens
description: Spend fewer expensive tokens without lowering answer quality. Use when the user types /moretokens <task>, or asks to save tokens/usage on a job that involves reading a lot of material (summaries, extraction, translation, analysis, document review). Hands the reading to a cheaper model (Haiku or Sonnet) in a subagent, verifies what matters, and keeps decisions on the stronger model. Short tasks stay inline.
---

# MoreTokens

Same answer, fewer expensive tokens. Reading is where tokens go; deciding is where quality matters. Pay the cheap model to read and the strong model to decide.

## Rule 0: delegation has a fixed cost

A subagent loads its own instructions and you re-read the conversation at every step. Below ~3,000 words of material, or when a search finds the answer, **do it inline**. Do not delegate to look thorough.

## Step 1: classify before reading

Do not open the material to decide; reading it is already the cost. Use the task text and, at most, one `wc -w`. Answer four questions:

| Question | Values |
|---|---|
| **Words** of material | number |
| **Full read?** Does the answer need all of it, or can a search find it? | yes / no |
| **Judgment** needed while reading | none / some / high |
| **Decision?** Does the task end in a decision, plan or recommendation? | yes / no |

Then:

- Full read **and** words ≥ 3,000 → delegate the reading.
  - judgment **none** (summarize, extract, table, translate, check against a list) → **Lean helper** (`model: "haiku"`).
  - judgment **some/high** (analysis, risks, report from several documents) → **Mid helper** (`model: "sonnet"`). If you already are Sonnet, do it yourself.
- Otherwise → no helper.
- **Decision = yes** → the strong model (Opus) decides, on the helper's extract. If you are not Opus, hand the decision to an Opus subagent (`model: "opus"`) with the extract and the question.
- Decision = no → you answer, after verifying.

`moretokens route --words N --full-read --judgment none|some|high [--decision]` prints this table's answer, and `evals/cases.json` is its test set.

## Step 2: brief the helper (one message)

Always pass `model` explicitly; without it the helper inherits your model and saves nothing. Use `effort: "low"` for Lean, `"medium"` for Mid, none for Opus.

A good brief has exactly:

1. **Goal** in one sentence.
2. **Absolute paths**, and "read each file completely; do not just search for keywords".
3. **Output contract**: what to return and a hard cap ("one line per clause: number + what it says, max 25 lines"). Never the full text.
4. **Long output goes to a file**: ask for the path, line count and totals only.
5. **Constraints that affect it**: language, fixed terms, tone. Do not paste conversation history.
6. **Honesty clause**: "If you cannot find it or are unsure, say so. Do not invent. Report, do not recommend."

Chunking (starting points, tune with the benchmark): Lean ≈ 15,000 words per helper, Mid ≈ 40,000. More material → several helpers **in the same message**, each with its own file or line range.

## Step 3: verify, then escalate once

One step, at most three checks in parallel, only on what your answer depends on:

- the 2–3 decisive quotes or figures → grep the exact text in the source;
- a file the helper wrote → it exists, `wc -l -w`;
- any sum or total → recompute with a script.

If a check fails or the helper said it was unsure, redo **only that part** yourself or with the next tier up (Lean → Mid → Strong). One escalation per task; if it fails again, tell the user plainly. Do not re-read all the material: that is the cost you avoided.

## Step 4: answer

Start with one status line, then the answer, as complete as it would be without this skill:

```
[moretokens] haiku read 14 files · opus verified and answered
[moretokens] inline: 1,200 words, delegation would cost more
```

Use the user's language even if the material is in another. Never state how many tokens were saved; you cannot know. Point to `moretokens report` / `moretokens compare` instead.

## Without subagents (chat apps)

Classify anyway. If the job is Lean-sized and large, say so before doing anything: "This is a Haiku-sized job: switch the model selector and resend, or tell me to continue." Otherwise do it yourself and print the status line.

## Known limits

- The classification is the model's judgment; Step 3 is the safety net.
- Needs a way to start subagents with a chosen model (Claude Code). Elsewhere only Step 1 applies.
- Savings depend on the task and are not guaranteed: measure them.
