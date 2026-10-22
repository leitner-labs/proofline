"""Generate narration WAVs with Piper TTS (local, offline). Model in video/voices/ (gitignored)."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(HERE, 'narration.json')))
model = os.path.join(HERE, 'voices', 'en_US-lessac-medium.onnx')
outdir = os.path.join(HERE, 'narration')
os.makedirs(outdir, exist_ok=True)
for name, text in script.items():
    out = os.path.join(outdir, name + '.wav')
    p = subprocess.run(['piper', '--model', model, '--output-file', out,
                        '--length-scale', '1.05', '--sentence-silence', '0.25'],
                       input=text, capture_output=True, text=True)
    if p.returncode: raise SystemExit(p.stderr)
    print(name, '->', out)
