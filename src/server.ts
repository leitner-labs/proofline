/** Proofline demo server: static UI + /api/answer?q=... */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ProoflineAgent } from './agent/loop.js';
import { MockProvider, NightshiftProvider } from './agent/providers.js';

const provider = process.env.NIGHTSHIFT_URL ? new NightshiftProvider() : new MockProvider();
const agent = new ProoflineAgent(undefined as any, provider, undefined as any);
const WEB = path.join(import.meta.dirname, '..', 'web');

createServer(async (req, res) => {
  const u = new URL(req.url ?? '/', 'http://x');
  if (u.pathname === '/api/answer') {
    try {
      const q = u.searchParams.get('q') ?? '';
      const ans = await agent.answer(q);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(ans));
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }
  const file = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
  try {
    const body = readFileSync(path.join(WEB, file));
    res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(4173, () => console.log('proofline demo on :4173, provider =', provider.name));
