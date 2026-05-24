# Project Memory System

This project uses a structured memory system. Follow these rules on every session.

---

## ON SESSION START

When the user says anything like "let's work on X" or "continue with Y" or names a project:

1. Read `CONTEXT.md` — this is compiled truth, your starting point.
2. Read the last 10 entries in `LOG.md` — this is the recent trail.
3. Scan `notes/` for any file modified in the last 14 days.
4. Briefly confirm to the user: what state the project is in, what was last worked on, and any open questions flagged. Keep this to 3–5 sentences. Do not reproduce the files verbatim — synthesize.

If CONTEXT.md does not exist yet, say so and offer to initialize the memory structure.

---

## DURING THE SESSION

After any exchange that produces a decision, conclusion, abandoned approach, or meaningful finding, append a brief timestamped entry to `LOG.md`. Format:

```
### YYYY-MM-DD HH:MM
[1–4 lines. What was tried or decided. Why. What was ruled out and why.]
```

Do not wait until the end of the session to do this. Write to LOG.md incrementally. Short entries are fine. The goal is an honest trail, not prose.

If a substantive artifact is produced (a table, a regression spec, a cleaned dataset, a lit review, a model outline), save it as a dated file in `notes/`: `notes/YYYY-MM-DD-slug.md`. Never overwrite an existing notes file — create a new one.

---

## ON SESSION END

When the user signals they are done (says goodbye, "that's it", "stop here", etc.) or when you determine the session has reached a natural close:

1. **Rewrite `CONTEXT.md`** — replace it entirely with current compiled truth. Use the template below. This is your best current understanding of the project. Do not append — rewrite.
2. **Append a session summary to `LOG.md`** — one entry summarizing the full session: what changed, what was concluded, what is now open.
3. Confirm to the user: "Memory updated." Nothing more needed.

---

## FILE FORMATS

### CONTEXT.md template

```markdown
# [Project Name]

**Last updated:** YYYY-MM-DD
**Status:** [one line: e.g., "Active — working on identification strategy"]

## Current understanding
[2–4 paragraphs. Prose. Brief a colleague who knows the field.]

## Active questions
[Numbered list of open questions that are genuinely unresolved.]

## Decisions made
[Numbered list of things that have been decided and should not be relitigated unless new evidence arrives. Include brief rationale.]

## Approaches tried and abandoned
[Numbered list. What was tried, why it was dropped. Critical — do not omit failures.]

## Next steps
[Short numbered list of concrete next actions.]

## Key files
[Important notes/, data files, or code files worth flagging.]
```

### LOG.md format

Append-only. Never edit existing entries. Newest entries at the bottom.

```markdown
# Log — [Project Name]

### YYYY-MM-DD HH:MM
[Entry]
```

---

## RULES

- **Never edit existing LOG.md entries.** Only append.
- **Never overwrite notes/ files.** Only create new ones with new dates.
- **CONTEXT.md is the only file that gets rewritten.** Everything else accumulates.
- If the user asks "what did we try before?" or "why did we drop X?", search LOG.md and notes/ — do not rely on session memory.
- If CONTEXT.md and a LOG.md entry contradict each other, flag it to the user.

---

## SKILLS

Three user-level skills are available for explicit invocation:

- `/ctx-save` — checkpoint now: rewrite CONTEXT.md and append to LOG.md without ending the session.
- `/ctx-status` — print current project state from CONTEXT.md without writing anything.
- `/ctx-history [query]` — search LOG.md and notes/ for a topic and summarize findings.
