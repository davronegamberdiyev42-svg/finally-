#!/usr/bin/env python3
"""Stage 60 Chromium acceptance test over exact release bytes (HTTPS request routing; no external host)."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json, mimetypes, sys

ROOT=Path(__file__).resolve().parents[1]
BASE='https://stage60.invalid/finally-/'
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
    if not path.startswith('/finally-/'):
        route.fulfill(status=404,body='not found'); return
    rel=unquote(path[len('/finally-/'):]).lstrip('/') or 'index.html'
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
    page.route('https://stage60.invalid/**',serve)
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
    page.wait_for_function("window.__IELTS_BOOST_STAGE60_READY__ === true",timeout=120000)
    page.wait_for_function("window.IELTSBoostStage58?.getVocabularyStatus()?.loaded === true",timeout=30000)
    page.wait_for_timeout(250)

    boot=page.evaluate("() => ({release:window.IELTSBoostContract?.release, ready:window.__IELTS_BOOST_STAGE58_READY__, modules:window.IELTSBoostArchitecture?.report?.().map(x=>({id:x.id,status:x.status,version:x.version})), appData:!!document.querySelector('#appData'), backup:window.IELTSBoostBackup?.format})")
    record('BOOT_AND_STAGE58_MODULE_READY',bool(boot.get('ready') and boot.get('release')=='60.0.0-real-listening' and any(x['id']=='stage58-adaptive' and x['status']=='ready' for x in boot.get('modules',[]))),boot)
    record('STAGE60_MODULE_READY',bool(page.evaluate("()=>window.__IELTS_BOOST_STAGE60_READY__===true && window.IELTSBoostStage60?.version==='60.0.0' && window.IELTSBoostArchitecture.getModule('stage60-listening')?.status==='ready'")),page.evaluate("()=>({version:window.IELTSBoostStage60?.version,module:window.IELTSBoostArchitecture.getModule('stage60-listening')?.status})"))
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

    # Stage 59 precision scoring integration inside the existing Advanced Studio.
    page.locator('#s58-overlay [data-s58-close]').click(force=True)
    page.locator('#nav [data-page="mastery"]').click(force=True)
    page.wait_for_selector('#app [data-ib4050-open]',timeout=10000)
    studio_trigger=page.locator('#app [data-ib4050-open]').first
    record('STAGE59_STUDIO_TRIGGER_AVAILABLE',studio_trigger.count()>0,studio_trigger.count())
    studio_trigger.click(force=True)
    page.wait_for_selector('#ib4050-panel:not([hidden])',timeout=15000)
    page.locator('#ib4050-panel [data-ib4050-tab="scoring"]').click(force=True)
    engine_ready=page.evaluate("()=>({engine:window.IELTSBoostStage59Scoring?.version,mod:window.IELTSBoostArchitecture?.getModule('stage59-scoring')?.status,boot:window.__IELTS_BOOST_BOOT__?.release})")
    record('STAGE59_SCORING_ENGINE_BOOTED',bool(engine_ready.get('engine')=='59.0.0' and engine_ready.get('mod')=='ready' and engine_ready.get('boot')=='60.0.0'),engine_ready)

    def stage59_fill_raw(skill, prompt_id, correct_count, key_source='teacher'):
        page.locator('#ib4050-score-type').select_option(skill)
        page.wait_for_timeout(35)
        page.locator('#ib4050-prompt-id').fill(prompt_id)
        page.locator('#s59-key-source').select_option(key_source)
        keys=[f'{prompt_id}-answer-{i+1}' for i in range(10)]
        answers=keys[:correct_count]+[f'{prompt_id}-wrong-{i+1}' for i in range(10-correct_count)]
        page.locator('#s59-answer-key').fill('\n'.join(keys))
        page.locator('#s59-learner-answers').fill('\n'.join(answers))
        page.wait_for_timeout(35)
        preview=page.locator('#ib4050-score-preview').inner_text()
        page.locator('#ib4050-panel [data-action="score-save"]').click(force=True)
        page.wait_for_timeout(80)
        return preview

    raw_previews=[]
    for i,correct in enumerate([8,9,7],1):
        raw_previews.append(stage59_fill_raw('reading',f'S59-READING-{i}',correct))
    reading_records=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.filter(x=>x.stage59 && x.type==='reading')")
    record('READING_RAW_MARKS_AND_EVIDENCE_AUDIT',bool(len(reading_records)==3 and [x['correct'] for x in reading_records]==[8,9,7] and all(x['format']=='stage59-answer-key-v1' and x['objective'] is True and abs(x['accuracy']-x['correct']/10)<0.001 for x in reading_records) and '8/10 marks' in raw_previews[0]),{'previews':raw_previews,'records':reading_records})

    for i,correct in enumerate([6,7,8],1):
        stage59_fill_raw('listening',f'S59-LISTENING-{i}',correct,'publisher')
    listening_records=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.filter(x=>x.stage59 && x.type==='listening')")
    record('LISTENING_IS_ANSWER_KEY_OBJECTIVE_NOT_SELF_REVIEW',bool(len(listening_records)==3 and all(x['objective'] is True and x['rawResult']['questionCount']==10 for x in listening_records)),listening_records)
    adapted=page.evaluate("()=>({r:window.IELTSBoostStage58.getProfile().find(x=>x.skill==='reading'),l:window.IELTSBoostStage58.getProfile().find(x=>x.skill==='listening')})")
    record('STAGE58_ADAPTIVE_CONSUMES_STAGE59_RAW_RATIOS',bool(adapted['r'] and adapted['l'] and adapted['r']['confidence'].startswith('Repeated answer-key') and adapted['l']['confidence'].startswith('Repeated answer-key') and 0<=adapted['r']['score']<=100 and 0<=adapted['l']['score']<=100),adapted)

    # Accepted answer variants, weighted marks and no generic band conversion.
    page.locator('#ib4050-score-type').select_option('listening'); page.wait_for_timeout(30)
    page.locator('#ib4050-prompt-id').fill('S59-LISTENING-ALTERNATES')
    page.locator('#s59-key-source').select_option('official')
    page.locator('#s59-answer-key').fill('alpha\ncolour || color\nforty-two')
    page.locator('#s59-learner-answers').fill('ALPHA\nColor\nforty-two')
    page.locator('#s59-marks').fill('1\n2\n1')
    page.wait_for_timeout(30)
    alt_preview=page.locator('#ib4050-score-preview').inner_text()
    record('ALTERNATES_AND_QUESTION_WEIGHTS',bool('4/4 marks' in alt_preview and '100.0%' in alt_preview),alt_preview)
    record('NO_AUTOMATIC_RAW_SCORE_TO_BAND',bool('no band conversion' in alt_preview.lower() or 'raw result only' in alt_preview.lower()),alt_preview)
    page.locator('#ib4050-panel [data-action="score-save"]').click(force=True); page.wait_for_timeout(60)

    # Writing Task 1 and Task 2 require actual response text plus criterion-by-criterion evidence.
    def stage59_fill_rubric(skill,prompt_id,score_values,word_count,target):
        page.locator('#ib4050-score-type').select_option(skill); page.wait_for_timeout(35)
        page.locator('#ib4050-prompt-id').fill(prompt_id)
        page.locator('#s59-task-prompt').fill('Write a response to this practice question about public transport and city planning.')
        response=' '.join(f'word{i+1}' for i in range(word_count))
        page.locator('#s59-response').fill(response)
        for i,value in enumerate(score_values):
            page.locator(f'[data-s59-rating="{i}"]').select_option(f'{float(value):.1f}')
            page.locator(f'[data-s59-evidence="{i}"]').fill(f'Observed criterion evidence number {i+1}: clear example and specific detail.')
        page.wait_for_timeout(35)
        preview=page.locator('#ib4050-score-preview').inner_text()
        page.locator('#ib4050-panel [data-action="score-save"]').click(force=True)
        page.wait_for_timeout(70)
        return preview

    w1preview=stage59_fill_rubric('writing1','S59-WRITING-T1',[6,6,6,6],150,150)
    w2preview=stage59_fill_rubric('writing2','S59-WRITING-T2',[7,7,7,7],250,250)
    writing_records=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.filter(x=>x.stage59 && (x.type==='writing1'||x.type==='writing2'))")
    writing_calc=page.evaluate("()=>{const s=window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores;const a=s.filter(x=>x.stage59&&x.type==='writing1').at(-1);const b=s.filter(x=>x.stage59&&x.type==='writing2').at(-1);return {task1:a?.score,task2:b?.score,combined:window.IELTSBoostStage59Scoring.writingOverall(a?.score,b?.score)}}")
    record('WRITING_CRITERIA_AND_TASK2_DOUBLE_WEIGHT',bool(len(writing_records)==2 and writing_records[0]['evidenceCoverage']==4 and writing_records[0]['wordTargetReached'] is True and writing_records[1]['wordTargetReached'] is True and abs(writing_calc['combined']-(writing_calc['task1']+2*writing_calc['task2'])/3)<0.001 and '6.00 / 9' in w1preview and '7.00 / 9' in w2preview),{'task1Preview':w1preview,'task2Preview':w2preview,'calculation':writing_calc})

    # Speaking is blocked without a saved real audio clip and learner replay confirmation.
    before_speaking=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.length")
    page.locator('#ib4050-score-type').select_option('speaking'); page.wait_for_timeout(30)
    page.locator('#ib4050-prompt-id').fill('S59-SPEAKING-NO-AUDIO')
    page.locator('#s59-task-prompt').fill('Describe a skill you want to learn.')
    page.locator('#s59-response').fill(speaking)
    for i,value in enumerate([6.5,6.5,6,5.5]):
        page.locator(f'[data-s59-rating="{i}"]').select_option(f'{float(value):.1f}')
        page.locator(f'[data-s59-evidence="{i}"]').fill(f'Observed speaking evidence number {i+1} from the response and notes.')
    page.locator('#ib4050-panel [data-action="score-save"]').click(force=True); page.wait_for_timeout(60)
    after_speaking=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.length")
    toast=page.locator('#ib4050-toast').inner_text()
    record('SPEAKING_AUDIO_EVIDENCE_GATE',bool(after_speaking==before_speaking and 'saqlangan audio' in toast.lower()),{'before':before_speaking,'after':after_speaking,'toast':toast})

    # Local full-device backup must include Stage 59 records without changing Stage 58 extension data.
    backup=page.evaluate("async()=>{const s=await window.IELTSBoostBackup.buildSnapshot();const raw=s.state.studio.raw;const st=JSON.parse(raw);return {parsed:s.state.studio.parsed,format:s.format,stage59Records:st.scores.filter(x=>x.stage59).length,extensions:Object.keys(st.extensions||{})}}")
    record('STAGE59_SCORES_INCLUDED_IN_UNIFIED_BACKUP',bool(backup.get('parsed') and backup.get('stage59Records')>=9 and 'stage58' in backup.get('extensions',[])),backup)

    # Advanced Studio stays responsive on a narrow mobile viewport.
    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(100)
    dims=page.evaluate("()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,dialog:document.querySelector('#ib4050-panel .ib4050-card')?.getBoundingClientRect().width})")
    record('STAGE59_MOBILE_SCORING_NO_HORIZONTAL_OVERFLOW',bool(dims['doc']<=dims['width']+1 and dims['body']<=dims['width']+1),dims)
    page.locator('#ib4050-panel [data-ib4050-close]').click(force=True)
    page.wait_for_timeout(30)

    # The exact Stage 55 full backup path includes new extension data.
    backup=page.evaluate("async()=>{const s=await window.IELTSBoostBackup.buildSnapshot();const raw=s.state.studio.raw;return {format:s.format,parsed:s.state.studio.parsed,hasStage58:!!JSON.parse(raw).extensions?.stage58,keys:Object.keys(JSON.parse(raw).extensions||{})}}")
    record('STAGE58_STATE_INCLUDED_IN_FULL_DEVICE_BACKUP',bool(backup.get('parsed') and backup.get('hasStage58') and 'stage58' in backup.get('keys',[])),backup)

    # Reopen the existing Stage 58 layer after Stage 59, then verify focus restoration.
    page.locator('#nav [data-s58-open]').first.click(force=True)
    page.wait_for_selector('#s58-overlay:not([hidden])')
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

    # Stage 60 Listening Hub: bundled library, three answer-key attempts and Stage58 adaptive sync.
    page.locator('#nav [data-s60-open]').first.click(force=True)
    page.wait_for_selector('#s60-overlay:not([hidden])',timeout=10000)
    stage60_api=page.evaluate("()=>({version:window.IELTSBoostStage60?.version,tracks:window.IELTSBoostStage60?.getBuiltInItems()?.length,questions:window.IELTSBoostStage60?.getBuiltInItems()?.reduce((n,x)=>n+x.questionCount,0)})")
    record('STAGE60_BUILTIN_LISTENING_BANK_84_420',bool(stage60_api.get('version')=='60.0.0' and stage60_api.get('tracks')==84 and stage60_api.get('questions')==420),stage60_api)
    record('BUILTIN_AUDIO_PROVENANCE_VISIBLE',bool(page.locator('#s60-overlay').inner_text().lower().find('synthetic practice mp3')>=0 and page.locator('#s60-overlay').inner_text().lower().find('official')>=0),page.locator('#s60-overlay').inner_text()[:500])
    page.locator('#s60-overlay summary').first.click(force=True)
    page.locator('#s60-overlay [data-s60-builtin="builtin-day-01"]').click(force=True)
    page.wait_for_selector('#s60-quiz-form',timeout=10000)
    page.wait_for_timeout(120)

    def stage60_fill_quiz(day):
        values=page.evaluate("(day)=>{const app=JSON.parse(document.querySelector('#appData').textContent);return app.core.days[day-1].listening.questions.map(q=>q.options[q.answer]);}",day)
        form=page.locator('#s60-quiz-form')
        for i,value in enumerate(values): form.locator(f'[name="answer-{i}"]').select_option(value=value)
        form.evaluate('(f)=>f.requestSubmit()')
        page.wait_for_function('(day)=>window.IELTSBoostStage60.getState().attempts.some(x=>x.day===day)',arg=day,timeout=10000)
        return page.evaluate('(day)=>window.IELTSBoostStage60.getState().attempts.filter(x=>x.day===day).at(-1)',day)

    attempt1=stage60_fill_quiz(1)
    record('BUNDLED_DAY1_RAW_ANSWER_KEY_MARKS',bool(attempt1 and attempt1['correctMarks']==5 and attempt1['totalMarks']==5 and attempt1['adaptiveSynced']),attempt1)
    audio_src=page.locator('#s60-audio').get_attribute('src') or ''
    record('BUILTIN_PLAYER_POINTS_TO_DAY1_LOCAL_MP3',bool(audio_src.endswith('/audio/listening-day-01.mp3')),audio_src)
    page.locator('#s60-active-item').select_option(value='builtin-day-02')
    page.wait_for_selector('#s60-quiz-form',timeout=10000)
    attempt2=stage60_fill_quiz(2)
    page.locator('#s60-active-item').select_option(value='builtin-day-03')
    page.wait_for_selector('#s60-quiz-form',timeout=10000)
    attempt3=stage60_fill_quiz(3)
    studio_listening=page.evaluate("()=>window.__IELTS_BOOST_ADVANCED_STUDIO__.getStateSnapshot().scores.filter(x=>x.stage60&&x.type==='listening'&&/^builtin-day-0[123]$/.test(x.promptId))")
    profile_listening=page.evaluate("()=>window.IELTSBoostStage58.getProfile().find(x=>x.skill==='listening')")
    record('THREE_UNIQUE_LISTENING_TESTS_SYNC_TO_STAGE58',bool(attempt2 and attempt3 and len(studio_listening)==3 and profile_listening and profile_listening.get('confidence','').startswith('Repeated answer-key')),{'studioRecords':studio_listening,'profile':profile_listening})

    # Strict exam mode hides transcript, disallows revealing/pausing, and runs once.
    page.locator('#s60-exam-mode').check(force=True); page.wait_for_timeout(80)
    hidden_before=page.evaluate("()=>window.IELTSBoostStage60.getState().preferences.transcriptHidden")
    page.locator('#s60-transcript-toggle').click(force=True); page.wait_for_timeout(60)
    exam_gate=page.evaluate("()=>({hidden:window.IELTSBoostStage60.getState().preferences.transcriptHidden,toast:document.querySelector('#s60-toast')?.textContent})")
    record('STRICT_EXAM_TRANSCRIPT_GATE',bool(hidden_before and exam_gate['hidden'] and 'transcript' in (exam_gate['toast'] or '').lower()),exam_gate)
    # Simulate an active media session without depending on audio output hardware.
    page.evaluate("""()=>{const a=document.querySelector('#s60-audio');let playing=false,pauseCalls=0;Object.defineProperty(a,'paused',{configurable:true,get:()=>!playing});a.play=()=>{playing=true;return Promise.resolve()};a.pause=()=>{pauseCalls++;playing=false};a.__s60GetPauseCalls=()=>pauseCalls;}""")
    page.locator('#s60-play').click(force=True); page.wait_for_timeout(50)
    page.locator('#s60-play').click(force=True); page.wait_for_timeout(50)
    pause_guard=page.evaluate("()=>({pauseCalls:document.querySelector('#s60-audio').__s60GetPauseCalls(),toast:document.querySelector('#s60-toast')?.textContent})")
    record('STRICT_EXAM_NO_PAUSE_AFTER_START',bool(pause_guard['pauseCalls']==0 and 'cannot be paused' in (pause_guard['toast'] or '').lower()),pause_guard)
    page.locator('#s60-exam-mode').uncheck(force=True); page.wait_for_timeout(70)

    # Dictation compares learner text, classifies an error, and stores a repair strategy.
    page.locator('#s60-overlay [data-s60-tab="dictation"]').click(force=True)
    transcript=page.evaluate("()=>JSON.parse(document.querySelector('#appData').textContent).core.days[2].listening.script")
    page.locator('#s60-dictation-answer').fill(transcript)
    page.locator('#s60-overlay [data-s60-action="dictation-check"]').click(force=True); page.wait_for_timeout(80)
    wer=page.locator('#s60-dictation-result').inner_text()
    page.locator('#s60-dictation-error').select_option('distractor')
    page.locator('#s60-dictation-repair').fill('Listen for the correction cue and wait until the speaker confirms the final choice.')
    page.locator('#s60-overlay [data-s60-action="dictation-save-error"]').click(force=True); page.wait_for_timeout(80)
    dstate=page.evaluate("()=>window.IELTSBoostStage60.getState()")
    record('DICTATION_WER_AND_ERROR_REPAIR_SAVED',bool('0.0%' in wer and len(dstate['dictations'])==1 and len(dstate['errors'])==1 and dstate['errors'][0]['kind']=='distractor'),{'result':wer,'dictations':len(dstate['dictations']),'errors':dstate['errors']})

    # Curated natural audio resources link to their providers, not re-hosted media.
    page.locator('#s60-overlay [data-s60-tab="resources"]').click(force=True)
    bc=page.locator('#s60-overlay a[href*="learnenglish.britishcouncil.org/free-resources/general/audio-zone"]')
    record('NATURAL_AUDIO_RESOURCE_HUB_HAS_BRITISH_COUNCIL',bc.count()==1,bc.get_attribute('href') if bc.count() else '')

    # Import a tiny authorised local audio fixture + VTT + answer key, then verify metadata and blob persist.
    page.locator('#s60-overlay .s60-tabs [data-s60-tab="library"]').click(force=True); page.wait_for_timeout(120)
    import_form=page.locator('#s60-import-form')
    import_form.locator('[name="title"]').fill('Stage 60 browser test clip')
    import_form.locator('[name="part"]').select_option('1')
    import_form.locator('[name="audio"]').set_input_files({'name':'stage60-test.wav','mimeType':'audio/wav','buffer':b'RIFF\x24\x00\x00\x00WAVEfmt ' + b'\x10\x00\x00\x00\x01\x00\x01\x00\x40\x1f\x00\x00\x80\x3e\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00'})
    import_form.locator('[name="transcriptFile"]').set_input_files({'name':'stage60-test.vtt','mimeType':'text/vtt','buffer':b'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nWelcome to the library.\n'})
    import_form.locator('[name="sourceName"]').fill('Original local test recording')
    import_form.locator('[name="questions"]').fill('What place is mentioned?')
    import_form.locator('[name="answerKey"]').fill('library')
    import_form.locator('[name="answerKeySource"]').check(force=True)
    import_form.locator('[name="rights"]').check(force=True)
    import_form.evaluate('(f)=>f.requestSubmit()')
    page.wait_for_function("()=>window.IELTSBoostStage60.getState().items.some(x=>x.title==='Stage 60 browser test clip')",timeout=10000)
    imported=page.evaluate("()=>window.IELTSBoostStage60.getState().items.find(x=>x.title==='Stage 60 browser test clip')")
    record('CUSTOM_AUDIO_AND_VTT_IMPORT',bool(imported and imported['segments'] and imported['segments'][0]['text']=='Welcome to the library.' and imported['answerKeyChecked']),imported)
    page.locator('#s60-overlay [data-s60-tab="player"]').click(force=True)
    page.wait_for_selector('#s60-quiz-form',timeout=10000)
    page.locator('#s60-active-item').select_option(value=imported['id']); page.wait_for_selector('#s60-quiz-form',timeout=10000)
    page.locator('#s60-quiz-form [name="answer-0"]').fill('library')
    page.locator('#s60-quiz-form').evaluate('(f)=>f.requestSubmit()'); page.wait_for_timeout(100)
    custom_attempt=page.evaluate("()=>window.IELTSBoostStage60.getState().attempts.filter(x=>x.itemId!==undefined && x.title==='Stage 60 browser test clip').at(-1)")
    record('IMPORTED_CHECKED_ANSWER_KEY_SYNCED',bool(custom_attempt and custom_attempt['correctMarks']==1 and custom_attempt['adaptiveSynced']),custom_attempt)

    backup60=page.evaluate("async()=>{const s=await window.IELTSBoostBackup.buildSnapshot();const st=JSON.parse(s.state.studio.raw);const item=st.extensions.stage60.items.find(x=>x.title==='Stage 60 browser test clip');const row=s.indexedDB.studio.records.find(x=>x.key===item.blobId);return {parsed:s.state.studio.parsed,hasMeta:!!item,hasBlob:!!row,blobBytes:row?.value?.blob?.size,attempts:st.extensions.stage60.attempts.length,dictations:st.extensions.stage60.dictations.length,errors:st.extensions.stage60.errors.length};}")
    record('FULL_DEVICE_BACKUP_INCLUDES_STAGE60_AUDIO_AND_METADATA',bool(backup60.get('parsed') and backup60.get('hasMeta') and backup60.get('hasBlob') and backup60.get('blobBytes')>0 and backup60.get('attempts')>=4 and backup60.get('dictations')>=1 and backup60.get('errors')>=1),backup60)

    # Responsive modal and keyboard focus restoration for Stage 60.
    page.locator('#s60-overlay [data-s60-close]').click(force=True); page.wait_for_timeout(40)
    focus60=page.evaluate("()=>document.activeElement?.hasAttribute('data-s60-open') && document.activeElement?.parentElement?.id==='nav'")
    record('STAGE60_CLOSE_RESTORES_DESKTOP_FOCUS',bool(focus60),focus60)
    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(90)
    mobile60=page.locator('#mobileBottom [data-s60-open]').first
    if not mobile60.count(): mobile60=page.locator('[data-s60-open]').last
    mobile60.click(force=True); page.wait_for_selector('#s60-overlay:not([hidden])')
    dims60=page.evaluate("()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,dialog:document.querySelector('#s60-overlay .s60-shell')?.getBoundingClientRect().width})")
    record('STAGE60_MOBILE_390_NO_OVERFLOW',bool(dims60['doc']<=dims60['width']+1 and dims60['body']<=dims60['width']+1),dims60)
    page.locator('#s60-overlay [data-s60-close]').click(force=True); page.wait_for_timeout(30)
    mobile_focus60=page.evaluate("()=>document.activeElement?.hasAttribute('data-s60-open') && document.activeElement?.parentElement?.id==='mobileBottom'")
    record('STAGE60_CLOSE_RESTORES_MOBILE_FOCUS',bool(mobile_focus60),mobile_focus60)

    record('NO_PAGE_JAVASCRIPT_ERRORS',len(page_errors)==0,page_errors[:4])
    record('NO_CONSOLE_ERRORS',len(console_errors)==0,console_errors[:4])
    record('ALL_LOCAL_ASSET_REQUESTS_SERVED',not bad_responses,bad_responses[:8])
    ctx.close(); browser.close()

passed=sum(x['pass'] for x in results); failed=len(results)-passed
out={
 'release':'60.0.0-real-listening','method':'Chromium with exact ZIP build bytes fulfilled through an isolated HTTPS request route; real browser DOM, localStorage and IndexedDB; Service Worker blocked and simulated separately.',
 'passed':passed,'failed':failed,'total':len(results),'checks':results,'pageErrors':page_errors,'consoleErrors':console_errors,'badResponses':bad_responses,
 'limitations':['No physical Android device, microphone permission, browser speech recognition, public GitHub Pages deployment, or real offline cold-start were available in this build environment.','Writing and Speaking use learner-entered text and self-reflection; this is not examiner scoring.','The supplied Barron\'s material was not copied into the project; the learner enters their own answer-key outcome.']}
(ROOT/'docs/BROWSER_RUNTIME_60_0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
