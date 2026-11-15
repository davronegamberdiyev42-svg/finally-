#!/usr/bin/env python3
"""Static Stage 60 release QA against the exact Stage 59 ZIP baseline."""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
BASELINE=Path('/mnt/data/IELTS_Boost_Stage59_baseline')
checks=[]
def rec(name,ok,detail=''):checks.append({'id':name,'pass':bool(ok),'detail':str(detail)[:700]})
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
required=['index.html','manifest.webmanifest','sw.js','release-check.html','assets/css/stage60-listening.css','assets/js/stages/stage60-listening-hub.js','assets/js/modules/advanced-studio.js','assets/js/stages/stage58-adaptive.js','assets/js/stages/stage59-scoring-engine.js','docs/STAGE60_MASTER_REPORT_UZ.md','docs/STAGE60_SOURCES_UZ.md','docs/STAGE60_QA_REPORT_UZ.md','docs/STAGE60_RESOURCE_HUB_GUIDE_UZ.md','docs/BROWSER_RUNTIME_60_0.json','docs/SERVICE_WORKER_SIM_60_0.json','assets/js/release-check.js','tests/run_stage60_listening_engine.js','tests/run_browser_acceptance_60.py','tests/run_architecture_contract_60.js']
missing=[x for x in required if not (ROOT/x).is_file()]
rec('release-files-present',not missing,missing or f'{len(required)} release files exist')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
paths=re.findall(r"['\"]\./([^'\"]+)['\"]",sw.split('];',1)[0])
missing_shell=[x for x in paths if not (ROOT/x).exists()]
rec('service-worker-shell-paths-exist',not missing_shell,missing_shell or f'{len(paths)} shell paths resolved')
html=(ROOT/'index.html').read_text(encoding='utf-8');manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
rec('entrypoint-stage60-css','stage60-listening.css' in html and 'Stage 60' in html and 'boot.js' in html,'Stage 60 CSS and module boot linked')
rec('no-stale-stage59-entry-labels','Stage 59' not in html and '59.0' not in html,'Boot status/footer identify current Stage 60 release')
rec('manifest-stage60-identity','Stage 60' in manifest.get('name','') or 'Listening' in manifest.get('name',''),manifest.get('name'))
rec('cache-release-version-coherent','ielts-boost-finally-60-shell-v1' in sw and '60.0.0-real-listening' in sw,'Stage 60 cache namespace and release version present')
soup=BeautifulSoup(html,'html.parser');refs=[]
for tag,attr in [('script','src'),('link','href'),('img','src')]:
 for el in soup.find_all(tag):
  val=el.get(attr,'').strip()
  if not val or val.startswith(('http:','https:','data:','#','//')):continue
  if val.startswith('./'):val=val[2:]
  refs.append(val)
missing_refs=[r for r in refs if not (ROOT/r).is_file()]
rec('entrypoint-local-assets-resolve',not missing_refs,missing_refs or f'{len(refs)} local assets resolve')
allowed_runtime={'index.html','manifest.webmanifest','sw.js','release-check.html','assets/js/core/boot.js','assets/js/core/contract.js','assets/js/core/module-registry.js','assets/js/modules/advanced-studio.js','assets/js/release-check.js'}
allowed_add={'assets/css/stage60-listening.css','assets/js/stages/stage60-listening-hub.js'}
allowed_docs={'README_UZ.md','STAGE58_ADAPTIVE_MASTER_REPORT_UZ.md','QA_REPORT_UZ.md','INSTALL_FINAL_STAGE_UZ.md','GITHUB_UPLOAD_GUIDE_UZ.md','SHA256SUMS.txt','FINAL_STAGE_REPOSITORY_ROOT_LAYOUT.txt'}
missing_base=[];changed=[]
if BASELINE.exists():
 for bf in BASELINE.rglob('*'):
  if not bf.is_file():continue
  rel=bf.relative_to(BASELINE).as_posix();cur=ROOT/rel
  if not cur.exists():missing_base.append(rel);continue
  if sha(bf)!=sha(cur) and rel not in allowed_runtime and not rel.startswith(('docs/','tests/')) and rel not in allowed_docs:
   changed.append(rel)
 rec('stage59-all-files-retained',not missing_base,missing_base[:25] or 'Every Stage59 baseline file retained')
 rec('only-approved-runtime-files-modified',not changed,changed[:25] or sorted(allowed_runtime))
 rec('stage60-additions-bounded',all((ROOT/x).is_file() for x in allowed_add),sorted(allowed_add))
 unchanged=['data/app-data.json','data/vocabulary-index.json','data/stage58-vocabulary.json','assets/css/stage58.css','assets/js/stage40-50.js','assets/js/compat/legacy-core.js','assets/js/modules/backup-manager.js','assets/js/stages/stage58-adaptive.js','assets/js/stages/stage59-scoring-engine.js','assets/css/stage59-scoring.css','standalone.html']
 failures=[x for x in unchanged if not (ROOT/x).is_file() or not (BASELINE/x).is_file() or sha(ROOT/x)!=sha(BASELINE/x)]
 rec('curriculum-and-prior-stages-byte-identical',not failures,failures or unchanged)
 audio_diff=[]
 for i in range(1,85):
  x=f'audio/listening-day-{i:02d}.mp3'
  if not (ROOT/x).exists() or not (BASELINE/x).exists() or sha(ROOT/x)!=sha(BASELINE/x):audio_diff.append(x)
 rec('all-84-mp3-assets-unchanged',not audio_diff,audio_diff or 'All original Stage57/59 files preserved exactly')
 old_report='docs/BROWSER_RUNTIME_59_0.json'
 rec('stage59-historical-browser-report-preserved',(ROOT/old_report).exists() and sha(ROOT/old_report)==sha(BASELINE/old_report),old_report)
 old_sw='docs/SERVICE_WORKER_SIM_59_0.json'
 rec('stage59-historical-service-worker-report-preserved',(ROOT/old_sw).exists() and sha(ROOT/old_sw)==sha(BASELINE/old_sw),old_sw)
 rec('stage60-browser-and-worker-reports-distinct',(ROOT/'docs/BROWSER_RUNTIME_60_0.json').exists() and (ROOT/'docs/SERVICE_WORKER_SIM_60_0.json').exists(),'Current release uses separate Stage 60 report filenames')
else:rec('stage59-baseline-available',False,str(BASELINE))
contract=(ROOT/'assets/js/core/contract.js').read_text(encoding='utf-8')
engine=(ROOT/'assets/js/stages/stage60-listening-hub.js').read_text(encoding='utf-8')
app_data=json.loads((ROOT/'data/app-data.json').read_text(encoding='utf-8'))
days=app_data.get('core',{}).get('days',[])
q_count=sum(len(d.get('listening',{}).get('questions',[])) for d in days)
audio_assets=sum(bool(d.get('listening',{}).get('audio_asset')) for d in days)
rec('84-track-420-question-bank',len(days)==84 and q_count==420 and audio_assets==84, f'{len(days)} daily packs / {audio_assets} audio paths / {q_count} questions')
rec('strict-mode-transcript-hidden','examState.locked' in engine and 'transcriptHidden=true' in engine,'Strict one-play playback prevents premature transcript reveal')
rec('private-local-storage-and-shared-backup','IELTSBoostPlanA_Audio_v1' in engine and "const EXTENSION = 'stage60'" in engine,'Stage60 metadata extension + Stage55 binary store')
rec('natural-audio-links-not-bundled','learnenglish.britishcouncil.org' in engine and 'commonvoice.mozilla.org' in engine and 'Audio stays on the provider' in engine,'Natural source links open externally; no provider audio copied')
rec('no-wer-as-ielts-pronunciation-score','not IELTS scoring' in engine and 'does not assess pronunciation or meaning' in engine,'WER is accurately described as text-level comparison only')
passed=sum(x['pass'] for x in checks)
out={'release':'60.0.0-real-listening','passed':passed,'failed':len(checks)-passed,'total':len(checks),'checks':checks,'method':'Static inspection and SHA-256 comparison against exact Stage 59 release ZIP. Public deployment and physical-device acceptance are not implied.'}
(ROOT/'docs/STATIC_QA_60_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2));sys.exit(1 if passed!=len(checks) else 0)
