import { test } from 'node:test';
import assert from 'node:assert';
import { ProoflineAgent } from '../src/agent/loop.js';
import { MockProvider } from '../src/agent/providers.js';
import { classify } from '../src/agent/intents.js';

const agent = new ProoflineAgent(undefined as any, new MockProvider(), undefined as any);

test('classify routes question shapes', () => {
  assert.equal(classify('any recalls on our suppliers?'), 'recalls');
  assert.equal(classify('what is the cheapest price per unit?'), 'pricing');
  assert.equal(classify('should we switch suppliers?'), 'supplier-decision');
});
test('supplier decision: all claims verified, evidence-backed', async () => {
  const a = await agent.answer('Should Meridian Roast switch its oat-milk supplier?');
  assert.ok(a.claims.length >= 4);
  assert.ok(a.claims.every(c => c.verified && c.evidence.length > 0));
});
test('recall question surfaces the Class II event', async () => {
  const a = await agent.answer('Any recalls or safety issues with our oat milk suppliers?');
  assert.ok(a.claims.some(c => /Class II/.test(c.text)));
});
