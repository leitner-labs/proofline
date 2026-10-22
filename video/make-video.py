"""Assemble proofline-demo.mp4 from scene PNGs + narration WAVs (ffmpeg, local)."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
def dur(p):
    return float(subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration',
        '-of','csv=p=0',p],capture_output=True,text=True).stdout.strip())
scenes = json.load(open(os.path.join(HERE,'narration.json'))).keys()
segs = []
for name in scenes:
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
