/* IELTS Boost Stage 58 · Intelligent Adaptive Learning
 * Adds an optional learning layer. The original 84-day curriculum and its routes remain untouched.
 * All learner content stays local and is stored inside the existing Advanced Studio backup payload.
 */
(function (window, document) {
  'use strict';
  const API = window.__IELTS_BOOST_ADVANCED_STUDIO__;
  const CORE = window.__IELTS_BOOST_CORE__;
  const STORE_KEY = 'IELTSBoost_Stage58_Fallback_v1';
  const VOCAB_URL = './data/stage58-vocabulary.json';
  const SKILLS = ['reading', 'listening', 'writing', 'speaking'];
  const LABEL = {reading:'Reading', listening:'Listening', writing:'Writing', speaking:'Speaking'};
  const CRITERIA = {
    writing: [
      ['Task response', 'Savolning barcha qismlariga javob berdimmi?'],
      ['Coherence & cohesion', 'Fikrlar mantiqiy tartibda va aniq bog‘langanmi?'],
      ['Lexical precision', 'So‘zlarni ma’nosi va collocation’iga mos ishlatdimmi?'],
      ['Grammar control', 'Gaplarimda grammatik aniqlikni tekshirdimmi?']
    ],
    speaking: [
      ['Fluency & coherence', 'Javobni tabiiy davom ettirdimmi va fikrni bog‘ladimmi?'],
      ['Lexical resource', 'Aniq va kontekstga mos so‘z tanladimmi?'],
      ['Grammar range & accuracy', 'Gap tuzilishini nazorat qildimmi?'],
      ['Pronunciation reflection', 'Ovoz yozuvimni tinglab, tushunarlilik va urg‘uni tekshirdimmi?']
    ]
  };
  const PHASES = [
    {name:'Foundation reset', weeks:[1,2,3], aim:'Asosiy tushunish, gap qurish va xato sababini aniqlash.', methods:['Eng ko‘p uchraydigan 2 xatoni ajratish','Bir savol turini alohida mashq qilish','Har javobga qisqa dalil yozish']},
    {name:'Accuracy & control', weeks:[4,5,6], aim:'Aniqlik, so‘z shakli, paraphrase va grammatik nazoratni oshirish.', methods:['Distractor va correction cue’larni ajratish','Javobni source evidence bilan tekshirish','Yozma va og‘zaki javobni qayta tahrirlash']},
    {name:'Transfer & range', weeks:[7,8,9], aim:'O‘rgangan usulni yangi mavzu va yangi promptga ko‘chirish.', methods:['Yangi passage yoki audio bilan transfer','Bir mavzuda 2 xil paraphrase sinash','Speaking’da sabab + misol + izoh bilan rivojlantirish']},
    {name:'Exam integration', weeks:[10,11,12], aim:'To‘rtta skillni birgalikda qo‘llash va zaif nuqtani nazorat qilish.', methods:['Aralash skill mashqi','Xatolarni qayta sinash','Mock natijasidan keyingi aniq repair rejasini tanlash']}
  ];
  const STOP = new Set(('the a an and or but if then than to of in on at by for from with about as is are was were be been being it its this that these those they them their he she we you i my our your his her who which what when where why how do does did have has had can could would should will may might must not no yes very more most much many some any each every another other also only own same such into over under between across through after before because while during against without up down out all both few several there here than'.split(' ')));
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const words = text => String(text || '').match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const addDays = (date, days) => { const d = new Date((date || today()) + 'T12:00:00'); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const cap = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));
  const norm = text => String(text || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const deepCopy = value => JSON.parse(JSON.stringify(value));
  const defaults = () => ({
    schemaVersion:1, activeTab:'overview', goal:{baseline:'5.0',target:'6.5'},
    diagnostics:{reading:null,listening:null,writing:null,speaking:null},
    vocabulary:{starter:[1,2,3,4,5],activeId:1,progress:{},pressureChecks:[]},
    crossSkill:{checks:{},lastSource:''}, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
  });
  let state = loadState();
  let vocabulary = null;
  let vocabularyError = '';
  let overlay = null;
  let lastTrigger = null;
  let isOpen = false;
  let toastTimer = null;

  function loadState() {
    try {
      const saved = API && API.getExtensionState ? API.getExtensionState('stage58') : null;
      if (saved && typeof saved === 'object') return migrate(saved);
    } catch (error) { console.warn('Stage 58 backup-state read:', error); }
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      return saved && typeof saved === 'object' ? migrate(saved) : defaults();
    } catch (_) { return defaults(); }
  }
  function migrate(saved) {
    const base = defaults();
    const next = Object.assign(base, saved);
    next.schemaVersion = 1;
    next.goal = Object.assign(base.goal, saved.goal || {});
    next.diagnostics = Object.assign(base.diagnostics, saved.diagnostics || {});
    next.vocabulary = Object.assign(base.vocabulary, saved.vocabulary || {});
    next.vocabulary.progress = Object.assign({}, saved.vocabulary && saved.vocabulary.progress || {});
    next.vocabulary.starter = Array.isArray(next.vocabulary.starter) ? next.vocabulary.starter.slice(0,5) : [1,2,3,4,5];
    next.vocabulary.pressureChecks = Array.isArray(next.vocabulary.pressureChecks) ? next.vocabulary.pressureChecks : [];
    next.crossSkill = Object.assign(base.crossSkill, saved.crossSkill || {});
    next.crossSkill.checks = Object.assign({}, next.crossSkill.checks || {});
    return next;
  }
  function save() {
    state.updatedAt = new Date().toISOString();
    let saved = false;
    try {
      if (API && API.setExtensionState) { API.setExtensionState('stage58', state); saved = true; }
    } catch (error) { console.warn('Stage 58 unified backup save:', error); }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); saved = true; } catch (_) { /* quota: keep current in-memory session */ }
    return saved;
  }
  function notify(message) {
    const node = $('#s58-toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }
  function initNav() {
    const nav = $('#nav');
    if (nav && !nav.querySelector('[data-s58-open]')) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.s58Open = '1'; button.setAttribute('aria-haspopup','dialog');
      button.innerHTML = '<span class="nav-icon">✦</span>Adaptive';
      nav.appendChild(button);
    }
    const mobile = $('#mobileBottom');
    if (mobile && !mobile.querySelector('[data-s58-open]')) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.s58Open = '1'; button.setAttribute('aria-haspopup','dialog');
      button.innerHTML = '<b>✦</b>Adapt';
      mobile.appendChild(button);
    }
  }
  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 's58-overlay'; overlay.className = 's58-overlay'; overlay.hidden = true;
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Stage 58 Intelligent Adaptive Learning');
    document.body.appendChild(overlay);
    return overlay;
  }
  function open(trigger) {
    if(trigger && trigger.matches && trigger.matches('[data-s58-open]')) lastTrigger=trigger;
    createOverlay(); isOpen = true; overlay.hidden = false; document.body.classList.add('s58-open');
    render();
    const close = $('[data-s58-close]', overlay); if (close) close.focus();
  }
  function close() {
    if (!overlay) return;
    isOpen = false; overlay.hidden = true; document.body.classList.remove('s58-open');
    const trigger = lastTrigger && lastTrigger.isConnected ? lastTrigger : $('[data-s58-open]'); if (trigger) trigger.focus();
  }
  function routeFromRate(rate) { return rate < 55 ? 'foundation' : rate < 80 ? 'core' : 'stretch'; }
  function routeLabel(route) { return ({unassessed:'Diagnostika kerak',foundation:'Foundation · asoslarni tiklash',core:'Core · aniqlik va nazorat',stretch:'Stretch · transfer va murakkablik'})[route] || 'Diagnostika kerak'; }
  function reflectionLabel(value) { return ({support:'Ko‘proq yordam kerak',developing:'Ba’zan mustaqil bajara olaman',secure:'Odatda mustaqil bajara olaman'})[value] || 'Tanlanmagan'; }
  function sampleStats(text) {
    const tokens = words(text); const sentences = String(text || '').split(/[.!?]+/).filter(x=>x.trim());
    const paras = String(text || '').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    const content = tokens.map(x=>x.toLowerCase()).filter(x=>x.length>3 && !STOP.has(x));
    const counts = new Map(); content.forEach(x=>counts.set(x,(counts.get(x)||0)+1));
    const repeats = Array.from(counts.entries()).filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const unique = new Set(content).size;
    return {wordCount:tokens.length,sentenceCount:sentences.length,paragraphCount:paras.length,contentWordCount:content.length,lexicalVariety:content.length?unique/content.length:0,repeated:repeats};
  }
  function studioSnapshot() { try { return API && API.getStateSnapshot ? API.getStateSnapshot() : {}; } catch (_) { return {}; } }
  function mainSnapshot() { try { return CORE && CORE.getStateSnapshot ? CORE.getStateSnapshot() : {}; } catch (_) { return {}; } }
  function errorSignals() {
    const main = mainSnapshot(); const studio = studioSnapshot();
    const records = [...(Array.isArray(main.errors)?main.errors:[]), ...(Array.isArray(studio.errors)?studio.errors:[])].filter(x=>x && !x.resolved);
    const map = Object.fromEntries(SKILLS.map(s=>[s,[]]));
    records.forEach(error=>{
      const raw = norm(error.skill || error.type || '');
      const target = SKILLS.find(s=>raw.includes(s));
      if (target) map[target].push(error);
    });
    return map;
  }
  function objectiveSignals(skill) {
    const studio = studioSnapshot();
    const main = mainSnapshot();
    const rows = [];
    // Repeated, answer-key-verified diagnostics entered in this adaptive layer.
    const localAttempts = state.diagnostics[skill]?.attempts || [];
    localAttempts.forEach(x => {
      if (x && x.verified === true && Number.isFinite(Number(x.rate)) && x.total > 0) {
        rows.push({key:`manual:${norm(x.source)}`, date:x.attemptId||x.date||'', rate:Number(x.rate), source:x.source||'Answer-key diagnostic'});
      }
    });
    // Legacy Reading records are retained as before; Stage 59 adds answer-key-verified
    // Reading AND Listening attempts with accuracy stored as a 0–1 ratio.
    const scores = (Array.isArray(studio.scores)?studio.scores:[]).filter(x => {
      if (!x || x.objective !== true || !x.promptId || !Number.isFinite(Number(x.accuracy))) return false;
      const type = String(x.type||'').toLowerCase();
      if (x.format === 'stage59-answer-key-v1') return type === skill;
      return skill === 'reading' && type === 'reading';
    });
    scores.forEach(x => rows.push({key:`studio:${String(x.promptId)}`,date:x.date||'',rate:Number(x.accuracy)*(x.format === 'stage59-answer-key-v1' ? 100 : 10),source:`Studio ${x.promptId}`}));
    // Licensed mock answer sheets store objective correct/attempted counts for both Reading and Listening.
    (Array.isArray(main.licensedMockHistory)?main.licensedMockHistory:[]).forEach((x,i) => {
      const part=x && x[skill];
      if (part && Number(part.attempted)>0 && Number.isFinite(Number(part.accuracy))) {
        rows.push({key:`licensed:${norm(x.source)}:${x.at||i}`,date:x.at||'',rate:Number(part.accuracy),source:x.source||'Licensed answer sheet'});
      }
    });
    const unique = new Map();
    rows.forEach(x => { if (x.key) unique.set(x.key,x); });
    const latest = Array.from(unique.values()).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-12);
    if (latest.length < 3) return {available:false,count:latest.length,rate:null,sources:latest.map(x=>x.source)};
    return {available:true,count:latest.length,rate:latest.reduce((sum,x)=>sum+cap(x.rate,0,100),0)/latest.length,sources:latest.map(x=>x.source)};
  }
  function focusPractice(skill, focus, weakCriteria=[]) {
    const key=norm(focus);
    if (skill==='reading') {
      if (key.includes('true') || key.includes('false') || key.includes('not given')) return 'TFNG: har bir statement uchun exact supporting line top; “false” bilan “not given”ni farqlab, dalilni o‘z so‘zing bilan yoz.';
      if (key.includes('yes') || key.includes('no')) return 'Writer’s views: muallif fikri, fakt va boshqa odamning qarashini ajrat; Yes/No/Not Given qarorini muallif pozitsiyasi bilan asosla.';
      if (key.includes('heading')) return 'Matching headings: har paragrafning asosiy vazifasini 5–8 so‘zda ifoda et; misolni main idea deb qabul qilma.';
      if (key.includes('matching information') || key.includes('matching features') || key.includes('sentence endings')) return 'Matching: ism, sana va maxsus detail’ni skan qil; paraphrase orqali moslikni tekshir, faqat bir xil so‘zga ishonma.';
      if (key.includes('summary') || key.includes('completion') || key.includes('table') || key.includes('note') || key.includes('flow')) return 'Completion: javobdan oldin kerakli so‘z turini taxmin qil; word limit, singular/plural va passage’dagi ayni iborani tekshir.';
      if (key.includes('diagram')) return 'Diagram labelling: diagramdagi label tartibini kuzat; passage’dan joylashuv/part nomini dalil bilan top.';
      if (key.includes('multiple choice')) return 'Multiple choice: har bir variant uchun passage dalilini top; qisman to‘g‘ri distractor va butunlay mos javobni farqla.';
      if (key.includes('short-answer')) return 'Short answer: savolning grammatik shakliga mos qisqa javob yoz; word limit va spelling’ni tekshir.';
      if (key) return `Selected task focus: ${focus}. Har javob uchun passage’dan aniq dalil top va noto‘g‘ri variant nega mos emasligini izohla.`;
    }
    if (skill==='listening') {
      if (key.includes('map') || key.includes('plan') || key.includes('diagram')) return 'Map/plan: audio boshlanishidan oldin yo‘nalish so‘zlarini ko‘r; left/right, opposite, beyond va turning point’larni kuzat.';
      if (key.includes('multiple choice')) return 'Multiple choice: variantlarni oldindan solishtir; speaker fikri o‘zgargan paytni va distractor’ni tingla.';
      if (key.includes('matching')) return 'Matching: variantlar farqini oldindan belgila; sinonim, referent va keyingi correction’ni tinglab moslashtir.';
      if (key.includes('correction') || key.includes('distractor')) return 'Correction cues: “actually”, “rather”, “sorry”, “instead” kabi tuzatish signallaridan keyin yakuniy javobni tanla.';
      if (key.includes('spelling') || key.includes('word form')) return 'Spelling/word form: javobning singular/plural, tense va word ending’ini tekshir; keyin transcript bilan xatoni tasnifla.';
      if (key.includes('inference') || key.includes('attitude')) return 'Inference/attitude: faqat faktni emas, speaker’ning munosabati, ohang va sababini ham tingla.';
      if (key.includes('completion') || key.includes('form') || key.includes('note') || key.includes('table') || key.includes('flow')) return 'Completion: audio’dan oldin javob turi va word limit’ni bashorat qil; eshitilgan so‘zni grammatik shaklga mos yoz.';
      if (key.includes('short-answer')) return 'Short answer: kerakli detail’ni eshit, ortiqcha so‘z qo‘shma va spelling’ni transcript bilan keyin tekshir.';
      if (key) return `Selected task focus: ${focus}. Birinchi tinglashda javobni belgila, keyin transcript bilan exact signal va distractor’ni top.`;
    }
    const first=(weakCriteria[0]||'').toLowerCase();
    if (skill==='writing') {
      if (first.includes('coherence')) return 'Coherence repair: paragraph purpose’ni aniqlab, topic sentence → explanation → example → link zanjirini tekshir.';
      if (first.includes('task response')) return 'Task Response repair: promptning har bir talabini ajrat; aniq pozitsiya, rivojlangan sabab va relevant example bilan javobni to‘liq qil.';
      if (first.includes('lexical')) return 'Lexical repair: collocation va ma’no aniqligini tekshir; sinonimni faqat kontekst mos bo‘lsa almashtir.';
      if (first.includes('grammar')) return 'Grammar repair: o‘zingda takrorlanadigan 1–2 xatoni tanla; clause boundary, tense va subject–verb agreement’ni tahrir qil.';
    }
    if (skill==='speaking') {
      if (first.includes('fluency')) return 'Fluency repair: javobni direct answer → reason → specific example → short reflection tartibida tabiiy rivojlantir.';
      if (first.includes('lexical')) return 'Lexical repair: 5 ta foydali iborani kontekstda o‘rgan; ularni majburlamasdan aniq va tabiiy ishlat.';
      if (first.includes('grammar')) return 'Grammar repair: qisqa va murakkab gaplarni aralashtir; aniqlikni buzadigan uzun gaplarni qayta tuz.';
      if (first.includes('pronunciation')) return 'Pronunciation repair: audio’ni qayta tinglab word stress, sentence stress, chunking va intelligibility bo‘yicha qayd yoz; transcript yetarli dalil emas.';
    }
    return '';
  }
  function diagnosticRoute(skill, errors) {
    const dx = state.diagnostics[skill];
    const errorCount = (errors[skill] || []).length;
    if (skill === 'reading' || skill === 'listening') {
      const objective = objectiveSignals(skill);
      const focus = dx?.focus || '';
      const task = focusPractice(skill,focus);
      if (objective.available) {
        const route=routeFromRate(objective.rate);
        return {route,score:objective.rate,focus,focusTask:task,confidence:`Repeated answer-key evidence · ${objective.count} unique attempts`,reason:`${objective.count} ta noyob answer-key natijasi birlashtirildi. ${focus?`Oxirgi tanlangan zaif task: ${focus}.`:''} Manbalar: ${objective.sources.slice(-3).join('; ')}. Bu xom aniqlik, IELTS bandi emas.`,errorCount};
      }
      if (!dx) return {route:'unassessed',score:null,focus:'',focusTask:'',confidence:'No diagnostic yet',reason:'Boshlang‘ich diagnostika hali saqlanmagan.',errorCount};
      const route = routeFromRate(dx.rate);
      return {route,score:dx.rate,focus,focusTask:task,confidence:`Single answer-key sample · ${objective.count}/3 repeated attempts`,reason:`${dx.source} · ${dx.correct}/${dx.total} javob · answer key tekshirilgan. ${focus?`Zaif task: ${focus}.`:''}`,errorCount};
    }
    if (!dx) return {route:'unassessed',score:null,focus:'',focusTask:'',weakCriteria:[],confidence:'No diagnostic yet',reason:'Namuna va reflection hali kiritilmagan.',errorCount};
    const criteria = dx.reflections || {};
    const reflectionValues = Object.entries(criteria).filter(([key,value])=>value && !(skill==='speaking' && key==='r3' && value==='not-reviewed')).map(([,value])=>value);
    const weak = reflectionValues.filter(x=>x==='support').length;
    const developing = reflectionValues.filter(x=>x==='developing').length;
    const weakCriteria = ['support','developing'].flatMap(level=>CRITERIA[skill].filter((_,i)=>criteria['r'+i]===level).map(x=>x[0]));
    const missingPronunciationEvidence = skill==='speaking' && !dx.audioReviewed;
    const sampleNeedsRepair = skill==='writing'
      ? dx.stats.paragraphCount<3 || dx.stats.repeated.length>=3 || dx.stats.lexicalVariety<0.42
      : (dx.stats.sentenceCount<3 || (dx.stats.wordCount/Math.max(1,dx.stats.sentenceCount))>28);
    let route = weak >= 2 || dx.stats.wordCount < (skill==='writing'?120:70) ? 'foundation' : (weak + developing > 0 || missingPronunciationEvidence || sampleNeedsRepair ? 'core' : 'stretch');
    if (errorCount >= 3 && route === 'stretch') route = 'core';
    const task = focusPractice(skill,'',weakCriteria);
    const evidenceNote = missingPronunciationEvidence ? ' · pronunciation audio review yo‘q' : '';
    const sampleNote = sampleNeedsRepair ? ' · sample structure/repetition bo‘yicha repair signali' : '';
    const criteriaNote = weakCriteria.length ? ` · Fokus: ${weakCriteria.join(', ')}` : '';
    return {route,score:null,focus:weakCriteria.join(', '),focusTask:task,weakCriteria,confidence:'Learner sample + structured self-reflection (not examiner assessed)',reason:`${dx.stats.wordCount} so‘z · ${reflectionValues.length}/4 kuzatilgan mezon${criteriaNote}${evidenceNote}${sampleNote} · self-review, examiner bahosi emas.`,errorCount};
  }
  function profile() {
    const errors = errorSignals();
    return SKILLS.map(skill=>{
      const d=diagnosticRoute(skill,errors); const dx=state.diagnostics[skill];
      let priority = d.route==='unassessed'?4:(d.route==='foundation'?3:d.route==='core'?2:1);
      priority += Math.min(3,d.errorCount)*0.8;
      if (d.confidence.startsWith('Single answer-key')) priority += 0.35;
      if (d.focus || (Array.isArray(d.weakCriteria) && d.weakCriteria.length)) priority += 0.25;
      return {skill,...d,priority};
    }).sort((a,b)=>b.priority-a.priority);
  }
  function trackInstruction(skill, route) {
    if(route==='unassessed') return ({reading:'3 ta passage savolini mustaqil ishlab, answer key bilan tekshir; manba va savol turini qayd et.',listening:'Official sample yoki o‘zingdagi testdan bir section tingla; birinchi urinishdan keyin answer key bilan tekshir.',writing:'Bitta Task 2 promptga 120+ so‘zli diagnostik sample yoz; bu to‘liq IELTS essay bahosi emas.',speaking:'Part 2 promptga javobni yozib ol, transcript tayyorla va audio’ni qayta tingla.'})[skill];
    const content = {
      reading:{foundation:'Main idea va paragraph purpose’ni topish; savolni passage bilan so‘zma-so‘z emas, ma’no orqali bog‘lash.',core:'Paraphrase, inference va TFNG dalillarini qator/paragraph bilan asoslash.',stretch:'Aralash savol turlari va yangi passage’da evidence transfer; javobni taxmin bilan emas, matn bilan tasdiqlash.'},
      listening:{foundation:'Keywords, numbers, spelling va word form’ni alohida mashq qilish; transcriptni faqat urinishdan keyin ochish.',core:'Distractor, correction cue va paraphrase’ni ajratish; eshitilgan javobning yakuniy variantini tekshirish.',stretch:'Turli speaker/aksentlarda note-taking, inference va birinchi tinglashda umumiy ma’noni tutish.'},
      writing:{foundation:'Aniq topic sentence, sodda grammatik to‘g‘rilik va savolning barcha qismlariga javob.',core:'Paragraph progression, sabab–misol–izoh zanjiri va collocation aniqligi.',stretch:'Nuans, qualification, cohesion va grammatik diapazonni tabiiy boshqarish; fikrni ortiqcha murakkablashtirmaslik.'},
      speaking:{foundation:'Savolga to‘g‘ridan-to‘g‘ri javob, sodda to‘liq gaplar va tushunarli talaffuzga e’tibor.',core:'Javobni sabab, misol va izoh bilan kengaytirish; takrorlanishni kamaytirish.',stretch:'Fikrni spontan rivojlantirish, aniq leksika, mos grammatik o‘zgarish va tabiiy chunking.'}
    };
    return content[skill][route];
  }
  function focusReason(row) {
    const bits=[];
    if (row.route==='foundation') bits.push('foundation amaliyot kerak');
    else if (row.route==='core') bits.push('aniqlikni mustahkamlash kerak');
    else bits.push('transfer mashqlari mos');
    if(row.errorCount) bits.push(`${row.errorCount} ta ochiq xato`);
    if(row.focus) bits.push(`fokus: ${row.focus}`);
    return bits.join(' · ');
  }
  function pageHead(kicker,title,description) { return `<div class="s58-page-head"><div><span class="s58-kicker">${esc(kicker)}</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div></div>`; }
  function card(title,content,extra='') { return `<section class="s58-card ${extra}"><h3>${title}</h3>${content}</section>`; }
  function overviewView() {
    const rows=profile(); const done=SKILLS.filter(s=>state.diagnostics[s]).length; const selected=rows[0];
    const totalDue=Object.values(state.vocabulary.progress).filter(x=>x && x.due && x.due<=today()).length;
    const weeks=Object.values(state.crossSkill.checks).filter(Boolean).length;
    return `${pageHead('STAGE 58 · ADAPTIVE LEARNING','Senga mos o‘rganish yo‘li','Stage 57 ning 84 kunlik asosiy rejasiga tegmaydi. Ushbu qatlam diagnostika, tavsiya va qo‘shimcha mashqlarni individual tartiblaydi.')}
      <section class="s58-hero"><div><span class="s58-chip">PERSONALISED LEARNING LAYER</span><h3>O‘rganishni taxmin bilan emas, dalil bilan moslashtir.</h3><p>Har bir skill alohida ko‘riladi. Reading/Listening xom natijasi IELTS bandi emas; Writing/Speaking sample tahlili ham examiner score emas.</p><div class="s58-actions"><button class="s58-primary" data-s58-tab="diagnostics">Diagnostikani boshlash →</button><button class="s58-secondary" data-s58-tab="plan">Adaptive reja</button></div></div><div class="s58-hero-stat"><strong>${done}/4</strong><span>Skill diagnostikasi saqlangan</span><strong>${totalDue}</strong><span>Vocabulary review due</span></div></section>
      <div class="s58-grid four">${rows.map(r=>`<article class="s58-skill-card"><div class="s58-row"><span class="s58-skill-name">${LABEL[r.skill]}</span><span class="s58-badge ${r.route}">${r.route.toUpperCase()}</span></div><p>${esc(focusReason(r))}</p><small>${esc(r.confidence)}</small>${r.score===null?'':`<div class="s58-meter"><i style="width:${cap(r.score,0,100)}%"></i></div><b>${r.score.toFixed(1)}% · xom natija</b>`}</article>`).join('')}</div>
      ${card('Hozirgi eng muhim fokus',`<p><b>${LABEL[selected.skill]} · ${routeLabel(selected.route)}</b></p><p>${esc(trackInstruction(selected.skill,selected.route))}</p><p class="s58-muted">Sabab: ${esc(selected.reason)}</p>`)}
      <div class="s58-grid two">${card('O‘quvchi uchun qanday ishlaydi',`<ol class="s58-list"><li>Har skill bo‘yicha kichik diagnostika saqlaysan.</li><li>Platforma zaif yo‘nalish va qayd etilgan xatolarni ajratadi.</li><li>84 kunlik reja o‘zgarmaydi; adaptiv qo‘shimcha topshiriqlar ustuvorlikka ko‘ra beriladi.</li><li>Natija va tavsiyalar qurilmangda saqlanadi.</li></ol>`)}${card('Halollik va ishonchlilik',`<p>“Diagnostika kerak / Foundation / Core / Stretch” — mashq yo‘li. Raw percentage, sample statistics va self-reflection IELTS Band Score emas.</p><p>Bir martalik xom natija ishonchliligi cheklangan. Kamida 3 ta noyob answer-key urinish birlashtirilganda objective signal kuchayadi; manbalar alohida ko‘rsatiladi.</p><p>Writing/Speaking sample tahlili word count, paragraph, sentence va reflection’ga yordam beradi; avtomatik examiner bahosi bermaydi.</p>`)}</div>
      ${card('PDF metodikasiga tayangan cross-skill sikl',`<p>Bir manbani to‘rtta skill bilan qayta ishlash: <b>Read → Note → Paraphrase → Speak/Record → Transcribe → Correct → Repeat.</b></p><button class="s58-primary" data-s58-tab="transfer">Siklni bajarish →</button>`)}
      ${card('Tekshirilgan rasmiy IELTS manbalari',`<p><a href="https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener noreferrer">IELTS Academic — official sample tasks</a></p><p><a href="https://ielts.org/take-a-test/preparation-resources/writing-test-resources" target="_blank" rel="noopener noreferrer">Writing assessment criteria and examiner guidance</a></p><p><a href="https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf" target="_blank" rel="noopener noreferrer">Speaking public band descriptors (PDF)</a></p><small>Bu havolalar format va mezonlarni o‘rganish uchun. Stage 58 ichki yo‘l tanlashini rasmiy band score bilan almashtirmaydi.</small>`)}
    `;
  }
  function diagnosticFormRL(skill) {
    const dx=state.diagnostics[skill]||{}; const isRead=skill==='reading';
    const options=isRead?['Multiple choice (one / more answers)','Identifying information · True / False / Not Given','Writer’s views · Yes / No / Not Given','Matching headings','Matching information','Matching features','Matching sentence endings','Summary completion · words from text','Summary completion · word list','Note / table / flow-chart completion','Sentence completion','Diagram label completion','Short-answer questions','Mixed question types']:['Multiple choice · one / more answers','Matching','Plan / map / diagram labelling','Form completion','Note completion','Table completion','Flow-chart completion','Summary completion','Sentence completion','Short-answer questions','Distractors / correction cues','Spelling / word form','Inference / speaker attitude','Mixed section'];
    return `<form class="s58-form" data-s58-form="${skill}"><div class="s58-form-head"><div><span class="s58-kicker">${isRead?'TEXT EVIDENCE':'AUDIO COMPREHENSION'}</span><h3>${LABEL[skill]} · answer-key diagnostikasi</h3></div><span class="s58-badge ${dx.route||'neutral'}">${dx.rate==null?'Not saved':routeFromRate(dx.rate).toUpperCase()}</span></div>
      <label>Test / manba nomi<input class="s58-input" name="source" required maxlength="100" placeholder="Masalan: Practice Test 2 · Section 3" value="${esc(dx.source||'')}"><small>Har bir yangi va mustaqil testga alohida nom ber. Bir testni qayta yechish yangi mustaqil dalil hisoblanmaydi.</small></label>
      <div class="s58-form-grid"><label>To‘g‘ri javob<input class="s58-input" type="number" name="correct" min="0" max="80" step="1" required value="${dx.correct??''}"></label><label>Jami savol<input class="s58-input" type="number" name="total" min="1" max="80" step="1" required value="${dx.total??''}"></label></div>
      <label>Eng ko‘p qiynalgan savol turi<select class="s58-input" name="focus">${options.map(x=>`<option ${dx.focus===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="s58-check"><input type="checkbox" name="verified" ${dx.verified?'checked':''} required><span>Javoblarni testning answer key’i bilan tekshirdim. Bu self-mark emas.</span></label>
      <button class="s58-primary" type="submit">${dx.rate==null?'Diagnostikani saqlash':'Natijani yangilash'}</button>
      ${dx.rate==null?'':`<div class="s58-result"><b>${dx.rate.toFixed(1)}% · Raw accuracy</b><p>${routeLabel(dx.route)} — faqat qo‘shimcha mashqni tanlash uchun ichki threshold. Bu IELTS band conversion emas.</p><small>${esc(dx.savedAt||'')}</small></div>`}
    </form>`;
  }
  function reflectionSelect(skill, key, value) {
    return `<label class="s58-reflection"><span><b>${esc(CRITERIA[skill][key][0])}</b><small>${esc(CRITERIA[skill][key][1])}</small></span><select class="s58-input" name="r${key}"><option value="">Tanla…</option><option value="support" ${value==='support'?'selected':''}>Ko‘proq yordam kerak</option><option value="developing" ${value==='developing'?'selected':''}>Ba’zan mustaqil</option><option value="secure" ${value==='secure'?'selected':''}>Odatda mustaqil</option>${skill==='speaking'&&key===3?`<option value="not-reviewed" ${value==='not-reviewed'?'selected':''}>Audio hali tinglanmagan</option>`:''}</select></label>`;
  }
  function diagnosticFormWriting() {
    const dx=state.diagnostics.writing||{};
    return `<form class="s58-form" data-s58-form="writing"><div class="s58-form-head"><div><span class="s58-kicker">ACADEMIC WRITING · TASK 2</span><h3>Writing sample diagnostikasi</h3></div><span class="s58-badge neutral">${dx.stats?dx.stats.wordCount+' words':'Not saved'}</span></div>
      <label>Original practice prompt<textarea class="s58-input s58-textarea" name="prompt" required placeholder="Masalan: Some people think public transport should be free. To what extent do you agree or disagree?">${esc(dx.prompt||'')}</textarea></label>
      <label>O‘zing yozgan sample<textarea class="s58-input s58-textarea tall" name="sample" required placeholder="Kamida 120 ta so‘z va kamida 2 paragraf yoz. Bu qisqa diagnostika sample’i, to‘liq IELTS Task 2 emas (rasmiy Task 2 kamida 250 so‘z).">${esc(dx.sample||'')}</textarea></label>
      <div class="s58-reflection-list">${CRITERIA.writing.map((x,i)=>reflectionSelect('writing',i,dx.reflections?.['r'+i])).join('')}</div>
      <button class="s58-primary" type="submit">Sample va reflection’ni saqlash</button>
      ${dx.stats?`<div class="s58-result"><b>${dx.stats.wordCount} words · ${dx.stats.paragraphCount} paragraphs · ${dx.stats.sentenceCount} sentences</b><p>Content-word variety (oddiy ichki kuzatuv): ${(dx.stats.lexicalVariety*100).toFixed(0)}%. Bu Lexical Resource bandi emas.</p>${dx.stats.repeated.length?`<p>3+ marta takrorlangan content words: ${dx.stats.repeated.map(x=>esc(x[0])+' ('+x[1]+')').join(', ')}</p>`:'<p>Ko‘p takrorlangan content word topilmadi.</p>'}<small>Saqlangan sample o‘zingizning qurilmangizda qoladi.</small></div>`:''}
    </form>`;
  }
  function diagnosticFormSpeaking() {
    const dx=state.diagnostics.speaking||{};
    return `<form class="s58-form" data-s58-form="speaking"><div class="s58-form-head"><div><span class="s58-kicker">SPEAKING · PART 2 / EXTENDED RESPONSE</span><h3>Speaking transcript diagnostikasi</h3></div><span class="s58-badge neutral">${dx.stats?dx.stats.wordCount+' words':'Not saved'}</span></div>
      <label>Prompt / mavzu<input class="s58-input" name="prompt" maxlength="160" required value="${esc(dx.prompt||'')}" placeholder="Describe a skill you would like to learn"></label>
      <label>Ovoz yozuvingdan transcript (yoki o‘zing aytgan javob)<textarea class="s58-input s58-textarea tall" name="sample" required placeholder="Kamida 70 ta so‘z bilan javob transcriptini yoz. Bu diagnostika namunasi, to‘liq 11–14 daqiqalik IELTS Speaking testi emas. Transcript talaffuzni baholamaydi.">${esc(dx.sample||'')}</textarea></label>
      <div class="s58-reflection-list">${CRITERIA.speaking.map((x,i)=>reflectionSelect('speaking',i,dx.reflections?.['r'+i])).join('')}</div>
      <label class="s58-check"><input type="checkbox" name="audioReviewed" ${dx.audioReviewed?'checked':''}><span>Men o‘z audio yozuvimni qayta tinglab, pronunciation/intelligibility’ni alohida tekshirdim. Transcriptning o‘zi talaffuzni ko‘rsatmaydi.</span></label>
      <button class="s58-primary" type="submit">Transcript va reflection’ni saqlash</button>
      ${dx.stats?`<div class="s58-result"><b>${dx.stats.wordCount} words · ${dx.stats.sentenceCount} sentences</b><p>Average sentence length: ${dx.stats.sentenceCount?(dx.stats.wordCount/dx.stats.sentenceCount).toFixed(1):'—'} words. Bu fluency score emas, faqat matn ko‘rsatkichi.</p>${dx.audioReviewed?'<small>Audio qayta tinglanganligi learner tomonidan tasdiqlandi; platforma audio talaffuzni avtomatik baholamadi.</small>':'<small>Pronunciation evidence yo‘q. Ovoz yozuvini qayta tinglashni rejalashtir.</small>'}</div>`:''}
    </form>`;
  }
  function diagnosticsView() {
    return `${pageHead('FOUR-SKILL DIAGNOSTIC','Boshlang‘ich nuqtani aniqlash','Har bir skillni alohida saqla. Birinchi kunda to‘rtta formani birdan to‘ldirish shart emas; mavjud dalilingdan boshlashing mumkin.')}
      <div class="s58-grid two">${diagnosticFormRL('reading')}${diagnosticFormRL('listening')}${diagnosticFormWriting()}${diagnosticFormSpeaking()}</div>
      <div class="s58-callout"><b>Natijani to‘g‘ri talqin qil:</b> Reading/Listening foizi faqat shu testning raw accuracy’si. Writing/Speaking reflection’i self-report. Hech biri alohida holda IELTS Band Score yoki rasmiy prediction emas.</div>`;
  }
  function weeklyPlan(rows) {
    const rank=rows.map(x=>x.skill); const lead=rank[0],second=rank[1];
    return PHASES.map(phase=>`<details class="s58-week"><summary><b>${phase.weeks[0]}–${phase.weeks[2]}-haftalar · ${esc(phase.name)}</b><span>${esc(phase.aim)}</span></summary><div class="s58-week-body"><p><b>Asosiy fokus:</b> ${LABEL[lead]} · ${LABEL[second]}</p><ol>${phase.methods.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="s58-mini-grid">${SKILLS.map(skill=>`<div><b>${LABEL[skill]}</b><small>${esc(trackInstruction(skill,rows.find(x=>x.skill===skill).route))}</small></div>`).join('')}</div></div></details>`).join('');
  }
  function planView() {
    const rows=profile(); const main=rows[0];
    const objective = SKILLS.filter(s=>state.diagnostics[s]).length;
    const taskBank={
      reading:['Main idea va supporting line top','Paraphrase/synonym matching','TFNG uchun True/False/Not Given dalili'],
      listening:['Numbers va word forms dictation','Correction cue/distractor ajratish','Transcriptni first listen’dan keyin tahlil qilish'],
      writing:['Prompt barcha qismlarini belgilash','Claim → reason → example paragraph','Collocation va grammar self-edit'],
      speaking:['45–60 soniyalik reason + example','Part 2: note → speak → transcript','Audio’ni qayta tinglab stress/chunking belgilash']
    };
    const nextSeven=[];
    const usage={reading:0,listening:0,writing:0,speaking:0};
    const lead=rows[0];
    rows.forEach(row=>{
      const task=row.route==='unassessed'?trackInstruction(row.skill,'unassessed'):(row.focusTask||taskBank[row.skill][0]);
      nextSeven.push({day:nextSeven.length+1,skill:row.skill,task,kind:row.route==='unassessed'?'DIAGNOSTIC':'REPAIR'});
      usage[row.skill]++;
    });
    // Three extra sessions are assigned only after each skill has had one place in the plan.
    // If no diagnostics exist yet, use source-neutral foundation tasks rather than inventing a weakest skill.
    const assessed=rows.filter(row=>row.route!=='unassessed');
    for(let i=0;i<3;i++){
      const row=assessed.length?assessed[i%Math.min(assessed.length,2)]:rows[i%rows.length];
      const skill=row.skill; const idx=usage[skill]++;
      const task=assessed.length?taskBank[skill][idx%taskBank[skill].length]:[
        'Vocabulary starter 5: kontekstli alternativani tanla va original gap tuz',
        'Bitta manbani Read → Note → Paraphrase siklidan o‘tkaz',
        'Bir xatoni qayta ko‘rib, tuzatilgan javobni qayta yoz yoki ayt'
      ][i];
      nextSeven.push({day:nextSeven.length+1,skill,task,kind:assessed.length?'PRIORITY BOOSTER':'FOUNDATION BOOSTER'});
    }
    return `${pageHead('ADAPTIVE ROADMAP · 84 DAYS','Shaxsiy qo‘shimcha reja','Bu 84 kunlik Stage 57 curriculum’ni almashtirmaydi. U asosiy rejaga qo‘shiladigan adaptiv booster bo‘lib, ustuvor skillga ko‘proq repair amaliyoti beradi.')}
      <section class="s58-plan-hero"><div><span class="s58-chip">CURRENT PRIORITY</span><h3>${LABEL[main.skill]} · ${routeLabel(main.route)}</h3><p>${esc(trackInstruction(main.skill,main.route))}</p><small>${objective}/4 diagnostika saqlangan · ${esc(main.confidence)}</small></div><div class="s58-goals"><label>Hozirgi taxminiy boshlanish nuqtasi<select class="s58-input" data-s58-goal="baseline">${['5.0','5.5','6.0','6.5','7.0','Not sure'].map(x=>`<option ${state.goal.baseline===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Maqsad band<select class="s58-input" data-s58-goal="target">${['6.5','7.0','7.5','8.0'].map(x=>`<option ${state.goal.target===x?'selected':''}>${x}</option>`).join('')}</select></label><small>Bu o‘quvchining maqsad tanlovi; diagnostika band score emas.</small></div></section>
      <div class="s58-grid two">${rows.map((r,i)=>card(`${i+1}. ${LABEL[r.skill]} · ${r.route.toUpperCase()}`,`<p>${esc(focusReason(r))}</p><p>${esc(trackInstruction(r.skill,r.route))}</p><small>${esc(r.reason)}</small>`)).join('')}</div>
      <h3 class="s58-section-title">Keyingi 7 kun uchun booster tasks</h3><div class="s58-next-seven">${nextSeven.map(x=>`<article><span>DAY ${x.day} · ${x.kind}</span><b>${LABEL[x.skill]}</b><p>${esc(x.task)}</p></article>`).join('')}</div>
      <h3 class="s58-section-title">84 kunlik 12 haftalik bosqichlar</h3>${weeklyPlan(rows)}
      <p class="s58-muted">Adaptiv qoidalar ochiq: Reading/Listening’da answer key’li raw score va takroriy objective attempts muhim; Writing/Speaking’da sample va learner reflection faqat mashq yo‘naltiradi. Examiner tasdiqlangan rubric paydo bo‘lmaguncha rasmiy band xulosasi qilinmaydi.</p>`;
  }
  function currentVocab() {
    if (!vocabulary || !Array.isArray(vocabulary.items)) return null;
    const id = Number(state.vocabulary.activeId) || state.vocabulary.starter[0] || 1;
    return vocabulary.items.find(x=>x.id===id) || vocabulary.items[0];
  }
  function vocabProgress(item) { return state.vocabulary.progress[String(item.id)] || {attempts:0,correct:0,status:'new',due:null}; }
  function vocabView() {
    const item=currentVocab(); const selected=state.vocabulary.starter || []; const progress=state.vocabulary.progress || {};
    const due=Object.entries(progress).filter(([,x])=>x && x.due && x.due<=today());
    if (!item) return `${pageHead('VOCABULARY CONTEXT LAB','Vocabulary yuklanmadi',vocabularyError||'data/stage58-vocabulary.json faylini tekshir.')}`;
    const p=vocabProgress(item); const answered=p.lastAnswer || ''; const revealed=!!p.revealed;
    const list=vocabulary.items.map(x=>`<label class="s58-word-pick"><input type="checkbox" data-s58-word-pick="${x.id}" ${selected.includes(x.id)?'checked':''} ${selected.length>=5&&!selected.includes(x.id)?'disabled':''}><span><b>${esc(x.headword)}</b><small>${esc(x.category)}</small></span></label>`).join('');
    return `${pageHead('50 CONTEXTUAL VOCABULARY CONCEPTS','So‘zni emas, kontekstni o‘rgan','PDF metodikasi: boshlash uchun 5 ta tanla, ma’noni turli vaziyatda mashq qil, keyin original yozuvga tabiiy qo‘sh. Sinonimlar har doim bir-birini almashtirmaydi.')}
      <div class="s58-grid two">${card('1 · Boshlang‘ich 5 talik',`<p>Tanlangan: <b>${selected.length}/5</b>. Avval o‘zingga eng kerakli 5 tushunchani tanla. Keyin yana 5 tadan qo‘shishing mumkin.</p><div class="s58-word-list">${list}</div><button class="s58-primary" data-s58-action="save-starter" ${selected.length!==5?'disabled':''}>Boshlang‘ich 5 ni saqlash</button>`)}${card('Review queue',`<div class="s58-review-stat"><b>${due.length}</b><span>Bugun qayta ko‘rish kerak</span></div>${due.length?due.map(([id,x])=>{const it=vocabulary.items.find(v=>v.id===Number(id));return `<button class="s58-due-word" data-s58-open-word="${id}">${esc(it?.headword||'Word')} · ${esc(x.due)}</button>`}).join(''):'<p class="s58-muted">Hozircha due card yo‘q. Birinchi 5 ta kartani ishlashdan boshla.</p>'}`)}</div>
      <section class="s58-vocab-study"><div class="s58-row"><div><span class="s58-kicker">CONTEXT PRACTICE · ${item.id}/50</span><h3>${esc(item.headword)}</h3></div><span class="s58-badge ${p.status==='mastered'?'stretch':'core'}">${esc(p.status||'new')}</span></div><p class="s58-muted">${esc(item.category)}</p>
        <div class="s58-vocab-context"><p>${esc(item.prompt)}</p><form data-s58-vocab-answer="${item.id}"><div class="s58-choice-list">${item.choices.map(choice=>`<label class="s58-choice"><input type="radio" name="answer" value="${esc(choice)}" ${answered===choice?'checked':''} ${revealed?'disabled':''}><span>${esc(choice)}</span></label>`).join('')}</div><button class="s58-primary" type="submit" ${revealed?'disabled':''}>Javobni tekshirish</button></form>
          ${revealed?`<div class="s58-result ${p.correct===true?'good':'review'}"><b>${p.correct?'To‘g‘ri tanlov':'Bu kontekst uchun mosroq tanlov bor'}</b><p><b>Best fit:</b> ${esc(item.best)}</p><p>${esc(item.explanation)}</p><div class="s58-nuances">${item.alternatives.map(a=>`<p><b>${esc(a.term)}</b> — ${esc(a.nuance)}</p>`).join('')}</div>${item.warning?`<p class="s58-warn">${esc(item.warning)}</p>`:''}${!p.correct?`<button class="s58-secondary" data-s58-action="retry-word">Yana urinib ko‘r</button>`:''}<label>O‘zingning original gaping<input class="s58-input" data-s58-own-sentence="${item.id}" value="${esc(p.ownSentence||'')}" placeholder="Use ${esc(item.best)} in a new, natural sentence."></label><label class="s58-check"><input type="checkbox" data-s58-natural-check="${item.id}" ${p.naturalChecked?'checked':''}><span>Men bu gapdagi ma’no, grammar va collocation’ni o‘zim tekshirdim.</span></label><button class="s58-primary" data-s58-action="save-own-sentence" data-id="${item.id}" ${!p.correct?'disabled':''}>Original gapni saqlash</button></div>`:''}
        </div><div class="s58-vocab-controls"><button class="s58-secondary" data-s58-action="previous-word">← Oldingi</button><button class="s58-secondary" data-s58-action="next-word">Keyingi →</button><small>${selected.length} ta starter concept · ${Object.values(progress).filter(x=>x.status==='practised'||x.status==='mastered').length} ta practiced</small></div>
        ${revealed && p.correct?`<div class="s58-srs"><b>Spaced review</b><p>Original gap saqlangach, eslab qolishni quyidagi interval bilan rejalashtir:</p>${['again','hard','good','easy'].map(x=>`<button class="s58-secondary" data-s58-grade="${x}" data-id="${item.id}">${({again:'Again · 1 day',hard:'Hard · 2 days',good:'Good · 4 days',easy:'Easy · 7 days'})[x]}</button>`).join('')}</div>`:''}
      </section>
      ${card('2 · Pressure test: kontekstga integratsiya',`<p>70+ so‘zli original paragraf yoz. Tanlagan 5 tushunchangdan 2–5 tasini faqat tabiiy mos tushsa ishlat. Maqsad synonym stuffing emas — aniqlik.</p><textarea class="s58-input s58-textarea tall" data-s58-pressure placeholder="Write a short paragraph on education, technology, society or the environment…">${esc(state.vocabulary.lastPressure||'')}</textarea><div class="s58-actions"><button class="s58-primary" data-s58-action="pressure-check">Paragrafni tekshirish</button><span class="s58-muted">Word count + target concepts only; grammar/naturalness avtomatik band sifatida baholanmaydi.</span></div>${state.vocabulary.lastPressureResult?`<div class="s58-result"><b>${state.vocabulary.lastPressureResult.wordCount} words · ${state.vocabulary.lastPressureResult.found.length} target concepts</b><p>${state.vocabulary.lastPressureResult.found.map(x=>esc(x)).join(', ')||'Hali target expression topilmadi.'}</p><p>${state.vocabulary.lastPressureResult.message}</p></div>`:''}`)}
    `;
  }
  function transferView() {
    const steps=[['read','Read','Maqola yoki passage’ni diqqat bilan o‘qi. Asosiy g‘oya va yangi iboralarni belgila.'],['note','Note','5–7 ta qisqa note tuz; matndan gaplarni ko‘chirib yozma.'],['paraphrase','Paraphrase','Asosiy fikrni o‘z so‘zlaring bilan 2–3 gapda qayta ifoda et.'],['speak','Speak / record','Paraphrase asosida qisqa og‘zaki izoh yozib ol.'],['transcribe','Transcribe','Ovoz yozuvingdan transcript tayyorla.'],['correct','Correct','Grammar, word choice, meaning va pronunciation (audio qayta tinglab) xatolarini top.'],['repeat','Repeat','Tuzatilgan javobni qayta yoz yoki ayt; eski va yangi versiyani solishtir.']];
    const allDone=steps.every(x=>state.crossSkill.checks[x[0]]);
    return `${pageHead('CROSS-SKILL TRANSFER LOOP','Bitta materialdan 4 skill mashqi','Yuklangan IELTS self-study bo‘limidagi integratsiyalashgan yondashuv: o‘qishdan boshlab, o‘z nutqingni yozib, transcript va xatolar orqali qayta ishlash.')}
      <section class="s58-card"><label>Manba / mavzu nomi<input class="s58-input" data-s58-source value="${esc(state.crossSkill.lastSource||'')}" placeholder="Article, passage, podcast episode yoki topic"></label><div class="s58-transfer-steps">${steps.map((x,i)=>`<label class="s58-transfer-step"><input type="checkbox" data-s58-transfer-check="${x[0]}" ${state.crossSkill.checks[x[0]]?'checked':''}><span><b>${i+1}. ${x[1]}</b><small>${x[2]}</small></span></label>`).join('')}</div><div class="s58-actions"><button class="s58-primary" data-s58-action="save-transfer">Sikl progressini saqlash</button><span class="s58-badge ${allDone?'stretch':'core'}">${steps.filter(x=>state.crossSkill.checks[x[0]]).length}/7 completed</span></div>${allDone?'<p class="s58-result good">Sikl yakunlandi. Keyingi materialda yana shu jarayonni takrorla.</p>':''}</section>
      ${card('Nega bu metod foydali?',`<p>Bu jarayon bir xil mavzuni Reading, Writing, Speaking va Listening orqali qayta ishlashga yordam beradi. Matnni yodlash shart emas: ma’noni saqlab, o‘z gaping bilan qayta tuz.</p><p>Audio yozuvning talaffuzini transcript emas, audio’ni tinglash orqali ko‘rib chiq.</p>`)}`;
  }
  function render() {
    if (!overlay || !isOpen) return;
    const tabs=[['overview','Overview'],['diagnostics','Diagnostics'],['plan','Adaptive plan'],['vocabulary','Vocabulary 50'],['transfer','Cross-skill loop']];
    const views={overview:overviewView,diagnostics:diagnosticsView,plan:planView,vocabulary:vocabView,transfer:transferView};
    overlay.innerHTML=`<div class="s58-shell"><header class="s58-header"><div><span class="s58-kicker">IELTS BOOST · STAGE 58</span><h1>Intelligent Adaptive Learning</h1><p>Individual focus · source-aware diagnostics · local-first progress</p></div><button type="button" class="s58-close" data-s58-close aria-label="Close Stage 58">×</button></header><nav class="s58-tabs" aria-label="Stage 58 sections">${tabs.map(([id,label])=>`<button type="button" data-s58-tab="${id}" class="${state.activeTab===id?'active':''}" aria-current="${state.activeTab===id?'page':'false'}">${label}</button>`).join('')}</nav><main class="s58-content">${(views[state.activeTab]||overviewView)()}</main><footer class="s58-footer">Stage 58 · Supplementary adaptive layer · Not an official IELTS score · Local device storage</footer></div><div class="s58-toast" id="s58-toast" role="status" aria-live="polite"></div>`;
  }
  function handleRL(form, skill) {
    const fd=new FormData(form); const source=String(fd.get('source')||'').trim(); const correct=Number(fd.get('correct')); const total=Number(fd.get('total')); const verified=fd.get('verified')==='on';
    if(!source) throw new Error('Test/manba nomini kiriting.');
    if(!Number.isInteger(correct)||!Number.isInteger(total)||total<1||total>80||correct<0||correct>total) throw new Error('Correct/total qiymatini tekshir. Jami 1–80, correct esa total’dan katta bo‘lmasin.');
    if(!verified) throw new Error('Natijani answer key bilan tekshirganingni tasdiqla.');
    const rate=correct/total*100;
    const savedAt=new Date().toLocaleString(); const attemptId=new Date().toISOString();
    const previous=state.diagnostics[skill]||{};
    const attempt={source,correct,total,rate,route:routeFromRate(rate),verified:true,focus:String(fd.get('focus')||''),savedAt,attemptId};
    const attempts=[...(Array.isArray(previous.attempts)?previous.attempts:[]),attempt].slice(-12);
    state.diagnostics[skill]={...attempt,attempts};
    save(); state.activeTab='diagnostics'; render(); notify('Answer-key diagnostikasi saqlandi.');
  }
  function handleWriting(form, skill) {
    const fd=new FormData(form); const sample=String(fd.get('sample')||'').trim(), prompt=String(fd.get('prompt')||'').trim();
    const stats=sampleStats(sample); if(stats.wordCount<120) throw new Error(`Kamida 120 so‘z yoz. Hozir: ${stats.wordCount}.`);
    if(stats.paragraphCount<2) throw new Error('Sample kamida 2 paragrafdan iborat bo‘lsin (paragraflar orasida bo‘sh qator qoldir).');
    if(!prompt) throw new Error('Practice promptni kiriting.');
    const reflections={}; CRITERIA[skill].forEach((_,i)=>reflections['r'+i]=String(fd.get('r'+i)||''));
    if(Object.values(reflections).some(x=>!x)) throw new Error('To‘rtta reflection mezonining har birini tanla.');
    state.diagnostics[skill]={prompt,sample,stats,reflections,savedAt:new Date().toLocaleString(),evidence:'learner-sample-and-self-reflection'};
    save(); render(); notify('Writing sample va reflection saqlandi.');
  }
  function handleSpeaking(form) {
    const fd=new FormData(form); const sample=String(fd.get('sample')||'').trim(), prompt=String(fd.get('prompt')||'').trim();
    const stats=sampleStats(sample); if(stats.wordCount<70) throw new Error(`Kamida 70 so‘zli transcript kiriting. Hozir: ${stats.wordCount}.`);
    if(!prompt) throw new Error('Speaking promptni kiriting.');
    const reflections={}; CRITERIA.speaking.forEach((_,i)=>reflections['r'+i]=String(fd.get('r'+i)||''));
    const audioReviewed=fd.get('audioReviewed')==='on';
    if(!reflections.r0||!reflections.r1||!reflections.r2||(audioReviewed&&!reflections.r3)) throw new Error('Speaking uchun dastlabki 3 reflection tanla; audio qayta tinglansa, pronunciation reflection’ni ham tanla.');
    if(!audioReviewed) reflections.r3='not-reviewed';
    state.diagnostics.speaking={prompt,sample,stats,reflections,audioReviewed,savedAt:new Date().toLocaleString(),evidence:'learner-transcript-and-self-reflection'};
    save(); render(); notify('Speaking transcript va reflection saqlandi.');
  }
  function saveAnswer(form,id) {
    const fd=new FormData(form); const answer=String(fd.get('answer')||''); if(!answer) throw new Error('Javob variantini tanla.');
    const item=vocabulary.items.find(x=>x.id===Number(id)); if(!item) throw new Error('Vocabulary item topilmadi.');
    const p=vocabProgress(item); p.attempts=(p.attempts||0)+1; p.lastAnswer=answer; p.correct=norm(answer)===norm(item.best); p.revealed=true; p.status=p.correct?'answer-correct':'review-needed';
    state.vocabulary.progress[String(id)]=p; save(); render();
    notify(p.correct?'Javob to‘g‘ri. Endi o‘zingning gapingni tuz.':'Izohni o‘qib, kontekst farqini o‘rgan.');
  }
  function saveOwnSentence(id) {
    const item=vocabulary.items.find(x=>x.id===Number(id)); const p=vocabProgress(item);
    const input=$(`[data-s58-own-sentence="${id}"]`,overlay); const check=$(`[data-s58-natural-check="${id}"]`,overlay);
    const sentence=String(input?.value||'').trim(); const tokenCount=words(sentence).length;
    if(!p.correct) throw new Error('Avval to‘g‘ri kontekst variantini tanla.');
    if(tokenCount<6) throw new Error('Original gap kamida 6 so‘zdan iborat bo‘lsin.');
    if(!norm(sentence).includes(norm(item.best))) throw new Error(`Gap ichida “${item.best}” iborasi bo‘lishi kerak.`);
    if(!check?.checked) throw new Error('Ma’no, grammar va collocation’ni o‘zing tekshirganingni belgila.');
    p.ownSentence=sentence; p.naturalChecked=true; p.status='practised'; p.due=addDays(today(),1); p.lastPractised=today();
    state.vocabulary.progress[String(id)]=p; save(); render(); notify('Original gap saqlandi; ertaga qayta ko‘rish rejalashtirildi.');
  }
  function gradeWord(id,grade) {
    const p=state.vocabulary.progress[String(id)]; if(!p) return;
    const intervals={again:1,hard:2,good:4,easy:7};
    p.due=addDays(today(),intervals[grade]||1); p.lastGrade=grade;
    p.status=grade==='again'?'review-needed':'practised';
    save(); render(); notify(`Keyingi review: ${p.due}`);
  }
  function pressureCheck() {
    const text=String($('[data-s58-pressure]',overlay)?.value||'').trim(); const stats=sampleStats(text);
    if(stats.wordCount<70) throw new Error(`Kamida 70 so‘z yoz. Hozir: ${stats.wordCount}.`);
    const selected=new Set(state.vocabulary.starter||[]); const found=[];
    vocabulary.items.filter(x=>selected.has(x.id)).forEach(item=>{
      // Count contextual alternatives, not the common base headword itself.
      const matched=item.alternatives.map(a=>a.term).filter(term=>
        new RegExp('(^|[^a-z])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')+'([^a-z]|$)','i').test(text)
      );
      if(matched.length) found.push(`${item.headword} → ${matched.slice(0,2).join(', ')}`);
    });
    const result={wordCount:stats.wordCount,found,message:found.length>=2&&found.length<=5?'2–5 ta target concept ishlatilgan. Ularning tabiiy va aniq ekanini o‘zing qayta o‘qi.':found.length<2?'Hozircha 2 tadan kam concept topildi. Faqat mazmunga mos bo‘lsa qo‘sh; majburlab ishlatma.':'5 tadan ko‘p concept topildi. Soddalik va aniqlikni ustun qo‘y.'};
    state.vocabulary.lastPressure=text; state.vocabulary.lastPressureResult=result; state.vocabulary.pressureChecks.push({date:today(),...result});
    if(state.vocabulary.pressureChecks.length>50)state.vocabulary.pressureChecks=state.vocabulary.pressureChecks.slice(-50);
    save(); render(); notify('Pressure test tahlili saqlandi.');
  }
  function chooseNextWord(direction) {
    const starter=state.vocabulary.starter || []; if(!starter.length) throw new Error('Avval boshlang‘ich 5 ta concept tanla.');
    let idx=starter.indexOf(Number(state.vocabulary.activeId)); if(idx<0)idx=0;
    state.vocabulary.activeId=starter[(idx+direction+starter.length)%starter.length]; save(); render();
  }
  function handleAction(action,button) {
    if(action==='retry-word') {
      const item=currentVocab(); const p=vocabProgress(item); p.revealed=false; p.lastAnswer=''; p.status='review-needed'; state.vocabulary.progress[String(item.id)]=p; save(); render(); notify('Qayta urinishga tayyor.');
    } else if(action==='save-starter') {
      if(state.vocabulary.starter.length!==5) throw new Error('Aynan 5 ta concept tanla.');
      state.vocabulary.activeId=state.vocabulary.starter[0]; save(); render(); notify('Boshlang‘ich 5 ta concept saqlandi.');
    } else if(action==='save-own-sentence') saveOwnSentence(button.dataset.id);
    else if(action==='previous-word') chooseNextWord(-1);
    else if(action==='next-word') chooseNextWord(1);
    else if(action==='pressure-check') pressureCheck();
    else if(action==='save-transfer') {
      state.crossSkill.lastSource=String($('[data-s58-source]',overlay)?.value||'').trim();
      if(!state.crossSkill.lastSource) throw new Error('Avval manba yoki mavzu nomini yoz.');
      state.crossSkill.checks={}; $$('[data-s58-transfer-check]',overlay).forEach(x=>state.crossSkill.checks[x.dataset.s58TransferCheck]=x.checked);
      save(); render(); notify('Cross-skill sikl progressi saqlandi.');
    }
  }
  function onDocumentClick(event) {
    const target=event.target;
    const openButton=target.closest && target.closest('[data-s58-open]');
    if(openButton){event.preventDefault();event.stopImmediatePropagation();open(openButton);return;}
    const closeButton=target.closest && target.closest('[data-s58-close]');
    if(closeButton){event.preventDefault();close();return;}
    const tab=target.closest && target.closest('[data-s58-tab]');
    if(tab){event.preventDefault();state.activeTab=tab.dataset.s58Tab;save();render();return;}
    const action=target.closest && target.closest('[data-s58-action]');
    if(action){event.preventDefault();try{handleAction(action.dataset.s58Action,action);}catch(error){notify(error.message||'Amal bajarilmadi.');}return;}
    const grade=target.closest && target.closest('[data-s58-grade]');
    if(grade){event.preventDefault();gradeWord(grade.dataset.id,grade.dataset.s58Grade);return;}
    const openWord=target.closest && target.closest('[data-s58-open-word]');
    if(openWord){event.preventDefault();state.vocabulary.activeId=Number(openWord.dataset.s58OpenWord);state.activeTab='vocabulary';save();render();return;}
  }
  function onDocumentSubmit(event) {
    const form=event.target;
    if(!form || !form.matches('[data-s58-form],[data-s58-vocab-answer]')) return;
    event.preventDefault();
    try {
      const kind=form.dataset.s58Form;
      if(kind==='reading'||kind==='listening') handleRL(form,kind);
      else if(kind==='writing') handleWriting(form,'writing');
      else if(kind==='speaking') handleSpeaking(form);
      else if(form.hasAttribute('data-s58-vocab-answer')) saveAnswer(form,form.dataset.s58VocabAnswer);
    } catch(error) { notify(error.message || 'Ma’lumotni tekshir.'); }
  }
  function onDocumentChange(event) {
    const el=event.target;
    if(el.matches('[data-s58-word-pick]')) {
      const id=Number(el.dataset.s58WordPick); let selected=state.vocabulary.starter.slice();
      if(el.checked) { if(selected.length>=5){el.checked=false;notify('Bir vaqtda faqat 5 ta starter concept tanlanadi.');return;} selected.push(id); }
      else selected=selected.filter(x=>x!==id);
      state.vocabulary.starter=selected; save();
      if(overlay && isOpen) render();
    } else if(el.matches('[data-s58-goal]')) {
      state.goal[el.dataset.s58Goal]=el.value; save(); notify('Maqsad sozlamasi saqlandi.');
    }
  }
  function onKeydown(event) {
    if(!isOpen)return;
    if(event.key==='Escape'){close();return;}
    if(event.key==='Tab'&&overlay){
      const list=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',overlay).filter(x=>x.offsetParent!==null);
      if(!list.length)return; const first=list[0],last=list[list.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
  async function loadVocabulary() {
    try {
      const response=await fetch(VOCAB_URL,{cache:'no-cache'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(data.schemaVersion!==2||!Array.isArray(data.items)||data.items.length!==50) throw new Error('50-item schema validation failed');
      const ids=new Set();
      data.items.forEach(item=>{
        if(!Number.isInteger(item.id)||ids.has(item.id)||!item.headword||!item.prompt||!Array.isArray(item.choices)||item.choices.length!==3||!item.choices.includes(item.best)) throw new Error(`Invalid vocabulary entry ${item.id}`);
        ids.add(item.id);
      });
      vocabulary=data;
    } catch(error) { vocabularyError=error.message; console.error('Stage 58 vocabulary load:',error); }
    if(isOpen && state.activeTab==='vocabulary') render();
  }
  function installEvents() {
    document.addEventListener('click',onDocumentClick,true);
    document.addEventListener('submit',onDocumentSubmit,true);
    document.addEventListener('change',onDocumentChange,true);
    document.addEventListener('keydown',onKeydown,true);
    const observer=new MutationObserver(initNav);
    ['nav','mobileBottom'].forEach(id=>{const node=$('#'+id);if(node)observer.observe(node,{childList:true});});
    initNav();
  }
  function init() {
    if (window.__IELTS_BOOST_STAGE58_READY__) return;
    if (!API || typeof API.getExtensionState!=='function' || typeof API.setExtensionState!=='function') {
      console.error('Stage 58 requires the Stage 55+ Advanced Studio extension API.'); return;
    }
    window.__IELTS_BOOST_STAGE58_READY__=true;
    installEvents();
    loadVocabulary();
  }
  window.IELTSBoostStage58=Object.freeze({version:'58.0.0',init,open,close,getState:()=>deepCopy(state),getProfile:()=>deepCopy(profile()),getVocabularyStatus:()=>({loaded:!!vocabulary,count:vocabulary?.items?.length||0,error:vocabularyError}),reset:()=>{state=defaults();save();if(isOpen)render();}});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})(window,document);
