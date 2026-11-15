/* IELTS Boost Stage 60 · Real Listening & Resource Hub
 * Local-first natural-audio library, timed transcripts, exam-mode playback,
 * dictation/WER, shadowing recordings, answer-key quizzes and error intelligence.
 * User media is kept in the existing Stage 55-backed Advanced Studio audio DB.
 */
(function (global, document) {
  'use strict';
  const VERSION = '60.0.0';
  const API = global.__IELTS_BOOST_ADVANCED_STUDIO__;
  const STORE_NAME = 'IELTSBoostPlanA_Audio_v1';
  const OBJECT_STORE = 'clips';
  const EXTENSION = 'stage60';
  const MAX_FILE_BYTES = 60 * 1024 * 1024;
  const MAX_STAGE60_AUDIO_BYTES = 120 * 1024 * 1024;
  const MAX_TOTAL_AUDIO_BYTES = 175 * 1024 * 1024; // below Stage 55's 200 MB full-backup ceiling
  const MAX_TRANSCRIPT_CHARS = 220000;
  const MAX_SEGMENTS = 5000;
  const MAX_ITEMS = 200;
  const MAX_QUESTIONS = 40;
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${global.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`;
  const now = () => new Date().toISOString();
  const bytesLabel = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const wordTokens = text => (String(text || '').toLowerCase().normalize('NFKC').match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || []);
  const RESOURCES = [
    {id:'ielts-format',name:'IELTS.org · Listening test format',type:'Official exam specification',level:'All',accent:'British · Australian · New Zealand · North American',url:'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening',detail:'4 parts, 40 questions, one-play recordings and official question-type descriptions.'},
    {id:'bc-audio-zone',name:'British Council · Audio zone',type:'Natural speech + transcript + exercises',level:'B2–C1',accent:'Speakers from different parts of the world',url:'https://learnenglish.britishcouncil.org/free-resources/general/audio-zone',detail:'Natural recordings, international accents, transcripts and interactive comprehension exercises.'},
    {id:'bc-listening',name:'British Council · Listening skills',type:'Guided listening practice',level:'A2–C1',accent:'Varied',url:'https://learnenglish.britishcouncil.org/skills/listening',detail:'Structured listening practice with lessons and level-based tasks.'},
    {id:'common-voice',name:'Mozilla Common Voice · Datasets',type:'Open speech dataset',level:'Varies by clip',accent:'Depends on selected English locale and speaker',url:'https://commonvoice.mozilla.org/en/datasets',detail:'CC0 dataset for speech diversity and focused accent familiarisation. It is not an IELTS mock test; use the dataset page to inspect locale, size and terms before downloading.'},
    {id:'ielts-samples',name:'IELTS.org · Sample test questions',type:'Official sample materials',level:'IELTS',accent:'Exam format',url:'https://ielts.org/take-a-test/preparation-resources/sample-test-questions',detail:'Official sample tasks and preparation information.'}
  ];
  const ERROR_TYPES = [
    ['paraphrase','Paraphrase not recognised'],['distractor','Distractor / correction cue'],['number-name','Numbers, names or spelling'],['word-form','Word form / plural / ending'],
    ['connected-speech','Connected speech / reduced sounds'],['accent','Accent / unfamiliar pronunciation'],['attention','Attention / next-question tracking'],['memory','Working-memory / note-taking'],['other','Other / not yet identified']
  ];
  const PARTS = [
    {id:'1',label:'Part 1',kind:'Social conversation',speakers:'Two speakers',focus:'Everyday arrangements, names, numbers and practical details.'},
    {id:'2',label:'Part 2',kind:'Social monologue',speakers:'One main speaker',focus:'A talk about a local place, service, facility or event.'},
    {id:'3',label:'Part 3',kind:'Academic conversation',speakers:'Two to four speakers',focus:'Students and/or a tutor discussing study, research or training.'},
    {id:'4',label:'Part 4',kind:'Academic monologue',speakers:'One main speaker',focus:'An extended academic talk or lecture.'}
  ];
  const ACCENTS = ['British','Australian','New Zealand','North American','International / mixed','Unknown / not labelled'];
  const LEVELS = ['A2','B1','B1+','B2','C1','Native / natural','Unknown'];
  const TYPES = ['Multiple choice','Matching','Form / note / table completion','Map / plan / diagram labelling','Sentence completion','Short answer','Mixed / custom'];
  const defaults = () => ({
    schemaVersion:1, activeItemId:'builtin-day-01', activeTab:'library', items:[], attempts:[], dictations:[], errors:[], shadows:[],
    preferences:{transcriptHidden:true,playbackRate:1}, createdAt:now(), updatedAt:now()
  });
  let state = loadState();
  let overlay = null, lastTrigger = null, openState = false;
  let dbPromise = null, objectUrls = new Map(), activeAudioId = '', loopCue = null, activeCueIndex = -1;
  let pendingRecorder = null, pendingStream = null, pendingShadowChunks = [], pendingShadowMeta = null;
  let examState = {enabled:false,started:false,locked:false};
  let toastTimer = 0;

  function safeState(saved) {
    const base = defaults();
    const out = Object.assign(base, saved || {});
    out.schemaVersion = 1;
    out.items = Array.isArray(out.items) ? out.items.filter(x => x && typeof x.id === 'string' && typeof x.blobId === 'string').slice(-MAX_ITEMS) : [];
    out.attempts = Array.isArray(out.attempts) ? out.attempts.slice(-500) : [];
    out.dictations = Array.isArray(out.dictations) ? out.dictations.slice(-500) : [];
    out.errors = Array.isArray(out.errors) ? out.errors.slice(-500) : [];
    out.shadows = Array.isArray(out.shadows) ? out.shadows.slice(-200) : [];
    out.preferences = Object.assign(base.preferences, out.preferences || {});
    out.preferences.playbackRate = [0.65,0.75,0.85,0.9,1,1.1,1.2,1.25,1.5].includes(Number(out.preferences.playbackRate)) ? Number(out.preferences.playbackRate) : 1;
    if (!out.items.some(x => x.id === out.activeItemId) && !/^builtin-day-\d{2}$/.test(String(out.activeItemId || ''))) out.activeItemId = out.items[0]?.id || 'builtin-day-01';
    return out;
  }
  function loadState() {
    try {
      const saved = API?.getExtensionState?.(EXTENSION);
      return safeState(saved && typeof saved === 'object' ? saved : null);
    } catch (error) { console.warn('Stage 60 state read:', error); return defaults(); }
  }
  function save() {
    state.updatedAt = now();
    try {
      if (!API?.setExtensionState) throw new Error('Advanced Studio extension storage is unavailable.');
      API.setExtensionState(EXTENSION, state);
      return true;
    } catch (error) {
      notify(`Saqlash amalga oshmadi: ${error.message || error}. Storage va backup holatini tekshir.`);
      return false;
    }
  }
  function notify(message) {
    let node = $('#s60-toast');
    if (!node) { node = document.createElement('div'); node.id = 's60-toast'; node.className = 's60-toast'; node.setAttribute('role','status'); node.setAttribute('aria-live','polite'); document.body.appendChild(node); }
    node.textContent = message; node.classList.add('show'); global.clearTimeout(toastTimer); toastTimer = global.setTimeout(() => node.classList.remove('show'), 4200);
  }
  function getDB() {
    if (!global.indexedDB) return Promise.reject(new Error('IndexedDB bu brauzerda mavjud emas.'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject) => {
      const req = indexedDB.open(STORE_NAME, 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(OBJECT_STORE)) db.createObjectStore(OBJECT_STORE,{keyPath:'id'}); };
      req.onsuccess = () => { const db = req.result; if (!db.objectStoreNames.contains(OBJECT_STORE)) { db.close(); reject(new Error('Stage 55 bilan umumiy audio store topilmadi.')); return; } db.onversionchange = () => { db.close(); dbPromise = null; }; resolve(db); };
      req.onerror = () => { dbPromise = null; reject(req.error || new Error('Audio database ochilmadi.')); };
      req.onblocked = () => { dbPromise = null; reject(new Error('Audio database boshqa tabda band. Boshqa IELTS Boost oynalarini yoping.')); };
    });
    return dbPromise;
  }
  async function getAllRows() {
    const db = await getDB();
    return new Promise((resolve,reject) => { const tx=db.transaction(OBJECT_STORE,'readonly'); const req=tx.objectStore(OBJECT_STORE).getAll(); req.onsuccess=()=>resolve(req.result||[]); req.onerror=()=>reject(req.error||new Error('Audio yozuvlari o‘qilmadi.')); tx.onerror=()=>reject(tx.error); });
  }
  async function getBlob(id) {
    const db = await getDB();
    return new Promise((resolve,reject) => { const req=db.transaction(OBJECT_STORE,'readonly').objectStore(OBJECT_STORE).get(id); req.onsuccess=()=>resolve(req.result?.blob instanceof Blob ? req.result.blob : null); req.onerror=()=>reject(req.error||new Error('Audio blob topilmadi.')); });
  }
  async function putBlob(id, blob) {
    const db = await getDB();
    return new Promise((resolve,reject) => {
      const tx=db.transaction(OBJECT_STORE,'readwrite');
      tx.objectStore(OBJECT_STORE).put({id,blob,updatedAt:now()});
      tx.oncomplete=()=>resolve(true); tx.onerror=()=>reject(tx.error||new Error('Audio yozilmadi.')); tx.onabort=()=>reject(tx.error||new Error('Audio yozish bekor qilindi.'));
    });
  }
  async function deleteBlob(id) {
    const db=await getDB();
    return new Promise((resolve,reject)=>{const tx=db.transaction(OBJECT_STORE,'readwrite');tx.objectStore(OBJECT_STORE).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Audio o‘chirilmadi.'));});
  }
  async function storageCheck(incomingBytes) {
    if (incomingBytes > MAX_FILE_BYTES) throw new Error(`Bitta audio fayl ${bytesLabel(MAX_FILE_BYTES)} limitidan oshmasin.`);
    const rows = await getAllRows();
    const current = rows.reduce((sum,row)=>sum+(row?.blob instanceof Blob?row.blob.size:0),0);
    if (current + incomingBytes > MAX_TOTAL_AUDIO_BYTES) throw new Error(`Umumiy audio ombori ${bytesLabel(MAX_TOTAL_AUDIO_BYTES)} limitiga yaqin. Avval keraksiz kliplarni eksport qiling yoki o‘chiring. Full backup limiti 200 MB.`);
    const own = state.items.reduce((sum,row)=>sum+(Number(row.size)||0),0) + state.shadows.reduce((sum,row)=>sum+(Number(row.size)||0),0);
    if (own + incomingBytes > MAX_STAGE60_AUDIO_BYTES) throw new Error(`Stage 60 audio kutubxonasi ${bytesLabel(MAX_STAGE60_AUDIO_BYTES)} chegarasidan oshmaydi.`);
    try { const estimate=await navigator.storage?.estimate?.(); if (estimate?.quota && estimate?.usage && estimate.usage + incomingBytes > estimate.quota * .92) throw new Error('Qurilma storage quota’si deyarli to‘lgan. Keraksiz fayllarni olib tashlang.'); } catch (error) { if (/quota/i.test(error.message)) throw error; }
  }
  function parseTimestamp(value) {
    const s=String(value||'').trim().replace(',','.');
    const m=s.match(/^(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if(!m)return null;
    return (Number(m[1]||0)*3600)+(Number(m[2])*60)+Number(m[3])+Number(('0.'+(m[4]||'0')).slice(0,5));
  }
  function parseTranscript(raw, filename='transcript.txt') {
    const text=String(raw||'').replace(/^\uFEFF/,'').replace(/\r/g,'').trim();
    if(text.length>MAX_TRANSCRIPT_CHARS)throw new Error(`Transcript ${bytesLabel(text.length)} chegarasidan uzun (limit ${bytesLabel(MAX_TRANSCRIPT_CHARS)}).`);
    const ext=String(filename).split('.').pop().toLowerCase();
    if(ext==='json'){
      let data;try{data=JSON.parse(text);}catch{throw new Error('Transcript JSON sintaksisi noto‘g‘ri.');}
      const rows=Array.isArray(data)?data:(Array.isArray(data.segments)?data.segments:null);
      if(!rows)throw new Error('JSON ichida segments array bo‘lishi kerak.');
      const segments=rows.map((x,i)=>({start:Number(x.start??x.startTime),end:Number(x.end??x.endTime),text:String(x.text??x.caption??'').trim()})).filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.start>=0&&x.end>x.start&&x.text);
      if(segments.length>MAX_SEGMENTS)throw new Error(`Segmentlar ${MAX_SEGMENTS} tadan ko‘p bo‘lmasin.`);
      if(!segments.length)throw new Error('JSON’da start, end va text maydonlari bilan kamida bitta valid segment bo‘lishi kerak.');
      return {format:'json-timed',text:segments.map(x=>x.text).join('\n'),segments};
    }
    if(ext==='vtt'||ext==='srt'){
      const lines=text.split('\n'),segments=[];let i=0;
      while(i<lines.length){
        const line=lines[i].trim();
        const match=line.match(/(?:(\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})/);
        if(match){const start=parseTimestamp(match[0].split('-->')[0]),end=parseTimestamp(match[2]);i++;const body=[];while(i<lines.length&&lines[i].trim()&&!/^NOTE\b/i.test(lines[i].trim()))body.push(lines[i++].trim());if(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&body.length)segments.push({start,end,text:body.join(' ')});}
        i++;
      }
      if(segments.length){if(segments.length>MAX_SEGMENTS)throw new Error(`Segmentlar ${MAX_SEGMENTS} tadan ko‘p bo‘lmasin.`);return {format:ext+'-timed',text:segments.map(x=>x.text).join('\n'),segments};}
    }
    return {format:'plain-text',text,segments:[]};
  }
  function wer(reference,hypothesis) {
    const a=wordTokens(reference),b=wordTokens(hypothesis); if(!a.length)return {referenceWords:0,hypothesisWords:b.length,edits:b.length,rate:null,accuracy:null};
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){const curr=[i];for(let j=1;j<=b.length;j++)curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=curr;}
    const edits=prev[b.length],rate=edits/a.length;
    return {referenceWords:a.length,hypothesisWords:b.length,edits,rate:Number(rate.toFixed(4)),accuracy:Number(Math.max(0,1-rate).toFixed(4))};
  }
  function timedSegments(item) { return Array.isArray(item?.segments)?item.segments.filter(x=>Number.isFinite(Number(x.start))&&Number.isFinite(Number(x.end))&&Number(x.end)>Number(x.start)&&String(x.text||'').trim()):[]; }
  let builtInCache = null;
  function builtInItems() {
    if (builtInCache) return builtInCache;
    const node = $('#appData');
    if (!node) return [];
    try {
      const app = JSON.parse(node.textContent || '{}');
      const days = Array.isArray(app.core?.days) ? app.core.days : [];
      builtInCache = days.map((day, index) => {
        const listen = day?.listening || {};
        const sourceQuestions = Array.isArray(listen.questions) ? listen.questions : [];
        const questionChoices = sourceQuestions.map(q => Array.isArray(q.options) ? q.options.map(String) : []);
        const quizKeys = sourceQuestions.map(q => {
          const options = Array.isArray(q.options) ? q.options : [];
          const answer = q.answer;
          if (Number.isInteger(answer) && answer >= 0 && answer < options.length) return String(options[answer]);
          return String(answer ?? '').trim();
        });
        const dayNo = Number(day.day || index + 1);
        return {
          id: `builtin-day-${String(dayNo).padStart(2,'0')}`, builtin: true,
          title: String(listen.title || `Daily Listening · Day ${dayNo}`),
          audioUrl: String(listen.audio_asset || `./audio/listening-day-${String(dayNo).padStart(2,'0')}.mp3`),
          part: '0', level: 'B1–B2 practice', accent: 'Synthetic voice · not a natural accent',
          taskType: String(listen.format || 'Daily IELTS Boost practice').replace(/_/g,' '),
          sourceName: 'IELTS Boost original daily practice', sourceUrl: '',
          transcript: String(listen.script || ''), transcriptFormat: 'plain-text', segments: [],
          questions: sourceQuestions.map(q => String(q.question || q.prompt || 'Listening question')),
          questionChoices, questionExplanations: sourceQuestions.map(q => String(q.explanation || '')),
          questionEvidence: sourceQuestions.map(q => String(q.evidence || '')),
          quizKeys, answerKeyChecked: sourceQuestions.length > 0 && quizKeys.every(Boolean),
          sourceNote: String(listen.source_note || listen.audio_provenance || 'Original IELTS Boost scripted practice; synthetic voice, not official IELTS audio.'),
          day: dayNo, size: 0, mime: 'audio/mpeg'
        };
      }).filter(x => x.transcript && x.audioUrl).slice(0,84);
      return builtInCache;
    } catch (error) { console.warn('Stage 60 built-in audio index unavailable:', error); return []; }
  }
  function allItems() { return [...builtInItems(), ...state.items]; }
  function activeItem() { const items=allItems(); return items.find(x=>x.id===state.activeItemId)||state.items[0]||items[0]||null; }
  function partInfo(id) { return String(id)==='0' ? {id:'0',label:'Daily practice',kind:'In-app listening practice',speakers:'Varies',focus:'Original IELTS Boost daily practice.'} : PARTS.find(x=>x.id===String(id))||PARTS[0]; }
  function close() {
    if(!overlay||!openState)return;
    stopShadowRecorder(true);openState=false;overlay.hidden=true;document.body.classList.remove('s60-open');
    const focus=lastTrigger?.isConnected?lastTrigger:$('[data-s60-open]');if(focus)focus.focus();
  }
  function createOverlay() {
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='s60-overlay';overlay.className='s60-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','IELTS Boost Stage 60 Real Listening and Resource Hub');
    document.body.appendChild(overlay);return overlay;
  }
  function open(trigger) {
    if(trigger?.matches?.('[data-s60-open]'))lastTrigger=trigger;
    const node=createOverlay();openState=true;node.hidden=false;document.body.classList.add('s60-open');
    render();$('[data-s60-close]',node)?.focus();
  }
  function setTab(tab) { if(!['library','player','dictation','shadowing','insights','resources'].includes(tab))return;state.activeTab=tab;save();render();if(tab==='player'||tab==='dictation'||tab==='shadowing')loadActiveAudio().catch(e=>notify(e.message)); }
  function selectedPartLabel(item) { return item ? `${partInfo(item.part).label} · ${partInfo(item.part).kind}` : 'Part tanlanmagan'; }
  function shell() {
    const item=activeItem();
    return `<div class="s60-shell"><header class="s60-head"><div><span class="s60-eyebrow">IELTS BOOST · STAGE 60 · REAL LISTENING</span><h1>Listening Intelligence Hub</h1><p>Natural audio · synced transcript · dictation · shadowing · evidence-based error repair</p></div><button type="button" class="s60-close" data-s60-close aria-label="Listening Hub’ni yopish">×</button></header>
      <nav class="s60-tabs" aria-label="Listening Hub sections">${[['library','▣','Audio library'],['player','♫','Player & test'],['dictation','Aa','Dictation'],['shadowing','◉','Shadowing'],['insights','⌁','Error intelligence'],['resources','↗','Resources']].map(([id,ic,label])=>`<button type="button" role="tab" aria-selected="${state.activeTab===id?'true':'false'}" class="${state.activeTab===id?'active':''}" data-s60-tab="${id}"><span>${ic}</span>${label}</button>`).join('')}</nav>
      <main class="s60-main" id="s60-tabpanel" role="tabpanel">${view()}</main>
      <footer class="s60-foot"><span>${state.items.length} audio · ${state.attempts.length} quiz attempts · ${state.errors.length} listening errors</span><span>Local-only · Full-device backup includes imported audio in Stage 55 IndexedDB store</span></footer></div>`;
  }
  function view() {
    const views={library:libraryView,player:playerView,dictation:dictationView,shadowing:shadowingView,insights:insightsView,resources:resourcesView};
    return (views[state.activeTab]||libraryView)();
  }
  function libraryView() {
    const total=state.items.reduce((sum,x)=>sum+(Number(x.size)||0),0);
    return `<section class="s60-hero"><div><span class="s60-kicker">NATURAL SPEECH TRAINING</span><h2>Tabiiy inglizcha audioni o‘zingning IELTS mashqingga aylantir.</h2><p>O‘zingga tegishli yoki ishlatishga ruxsating bor MP3/WAV/M4A/OGG/WEBM faylni import qil. VTT/SRT/JSON transcriptni sinxronla; har bir audio uchun quiz, dictation va shadowing urinishlarini saqla.</p><div class="s60-metrics"><div><b>${state.items.length}</b><span>Audio resources</span></div><div><b>${bytesLabel(total)}</b><span>Stage 60 audio</span></div><div><b>${state.attempts.length}</b><span>Quiz attempts</span></div><div><b>${state.shadows.length}</b><span>Shadow clips</span></div></div></div><div class="s60-hero-side"><b>IELTS Listening map</b>${PARTS.map(p=>`<div class="s60-part-mini"><span>${p.label}</span><b>${p.kind}</b><small>${p.speakers}</small></div>`).join('')}<small>4 parts × 10 questions · 40 questions · recordings heard once in the official test.</small></div></section>
      <div class="s60-callout"><b>Audio source honesty:</b> Stage 57/59’dagi 84 synthetic practice MP3 fayl saqlanadi va qo‘shimcha mashq uchun foydali. Ular tabiiy speaker, real accent yoki rasmiy IELTS recording o‘rnini bosmaydi. Natural audio uchun pastdagi manbalarni och yoki ruxsatli audio import qil.</div>
      <section class="s60-card s60-builtin-library"><div class="s60-title"><div><span class="s60-kicker">ALREADY INCLUDED · 84 ORIGINAL DAYS</span><h2>Daily Listening practice bank</h2><p>84 ta mavjud MP3, original script va har kuni uchun 5 ta quiz savoli shu yerda. Ovozi synthetic; Part 1–4 rasmiy audio deb talqin qilinmaydi.</p></div><span class="s60-chip">84 × 5 questions</span></div><details><summary>84 kunlik audio bankni ochish</summary><div class="s60-library-list">${builtInItems().map(item=>`<article class="s60-resource-item"><div class="s60-resource-top"><div><b>Day ${item.day} · ${esc(item.title)}</b><p>Original script · Synthetic practice voice · ${item.questions.length} questions</p><small>${esc(item.taskType)} · ${esc(item.sourceNote)}</small></div><span class="s60-badge">${item.questions.length} Q</span></div><div class="s60-actions"><button type="button" class="s60-btn primary small" data-s60-builtin="${esc(item.id)}">Open daily audio</button><button type="button" class="s60-btn small" data-s60-tab="dictation" data-s60-builtin-tab="1">Dictation Lab</button></div></article>`).join('')}</div></details></section>
      <section class="s60-grid two"><article class="s60-card"><div class="s60-title"><div><span class="s60-kicker">IMPORT YOUR RESOURCE</span><h2>Audio + transcript + task pack</h2></div><span class="s60-chip">Offline after import</span></div>
        <form id="s60-import-form" class="s60-form">
          <label>Audio title<input class="s60-input" name="title" required maxlength="100" placeholder="Example: University library orientation"></label>
          <div class="s60-row"><label>IELTS part<select class="s60-input" name="part">${PARTS.map(p=>`<option value="${p.id}">${p.label} · ${p.kind}</option>`).join('')}<option value="0">General / not IELTS</option></select></label><label>Level<select class="s60-input" name="level">${LEVELS.map(x=>`<option>${x}</option>`).join('')}</select></label></div>
          <div class="s60-row"><label>Accent (only when known)<select class="s60-input" name="accent">${ACCENTS.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Question type<select class="s60-input" name="taskType">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select></label></div>
          <label>Audio file<input class="s60-input" type="file" name="audio" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.webm,.flac" required><small>Max 60 MB per file. Supported playback depends on the browser/codec.</small></label>
          <label>Transcript file (optional)<input class="s60-input" type="file" name="transcriptFile" accept=".txt,.vtt,.srt,.json,text/plain,text/vtt,application/json"><small>Timed VTT/SRT/JSON cues can sync to playback. Plain text is also supported.</small></label>
          <label>Or paste transcript<textarea class="s60-textarea" name="transcriptText" rows="4" maxlength="220000" placeholder="Paste your permitted transcript here…"></textarea></label>
          <div class="s60-row"><label>Source / author / publisher<input class="s60-input" name="sourceName" maxlength="120" placeholder="British Council / own recording / other"></label><label>Source URL (optional)<input class="s60-input" name="sourceUrl" type="url" maxlength="500" placeholder="https://…"></label></div>
          <label>Usage basis<select class="s60-input" name="usage"><option value="own">My own recording / I have permission</option><option value="cc0">CC0 / public-domain resource (checked)</option><option value="open">Open licence (terms checked)</option><option value="personal">Personal study copy / source terms checked</option></select></label>
          <div class="s60-divider"></div><b>Optional: build a mini Listening quiz</b><p class="s60-muted">Savol promptlari va answer key’ni bir xil tartibda, har qatorda bittadan kiriting. Variantlar double-pipe (ikki vertikal chiziq) bilan yoziladi. 1–40 savol. Javoblar Stage 59 raw-mark engine orqali tekshiriladi.</p>
          <label>Question prompts<textarea class="s60-textarea" name="questions" rows="3" placeholder="1. What is the registration fee?\n2. Which day is the tour?" maxlength="12000"></textarea></label>
          <label>Answer key<textarea class="s60-textarea" name="answerKey" rows="3" placeholder="£25\nThursday" maxlength="6000"></textarea></label>
          <label class="s60-check"><input type="checkbox" name="answerKeySource"> <span>Answer key is checked against the source material (I have verified it).</span></label>
          <label class="s60-check"><input type="checkbox" name="rights" required> <span>I have the right to use this audio/transcript in this private learning library, and it does not contain someone else’s private or sensitive information.</span></label>
          <button class="s60-btn primary" type="submit">Import to my Listening Library</button><p id="s60-import-status" class="s60-status" role="status" aria-live="polite">Audio fayl IndexedDB’da, transcript va metama’lumot backup qilinadigan Stage 55 local state’da saqlanadi.</p>
        </form></article>
        <article class="s60-card"><div class="s60-title"><div><span class="s60-kicker">YOUR LIBRARY</span><h2>Saved audio resources</h2></div><button type="button" class="s60-btn small" data-s60-action="refresh-library">Refresh</button></div>
          ${state.items.length?`<div class="s60-library-list">${state.items.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(item=>`<article class="s60-resource-item"><div class="s60-resource-top"><div><b>${esc(item.title)}</b><p>${esc(selectedPartLabel(item))} · ${esc(item.accent||'Unknown')} · ${esc(item.level||'Unknown')}</p><small>${esc(item.sourceName||'Source not recorded')} · ${bytesLabel(item.size||0)} · ${item.segments?.length||0} timed cues</small></div><span class="s60-badge">${item.quizKeys?.length||0} Q</span></div><div class="s60-actions"><button type="button" class="s60-btn primary small" data-s60-item="${esc(item.id)}">Open player</button><button type="button" class="s60-btn small" data-s60-export="${esc(item.id)}">Export audio</button><button type="button" class="s60-btn danger small" data-s60-delete="${esc(item.id)}">Delete</button></div></article>`).join('')}</div>`:'<div class="s60-empty">Hali audio import qilinmagan.<br>Ruxsatli MP3/WAV audio faylni chap tomondagi formadan qo‘sh.</div>'}
          <div class="s60-storage-note"><b>Storage:</b> Stage 60 audio limit ${bytesLabel(MAX_STAGE60_AUDIO_BYTES)}; total IndexedDB audio limit ${bytesLabel(MAX_TOTAL_AUDIO_BYTES)}. Full backup manager limit 200 MB. Backupni muntazam eksport qilib xavfsiz joyda saqla.</div>
        </article></section>`;
  }
  function playerView() {
    const item=activeItem();
    if(!item)return `<section class="s60-empty"><h2>Player bo‘sh</h2><p>Daily Listening bankdan track tanlang yoki ruxsatli audio import qiling.</p><button class="s60-btn primary" data-s60-tab="library">Open audio library</button></section>`;
    const cues=timedSegments(item),questions=Array.isArray(item.questions)?item.questions:[];
    return `<section class="s60-section-head"><div><span class="s60-kicker">LISTENING PLAYER</span><h2>${esc(item.title)}</h2><p>${esc(selectedPartLabel(item))} · ${esc(item.accent)} · ${esc(item.level)}</p></div><select class="s60-input s60-select" id="s60-active-item" aria-label="Choose audio">${allItems().map(x=>`<option value="${esc(x.id)}" ${x.id===item.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></section>
      <section class="s60-card s60-player-card"><div class="s60-player-art"><span>♫</span><b>${esc(partInfo(item.part).label||'General')}</b><small>${esc(item.taskType||'Listening practice')}</small></div><div class="s60-player-main"><div class="s60-player-controls"><button type="button" class="s60-btn primary" data-s60-action="play-toggle" id="s60-play">▶ Play</button><button type="button" class="s60-btn" data-s60-action="repeat-cue" id="s60-loop" ${cues.length?'':'disabled'}>↻ Repeat cue</button><label class="s60-speed">Speed<select class="s60-input" id="s60-speed" ${examState.enabled?'disabled':''}>${[0.65,0.75,0.85,0.9,1,1.1,1.2,1.25,1.5].map(x=>`<option value="${x}" ${Number(state.preferences.playbackRate)===x?'selected':''}>${x}×</option>`).join('')}</select></label></div>
        <audio id="s60-audio" preload="metadata" playsinline></audio><div class="s60-progress-row"><progress id="s60-progress" max="100" value="0"></progress><span id="s60-time">0:00 / --:--</span></div>
        <div class="s60-player-bottom"><label class="s60-check"><input type="checkbox" id="s60-exam-mode" ${examState.enabled?'checked':''}> <span>Strict one-play mode (no seeking or replay)</span></label><span id="s60-audio-status" class="s60-status" role="status" aria-live="polite">${examState.locked?'Exam playback completed. Switch to practice mode to replay.':'Audio loading…'}</span></div>
      </div></section>
      <section class="s60-grid two"><article class="s60-card"><div class="s60-title"><div><span class="s60-kicker">TRANSCRIPT CONTROL</span><h3>Synced transcript</h3></div><button type="button" class="s60-btn small" data-s60-action="toggle-transcript" id="s60-transcript-toggle">${state.preferences.transcriptHidden?'Reveal transcript':'Hide transcript'}</button></div>
        <p class="s60-muted">Timed cues audio vaqtiga bog‘lanadi. Har qatorni bosib o‘sha joydan tinglash mumkin (exam mode’da seeking o‘chiriladi).</p>
        <div id="s60-transcript-box" class="s60-transcript ${state.preferences.transcriptHidden?'is-hidden':''}">${cues.length?cues.map((cue,i)=>`<button type="button" class="s60-cue" data-s60-cue="${i}"><time>${fmtTime(cue.start)}</time><span>${esc(cue.text)}</span></button>`).join(''):`<p>${esc(item.transcript||'No transcript imported for this audio.')}</p>`}</div>
        <p class="s60-storage-note">${cues.length?`${cues.length} timed cues imported · click a cue to jump to its timestamp`:'Plain transcript only or not imported. You can still use full-clip dictation.'}</p>
      </article>
      <article class="s60-card"><div class="s60-title"><div><span class="s60-kicker">QUESTION SET</span><h3>${questions.length?`${questions.length} questions`:'No question set attached'}</h3></div><span class="s60-chip">${esc(item.taskType||'Custom')}</span></div>
        ${questions.length?`<form id="s60-quiz-form" class="s60-quiz">${questions.map((q,i)=>{const options=item.questionChoices?.[i]||[];return `<label class="s60-question"><b>${i+1}. ${esc(q)}</b>${options.length?`<select class="s60-input" name="answer-${i}"><option value="">Choose an answer…</option>${options.map((v,j)=>`<option value="${esc(v)}">${String.fromCharCode(65+j)} · ${esc(v)}</option>`).join('')}</select>`:`<input class="s60-input" name="answer-${i}" autocomplete="off" placeholder="Your answer…">`}</label>`;}).join('')}<button class="s60-btn primary" type="submit">Check answers with Stage 59</button><div id="s60-quiz-result" class="s60-quiz-result" aria-live="polite"></div><small>Raw marks and accuracy only. This is not an IELTS band prediction. Answer-key source: ${item.answerKeyChecked?'bundled source key / marked checked':'not independently verified'}.</small></form>`:'<div class="s60-empty compact">Add prompts + answer key when you import audio to enable automatic raw scoring.</div>'}
      </article></section>`;
  }
  function dictationView() {
    const item=activeItem(); if(!item)return `<div class="s60-empty">Audio import qiling, keyin Dictation Lab’ni oching.</div>`;
    const cues=timedSegments(item);
    return `<section class="s60-section-head"><div><span class="s60-kicker">ACTIVE LISTENING · DICTATION</span><h2>Listen → write → compare</h2><p>Transcript javob yozilmaguncha yashiriladi. Natija Word Error Rate (WER) va token farqi bilan ko‘rsatiladi, IELTS bandi emas.</p></div><select class="s60-input s60-select" id="s60-dictation-cue"><option value="-1">Full transcript / whole clip</option>${cues.map((c,i)=>`<option value="${i}">Cue ${i+1} · ${fmtTime(c.start)}</option>`).join('')}</select></section>
      <section class="s60-grid two"><article class="s60-card"><h3>1. Listen carefully</h3><p class="s60-muted">Current resource: ${esc(item.title)}</p><button class="s60-btn primary" data-s60-action="dictation-play">▶ Play selected segment</button><div class="s60-mini-progress" id="s60-dictation-status">Audio tayyorlanmoqda…</div><label class="s60-label" for="s60-dictation-answer">2. Write exactly what you hear</label><textarea class="s60-textarea" id="s60-dictation-answer" rows="7" placeholder="Write the words you heard. Keep spelling and word endings accurate."></textarea><div class="s60-actions"><button class="s60-btn primary" data-s60-action="dictation-check">Compare with transcript</button><button class="s60-btn" data-s60-action="dictation-reveal">Reveal reference</button></div></article><article class="s60-card"><h3>3. Diagnose the gap</h3><div id="s60-dictation-result" class="s60-result-placeholder">Comparison natijasi shu yerda paydo bo‘ladi.</div><div id="s60-dictation-reference" class="s60-reference" hidden></div><div class="s60-divider"></div><label>Asosiy xato turi<select class="s60-input" id="s60-dictation-error">${ERROR_TYPES.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><label>Repair strategy<textarea class="s60-textarea" rows="3" id="s60-dictation-repair" placeholder="Masalan: plural endings'ni eshitganda signal so‘z va noun ending’ga e’tibor qilaman."></textarea></label><button class="s60-btn" data-s60-action="dictation-save-error">Save error pattern</button></article></section>`;
  }
  function shadowingView() {
    const item=activeItem();if(!item)return `<div class="s60-empty">Audio import qiling, keyin Shadowing Lab’ni oching.</div>`;
    const cues=timedSegments(item);
    return `<section class="s60-section-head"><div><span class="s60-kicker">SPEECH RHYTHM · SHADOWING</span><h2>Listen, imitate, replay</h2><p>Original gapni tingla, ritm va chunking’ga e’tibor ber, so‘ng o‘zingni yozib solishtir. Bu avtomatik pronunciation score emas.</p></div></section>
      <section class="s60-grid two"><article class="s60-card"><h3>Source audio</h3><label>Segment<select class="s60-input" id="s60-shadow-cue"><option value="-1">Whole clip</option>${cues.map((c,i)=>`<option value="${i}">Cue ${i+1} · ${fmtTime(c.start)} · ${esc(c.text.slice(0,50))}</option>`).join('')}</select></label><button class="s60-btn primary" data-s60-action="shadow-play">▶ Listen to segment</button><div id="s60-shadow-source-status" class="s60-status">Source audio tayyorlanmoqda.</div><div class="s60-callout small">Shadowing checklist: stressed words · thought groups · linking · weak forms · sentence rhythm · intelligibility.</div></article>
      <article class="s60-card"><h3>Record your own attempt</h3><p class="s60-muted">Microphone faqat Record tugmasini bosgandan keyin so‘raladi. Yozuv faqat shu qurilmada saqlanadi; serverga yuborilmaydi.</p><div class="s60-actions"><button class="s60-btn primary" data-s60-action="shadow-record">● Record</button><button class="s60-btn" data-s60-action="shadow-stop" disabled id="s60-shadow-stop">■ Stop & save</button></div><div id="s60-shadow-status" class="s60-status" role="status" aria-live="polite">HTTPS + microphone permission talab qilinadi. Recording ixtiyoriy.</div><audio id="s60-shadow-playback" controls preload="none" class="s60-audio-native"></audio><label>Self-review<textarea id="s60-shadow-note" class="s60-textarea" rows="3" placeholder="Qaysi so‘zlar stressed? Qayerda pause yoki linkingni boshqacha qilding?"></textarea></label></article></section>
      <section class="s60-card"><div class="s60-title"><div><span class="s60-kicker">RECORDING HISTORY</span><h3>My shadowing attempts (${state.shadows.filter(x=>x.itemId===item.id).length})</h3></div></div>${renderShadowHistory(item)}</section>`;
  }
  function renderShadowHistory(item) {
    const rows=state.shadows.filter(x=>x.itemId===item.id).slice().reverse().slice(0,12);
    if(!rows.length)return '<div class="s60-empty compact">Hali recording yo‘q.</div>';
    return rows.map(row=>`<article class="s60-history"><div><b>${new Date(row.createdAt).toLocaleString()}</b><small>${Math.round((row.durationMs||0)/1000)}s · ${bytesLabel(row.size||0)} · ${esc(row.note||'No review note')}</small></div><div class="s60-actions"><button class="s60-btn small" data-s60-shadow-play="${esc(row.id)}">Play</button><button class="s60-btn small" data-s60-shadow-export="${esc(row.id)}">Export</button></div></article>`).join('');
  }
  function insightsView() {
    const counts={}; ERROR_TYPES.forEach(([id,label])=>counts[id]={label,count:0,last:''});
    state.errors.forEach(x=>{if(counts[x.kind]){counts[x.kind].count++;counts[x.kind].last=x.createdAt;}});
    const sorted=Object.entries(counts).sort((a,b)=>b[1].count-a[1].count);
    const top=sorted.find(([,x])=>x.count>0);
    const attempts=state.attempts.slice(-10), dict=state.dictations.slice(-10);
    return `<section class="s60-section-head"><div><span class="s60-kicker">LISTENING ERROR INTELLIGENCE</span><h2>Repeated listening problems → targeted repair</h2><p>Bu dashboard saqlangan quiz/dictation natijalari va o‘quvchi tanlagan xato turlariga asoslanadi; hidden AI diagnosis yoki examiner score emas.</p></div></section>
      <section class="s60-grid four"><article class="s60-stat-card"><b>${state.items.length}</b><span>Audio resources</span></article><article class="s60-stat-card"><b>${state.attempts.length}</b><span>Answer-key attempts</span></article><article class="s60-stat-card"><b>${state.dictations.length}</b><span>Dictation comparisons</span></article><article class="s60-stat-card"><b>${state.errors.length}</b><span>Saved error patterns</span></article></section>
      <section class="s60-grid two"><article class="s60-card"><h3>Most repeated error category</h3>${top?`<div class="s60-focus"><b>${esc(top[1].label)}</b><strong>${top[1].count}</strong><p>Recommended next step: shu xato turini boshqa audio yoki yangi cue bilan qayta sinab ko‘r.</p></div>`:'<div class="s60-empty compact">Xato pattern hali saqlanmagan. Dictation Lab’dan xatoni qayd qil.</div>'}<div class="s60-bars">${sorted.map(([id,x])=>`<div class="s60-bar-row"><span>${esc(x.label)}</span><div><i style="width:${state.errors.length?Math.round(x.count/state.errors.length*100):0}%"></i></div><b>${x.count}</b></div>`).join('')}</div></article>
      <article class="s60-card"><h3>Repair protocol</h3><ol class="s60-steps"><li><b>Notice:</b> transcript va eshitgan javobing orasidagi farqni top.</li><li><b>Classify:</b> paraphrase, distractor, word form, connected speech yoki accent turini tanla.</li><li><b>Repair:</b> bitta amaliy strategiyani yoz.</li><li><b>Transfer:</b> boshqa audio/cue’da qayta sinab ko‘r.</li><li><b>Review:</b> xato takrorlanmadimi, tarixga qayd et.</li></ol><p class="s60-muted">Adaptive 84-kunlik core plan o‘zgarmaydi; Stage 60 o‘z listening repair tarixini saqlaydi.</p></article></section>
      <section class="s60-grid two"><article class="s60-card"><h3>Recent answer-key attempts</h3>${attempts.length?attempts.reverse().map(x=>`<div class="s60-history"><div><b>${esc(x.title)}</b><small>${new Date(x.createdAt).toLocaleString()} · ${x.correctMarks}/${x.totalMarks} marks · ${Number(x.accuracyPct).toFixed(1)}%</small></div><span class="s60-chip">Raw</span></div>`).join(''):'<p class="s60-muted">No quiz attempts yet.</p>'}</article><article class="s60-card"><h3>Recent dictation comparisons</h3>${dict.length?dict.reverse().map(x=>`<div class="s60-history"><div><b>${esc(x.title)}</b><small>${new Date(x.createdAt).toLocaleString()} · ${x.werRate==null?'No reference':(x.werRate*100).toFixed(1)+'% WER'} · ${esc(x.kindLabel)}</small></div><span class="s60-chip">Dictation</span></div>`).join(''):'<p class="s60-muted">No dictations yet.</p>'}</article></section>`;
  }
  function resourcesView() {
    return `<section class="s60-section-head"><div><span class="s60-kicker">CURATED NATURAL LISTENING</span><h2>Real voices and trusted IELTS references</h2><p>External source pages open in a new tab. Audio stays on the provider’s site unless you separately import a file whose use is permitted.</p></div></section>
      <div class="s60-callout"><b>Exam format reference:</b> Listening 4 parts, 10 questions per part (40 total). Recordings are heard once in the official test, and accents may include British, Australian, New Zealand and North American. Use a mix of practice and strict one-play sessions.</div>
      <section class="s60-grid two">${RESOURCES.map(r=>`<article class="s60-resource-card"><span class="s60-kicker">${esc(r.type)}</span><h3>${esc(r.name)}</h3><div class="s60-tags"><span>${esc(r.level)}</span><span>${esc(r.accent)}</span></div><p>${esc(r.detail)}</p><a class="s60-btn link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></article>`).join('')}</section>
      <section class="s60-card"><h3>How to use an external natural-audio lesson</h3><ol class="s60-steps"><li>Open the provider’s lesson and listen on the original site.</li><li>Use its transcript and exercises there first; note the difficult phrase, accent or paraphrase.</li><li>Download/import a copy only where the provider’s terms allow it, or use your own recording.</li><li>When importing, record the source, licence/usage basis and speaker accent only if the page identifies it.</li><li>For an IELTS-style simulation, create 1–40 original prompts and an answer key on the Audio Library form.</li></ol><p class="s60-muted">Common Voice is for additional speech diversity, not a substitute for full IELTS multi-speaker tasks. Check dataset locale and file size before downloading.</p></section>`;
  }
  function fmtTime(seconds) { const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; }
  function updateAudioUI() {
    const audio=$('#s60-audio');if(!audio)return;
    const progress=$('#s60-progress'),time=$('#s60-time'),play=$('#s60-play');
    if(progress)progress.value=audio.duration?audio.currentTime/audio.duration*100:0;
    if(time)time.textContent=`${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
    if(play)play.textContent=audio.paused?'▶ Play':'Ⅱ Pause';
    const cues=timedSegments(activeItem());
    if(cues.length){const index=cues.findIndex(x=>audio.currentTime>=x.start&&audio.currentTime<x.end);if(index!==activeCueIndex){activeCueIndex=index;$$('[data-s60-cue]').forEach((el,i)=>el.classList.toggle('active',i===index));}}
    if(loopCue&&audio.currentTime>=loopCue.end){audio.currentTime=loopCue.start;audio.play().catch(()=>{});}
    if(examState.enabled&&examState.started&&audio.ended){examState.locked=true;setStatus('One-play session completed. To replay, switch to practice mode and start again.');const t=$('#s60-transcript-toggle');if(t)t.disabled=false;}
  }
  function setStatus(text, selector='#s60-audio-status') { const node=$(selector);if(node)node.textContent=text; }
  async function loadActiveAudio() {
    const item=activeItem(),audio=$('#s60-audio');if(!item||!audio)return;
    let url, mime=item.mime||'audio';
    if(item.builtin){url=new URL(item.audioUrl,document.baseURI).href;}
    else {const blob=await getBlob(item.blobId);if(!blob)throw new Error('Audio blob yo‘q. Full-device backup restore qiling yoki audio faylni qayta import qiling.');const old=objectUrls.get('player');if(old)URL.revokeObjectURL(old);url=URL.createObjectURL(blob);objectUrls.set('player',url);mime=blob.type||mime;}
    audio.src=url;audio.playbackRate=examState.enabled?1:Number(state.preferences.playbackRate)||1;
    audio.onloadedmetadata=()=>{updateAudioUI();setStatus(`Ready · ${fmtTime(audio.duration)} · ${mime}${item.builtin?' · bundled synthetic practice':''}`);};
    audio.ontimeupdate=updateAudioUI;
    audio.onended=()=>{updateAudioUI();if(examState.enabled){examState.locked=true;setStatus('One-play completed. Switch off exam mode to replay.');}};
    audio.onerror=()=>setStatus('Browser bu codec’ni playback qila olmayapti. MP3/WAV yoki browser qo‘llaydigan formatdan foydalan.');
  }
  async function playSelected(start=null,end=null) {
    const audio=$('#s60-audio');if(!audio||!audio.src)await loadActiveAudio();
    const el=$('#s60-audio');if(!el)return;
    if(examState.enabled){if(examState.locked){notify('Exam mode: this recording has already played once. Switch to practice mode to replay.');return;}if(!examState.started){el.currentTime=0;examState.started=true;}}
    else if(start!=null)el.currentTime=Math.max(0,Number(start)||0);
    if(end!=null&&end>0)loopCue={start:Number(start)||0,end:Number(end)};else loopCue=null;
    el.playbackRate=examState.enabled?1:Number(state.preferences.playbackRate)||1;
    await el.play();updateAudioUI();
  }
  function getSelectedCue(selector) {
    const item=activeItem(),cues=timedSegments(item),idx=Number($(selector)?.value??-1);
    if(idx>=0&&idx<cues.length)return {cue:cues[idx],index:idx};
    return {cue:null,index:-1};
  }
  function dictationReference() {
    const item=activeItem();if(!item)return '';
    const selected=getSelectedCue('#s60-dictation-cue');return selected.cue?.text||item.transcript||'';
  }
  function renderDictationResult(result) {
    const box=$('#s60-dictation-result');if(!box)return;
    if(!result.referenceWords){box.innerHTML='<p>Reference transcript is empty. Add transcript before comparing.</p>';return;}
    box.innerHTML=`<div class="s60-result-metrics"><div><b>${result.edits}</b><small>Word edits</small></div><div><b>${result.rate==null?'—':(result.rate*100).toFixed(1)+'%'}</b><small>Word Error Rate</small></div><div><b>${result.accuracy==null?'—':(result.accuracy*100).toFixed(1)+'%'}</b><small>Token similarity indicator</small></div></div><p class="s60-muted">WER is an educational text-comparison metric, not IELTS scoring. Punctuation/capitalisation are normalised; it does not assess pronunciation or meaning.</p>`;
  }
  function showDictationReference() {
    const ref=dictationReference(),box=$('#s60-dictation-reference');if(!box)return;
    box.hidden=false;box.textContent=ref||'No transcript available.';
  }
  function saveDictation() {
    const reference=dictationReference(),answer=$('#s60-dictation-answer')?.value||'',item=activeItem();
    if(!item||!reference.trim()||!answer.trim())throw new Error('Audio, reference transcript va o‘zing yozgan javob kerak.');
    const comparison=wer(reference,answer);
    const selected=getSelectedCue('#s60-dictation-cue');
    const row={id:uid('dict'),itemId:item.id,title:item.title,reference,answer,werRate:comparison.rate,edits:comparison.edits,referenceWords:comparison.referenceWords,hypothesisWords:comparison.hypothesisWords,kind:$('#s60-dictation-error')?.value||'other',kindLabel:ERROR_TYPES.find(x=>x[0]===($('#s60-dictation-error')?.value||'other'))?.[1]||'Other',cueIndex:selected.index,createdAt:now()};
    state.dictations.push(row);state.dictations=state.dictations.slice(-500);save();renderDictationResult(comparison);showDictationReference();notify('Dictation comparison saved. Keyingi audio cue’da xatoni transfer qilib ko‘r.');
  }
  function saveErrorFromDictation() {
    const item=activeItem(),dict=state.dictations.slice().reverse().find(x=>x.itemId===item?.id);
    const repair=$('#s60-dictation-repair')?.value.trim()||'';
    if(!item||!dict)throw new Error('Avval dictation comparison bajaring.');
    if(repair.length<12)throw new Error('Repair strategy kamida 12 belgidan iborat bo‘lsin.');
    const kind=$('#s60-dictation-error')?.value||'other';
    state.errors.push({id:uid('err'),itemId:item.id,dictationId:dict.id,kind,kindLabel:ERROR_TYPES.find(x=>x[0]===kind)?.[1]||'Other',heard:dict.answer,reference:dict.reference,repair,createdAt:now(),resolved:false});
    state.errors=state.errors.slice(-500);save();notify('Listening error pattern saved. Boshqa audio’da transfer retest qil.');
  }
  async function saveQuiz(event) {
    event.preventDefault();const item=activeItem();if(!item||!item.quizKeys?.length)throw new Error('This audio has no answer key.');
    const form=$('#s60-quiz-form');const answers=item.quizKeys.map((_,i)=>form.elements[`answer-${i}`]?.value||'');
    if(answers.every(x=>!x.trim()))throw new Error('At least one learner answer is needed.');
    const engine=global.IELTSBoostStage59Scoring;if(!engine?.scoreAnswerKey)throw new Error('Stage 59 scoring engine is not loaded.');
    const raw=engine.scoreAnswerKey({keysText:item.quizKeys.join('\n'),answersText:answers.join('\n')});
    const attempt={id:uid('attempt'),itemId:item.id,title:item.title,day:item.day||null,questionCount:raw.questionCount,correctQuestions:raw.correctQuestions,blankQuestions:raw.blankQuestions,correctMarks:raw.correctMarks,totalMarks:raw.totalMarks,accuracyPct:raw.accuracyPct,source:item.builtin?'IELTS Boost bundled original answer key':(item.answerKeyChecked?'Learner-marked checked source':'Unverified / user supplied'),keySourceVerified:!!item.answerKeyChecked,adaptiveSynced:false,createdAt:now()};
    if(item.builtin||item.answerKeyChecked){
      const studio=global.__IELTS_BOOST_ADVANCED_STUDIO__;
      if(typeof studio?.recordObjectiveAnswerKeyScore==='function'){
        studio.recordObjectiveAnswerKeyScore({type:'listening',promptId:item.id,source:item.title,accuracy:raw.accuracyPct/100,correct:raw.correctMarks,total:raw.totalMarks,correctQuestions:raw.correctQuestions,questionCount:raw.questionCount,verified:true,sourceLabel:item.builtin?'IELTS Boost bundled original script + answer key':'Learner-marked answer key; user confirmed source',format:'stage59-answer-key-v1',stage60AttemptId:attempt.id,day:item.day||null});
        attempt.adaptiveSynced=true;
      }
    }
    state.attempts.push(attempt);state.attempts=state.attempts.slice(-500);save();
    const result=$('#s60-quiz-result');if(result){result.innerHTML=`<div class="s60-result-metrics"><div><b>${raw.correctMarks}/${raw.totalMarks}</b><small>Raw marks</small></div><div><b>${raw.correctQuestions}/${raw.questionCount}</b><small>Correct questions</small></div><div><b>${raw.accuracyPct.toFixed(1)}%</b><small>Accuracy</small></div></div><div class="s60-review-list">${raw.items.map((row,i)=>`<article class="s60-review-row ${row.correct?'is-correct':'is-incorrect'}"><b>Q${i+1} · ${row.correct?'Correct':'Review'}</b><p>Your answer: ${esc(row.response||'Blank')} · Key: ${esc(row.key)}</p>${item.questionExplanations?.[i]?`<small>${esc(item.questionExplanations[i])}</small>`:''}${item.questionEvidence?.[i]?`<small>Evidence: ${esc(item.questionEvidence[i])}</small>`:''}</article>`).join('')}</div><p class="s60-muted">This is a raw practice result, not an IELTS band prediction.</p>`;}
    notify(`Raw result: ${raw.correctMarks}/${raw.totalMarks} marks · ${raw.accuracyPct.toFixed(1)}%. This is not an IELTS band score.`);
  }
  function fileExt(name) { return String(name||'').split('.').pop().toLowerCase(); }
  async function saveImport(event) {
    event.preventDefault();const form=event.target,fd=new FormData(form),audioFile=fd.get('audio'),transcriptFile=fd.get('transcriptFile');
    if(!(audioFile instanceof File)||!audioFile.size)throw new Error('Audio file tanlang.');
    if(fd.get('rights')!=='on')throw new Error('Audio/transcriptdan foydalanish huquqini tasdiqlang.');
    if(audioFile.size>MAX_FILE_BYTES)throw new Error(`Audio fayl ${bytesLabel(MAX_FILE_BYTES)} limitidan oshmasin.`);
    const allowedAudioExt=new Set(['mp3','wav','m4a','aac','ogg','oga','opus','webm','flac']);
    const ext=fileExt(audioFile.name);
    if(!allowedAudioExt.has(ext)|| (audioFile.type && !/^audio\//i.test(audioFile.type) && !(ext==='webm'&&/webm/i.test(audioFile.type))))throw new Error('Fayl audio formatida bo‘lishi kerak. MP3, WAV, M4A, AAC, OGG, OPUS, WEBM yoki FLAC tanla.');
    const title=String(fd.get('title')||'').trim();if(!title)throw new Error('Audio title kiriting.');
    let transcript='';
    if(transcriptFile instanceof File&&transcriptFile.size){if(transcriptFile.size>MAX_TRANSCRIPT_CHARS)throw new Error('Transcript file juda katta.');const parsed=parseTranscript(await transcriptFile.text(),transcriptFile.name);transcript=parsed.text;}
    else if(String(fd.get('transcriptText')||'').trim())transcript=parseTranscript(fd.get('transcriptText'),'transcript.txt').text;
    let segments=[];
    if(transcriptFile instanceof File&&transcriptFile.size){segments=parseTranscript(await transcriptFile.text(),transcriptFile.name).segments;}
    const prompts=String(fd.get('questions')||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
    const keys=String(fd.get('answerKey')||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
    if((prompts.length||keys.length)&&(prompts.length!==keys.length||!prompts.length||prompts.length>MAX_QUESTIONS))throw new Error('Question prompts va answer key qatorlari teng bo‘lsin (1–40).');
    if(prompts.some(x=>x.length>500))throw new Error('Har bir question prompt 500 belgidan oshmasin.');
    if(keys.some(x=>x.length>250||!x))throw new Error('Answer key qatori bo‘sh yoki 250 belgidan uzun.');
    const sourceUrl=String(fd.get('sourceUrl')||'').trim();if(sourceUrl&&!/^https:\/\//i.test(sourceUrl))throw new Error('Source URL HTTPS bo‘lishi kerak.');
    await storageCheck(audioFile.size);
    const id=uid('audio'),blobId=`s60-${id}`;
    const record={id,blobId,title,filename:audioFile.name.slice(0,180),mime:audioFile.type||'application/octet-stream',size:audioFile.size,part:String(fd.get('part')||'0'),level:String(fd.get('level')||'Unknown'),accent:String(fd.get('accent')||'Unknown / not labelled'),taskType:String(fd.get('taskType')||'Mixed / custom'),sourceName:String(fd.get('sourceName')||'').trim().slice(0,120),sourceUrl,usage:String(fd.get('usage')||'own'),transcript,transcriptFormat:segments.length?'timed':'plain-text',segments:segments.slice(0,MAX_SEGMENTS),questions:prompts,quizKeys:keys,answerKeyChecked:fd.get('answerKeySource')==='on',createdAt:now(),lastPlayedAt:null,playCount:0};
    const status=$('#s60-import-status');if(status)status.textContent='Audio storage’ga yozilmoqda…';
    await putBlob(blobId,audioFile);
    state.items.push(record);state.items=state.items.slice(-MAX_ITEMS);state.activeItemId=id;state.activeTab='player';
    if(!save()){await deleteBlob(blobId);state.items=state.items.filter(x=>x.id!==id);throw new Error('Metadata saqlanmadi; audio rollback qilindi. Storage bo‘shating.');}
    form.reset();notify('Audio imported. Player, timed transcript va quiz tayyor.');render();await loadActiveAudio();
  }
  async function deleteItem(id) {
    const item=state.items.find(x=>x.id===id);if(!item)return;
    if(!global.confirm(`“${item.title}” audio va unga bog‘langan shadowing fayllarini o‘chirasizmi? Buni backup’siz qaytarib bo‘lmaydi.`))return;
    const shadows=state.shadows.filter(x=>x.itemId===id);
    await Promise.all([deleteBlob(item.blobId),...shadows.map(x=>deleteBlob(x.blobId).catch(()=>{}))]);
    state.items=state.items.filter(x=>x.id!==id);state.shadows=state.shadows.filter(x=>x.itemId!==id);state.attempts=state.attempts.filter(x=>x.itemId!==id);state.dictations=state.dictations.filter(x=>x.itemId!==id);state.errors=state.errors.filter(x=>x.itemId!==id);if(state.activeItemId===id)state.activeItemId=state.items[0]?.id||'builtin-day-01';
    save();render();notify('Audio resource and linked local data deleted.');
  }
  function download(blob,name) { const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500); }
  async function exportAudio(id) { const item=state.items.find(x=>x.id===id);if(!item)throw new Error('Audio resource not found.');const blob=await getBlob(item.blobId);if(!blob)throw new Error('Audio blob missing.');const ext=fileExt(item.filename)||'audio';download(blob,`IELTS-Boost-Stage60-${item.title}.${ext}`); }
  async function openShadowRecording() {
    if(!global.isSecureContext)throw new Error('Microphone recording requires HTTPS or localhost.');
    if(!navigator.mediaDevices?.getUserMedia||!global.MediaRecorder)throw new Error('MediaRecorder/microphone API unavailable in this browser.');
    if(pendingRecorder&&pendingRecorder.state!=='inactive')throw new Error('Avval joriy recordingni to‘xtating.');
    pendingStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const mimeChoices=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
    const mime=mimeChoices.find(x=>MediaRecorder.isTypeSupported?.(x))||'';
    pendingRecorder=mime?new MediaRecorder(pendingStream,{mimeType:mime}):new MediaRecorder(pendingStream);
    pendingShadowChunks=[];const item=activeItem(),selected=getSelectedCue('#s60-shadow-cue');
    pendingShadowMeta={id:uid('shadow'),itemId:item?.id||'',title:item?.title||'',cueIndex:selected.index,startedAt:Date.now(),mime};
    pendingRecorder.ondataavailable=e=>{if(e.data&&e.data.size)pendingShadowChunks.push(e.data);};
    pendingRecorder.onerror=e=>setStatus(`Recording error: ${e.error?.message||'unknown'}`,'#s60-shadow-status');
    pendingRecorder.onstop=async()=>{
      const chunks=pendingShadowChunks.slice(),meta=pendingShadowMeta;pendingShadowChunks=[];pendingShadowMeta=null;const blob=new Blob(chunks,{type:mime||chunks[0]?.type||'audio/webm'});
      if(meta&&blob.size){try{await storageCheck(blob.size);const blobId=`s60-shadow-${meta.id}`;await putBlob(blobId,blob);const row={id:meta.id,blobId,itemId:meta.itemId,title:meta.title,size:blob.size,mime:blob.type,durationMs:Date.now()-meta.startedAt,note:$('#s60-shadow-note')?.value.trim()||'',createdAt:now()};state.shadows.push(row);state.shadows=state.shadows.slice(-200);save();const player=$('#s60-shadow-playback');if(player){const old=objectUrls.get('shadow-playback');if(old)URL.revokeObjectURL(old);const url=URL.createObjectURL(blob);objectUrls.set('shadow-playback',url);player.src=url;}setStatus(`Shadowing recording saved · ${bytesLabel(blob.size)}`,'#s60-shadow-status');}catch(err){setStatus(`Recording saqlanmadi: ${err.message}`,'#s60-shadow-status');}}
      if(pendingStream){pendingStream.getTracks().forEach(t=>t.stop());pendingStream=null;}pendingRecorder=null;
      const stop=$('#s60-shadow-stop');if(stop)stop.disabled=true;
    };
    pendingRecorder.start(1000);const stop=$('#s60-shadow-stop');if(stop)stop.disabled=false;setStatus('Recording in progress… Stop & save tugmasini bos.','#s60-shadow-status');
  }
  function stopShadowRecorder(silent=false) {
    if(pendingRecorder&&pendingRecorder.state!=='inactive'){try{pendingRecorder.stop();if(!silent)setStatus('Recording saving…','#s60-shadow-status');}catch(e){console.warn(e);}}
    else if(pendingStream){pendingStream.getTracks().forEach(t=>t.stop());pendingStream=null;}
  }
  async function playShadow(id) {
    const row=state.shadows.find(x=>x.id===id);if(!row)throw new Error('Shadowing recording metadata missing.');
    const blob=await getBlob(row.blobId);if(!blob)throw new Error('Shadowing audio blob missing.');const player=$('#s60-shadow-playback');if(!player)throw new Error('Shadowing player not found.');
    const old=objectUrls.get('shadow-playback');if(old)URL.revokeObjectURL(old);const url=URL.createObjectURL(blob);objectUrls.set('shadow-playback',url);player.src=url;await player.play();
  }
  async function exportShadow(id) { const row=state.shadows.find(x=>x.id===id);if(!row)throw new Error('Shadowing record missing.');const blob=await getBlob(row.blobId);if(!blob)throw new Error('Audio blob missing.');download(blob,`IELTS-Boost-Shadow-${id}.${blob.type.includes('mp4')?'m4a':'webm'}`); }
  async function handleAction(action, button) {
    const item=activeItem();
    switch(action){
      case 'refresh-library':render();break;
      case 'play-toggle':{const audio=$('#s60-audio');if(!audio)break;if(examState.enabled&&examState.started&&!audio.paused){notify('Strict one-play mode: playback cannot be paused after it starts. Switch to practice mode for pause, replay or cue controls.');break;}if(audio.paused)await playSelected();else audio.pause();updateAudioUI();break;}
      case 'repeat-cue':{if(examState.enabled)throw new Error('Repeat is disabled in strict one-play mode.');const cues=timedSegments(item);if(activeCueIndex<0||!cues[activeCueIndex])throw new Error('Play the audio and select a timed cue first.');const c=cues[activeCueIndex];await playSelected(c.start,c.end);break;}
      case 'toggle-transcript':{if(examState.enabled&&!examState.locked)throw new Error('Strict one-play mode hides transcript until the complete recording has finished.');state.preferences.transcriptHidden=!state.preferences.transcriptHidden;save();const node=$('#s60-transcript-box'),btn=$('#s60-transcript-toggle');node?.classList.toggle('is-hidden',state.preferences.transcriptHidden);if(btn)btn.textContent=state.preferences.transcriptHidden?'Reveal transcript':'Hide transcript';break;}
      case 'dictation-play':{const {cue}=getSelectedCue('#s60-dictation-cue');if(cue)await playSelected(cue.start,cue.end);else await playSelected();setStatus('Listen once, then write what you heard.','#s60-dictation-status');break;}
      case 'dictation-check':{const reference=dictationReference(),answer=$('#s60-dictation-answer')?.value||'';if(!answer.trim())throw new Error('Write the words you heard first.');const result=wer(reference,answer);renderDictationResult(result);showDictationReference();state.dictations.push({id:uid('dict'),itemId:item?.id,title:item?.title||'',reference,answer,werRate:result.rate,edits:result.edits,referenceWords:result.referenceWords,kind:'unclassified',kindLabel:'Not yet classified',createdAt:now()});state.dictations=state.dictations.slice(-500);save();break;}
      case 'dictation-reveal':showDictationReference();break;
      case 'dictation-save-error':saveErrorFromDictation();break;
      case 'shadow-play':{const {cue}=getSelectedCue('#s60-shadow-cue');if(cue)await playSelected(cue.start,cue.end);else await playSelected();setStatus('Listen to the source, then record your own attempt.','#s60-shadow-source-status');break;}
      case 'shadow-record':await openShadowRecording();break;
      case 'shadow-stop':stopShadowRecorder(false);break;
      default:break;
    }
  }
  function bind() {
    if(!overlay||overlay.dataset.bound==='1')return;overlay.dataset.bound='1';
    overlay.addEventListener('click',async event=>{
      const closeBtn=event.target.closest('[data-s60-close]');if(closeBtn){close();return;}
      const tab=event.target.closest('[data-s60-tab]');if(tab){setTab(tab.dataset.s60Tab);return;}
      const openItem=event.target.closest('[data-s60-item],[data-s60-builtin]');if(openItem){state.activeItemId=openItem.dataset.s60Item||openItem.dataset.s60Builtin;state.activeTab='player';examState={enabled:false,started:false,locked:false};save();render();loadActiveAudio().catch(e=>notify(e.message));return;}
      const del=event.target.closest('[data-s60-delete]');if(del){deleteItem(del.dataset.s60Delete).catch(e=>notify(e.message));return;}
      const exp=event.target.closest('[data-s60-export]');if(exp){exportAudio(exp.dataset.s60Export).catch(e=>notify(e.message));return;}
      const cue=event.target.closest('[data-s60-cue]');if(cue){if(examState.enabled) {notify('Cue seeking is disabled in strict exam mode.');return;}const cues=timedSegments(activeItem()),c=cues[Number(cue.dataset.s60Cue)];if(c){activeCueIndex=Number(cue.dataset.s60Cue);playSelected(c.start).catch(e=>notify(e.message));}return;}
      const shadowPlay=event.target.closest('[data-s60-shadow-play]');if(shadowPlay){playShadow(shadowPlay.dataset.s60ShadowPlay).catch(e=>notify(e.message));return;}
      const shadowExport=event.target.closest('[data-s60-shadow-export]');if(shadowExport){exportShadow(shadowExport.dataset.s60ShadowExport).catch(e=>notify(e.message));return;}
      const action=event.target.closest('[data-s60-action]');if(action){try{await handleAction(action.dataset.s60Action,action);}catch(e){notify(e.message||'Action failed.');}return;}
    });
    overlay.addEventListener('change',async event=>{
      const select=event.target;
      if(select.id==='s60-active-item'){state.activeItemId=select.value;examState={enabled:false,started:false,locked:false};save();render();try{await loadActiveAudio();}catch(e){notify(e.message);} }
      if(select.id==='s60-speed'){state.preferences.playbackRate=Number(select.value)||1;save();const audio=$('#s60-audio');if(audio&&!examState.enabled)audio.playbackRate=state.preferences.playbackRate;}
      if(select.id==='s60-exam-mode'){examState={enabled:select.checked,started:false,locked:false};if(select.checked){state.preferences.transcriptHidden=true;save();}const audio=$('#s60-audio');if(audio){audio.pause();audio.currentTime=0;audio.playbackRate=1;}render();loadActiveAudio().catch(e=>notify(e.message));}
    });
    overlay.addEventListener('submit',event=>{
      if(event.target.id==='s60-import-form'){const status=$('#s60-import-status');if(status)status.textContent='Validating and storing…';saveImport(event).catch(e=>{if(status)status.textContent=e.message;notify(e.message);});}
      else if(event.target.id==='s60-quiz-form')saveQuiz(event).catch(e=>notify(e.message));
    });
  }
  function ensureEntry() {
    const nav=$('#nav');
    if(nav&&!nav.querySelector('[data-s60-open]')){
      const button=document.createElement('button');button.type='button';button.className='s51-nav-item s60-nav-entry';button.dataset.s60Open='1';button.setAttribute('aria-haspopup','dialog');button.innerHTML='<span class="nav-icon">♫</span><span>Listening Hub</span>';
      const library=nav.querySelector('[data-page="library"]');if(library)library.insertAdjacentElement('afterend',button);else nav.appendChild(button);
    }
    const mobile=$('#mobileBottom');
    if(mobile&&!mobile.querySelector('[data-s60-open]')){
      const button=document.createElement('button');button.type='button';button.dataset.s60Open='1';button.setAttribute('aria-haspopup','dialog');button.innerHTML='<b>♫</b>Listen';mobile.appendChild(button);
    }
    const app=$('#app');
    const listeningActive=!!app?.querySelector('.s51-hub-tabs[aria-label="practice"] [data-value="listening"][aria-selected="true"]');
    const priorCta=app?.querySelector('[data-s60-listening-cta]');
    if(!listeningActive){priorCta?.remove();return;}
    if(app&&!priorCta){
      const card=document.createElement('section');card.className='s60-practice-cta';card.dataset.s60ListeningCta='1';card.innerHTML='<div><span>STAGE 60 · REAL LISTENING</span><b>Listening Intelligence Hub</b><small>84 bundled daily tracks · imported natural audio · timed transcript · dictation · shadowing</small></div><button type="button" data-s60-open aria-haspopup="dialog">Open Listening Hub ↗</button>';
      const intro=app.querySelector('.s51-section-intro');if(intro)intro.insertAdjacentElement('afterend',card);else app.prepend(card);
    }
  }
  function render() {
    if(!overlay)return;
    overlay.innerHTML=shell();
    bind();
  }
  function init() {
    if(!API?.getExtensionState||!API?.setExtensionState){console.error('Stage 60 requires Advanced Studio extension storage.');return;}
    ensureEntry();
    const oldRender=global.render;
    if(typeof oldRender==='function'&&!oldRender.__s60Wrapped){
      const wrapped=function(){const result=oldRender.apply(this,arguments);global.requestAnimationFrame(ensureEntry);return result;};wrapped.__s60Wrapped=true;global.render=wrapped;
    }
    new MutationObserver(ensureEntry).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-s60-open]');if(trigger){event.preventDefault();event.stopImmediatePropagation();open(trigger);}},true);
    document.addEventListener('keydown',event=>{
      if(!openState||!overlay)return;
      if(event.key==='Escape'){close();return;}
      if(event.key==='Tab'){
        const items=$$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',overlay).filter(x=>x.offsetParent!==null);
        if(!items.length)return;const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    global.addEventListener('pagehide',()=>{stopShadowRecorder(true);for(const url of objectUrls.values())URL.revokeObjectURL(url);objectUrls.clear();});
    global.__IELTS_BOOST_STAGE60_READY__=true;
  }
  global.IELTSBoostStage60=Object.freeze({version:VERSION,open,close,getState:()=>JSON.parse(JSON.stringify(state)),parseTranscript,wordErrorRate:wer,getBuiltInItems:()=>builtInItems().map(x=>({id:x.id,title:x.title,day:x.day,audioUrl:x.audioUrl,questionCount:x.questions.length,accent:x.accent,sourceNote:x.sourceNote})),resources:RESOURCES,parts:PARTS});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
