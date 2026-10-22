/** Federated query layer. Locally: SQLite (warehouse) + CSVs (lake) + web extract.
 *  Lane 6 swaps/extends internals with Zetaris federation; the EvidenceRef lineage
 *  contract stays identical, so citations survive the swap. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EvidenceRef, nextId } from '../explain/trail.js';

const DATA = path.join(import.meta.dirname, '..', '..', 'data');

export interface QueryResult { rows: Record<string, unknown>[]; evidence: EvidenceRef; }

function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q && ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
    else if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function csvRows(file: string): Record<string, string>[] {
  const text = readFileSync(path.join(DATA, file), 'utf8').trim();
  const [head, ...lines] = text.split('\n');
  const cols = parseCsvLine(head);
  return lines.map(l => Object.fromEntries(parseCsvLine(l).map((v, i) => [cols[i], v])));
}

export class Federated {
  private db = new DatabaseSync(path.join(DATA, 'roaster.db'));
  sql(source: string, query: string): QueryResult {
    const rows = this.db.prepare(query).all() as Record<string, unknown>[];
    return {
      rows,
      evidence: {
        evidenceId: nextId('ev'), source: `roaster.db:${source}`, query,
        rowIds: rows.map((r, i) => String(r.id ?? r.rowid ?? i)),
        retrievedAt: new Date().toISOString(), lineageId: nextId('lin'),
      },
    };
  }
  csv(file: string, where?: (r: Record<string, string>) => boolean): QueryResult {
    const all = csvRows(file);
    const rows = where ? all.filter(where) : all;
    return {
      rows,
      evidence: {
        evidenceId: nextId('ev'), source: file, query: where ? `${file} filtered` : `${file} full scan`,
        rowIds: rows.map((_, i) => `line:${i + 2}`),
        retrievedAt: new Date().toISOString(), lineageId: nextId('lin'),
      },
    };
  }
}
