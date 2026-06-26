---
description: Verify that makeDefaultConfig in src/commands/init.ts covers every field in ConfigSchema in src/config.ts. Run this after any edit to either file.
---

Read `src/config.ts` and `src/commands/init.ts` in full.

Cross-reference every field in `ConfigSchema` against the YAML template produced by `makeDefaultConfig`:

1. **Missing field** — a schema field (at any nesting level) has no corresponding line in the YAML, commented or not.
2. **Wrong default** — the value shown in a YAML comment (e.g. `# keep: 5`) differs from the `.default(...)` in the schema.
3. **Stale field** — the YAML contains a key that no longer exists in the schema.
4. **Required vs optional** — fields with no `.default()` and not `.optional()` must be uncommented in the YAML; fields with a default should appear commented-out.

Report findings as:
- `✓ in sync` if everything matches.
- One bullet per discrepancy: field path, what the schema says, what the template shows.

If any discrepancies exist, offer to update `makeDefaultConfig` to match the current schema before finishing.
