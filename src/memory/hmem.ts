/** H-MEM wiring: every verified answer episode is stored in the vendored Meterless
 *  H-MEM engine with full provenance (source = the evidence ids behind the answer).
 *  The trust ledger audits each write - that audit trail is how Proofline explains
 *  WHY it knows something, not just what it concluded. */
// @ts-ignore - vendored TS engine (reference impl, no published types package)
import { HMEM } from '../../vendor/hmem/reference/src/index.ts';
import path from 'node:path';

export class ProoflineMemory {
  private engine: InstanceType<typeof HMEM>;
  constructor(persistDir = path.join(import.meta.dirname, '..', '..', 'data', 'hmem')) {
    this.engine = new HMEM({ persistDir, actor: 'proofline-agent' });
  }
  rememberEpisode(question: string, answerText: string, evidenceIds: string[]) {
    return this.engine.store.add({
      content: `Q: ${question}\nA: ${answerText}`,
      type: 'episode', source: 'proofline-agent',
      tags: ['answer', 'verified'],
      confidence: 0.8,
      provenance: { derivedFromClaimEvidence: evidenceIds } as any,
      derivedFrom: evidenceIds,
    });
  }
  recall(query: string): { content: string; relevance: number }[] {
    // Model-free reference embedder scores low; 0.15 is the practical floor here.
    const res = this.engine.retrieval.query(query, { topN: 3, threshold: 0.15 });
    return ((res as any).memories ?? []).map((r: any) => ({
      content: r.memory?.content ?? '', relevance: r.relevance ?? 0,
    }));
  }
  ledgerEntries() { return (this.engine.ledger as any).entries?.() ?? (this.engine.ledger as any).list?.() ?? []; }
}
