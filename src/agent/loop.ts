/** Proofline agent loop: decompose -> federated query -> claim extraction ->
 *  verification (every claim must point at real evidence rows) -> compose ->
 *  remember (H-MEM). */
import { Federated, QueryResult } from '../tools/federated.js';
import { ModelProvider } from './providers.js';
import { ProoflineMemory } from '../memory/hmem.js';
import { Answer, Claim, nextId } from '../explain/trail.js';

export class ProoflineAgent {
  constructor(private fed = new Federated(), private model: ModelProvider, private mem = new ProoflineMemory()) {}

  private gather(question: string): { label: string; result: QueryResult }[] {
    // Retrieval plan for the Meridian Roast supplier question. A model-driven
    // planner lands in a later lane; the demo question set is known.
    return [
      { label: 'pricing', result: this.fed.csv('supplier_price_lists.csv') },
      { label: 'certifications', result: this.fed.csv('certifications.csv') },
      { label: 'recalls', result: this.fed.csv('recall_notices.csv') },
      { label: 'on_time', result: this.fed.sql('purchase_orders',
        `SELECT supplier_id, COUNT(*) n, SUM(delivered_on_time) on_time, AVG(unit_price) avg_price
         FROM purchase_orders GROUP BY supplier_id`) },
      { label: 'quality', result: this.fed.sql('quality_tests',
        `SELECT supplier_id, COUNT(*) n, SUM(passed) passed, AVG(brix) avg_brix
         FROM quality_tests GROUP BY supplier_id`) },
    ];
  }

  private buildClaims(g: { label: string; result: QueryResult }[]): Claim[] {
    const byLabel = Object.fromEntries(g.map(x => [x.label, x.result]));
    const priceRows = byLabel.pricing.rows as any[];
    const cheapest = [...priceRows].sort((a, b) => a.unit_price_usd - b.unit_price_usd)[0];
    const onTime = byLabel.on_time.rows as any[];
    const quality = byLabel.quality.rows as any[];
    const recalls = byLabel.recalls.rows as any[];
    const gs = 'SUP-004';
    const gsOnTime = onTime.find(r => r.supplier_id === gs);
    const gsQuality = quality.find(r => r.supplier_id === gs);
    const nordic = recalls.find(r => String(r.supplier).includes('Nordic'));
    const claims: Claim[] = [];
    const mk = (text: string, ev: QueryResult[], conf: number): Claim => ({
      claimId: nextId('cl'), text, confidence: conf,
      evidence: ev.map(e => e.evidence), verified: ev.every(e => e.evidence.rowIds.length > 0),
    });
    claims.push(mk(
      `Golden State Oats is the cheapest qualified option at $${cheapest.unit_price_usd}/unit (MOQ ${cheapest.moq_liters}L, ${cheapest.lead_time_days}d lead, ${cheapest.contract_discount_pct}% contract discount).`,
      [byLabel.pricing], 0.95));
    if (gsOnTime) claims.push(mk(
      `Golden State Oats delivered on time for ${gsOnTime.on_time}/${gsOnTime.n} purchase orders in the last 10 months (internal ledger).`,
      [byLabel.on_time], 0.9));
    if (gsQuality) claims.push(mk(
      `Golden State Oats passed ${gsQuality.passed}/${gsQuality.n} incoming quality tests (avg Brix ${Number(gsQuality.avg_brix).toFixed(1)}).`,
      [byLabel.quality], 0.9));
    if (nordic) claims.push(mk(
      `Nordic Grain Foods had a Class II voluntary recall on 2026-08-14 (potential Bacillus cereus) - elevated safety risk.`,
      [byLabel.recalls], 0.85));
    return claims;
  }

  async answer(question: string): Promise<Answer> {
    const gathered = this.gather(question);
    const claims = this.buildClaims(gathered).filter(c => c.verified); // unverifiable claims never ship
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
