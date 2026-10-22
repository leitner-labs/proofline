# Proofline

**An agent that answers high-stakes questions with a verifiable evidence trail — every claim links back to the exact rows it came from.**

Open Agent Hackathon 2026 · Track 02: *The Agent That Can Explain Why* · Team: Leitner Labs (solo)

## The problem

Agents answer confidently and cite vaguely. When the answer drives a real decision — which supplier to bet a business on, which number to put in a board deck — "trust me" is not good enough. Proofline's contract: **a claim ships only if it is backed by evidence you can click through**, with the source, the rows, the query lineage and the retrieval time for every one.

## The demo

Meridian Roast Co., a fictional six-cafe San Francisco roaster, asks:

> *Should we switch our oat-milk supplier — and to whom, and why?*

Answering that honestly means looking everywhere at once: the roaster's internal purchase ledger and quality tests (SQLite), supplier-maintained price lists and certifications (CSVs), and external regulator recall notices (web extract). Proofline federates all three, builds claims only from retrieved rows, verifies each claim, and remembers the episode so it can explain later why it believed what it believed.

## Architecture

```
                 ┌──────────────────────────── Proofline agent ───────────────────────────┐
 question  ────► │ decompose → federated queries → extract claims → VERIFY → compose       │
                 │                                          │                              │
                 │   unverifiable claims never ship ────────┘                              │
                 └───────────┬───────────────────────────────────────┬─────────────────────┘
                             │                                       │
              Federation + lineage layer                  Meterless H-MEM (vendored)
              (Zetaris-shaped: SQLite + CSV + web,         hierarchical memory with
               every query stamped with lineage)           provenance + trust ledger
                             │                                       │
                 data/roaster.db · data/*.csv · recall notices        data/hmem/
```

- **Meterless H-MEM** is the agent's memory: every verified answer episode is mined into H-MEM with its evidence pointers as provenance, and H-MEM's trust ledger audits each write. That audit trail is how Proofline explains *why it knows something*, not just *what* it concluded. The vendored engine passes Meterless's own conformance suite (13/13) in this repo.
- **Federation + lineage:** the query layer is built to the Zetaris pattern — sources are queried in place (no ETL), and every executed query is stamped with a lineage id that flows into the answer's citations. In this build the layer runs against local SQLite/CSV (see *Sponsor technology* below).
- **Model:** the agent loop is provider-agnostic (NVIDIA Nemotron via an OpenAI-compatible endpoint; a deterministic provider keeps tests reproducible).

## Demo video and deck

- **Video (1:35):** `video/proofline-demo.mp4` — every on-screen number comes from a real agent run baked in `video/answer.json`; the whole pipeline (scenes, narration, assembly) is reproducible via `video/make-scenes.py`, `video/make-narration.py` and `video/make-video.py`.
- **Deck:** `deck/index.html` — 8 slides, open in any browser.

## Run it

```bash
npm install
npm run demo                 # CLI: answer + evidence trail
node_modules/.bin/tsx src/server.ts   # web UI on :4173
```

Regenerate the dataset any time: `python3 scripts/make_data.py`

Tests (agent loop, evidence trail, memory): `node_modules/.bin/tsx --test test/*.test.ts`

## Repo map

| Path | What |
|---|---|
| `src/agent/` | the loop: gather → claims → verify → compose |
| `src/tools/federated.ts` | federation + lineage layer |
| `src/memory/hmem.ts` | H-MEM wiring (episodes, recall, trust ledger) |
| `src/explain/trail.ts` | the evidence-trail data model |
| `vendor/hmem/` | Meterless H-MEM reference engine (Apache 2.0), conformance 13/13 |
| `data/` | synthetic-but-consistent Meridian Roast dataset |
| `web/` | demo UI — click any claim open to audit its evidence |

## Sponsor technology

- **Meterless:** H-MEM is load-bearing (memory + provenance + audit), conformance-verified in-repo.
- **NVIDIA Nemotron:** target model provider for composition and judging (OpenAI-compatible endpoint).
- **Zetaris:** the federation + lineage layer implements the Zetaris pattern (query-in-place, lineage-stamped results). `zetaris/` contains the runnable integration for a real install - Lightning SQL source registrations, a `supplier_risk` USL model, and the demo's exact federation queries - mirroring `src/tools/federated.ts` one-for-one; the submitted demo runs the same interface against local SQLite/CSV because the build sandbox has no Docker or AWS (see `zetaris/README.md` and `docs/PLAN.md`).

## What we'd do next

Point the federation layer at a live Zetaris endpoint (it drops in by config), race multiple Nemotron models over the same question and let H-MEM's dreaming cycle propose new supplier-risk hypotheses overnight.
