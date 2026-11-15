#!/usr/bin/env python3
"""Stage 58 package/content regression QA against the Stage 57 release archive."""
from pathlib import Path
import hashlib, json, subprocess, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/mnt/data/IELTS_Boost_Stage57_Final_Release_final-sss_GITHUB_READY.zip')
checks=[]
def check(name, fn):
    try:
        detail=fn(); checks.append({'name':name,'status':'PASS','detail':detail if isinstance(detail,str) else json.dumps(detail,ensure_ascii=False)})
    except Exception as e:
        checks.append({'name':name,'status':'FAIL','detail':str(e)})
def sha(b): return hashlib.sha256(b).hexdigest()

def baseline_check():
    if not BASE.exists(): raise AssertionError('Stage57 reference ZIP unavailable for non-destructive comparison')
    with zipfile.ZipFile(BASE) as z:
        old={n for n in z.namelist() if not n.endswith('/')}
        cur={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and '.pyc' not in p.suffixes}
        new=cur-old
        allowed_new={
          'STAGE58_ADAPTIVE_MASTER_REPORT_UZ.md','STAGE58_SOURCES_UZ.md','STAGE58_VOCABULARY_AUDIT_UZ.md',
          'assets/css/stage58.css','assets/js/stages/stage58-adaptive.js','data/stage58-vocabulary.json',
          'docs/BROWSER_RUNTIME_58_0.json','docs/RELEASE_CHECK_HARNESS_58_0.json','docs/ARCHITECTURE_CONTRACT_TESTS_58_0.json','docs/SERVICE_WORKER_SIM_58_0.json',
          'docs/BACKUP_MANAGER_TESTS_58_0.json','docs/HTTP_SMOKE_58_0.json','docs/RELEASE_CHECK_HARNESS_58_0.json',
          'docs/STATIC_QA_58_0.json','docs/STATIC_QA_57_0.json','docs/PRODUCTION_ACCEPTANCE_CHECKLIST_UZ.md',
          'tests/run_browser_acceptance_58.py','tests/run_architecture_contract_58.js','tests/run_service_worker_sim_58.js',
          'tests/run_backup_manager_tests_58.js','tests/run_http_smoke_58.py','tests/run_release_check_harness_58.js','tests/run_static_qa_58.py'
        }
        allowed_changed={
          'assets/js/core/boot.js','assets/js/core/contract.js','assets/js/core/module-registry.js',
          'assets/js/modules/advanced-studio.js','assets/js/release-check.js','index.html','manifest.webmanifest',
          'release-check.html','sw.js','README_UZ.md','QA_REPORT_UZ.md','INSTALL_FINAL_STAGE_UZ.md',
          'GITHUB_UPLOAD_GUIDE_UZ.md','FINAL_STAGE_REPOSITORY_ROOT_LAYOUT.txt','SHA256SUMS.txt','docs/PRODUCTION_ACCEPTANCE_CHECKLIST_UZ.md'
        }
        if new-allowed_new: raise AssertionError(f'unexpected new files: {sorted(new-allowed_new)}')
        changed=[]
        for name in sorted(old&cur):
            if z.read(name)!=(ROOT/name).read_bytes(): changed.append(name)
        if set(changed)-allowed_changed: raise AssertionError(f'unapproved Stage57 modifications: {sorted(set(changed)-allowed_changed)}')
        if 'standalone.html' in changed: raise AssertionError('legacy standalone fallback was modified')
        preserved=['data/app-data.json','data/vocabulary-index.json','assets/js/modules/backup-manager.js','assets/js/modules/reading.js','assets/js/modules/listening.js']
        for name in preserved:
            if name in old and z.read(name)!=(ROOT/name).read_bytes(): raise AssertionError(f'protected file changed: {name}')
        if z.read('docs/STATIC_QA_57_0.json')!=(ROOT/'docs/STATIC_QA_57_0.json').read_bytes(): raise AssertionError('historical Stage57 static QA evidence altered')
        return f'{len(changed)} allowed existing files changed; {len(new)} Stage58 files added; protected core data/legacy standalone preserved'

def content_counts():
    app=json.loads((ROOT/'data/app-data.json').read_text(encoding='utf-8'))
    expected={'days':84,'reading_questions':840,'listening_questions':420,'daily_words':672,'patterns':864,'articles':61,'skill_resource_rows':336,'listening_companions':84,'task1_datasets':84}
    core=app.get('core',{}).get('days',[])
    got={'days':len(app['plan']['days']),'core_days':len(core),
         'reading_questions':sum(len(d.get('reading',{}).get('questions',[])) for d in core),
         'listening_questions':sum(len(d.get('listening',{}).get('questions',[])) for d in core),
         'daily_words':len(app['words']),'patterns':len(app['patterns']),'articles':len(app['library']['articles'])}
    if got!={'days':84,'core_days':84,'reading_questions':840,'listening_questions':420,'daily_words':672,'patterns':864,'articles':61}: raise AssertionError(got)
    if not all({'reading','listening','writing','speaking'}<=set(d) for d in core): raise AssertionError('Not all four skills exist for every core day')
    for rel,want in [('data/stage47-skill-resources.json',336),('data/stage47-listening-companions.json',84),('data/stage47-task1-datasets.json',84)]:
        obj=json.loads((ROOT/rel).read_text(encoding='utf-8'))
        rows=obj if isinstance(obj,list) else (obj.get('items') or obj.get('days') or obj.get('resources') or [])
        if len(rows)!=want: raise AssertionError(f'{rel} has {len(rows)}, expected {want}')
    audio=sorted((ROOT/'audio').glob('listening-day-*.mp3'))
    if len(audio)!=84: raise AssertionError(f'expected 84 bundled MP3, got {len(audio)}')
    return f'84 days; 840 Reading + 420 Listening questions; all 4 skills/day; 672 daily words; 864 patterns; 61 articles; 336 skill resources; 84 audio companions; 84 MP3 files'

def vocab_check():
    d=json.loads((ROOT/'data/stage58-vocabulary.json').read_text(encoding='utf-8'))
    heads=['People','Important','Good','Develop','Increase (verb)','Government','Society','Technology','Environment','Children','Students','Improve','Effective','Necessary','Different','Work (noun)','Companies','Individual (noun)','Global','Modern','Many','Help (verb)','Provide','Believe','Create','Education','Health','Family','Teachers','Adults','Social','Public (adjective)','Local','Time','Life','Experience (noun)','Skills','Information','Community','Economic','Personal','National','Significant','Possible','Available','Common','Successful','General','Popular','More (comparative)']
    items=d.get('items',[])
    if d.get('schemaVersion')!=2 or d.get('count')!=50 or len(items)!=50: raise AssertionError('schema/count mismatch')
    if [x['headword'] for x in items]!=heads: raise AssertionError('headword list/order does not match 50 source concepts')
    if [x['id'] for x in items]!=list(range(1,51)): raise AssertionError('IDs are not continuous 1..50')
    for x in items:
        if len(x.get('choices',[]))!=3 or x.get('best') not in x['choices'] or len(x.get('alternatives',[]))<2: raise AssertionError(f"bad choices/alternatives: {x.get('headword')}")
        if not all(x.get(k) for k in ['prompt','explanation','uzbek_hint']): raise AssertionError(f"missing learning fields: {x.get('headword')}")
    return '50/50 source headwords, continuous IDs, 3 contextual options, one keyed best answer, explanation and learner hint each'

def integration_check():
    html=(ROOT/'index.html').read_text(encoding='utf-8'); boot=(ROOT/'assets/js/core/boot.js').read_text(encoding='utf-8')
    sw=(ROOT/'sw.js').read_text(encoding='utf-8'); rel=(ROOT/'assets/js/release-check.js').read_text(encoding='utf-8')
    con=(ROOT/'assets/js/core/contract.js').read_text(encoding='utf-8'); manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
    for token in ['stage58.css','stage58-adaptive.js','Stage 58','stage58-adaptive']:
        if token not in html+boot: raise AssertionError(f'missing integration marker {token}')
    for p in ['assets/css/stage58.css','assets/js/stages/stage58-adaptive.js','data/stage58-vocabulary.json']:
        if p not in sw: raise AssertionError(f'SW precache missing {p}')
    if '58.0.0-adaptive-release' not in con or 'Stage 58 contract' not in rel: raise AssertionError('release identifiers incomplete')
    if manifest.get('id')!='./' or manifest.get('scope')!='./' or manifest.get('start_url')!='./': raise AssertionError('manifest project-relative scope changed')
    return 'main app boot, lazy module, Stage58 stylesheet/data, release-check and PWA relative scope connected'

def syntax_check():
    files=['assets/js/stages/stage58-adaptive.js','assets/js/core/boot.js','assets/js/core/contract.js','assets/js/core/module-registry.js','assets/js/modules/advanced-studio.js','assets/js/release-check.js','tests/run_browser_acceptance_58.py']
    for p in files:
        if p.endswith('.py'):
            subprocess.run([sys.executable,'-m','py_compile',str(ROOT/p)],check=True,capture_output=True,text=True)
        else: subprocess.run(['node','--check',str(ROOT/p)],check=True,capture_output=True,text=True)
    return f'{len(files)} JS/Python syntax checks passed'

check('non-destructive-diff-vs-stage57',baseline_check)
check('preserved-curriculum-and-content-volume',content_counts)
check('pdf-derived-vocabulary-50-integrity',vocab_check)
check('main-app-pwa-and-release-integration',integration_check)
check('javascript-and-python-syntax',syntax_check)
passed=sum(x['status']=='PASS' for x in checks); out={'release':'58.0.0-adaptive-release','suite':'Static QA and Stage57 diff-protection','passed':passed,'failed':len(checks)-passed,'total':len(checks),'checks':checks,'note':'Baseline archive comparison verifies protected legacy content; local files and JSON manifests are checked without changing Stage57 historical evidence.'}
(ROOT/'docs/STATIC_QA_58_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2));sys.exit(1 if passed!=len(checks) else 0)
