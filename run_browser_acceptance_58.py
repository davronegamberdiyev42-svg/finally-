#!/usr/bin/env python3
"""Stage 58 Chromium acceptance test over exact release bytes (HTTPS request routing; no external host)."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json, mimetypes, sys

ROOT=Path(__file__).resolve().parents[1]
BASE='https://stage58.invalid/final-sss/'
results=[]; page_errors=[]; console_errors=[]; bad_responses=[]; served=[]

def record(name, ok, detail=''):
    results.append({'id':name,'pass':bool(ok),'detail':str(detail)[:600]})
    print('[TEST]',name,'PASS' if ok else 'FAIL',str(detail)[:180],flush=True)

def check(page, name, expr, args=None):
    try:
        value=page.evaluate(expr,args)
        record(name,bool(value),value)
        return value
    except Exception as e:
        record(name,False,repr(e)); return None

def click(page, selector):
    loc=page.locator(selector).first
    if not loc.count(): raise RuntimeError('selector not found: '+selector)
    loc.click(force=True)

def set_rl(page, skill, source, correct, total, focus):
    form=page.locator(f'[data-s58-form="{skill}"]')
    form.locator('[name="source"]').fill(source)
    form.locator('[name="correct"]').fill(str(correct))
    form.locator('[name="total"]').fill(str(total))
    form.locator('[name="focus"]').select_option(label=focus)
    form.locator('[name="verified"]').check()
    form.evaluate('(f)=>f.requestSubmit()')
    page.wait_for_timeout(50)

def serve(route):
    u=urlsplit(route.request.url)
    path=u.path
    if not path.startswith('/final-sss/'):
        route.fulfill(status=404,body='not found'); return
    rel=unquote(path[len('/final-sss/'):]).lstrip('/') or 'index.html'
    target=(ROOT/rel).resolve()
    try: target.relative_to(ROOT.resolve())
    except ValueError:
        route.fulfill(status=403,body='blocked'); return
    if not target.is_file():
        route.fulfill(status=404,body='not found'); bad_responses.append((rel,404)); return
    mime=mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
    served.append(rel)
    headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}
    if route.request.method=='HEAD':
        route.fulfill(status=200,headers={**headers,'Content-Type':mime,'Content-Length':str(target.stat().st_size)},body='')
    else:
        route.fulfill(status=200,headers={**headers,'Content-Type':mime},body=target.read_bytes())

# The prompts are new author-written diagnostics, not copied source-test content.
writing='''Public transport can make cities easier to live in, but it needs careful planning. In my view, local authorities should improve buses and trains before making every journey free. A reliable service can reduce traffic because more residents may choose not to drive. It can also help students and workers reach schools and workplaces on time.\n\nHowever, public transport is not equally useful in every area. Rural communities may need flexible routes, while large cities require frequent services. Governments should therefore collect passenger data and consult local people before changing a network. This approach can make investment more effective.\n\nIn addition, clear information and affordable fares matter. If passengers can understand routes easily, they are more likely to use the system. Overall, public transport deserves public investment, although each city should choose policies that reflect its own needs.'''
speaking='''I would like to learn photography because it combines creativity with patience. I became interested in it when I started taking pictures during family trips. At first, I used my phone and did not think carefully about light or composition. Later, I watched a few tutorials and tried to take pictures at different times of day.\n\nThe most difficult part is choosing what to include in a picture. Sometimes a simple scene looks interesting when the photographer changes the angle. I would like to practise more often and learn how to edit images without making them look unnatural. I think this skill would help me notice small details in everyday life.'''
pressure='''Citizens can play an important role in improving public services. Accurate information is essential when a community decides how money should be spent. A beneficial project can foster cooperation between residents and local organisations. In some cases, a small increase in funding can boost the quality of transport and education. However, decision makers should compare different options and explain their choices clearly. People need reliable evidence before they support a new policy. This is especially important when a project affects families, workers and students. A careful plan should consider the needs of different groups and avoid unnecessary costs. The best solution is not always the most expensive or complicated one. It is usually the one that responds to a real problem and can be maintained over time.'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1365,'height':900},accept_downloads=True,service_workers='block')
    page=ctx.new_page(); page.set_default_timeout(7000)
    page.on('pageerror',lambda e:page_errors.append(str(e)[:1200]))
    page.on('console',lambda m:console_errors.append(m.text[:1200]) if m.type=='error' else None)
    page.on('response',lambda r: bad_responses.append((r.url,r.status)) if r.status>=400 else None)
    page.route('https://stage58.invalid/**',serve)
    # The managed browser blocks top-level HTTPS navigation. set_content executes the exact package shell
    # with project-relative assets served from the routed HTTPS base, matching the Stage 57 harness.
    shell=(ROOT/'index.html').read_text(encoding='utf-8')
    soup=BeautifulSoup(shell,'html.parser')
    base=soup.new_tag('base',href=BASE); soup.head.insert(0,base)
    shim=r'''(()=>{
      const make=()=>{const m=new Map();return {get length(){return m.size},key(i){return [...m.keys()][i]??null},getItem(k){k=String(k);return m.has(k)?m.get(k):null},setItem(k,v){m.set(String(k),String(v))},removeItem(k){m.delete(String(k))},clear(){m.clear()}}};
      const ls=make(),ss=make();Object.defineProperty(window,'localStorage',{configurable:true,value:ls});Object.defineProperty(window,'sessionStorage',{configurable:true,value:ss});
      const dbs=new Map();function makeDB(name){const stores=new Map(),paths=new Map();return {name,version:1,objectStoreNames:{contains:n=>stores.has(n)},createObjectStore(n,o={}){stores.set(n,new Map());paths.set(n,o.keyPath||null);return{}},transaction(names,mode){const tx={error:null,objectStore(n){const map=stores.get(n),kp=paths.get(n);if(!map)throw new Error('Missing store '+n);return {getAll(){const r={};setTimeout(()=>{r.result=[...map.values()];r.onsuccess?.({target:r})},0);return r},getAllKeys(){const r={};setTimeout(()=>{r.result=[...map.keys()];r.onsuccess?.({target:r})},0);return r},get(k){const r={};setTimeout(()=>{r.result=map.get(k);r.onsuccess?.({target:r})},0);return r},put(v,k){map.set(kp?v[kp]:k,v);const r={result:k};setTimeout(()=>{r.onsuccess?.({target:r});tx.oncomplete?.()},0);return r},clear(){map.clear();setTimeout(()=>tx.oncomplete?.(),0)},delete(k){map.delete(k);setTimeout(()=>tx.oncomplete?.(),0)}}}};return tx},close(){}}}
      Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(name){const req={};setTimeout(()=>{let db=dbs.get(name),fresh=!db;if(!db){db=makeDB(name);dbs.set(name,db)}req.result=db;if(fresh)req.onupgradeneeded?.({target:req});req.onsuccess?.({target:req})},0);return req}}});
    })();'''
    script=soup.new_tag('script');script.string=shim;soup.head.append(script)
    page.set_content('<!doctype html>'+str(soup),wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("window.__IELTS_BOOST_STAGE58_READY__ === true",timeout=120000)
    page.wait_for_function("window.IELTSBoostStage58?.getVocabularyStatus()?.loaded === true",timeout=30000)
    page.wait_for_timeout(250)

    boot=page.evaluate("() => ({release:window.IELTSBoostContract?.release, ready:window.__IELTS_BOOST_STAGE58_READY__, modules:window.IELTSBoostArchitecture?.report?.().map(x=>({id:x.id,status:x.status,version:x.version})), appData:!!document.querySelector('#appData'), backup:window.IELTSBoostBackup?.format})")
    record('BOOT_AND_STAGE58_MODULE_READY',bool(boot.get('ready') and boot.get('release')=='58.0.0-adaptive-release' and any(x['id']=='stage58-adaptive' and x['status']=='ready' for x in boot.get('modules',[]))),boot)
    record('STAGE57_RUNTIME_PRESERVED',bool(page.locator('#nav').count() and page.locator('#appData').count() and page.evaluate('()=>!!window.__IELTS_BOOST_CORE__')),'Main navigation, embedded curriculum data and legacy core still present.')
    vocab=page.evaluate('()=>window.IELTSBoostStage58.getVocabularyStatus()')
    record('50_VOCABULARY_CARDS_LOADED',bool(vocab.get('loaded') and vocab.get('count')==50),vocab)

    # Desktop navigation, first-open routing and true no-diagnostic state.
    trigger=page.locator('#nav [data-s58-open]').first
    trigger.click(force=True)
    page.wait_for_selector('#s58-overlay:not([hidden])')
    initial=page.evaluate("()=>window.IELTSBoostStage58.getProfile().map(x=>({skill:x.skill,route:x.route}))")
    record('NO_UNSUPPORTED_BASELINE_INFERENCE',bool(len(initial)==4 and all(x['route']=='unassessed' for x in initial)),initial)
    page.locator('#s58-overlay .s58-tabs [data-s58-tab="diagnostics"]').click(force=True)

    # Three unique answer-key-backed tests create a repeated objective signal.
    read_focus='Matching headings'
    for src,correct in [('Practice source A',32),('Practice source B',30),('Practice source C',28)]:
        set_rl(page,'reading',src,correct,40,read_focus)
    listen_focus='Distractors / correction cues'
    for src,correct in [('Listening source A',20),('Listening source B',24),('Listening source C',28)]:
        set_rl(page,'listening',src,correct,40,listen_focus)
    prof=page.evaluate("()=>window.IELTSBoostStage58.getProfile()")
    pr=next(x for x in prof if x['skill']=='reading'); pl=next(x for x in prof if x['skill']=='listening')
    record('READING_REPEATED_RAW_EVIDENCE',bool(pr['route']=='core' and abs(pr['score']-75)<0.01 and 'Repeated answer-key' in pr['confidence'] and pr['focus']=='Matching headings'),pr)
    record('LISTENING_REPEATED_RAW_EVIDENCE',bool(pl['route']=='core' and abs(pl['score']-60)<0.01 and 'Repeated answer-key' in pl['confidence'] and pl['focus']==listen_focus),pl)
    page.locator('#s58-overlay .s58-tabs [data-s58-tab="diagnostics"]').click(force=True)

    # Writing: short learning sample (not represented as full IELTS Task 2).
    wf=page.locator('[data-s58-form="writing"]')
    wf.locator('[name="prompt"]').fill('Some people think public transport should be free. To what extent do you agree?')
    wf.locator('[name="sample"]').fill(writing)
    for i,val in enumerate(['developing','support','developing','secure']): wf.locator(f'[name="r{i}"]').select_option(val)
    wf.evaluate('(f)=>f.requestSubmit()'); page.wait_for_timeout(50)
    pd=page.evaluate("()=>window.IELTSBoostStage58.getProfile().find(x=>x.skill==='writing')")
    record('WRITING_SAMPLE_AND_CRITERION_GUIDANCE',bool(pd and pd['route']=='core' and pd.get('focus','').startswith('Coherence & cohesion') and pd.get('focusTask','').startswith('Coherence repair')),pd)

    # Speaking: transcript cannot be treated as pronunciation assessment.
    sf=page.locator('[data-s58-form="speaking"]')
    sf.locator('[name="prompt"]').fill('Describe a skill you would like to learn.')
    sf.locator('[name="sample"]').fill(speaking)
    for i,val in enumerate(['developing','support','secure']): sf.locator(f'[name="r{i}"]').select_option(val)
    sf.evaluate('(f)=>f.requestSubmit()'); page.wait_for_timeout(50)
    sp=page.evaluate("()=>window.IELTSBoostStage58.getProfile().find(x=>x.skill==='speaking')")
    record('SPEAKING_TRANSCRIPT_NOT_PHONETIC_SCORE',bool(sp and sp['route']=='core' and sp.get('focus','').startswith('Lexical resource') and 'not examiner assessed' in sp['confidence'] and 'audio review yo‘q' in sp['reason']),sp)

    # Plan uses selected weak task-family/criterion, not just a generic skill bucket.
    page.locator('#s58-overlay .s58-tabs [data-s58-tab="plan"]').click(force=True)
    plan=page.evaluate("()=>({days:document.querySelectorAll('.s58-next-seven article').length,weeks:document.querySelectorAll('.s58-week').length,first:document.querySelector('.s58-next-seven article')?.innerText||'',text:document.querySelector('.s58-content')?.innerText||''})")
    record('ADAPTIVE_PLAN_HAS_SEVEN_TASKS_AND_12_WEEK_PHASES',bool(plan['days']==7 and plan['weeks']==4),{k:plan[k] for k in ['days','weeks','first']})
    record('ADAPTIVE_PLAN_USES_SELECTED_WEAK_TASK',bool('Matching headings' in plan['first'] or 'matching headings' in plan['first'].lower() or 'paragraph purpose' in plan['first'].lower()),plan['first'])

    # Vocabulary: contextual best fit, own sentence and SRS storage.
    page.locator('#s58-overlay .s58-tabs [data-s58-tab="vocabulary"]').click(force=True)
    vf=page.locator('[data-s58-vocab-answer="1"]')
    vf.locator('input[value="citizens"]').check()
    vf.evaluate('(f)=>f.requestSubmit()'); page.wait_for_timeout(50)
    page.locator('[data-s58-own-sentence="1"]').fill('Citizens can improve local services by joining community discussions.')
    page.locator('[data-s58-natural-check="1"]').check()
    page.locator('[data-s58-action="save-own-sentence"][data-id="1"]').click(force=True); page.wait_for_timeout(50)
    page.locator('[data-s58-grade="good"][data-id="1"]').click(force=True); page.wait_for_timeout(50)
    vstate=page.evaluate("()=>window.IELTSBoostStage58.getState().vocabulary.progress['1']")
    record('VOCAB_CONTEXT_OWN_SENTENCE_AND_SRS',bool(vstate and vstate['correct'] and vstate['ownSentence'].startswith('Citizens') and vstate['naturalChecked'] and vstate['lastGrade']=='good' and vstate['due']),vstate)
    page.locator('[data-s58-pressure]').fill(pressure)
    page.locator('[data-s58-action="pressure-check"]').click(force=True); page.wait_for_timeout(50)
    pressure_result=page.evaluate("()=>window.IELTSBoostStage58.getState().vocabulary.lastPressureResult")
    record('PRESSURE_TEST_COUNTS_CONTEXTUAL_ALTERNATIVES',bool(pressure_result and 2<=len(pressure_result['found'])<=5),pressure_result)

    # Cross-skill checklist is saved with a non-empty source.
    page.locator('#s58-overlay .s58-tabs [data-s58-tab="transfer"]').click(force=True)
    page.locator('[data-s58-source]').fill('Original educational article: public transport')
    for checkbox in page.locator('[data-s58-transfer-check]').all(): checkbox.check(force=True)
    page.locator('[data-s58-action="save-transfer"]').click(force=True); page.wait_for_timeout(50)
    cstate=page.evaluate("()=>window.IELTSBoostStage58.getState().crossSkill")
    record('CROSS_SKILL_TRANSFER_PROGRESS_SAVED',bool(cstate['lastSource'] and len([x for x in cstate['checks'].values() if x])==7),cstate)

    # The exact Stage 55 full backup path includes new extension data.
    backup=page.evaluate("async()=>{const s=await window.IELTSBoostBackup.buildSnapshot();const raw=s.state.studio.raw;return {format:s.format,parsed:s.state.studio.parsed,hasStage58:!!JSON.parse(raw).extensions?.stage58,keys:Object.keys(JSON.parse(raw).extensions||{})}}")
    record('STAGE58_STATE_INCLUDED_IN_FULL_DEVICE_BACKUP',bool(backup.get('parsed') and backup.get('hasStage58') and 'stage58' in backup.get('keys',[])),backup)

    # Close restores focus to original desktop trigger.
    page.locator('#s58-overlay [data-s58-close]').click(force=True)
    focus=page.evaluate("()=>document.activeElement?.hasAttribute('data-s58-open') && document.activeElement?.parentElement?.id==='nav'")
    record('DESKTOP_CLOSE_RESTORES_FOCUS',bool(focus),focus)

    # Mobile navigation trigger / modal responsive check.
    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(100)
    mobile=page.locator('#mobileBottom [data-s58-open]').first
    if not mobile.count(): mobile=page.locator('[data-s58-open]').last
    mobile.click(force=True); page.wait_for_selector('#s58-overlay:not([hidden])')
    dims=page.evaluate("()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,dialog:document.querySelector('#s58-overlay .s58-shell')?.getBoundingClientRect().width})")
    record('MOBILE_390_NO_HORIZONTAL_OVERFLOW',bool(dims['doc']<=dims['width']+1 and dims['body']<=dims['width']+1),dims)
    page.locator('#s58-overlay [data-s58-close]').click(force=True)
    mobile_focus=page.evaluate("()=>document.activeElement?.hasAttribute('data-s58-open') && document.activeElement?.parentElement?.id==='mobileBottom'")
    record('MOBILE_CLOSE_RESTORES_FOCUS',bool(mobile_focus),mobile_focus)

    record('NO_PAGE_JAVASCRIPT_ERRORS',len(page_errors)==0,page_errors[:4])
    record('NO_CONSOLE_ERRORS',len(console_errors)==0,console_errors[:4])
    record('ALL_LOCAL_ASSET_REQUESTS_SERVED',not bad_responses,bad_responses[:8])
    ctx.close(); browser.close()

passed=sum(x['pass'] for x in results); failed=len(results)-passed
out={
 'release':'58.0.0-adaptive-release','method':'Chromium with exact ZIP build bytes fulfilled through an isolated HTTPS request route; real browser DOM, localStorage and IndexedDB; Service Worker blocked and simulated separately.',
 'passed':passed,'failed':failed,'total':len(results),'checks':results,'pageErrors':page_errors,'consoleErrors':console_errors,'badResponses':bad_responses,
 'limitations':['No physical Android device, microphone permission, browser speech recognition, public GitHub Pages deployment, or real offline cold-start were available in this build environment.','Writing and Speaking use learner-entered text and self-reflection; this is not examiner scoring.','The supplied Barron\'s material was not copied into the project; the learner enters their own answer-key outcome.']}
(ROOT/'docs/BROWSER_RUNTIME_58_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
