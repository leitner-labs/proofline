/** Exports the SQLite warehouse tables to CSV so every Proofline source can be
 *  registered as a Zetaris Lightning file table (see 01-register-sources.sql).
 *  Run: node zetaris/export-warehouse.mjs  (from the repo root) */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const out = path.join(import.meta.dirname, 'warehouse');
mkdirSync(out, { recursive: true });
const db = new DatabaseSync(path.join(root, 'data', 'roaster.db'));

const q = (v) => v === null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v);
for (const table of ['suppliers', 'purchase_orders', 'quality_tests']) {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n') + '\n';
  writeFileSync(path.join(out, `${table}.csv`), csv);
  console.log(`${table}.csv: ${rows.length} rows`);
}
