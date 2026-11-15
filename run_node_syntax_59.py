#!/usr/bin/env python3
"""Node syntax sweep for the Stage 59 release package."""
from pathlib import Path
import subprocess, json, sys
ROOT=Path(__file__).resolve().parents[1]
files=sorted((ROOT/'assets/js').rglob('*.js'))
results=[]
for f in files:
    p=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    results.append({'file':str(f.relative_to(ROOT)),'pass':p.returncode==0,'stderr':p.stderr.strip()[:1000]})
passed=sum(x['pass'] for x in results)
out={'release':'59.0.0-precision-scoring','passed':passed,'failed':len(results)-passed,'total':len(results),'results':results,'method':'node --check for every JavaScript file under assets/js'}
(ROOT/'docs/NODE_SYNTAX_59_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:out[k] for k in ['release','passed','failed','total']},indent=2))
sys.exit(1 if passed!=len(results) else 0)
