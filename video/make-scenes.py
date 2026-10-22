"""Render Proofline demo-video scenes (HTML -> 1280x720 PNG via headless Chrome).
Input: video/answer.json (baked by bake-answer.ts from a REAL agent run)."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ans = json.load(open(os.path.join(HERE, 'answer.json')))

def refword(n): return f"{n} evidence ref" + ("" if n == 1 else "s")

claims_html = ''
for c in ans['claims'][:5]:
    claims_html += (f'<div class="claim"><p>{c["text"]}</p>'
        f'<div class="meta"><span class="badge ok">verified</span>'
        f'<span class="conf">confidence {c["confidence"]}</span>'
        f'<span class="conf">{refword(len(c["evidence"]))}</span></div></div>')

c = ans['claims'][1]
ev_html = ''
for e in c['evidence']:
    rows = ', '.join(map(str, e['rowIds'][:6]))
    ev_html += (f'<div class="ev"><b>{e["source"]}</b> · rows {rows} · lineage {e["lineageId"]}<br>'
        f'<span class="ts">{e["retrievedAt"]}</span><code>{e["query"][:160]}</code></div>')
evidence_scene = (f'<div class="claim"><p>{c["text"]}</p>'
    f'<div class="meta"><span class="badge ok">verified</span>'
    f'<span class="conf">confidence {c["confidence"]}</span></div>{ev_html}</div>')

mem = [x for x in ans['claims'] if 'From memory' in x['text']]
mem_text = mem[0]['text'] if mem else ''

CSS = '''
* { box-sizing:border-box; }
body { margin:0; width:1280px; height:720px; font:15px/1.55 -apple-system,"Segoe UI",Roboto,sans-serif; background:#0b0f14; color:#e8eef4; display:flex; flex-direction:column; justify-content:center; padding:56px 72px; }
.kicker { color:#3fb950; text-transform:uppercase; letter-spacing:.14em; font-size:14px; margin-bottom:16px; }
h1 { font-size:52px; letter-spacing:-.03em; margin:0 0 16px; }
.dot { color:#3fb950; }
.sub { color:#8fa3b3; font-size:20px; margin:0; }
.claim { background:#131a22; border:1px solid #22303d; border-radius:12px; padding:14px 18px; margin-bottom:10px; }
.claim p { margin:0 0 8px; font-size:15.5px; }
.meta { display:flex; gap:8px; }
.badge { font-size:12px; padding:2px 9px; border-radius:999px; border:1px solid #3fb950; color:#3fb950; }
.conf { font-size:12px; color:#8fa3b3; }
.ev { margin:10px 0 0; padding:10px 12px; border-left:2px solid #22303d; font-size:13px; color:#8fa3b3; }
.ev code { color:#e8eef4; font-size:11.5px; display:block; margin-top:3px; white-space:pre-wrap; }
pre { background:#131a22; border:1px solid #22303d; border-radius:12px; padding:16px 20px; font-size:15px; color:#8fa3b3; }
.q { font-size:24px; color:#e8eef4; background:#131a22; border:1px solid #22303d; border-radius:12px; padding:16px 20px; margin-top:24px; }
ul { font-size:20px; line-height:1.75; }
b { color:#58a6ff; }
'''
def page(kicker, body):
    return ('<!doctype html><html><head><meta charset="utf-8"><style>' + CSS +
            '</style></head><body><div class="kicker">' + kicker + '</div>' + body + '</body></html>')

ledger_pre = ('data/hmem/ledger.jsonl\n{"memoryId":"mem-1","action":"create","actor":"proofline-agent",\n'
              ' "newState":{"content":"Q: Should Meridian Roast switch...","type":"episode"}}\n'
              '— Meterless H-MEM trust ledger: every write, audited.')
pages = {
 '1-hook': page('Proofline · Track 02', '<h1>"Switch suppliers."<span class="dot"> — says who?</span></h1><p class="sub">Agents answer confidently and cite vaguely. Proofline answers only what it can prove.</p><div class="q">Should Meridian Roast switch its oat-milk supplier, and to whom, and why?</div>'),
 '2-answer': page('The answer · every claim verified', claims_html),
 '3-evidence': page('Click any claim · audit the trail', evidence_scene),
 '4-memory': page('It remembers - and the memory is audited', '<div class="claim"><p>' + mem_text + '</p></div><pre>' + ledger_pre + '</pre>'),
 '5-arch': page('Under the hood', '<pre>question → decompose → federated queries (lineage-stamped)\n        → extract claims → VERIFY (evidence or drop)\n        → compose → remember (H-MEM episode + trust ledger)</pre><ul><li><b>Unverifiable claims never ship</b></li><li>SQLite + CSV + web, queried in place</li></ul>'),
 '6-sponsors': page('Built on the stack', '<ul><li><b>Meterless H-MEM</b> — memory + provenance + trust ledger (conformance 13/13)</li><li><b>NVIDIA Nemotron</b> — composition + judging models</li><li><b>Zetaris pattern</b> — query-in-place federation, lineage per query</li></ul>'),
 '7-close': page('Proofline', '<h1>An agent that can explain why<span class="dot">.</span></h1><p class="sub">github.com/leitner-labs/proofline · Leitner Labs · Open Agent Hackathon 2026</p>'),
}
outdir = os.path.join(HERE, 'scenes')
os.makedirs(outdir, exist_ok=True)
for name, html in pages.items():
    p = os.path.join(outdir, name + '.html')
    open(p, 'w').write(html)
    subprocess.run(['google-chrome', '--headless', '--disable-gpu', '--no-sandbox',
                    '--window-size=1280,720', '--screenshot=' + p.replace('.html', '.png'),
                    'file://' + p], capture_output=True)
print('rendered', len(pages), 'scenes')
