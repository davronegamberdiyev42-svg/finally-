#!/usr/bin/env python3
"""Static Stage 59 release QA, including byte-preservation against Stage 58 baseline."""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib, json, re, sys
ROOT=Path(__file__).resolve().parents[1]
BASELINE=Path('/mnt/data/IELTS_Boost_Stage58_build')
checks=[]
def record(name, ok, detail=''):
    checks.append({'id':name,'pass':bool(ok),'detail':str(detail)[:600]})
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

# Release essentials and file presence.
required=['index.html','manifest.webmanifest','sw.js','release-check.html','assets/css/stage59-scoring.css','assets/js/stages/stage59-scoring-engine.js','assets/js/modules/advanced-studio.js','assets/js/stages/stage58-adaptive.js','docs/STAGE59_MASTER_REPORT_UZ.md','docs/STAGE59_SOURCES_UZ.md','docs/STAGE59_QA_REPORT_UZ.md','docs/STAGE59_INSTALLATION_UZ.md','assets/js/release-check.js','tests/run_stage59_scoring_engine.js','tests/run_browser_acceptance_59.py','tests/run_release_check_harness_59.js']
missing=[x for x in required if not (ROOT/x).is_file()]
record('release-files-present',not missing,missing or f'{len(required)} required files exist')

# Every local file referenced by the PWA shell must physically exist.
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
paths=re.findall(r"['\"]\./([^'\"]+)['\"]",sw.split('];',1)[0])
missing_shell=[x for x in paths if not (ROOT/x).exists()]
record('service-worker-shell-paths-exist',not missing_shell,missing_shell or f'{len(paths)} shell paths resolved')

# Entry HTML loads the Stage 59 CSS; manifest and release identifiers align.
html=(ROOT/'index.html').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
record('entrypoint-stage59-css-and-engine-hook','stage59-scoring.css' in html and 'Stage 59' in html and 'boot.js' in html,'index links the Stage 59 stylesheet and module boot')
record('manifest-stage59-identity','Stage 59' in manifest.get('name',''),manifest.get('name'))
record('cache-release-version-coherent',"ielts-boost-final-sss-59-shell-v1" in sw and '59.0.0-precision-scoring' in sw,'Stage 59 cache namespace and release version present')

# HTML local references must resolve; ignore URL, fragment and data schemes.
soup=BeautifulSoup(html,'html.parser')
refs=[]
for tag,attr in [('script','src'),('link','href'),('img','src')]:
    for el in soup.find_all(tag):
        val=el.get(attr,'').strip()
        if not val or val.startswith(('http:','https:','data:','#','//')): continue
        if val.startswith('./'): val=val[2:]
        refs.append(val)
missing_refs=[r for r in refs if not (ROOT/r).is_file()]
record('entrypoint-local-assets-resolve',not missing_refs,missing_refs or f'{len(refs)} local script/link/image refs resolve')

# Protected Stage 58 source material must remain byte-identical except explicitly bridged files.
allowed_runtime_changes={
 'index.html','manifest.webmanifest','sw.js','release-check.html',
 'assets/js/core/boot.js','assets/js/core/contract.js','assets/js/core/module-registry.js',
 'assets/js/modules/advanced-studio.js','assets/js/stages/stage58-adaptive.js','assets/js/release-check.js'
}
allowed_runtime_additions={'assets/css/stage59-scoring.css','assets/js/stages/stage59-scoring-engine.js'}
allowed_root_docs={'README_UZ.md','QA_REPORT_UZ.md','INSTALL_FINAL_STAGE_UZ.md','GITHUB_UPLOAD_GUIDE_UZ.md'}
missing_base=[];changed_unapproved=[]
if BASELINE.exists():
    for base_file in BASELINE.rglob('*'):
        if not base_file.is_file(): continue
        rel=base_file.relative_to(BASELINE).as_posix(); cur=ROOT/rel
        if not cur.exists(): missing_base.append(rel); continue
        if sha(base_file)!=sha(cur) and rel not in allowed_runtime_changes and not rel.startswith(('docs/','tests/')) and rel not in allowed_root_docs and rel!='SHA256SUMS.txt':
            changed_unapproved.append(rel)
    record('stage58-all-files-retained',not missing_base,missing_base[:20] or 'All baseline files remain')
    record('only-approved-runtime-files-modified',not changed_unapproved,changed_unapproved[:20] or sorted(allowed_runtime_changes))
    record('stage59-runtime-only-additions-bounded',all((ROOT/x).is_file() for x in allowed_runtime_additions),sorted(allowed_runtime_additions))
    unchanged=['data/app-data.json','data/vocabulary-index.json','data/stage58-vocabulary.json','assets/css/stage58.css','assets/js/stage40-50.js','assets/js/compat/legacy-core.js','assets/js/modules/backup-manager.js','standalone.html']
    failures=[x for x in unchanged if not (ROOT/x).is_file() or not (BASELINE/x).is_file() or sha(ROOT/x)!=sha(BASELINE/x)]
    record('curriculum-and-legacy-core-byte-identical',not failures,failures or unchanged)
    old_report='docs/BROWSER_RUNTIME_58_0.json'
    old_preserved=(ROOT/old_report).exists() and sha(ROOT/old_report)==sha(BASELINE/old_report)
    record('stage58-historical-browser-report-preserved',old_preserved,old_report)
else:
    record('stage58-baseline-available',False,str(BASELINE))

# Scoring integrity guardrails are encoded in release files.
engine=(ROOT/'assets/js/stages/stage59-scoring-engine.js').read_text(encoding='utf-8')
studio=(ROOT/'assets/js/modules/advanced-studio.js').read_text(encoding='utf-8')
record('raw-score-never-generic-band-converted','no band conversion' in studio and 'accuracyPct' in engine,'raw marks and accuracy only; no fixed conversion lookup')
record('writing-task2-double-weight-formula', '(Number(task1) + 2 * Number(task2)) / 3' in engine,'Task 2 weight is twice Task 1')
record('four-criteria-evidence-per-task','criteria.length !== 4' in engine and 'evidence.length < 12' in engine,'each rubric requires four criterion observations')
record('speaking-requires-replayed-saved-audio',"if (!opts.audioId)" in engine and "audioReviewed !== true" in engine and 'getAudioClip(audioId)' in studio,'transcript alone is not pronunciation evidence')
record('self-and-external-source-caveat','independent verification absent' in engine and 'credentials are not verified' in engine,'source declarations are not authenticated')

passed=sum(x['pass'] for x in checks)
out={'release':'59.0.0-precision-scoring','passed':passed,'failed':len(checks)-passed,'total':len(checks),'checks':checks,'method':'Static inspection and SHA-256 comparison against the exact extracted Stage 58 base. No public deploy is implied.'}
(ROOT/'docs/STATIC_QA_59_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
sys.exit(1 if passed!=len(checks) else 0)
