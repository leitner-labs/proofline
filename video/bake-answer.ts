import { ProoflineAgent } from '../src/agent/loop.js';
import { MockProvider } from '../src/agent/providers.js';
import fs from 'node:fs';
const agent = new ProoflineAgent(undefined as any, new MockProvider(), undefined as any);
const a = await agent.answer('Should Meridian Roast switch its oat-milk supplier, and to whom, and why?');
fs.writeFileSync(new URL('./answer.json', import.meta.url), JSON.stringify(a, null, 2));
console.log('claims:', a.claims.length, 'evidence:', a.claims.flatMap(c => c.evidence).length);
