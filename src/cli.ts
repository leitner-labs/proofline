import { ProoflineAgent } from './agent/loop.js';
import { MockProvider, NightshiftProvider } from './agent/providers.js';

const provider = process.env.NIGHTSHIFT_URL ? new NightshiftProvider() : new MockProvider();
const agent = new ProoflineAgent(undefined as any, provider, undefined as any);
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const q = args[0] ?? 'Should Meridian Roast switch its oat-milk supplier, and to whom, and why?';
const explain = process.argv.includes('--explain');

const ans = await agent.answer(q);
console.log(`\nQUESTION: ${ans.question}\n`);
for (const c of ans.claims) {
  console.log(`• ${c.text}  [confidence ${c.confidence}, verified: ${c.verified}]`);
  if (explain) for (const e of c.evidence) {
    console.log(`    ↳ ${e.source} | rows: ${e.rowIds.slice(0, 4).join(',')}${e.rowIds.length > 4 ? '…' : ''} | lineage ${e.lineageId} | ${e.retrievedAt}`);
    console.log(`      query: ${e.query.slice(0, 110)}`);
  }
}
console.log(`\n(${ans.claims.length} claims, all backed by ${ans.claims.flatMap(c => c.evidence).length} evidence refs)`);
