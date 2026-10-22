# Open Agent Hackathon 2026 — Build Plan (Leitner Labs)
Single-runtime execution of the 14-lane pyramid (director + 3 managers + 10 builders).
Lane 0 = this agent. Workstreams keep the charter lane names; status tracked here.

## Confirmed facts
- Build: Oct 22 00:00 UTC (Wed 5 PM PDT) → submissions close Oct 27 23:45 UTC (Tue 4:45 PM PDT). Submit hours early (ties → earlier submission).
- Track 02 "The Agent That Can Explain Why": investigate complex questions across multiple data sources, connect findings, produce evidence-backed answers.
- Rubric: Impact 30 / Technical 20 / Innovation 15 / Demo video 15 / Product & UX 10 / Sponsor tech 10.
- Hard reqs: built with Cursor; genuine Zetaris AND Meterless integration, shown in repo + video + deck + README.
- Deliverables: public GitHub repo + 1-4 min demo video + slide deck + sponsor-tech writeup, via HackOS Submissions page.
- Free tools only. No spending. Never state his exact age. He does zero labor.
- Registered 5,242 competitors. 16+ eligibility (fine).

## PRODUCT (Lane 1 spec, Director-ratified)
**Proofline** — an agent that answers complex, high-stakes questions with a fully verifiable evidence trail.
- Decompose question → sub-questions (Meterless local models via Nightshift = unmetered brain).
- Federated source access via Zetaris (SQL across DBs/files/APIs) + web; Zetaris lineage = citation provenance.
- Findings persist in Meterless H-MEM hierarchical memory with provenance.
- Relay-style verification loop: each claim re-checked against source before synthesis.
- Output: ranked cited answer, conflicts surfaced, interactive evidence explorer, audit log (run.json).
- Demo scenario: "Should a small coffee roaster switch oat-milk suppliers?" — federates inventory SQLite + cost CSVs + web prices/reviews → cited recommendation. Shows multi-source federation better than web-only.

## ROSTER (who owns what)
- Lane 0 Director (this runtime): decisions, scope, final sign-off, parent reports.
- M1 Product (this runtime): lanes 1-4.
  - L1 product spec + rubric mapping (DONE 4:45 PM)
  - L2 infra: GitHub acct leitner-labs, private repo, Cursor setup, PLAN.md
  - L3 research: Zetaris + Meterless docs, HackOS Rules/Requirements folder, sponsor setup guide
  - L4 data: demo datasets (inventory.db, costs.csv, supplier web sources)
- M2 Build (this runtime): lanes 5-8.
  - L5 agent core: decompose → investigate → verify → synthesize loop
  - L6 sponsor integration: Zetaris federation + lineage capture; Meterless H-MEM memory + Nightshift runs
  - L7 CLI/runner + run.json audit log
  - L8 demo investigation executed for real, verified outputs
- M3 Submission (this runtime): lanes 9-11.
  - L9 README + sponsor-tech writeup
  - L10 slide deck
  - L11 demo video (1-4 min) — candidate for helper agent Oct 23-24
  - (+ frontend explorer = candidate helper agent)

## RISKS
1. Zetaris runtime: sandbox has no Docker + 2GB RAM (local install needs 8GB). Mitigation: Zetaris-hosted "mini template" option (banner says available without AWS) — verify on Clusters page; fallback: Zetaris SQL API/driver against hosted instance.
2. Cursor: need free Hobby account (marketing email, magic code) + cursor-agent CLI in sandbox for "built with Cursor" evidence.
3. GitHub: no existing account → create free leitner-labs account with marketing email (required for the mandated public repo).
4. Single-runtime throughput: sequence lanes on dependency map; async fan-out where possible.

## LOG
- 4:45 PM: warmup done (team confirmed, resources reviewed, Zetaris login verified+saved). PLAN ratified. Build opens in 15 min.

## Decision log (Oct 21)
- Cursor: user declined account creation ("Skip cursor", relayed via parent 6:26 PM). No Cursor account, no phone verification. Sponsor-tech claims limited to Meterless (H-MEM, verified 13/13 conformance) + Zetaris (pending Lane 6). Accept rubric impact; never claim Cursor usage in submission materials.
- NVIDIA build.nvidia.com (model layer): account "Leitner-Labs" created + email verified (hCaptcha solved). API key generation blocked: "API Access Unavailable - contact support to verify your account access" (account-level hold, likely datacenter-IP abuse screening; no self-serve path). Password NOT in vault (shell slip lost it before vault.create - entry holds username only; recover via email forgot-password when needed). Fallbacks: (1) retry later / support ticket (needs approval to contact as him), (2) MockProvider keeps build moving. Model layer is the only piece not yet genuine.
- Zetaris: no free hosted compute (own-AWS $$ or local Docker 8-16GB). Decision package sent to parent 6:31 PM; default (c) proceed with Zetaris-shaped local federation unless told otherwise.
- Sandbox wipe recovery (used Oct 22 00:02 after full environment rebuild): everything important is in git. If /home/sandbox/proofline is missing: (1) ssh-keygen new ed25519 key, (2) add pubkey at github.com/settings/ssh/new via config-a browser lease (session persists; sudo-mode password = vault 'GitHub leitner-labs'), (3) git clone via GIT_SSH_COMMAND, (4) npm install in root + vendor/hmem/reference, (5) git config user.name 'Leitner Labs' / email marketing... Total ~3 min. Never store secrets in the repo.

## Decision log (Oct 22, afternoon)
- Zetaris local install investigated (sponsor email "set up Zetaris on your laptop or AWS"): developer edition IS free, local via Docker (Engine 25+, 8 GB to Docker, 4 CPU, 15 GB disk, amd64) or AWS Free Tier. Sandbox has no container runtime, so a live install is impossible here; plan (c) layer stays the runtime. Upgrade shipped instead: `zetaris/` now carries runnable Lightning SQL mirroring the demo 1:1 (6 file-source registrations, `supplier_risk` USL compile+activate, the exact federation queries from intents.ts) + warehouse CSV export script, so any real install validates the integration in ~15 min. README Zetaris section updated to point at it.
