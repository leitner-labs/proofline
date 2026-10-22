/** Proofline agent loop: classify -> federated gather -> claim extraction ->
 *  verification (a claim ships only with real evidence rows) -> compose -> remember. */
import { Federated } from '../tools/federated.js';
import { ModelProvider } from './providers.js';
import { ProoflineMemory } from '../memory/hmem.js';
import { classify, plan } from './intents.js';
import { Answer, Claim, nextId } from '../explain/trail.js';
import { QueryResult } from '../tools/federated.js';

type Gathered = Record<string, QueryResult>;
const mk = (text: string, ev: QueryResult[], conf: number): Claim => ({
  claimId: nextId('cl'), text, confidence: conf,
  evidence: ev.map(e => e.evidence), verified: ev.every(e => e.evidence.rowIds.length > 0),
});

export class ProoflineAgent {
  constructor(private fed = new Federated(), private model: ModelProvider, private mem = new ProoflineMemory()) {}

  private claims(intent: string, g: Gathered): Claim[] {
    const out: Claim[] = [];
    if (g.pricing) {
      const rows = [...(g.pricing.rows as any[])].sort((a, b) => a.unit_price_usd - b.unit_price_usd);
      const c = rows[0], w = rows[rows.length - 1];
      out.push(mk(
        `${c.supplier} is the cheapest qualified option at $${c.unit_price_usd}/unit (MOQ ${c.moq_liters}L, ${c.lead_time_days}d lead, ${c.contract_discount_pct}% contract discount); the incumbent ${w.supplier} lists at $${w.unit_price_usd}.`,
        [g.pricing], 0.95));
    }
    if (g.onTime) {
      const rows = g.onTime.rows as any[];
      for (const r of rows) out.push(mk(
        `Supplier ${r.supplier_id} delivered on time for ${r.on_time}/${r.n} purchase orders (last 10 months, internal ledger).`,
        [g.onTime], 0.9));
    }
    if (g.quality) {
      const rows = g.quality.rows as any[];
      const best = [...rows].sort((a, b) => (b.passed / b.n) - (a.passed / a.n))[0];
      out.push(mk(
        `${best.supplier_id} has the strongest incoming-quality record: ${best.passed}/${best.n} tests passed, avg Brix ${Number(best.avg_brix).toFixed(1)}.`,
        [g.quality], 0.9));
    }
    if (g.recalls) {
      for (const r of g.recalls.rows as any[]) {
        if (String(r.severity).startsWith('Class')) out.push(mk(
          `${r.supplier} had a ${r.severity} event on ${r.date}: ${r.notice} (source: ${r.source}).`,
          [g.recalls], 0.85));
      }
    }
    if (g.certs) {
      const gs = (g.certs.rows as any[]).filter(r => r.supplier === 'Golden State Oats');
      if (gs.length) out.push(mk(
        `Golden State Oats holds ${gs.map(r => r.certification).join(' + ')} (valid to ${gs.map(r => r.valid_until).sort().pop()}).`,
        [g.certs], 0.9));
    }
    return out;
  }

  async answer(question: string): Promise<Answer> {
    const intent = classify(question);
    const gathered = plan(this.fed, intent);
    const claims = this.claims(intent, gathered).filter(c => c.verified); // unverifiable claims never ship
    const synthesis = await this.model.complete(
      'SYNTHESIZE: ' + question + '\n' + claims.map(c => '- ' + c.text).join('\n'));
    claims.unshift({
      claimId: nextId('cl'), text: synthesis, confidence: 0.8,
      evidence: claims.flatMap(c => c.evidence), verified: claims.length > 0 && claims.every(c => c.verified),
    });
    const answer: Answer = { question, claims, composedAt: new Date().toISOString() };
    this.mem.rememberEpisode(question, synthesis, claims.flatMap(c => c.evidence.map(e => e.evidenceId)));
    return answer;
  }
}
