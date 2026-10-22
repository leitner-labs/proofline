# Running Proofline on a real Zetaris install

Proofline's federation layer is built to the Zetaris pattern: sources are queried
in place, and every executed query is stamped with a lineage id that flows into
the answer's citations. This directory turns that pattern into scripts that run
verbatim on a real Zetaris install (local Docker or an AWS cluster - the
developer edition is free in both; see Zetaris's *Choose an install* guide).

## Status

The hackathon build sandbox has no Docker and no AWS account, so the submitted
demo runs the same interface against local SQLite + CSV (`src/tools/federated.ts`,
the "Zetaris-shaped" layer). The SQL here follows the official Lightning command
reference (sections 5, 13) and the getting-started file-source HOWTO. It has not
been executed against a live Zetaris server yet - that is the one step we could
not do from the build environment. Anyone with a running install can validate it
end to end in about 15 minutes.

## Steps

1. Install Zetaris locally (Docker, 8 GB) or on AWS Free Tier:
   <https://zetaris.github.io/getting-started/> -> *Choose an install*.
2. `node zetaris/export-warehouse.mjs` - dumps the SQLite warehouse tables to
   `zetaris/warehouse/*.csv` (already committed here).
3. Put the six CSVs (three lake CSVs from `data/`, three warehouse CSVs) where
   the install can read them; S3 and MinIO both work with the documented options.
4. Run `01-register-sources.sql` - one statement at a time, substituting paths.
5. Run `02-usl-model.sql` - compiles + deploys the `supplier_risk` USL and
   activates every table against its source query.
6. Run `03-queries.sql` - the exact federation queries behind the demo answers.

## Wiring the agent to it

`src/tools/federated.ts` is the only file that touches sources. Pointing the
agent at Zetaris means implementing the same two methods (`sql`, `csv`) over the
JDBC/HTTP endpoint against the USL tables above; the `EvidenceRef` lineage
contract (source, query text, row ids, retrieved-at) is unchanged, so every
citation in an answer still resolves to the rows it came from.

## Why the USL matters to the product

Proofline's promise is "every claim links back to the rows it came from."
Zetaris's Unified Semantic Layer is what makes that promise hold at real
company scale: the evidence trail resolves against governed semantic tables
across sources, not against whatever CSV happened to be on someone's laptop.
