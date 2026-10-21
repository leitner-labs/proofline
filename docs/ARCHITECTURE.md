# Proofline — Architecture (Track 02: The Agent That Can Explain Why)

Proofline answers high-stakes business questions with a **verifiable evidence trail**: every claim in the answer carries a citation chain back to the source rows/documents, with query lineage from Zetaris and reasoning memory from Meterless H-MEM.

## Demo question
"Should Meridian Roast Co. (fictional SF roaster, 6 cafes) switch its oat-milk supplier — and to whom, and why?"

## Data plane (Zetaris)
- `data/roaster.db` (SQLite): internal purchase orders + quality tests (the "warehouse").
- `data/supplier_price_lists.csv`, `data/certifications.csv`: supplier-maintained files (the "lake").
- `data/recall_notices.csv`: external regulator/news extract (the "web").
- Zetaris federates these in place — no ETL — and records **lineage for every query** the agent runs. That lineage is the citation provenance in the final answer.

## Agent plane (Meterless)
- Local models via Meterless Nightshift = the brain (no per-token API cost, private by default).
- H-MEM = hierarchical memory: supplier facts, prior analyses, and user preferences persist across runs, so the agent can explain not just *what* it concluded but *why*, referencing what it learned earlier.
- Agent loop: decompose question → plan queries → run federated queries (Zetaris) → extract claims with evidence pointers → verify each claim against ≥1 source → compose answer with citation chain → store episode in H-MEM.

## Explainability surface
- Every claim: `claim → evidence row ids → originating source → query lineage id (Zetaris) → retrieval time`.
- CLI demo prints the answer, then `--explain` walks the trail interactively.
