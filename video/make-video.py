"""Assemble proofline-demo.mp4 from scene PNGs + narration WAVs (ffmpeg, local)."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
def dur(p):
    d = subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration',
        '-of','csv=p=0',p],capture_output=True,text=True).stdout.strip()
    if d and d != 'N/A':
        return float(d)
    # webm screencasts may lack container duration: use last video packet pts
    out = subprocess.run(['ffprobe','-v','quiet','-select_streams','v:0',
        '-show_entries','packet=pts_time','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().splitlines()
    out = [x for x in out if x and x != 'N/A']
    return float(out[-1]) + 1/30
scenes = json.load(open(os.path.join(HERE,'narration.json'))).keys()
segs = []
LIVE = os.path.join(HERE,'build','live-ui.webm')
for name in scenes:
    if name == '2-answer' and os.path.exists(LIVE):
        # live UI capture replaces static scenes 2-3, narrated by both tracks
        d = dur(os.path.join(HERE,'narration','2-answer.wav')) + 0.9 + dur(os.path.join(HERE,'narration','3-evidence.wav')) + 0.9
        src = dur(LIVE)
        seg = os.path.join(HERE,'build','2-live.mp4')
        subprocess.run(['ffmpeg','-y','-v','error','-i',LIVE,
            '-i',os.path.join(HERE,'narration','2-answer.wav'),
            '-i',os.path.join(HERE,'narration','3-evidence.wav'),
            '-filter_complex',
            f'[0:v]setpts={d/src:.4f}*PTS,fps=30,format=yuv420p,fade=t=in:st=0:d=0.4,fade=t=out:st={d-0.45:.3f}:d=0.4[v];'
            f'[1:a]apad=pad_dur=0.9[a1];[a1][2:a]concat=n=2:v=0:a=1,apad=whole_dur={d:.3f}[a]',
            '-map','[v]','-map','[a]','-t',f'{d:.3f}',
            '-c:v','libx264','-preset','medium','-crf','20','-c:a','aac','-b:a','128k',seg],check=True)
        segs.append(seg)
        continue
    if name == '3-evidence' and os.path.exists(LIVE):
        continue
    png, wav = os.path.join(HERE,'scenes',name+'.png'), os.path.join(HERE,'narration',name+'.wav')
    d = dur(wav) + 0.9
    seg = os.path.join(HERE,'build',name+'.mp4')
    subprocess.run(['ffmpeg','-y','-v','error','-loop','1','-framerate','30','-i',png,'-i',wav,
        '-t',f'{d:.3f}','-vf',f'fade=t=in:st=0:d=0.4,fade=t=out:st={d-0.45:.3f}:d=0.4,format=yuv420p',
        '-af',f'apad=whole_dur={d:.3f}','-c:v','libx264','-preset','medium','-crf','20',
        '-c:a','aac','-b:a','128k','-shortest',seg],check=True)
    segs.append(seg)
lst = os.path.join(HERE,'build','concat.txt')
open(lst,'w').write(''.join(f"file '{s}'\n" for s in segs))
out = os.path.join(HERE,'proofline-demo.mp4')
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',lst,
    '-c:v','libx264','-preset','medium','-crf','20','-c:a','aac','-b:a','128k',
    '-movflags','+faststart',out],check=True)
print(out, f'{dur(out):.1f}s')
