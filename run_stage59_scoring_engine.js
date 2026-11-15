'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const context = { window: {}, console };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/stages/stage59-scoring-engine.js'), 'utf8'), context, { filename: 'stage59-scoring-engine.js' });
const S = context.window.IELTSBoostStage59Scoring;
const results = [];
function test(name, fn) { try { fn(); results.push({ name, status: 'PASS' }); } catch (error) { results.push({ name, status: 'FAIL', error: error.message }); } }
const baseCriteria = [
  { rating: 6, source: 'self', evidence: 'A clear example from the submitted response.' },
  { rating: 6.5, source: 'peer', evidence: 'The paragraph order is consistent and logical.' },
  { rating: 7, source: 'teacher', evidence: 'Several accurate topic-specific expressions.' },
  { rating: 6.5, source: 'self', evidence: 'Complex clauses appear with mostly accurate forms.' }
];
const words = n => Array.from({ length: n }, (_, i) => `word${i+1}`).join(' ');

test('module exposes Stage 59 API', () => assert.equal(S.version, '59.0.0'));
test('basic answer-key exact matching and score', () => { const r=S.scoreAnswerKey({keysText:'alpha\nbeta',answersText:'alpha\nwrong'}); assert.equal(r.correctQuestions,1); assert.equal(r.correctMarks,1); assert.equal(r.totalMarks,2); assert.equal(r.accuracyPct,50); assert.equal(r.practiceIndex10,5); });
test('answer comparison is case-insensitive', () => assert.equal(S.scoreAnswerKey({keysText:'Cambridge',answersText:'CAMBRIDGE'}).correctQuestions,1));
test('outer punctuation and extra spaces are normalized', () => assert.equal(S.scoreAnswerKey({keysText:'  the central library  ',answersText:'  The central library.  '}).correctQuestions,1));
test('valid alternative answer variants use double-pipe separator', () => assert.equal(S.scoreAnswerKey({keysText:'colour || color',answersText:'color'}).correctQuestions,1));
test('alternative variants do not accept unlisted spelling', () => assert.equal(S.scoreAnswerKey({keysText:'colour || color',answersText:'colours'}).correctQuestions,0));
test('internal punctuation is not discarded', () => assert.equal(S.scoreAnswerKey({keysText:'twenty-one',answersText:'twenty one'}).correctQuestions,0));
test('spelling is not autocorrected', () => assert.equal(S.scoreAnswerKey({keysText:'environment',answersText:'enviroment'}).correctQuestions,0));
test('blank response is wrong and tracked as blank', () => { const r=S.scoreAnswerKey({keysText:'one\ntwo\nthree',answersText:'one\n\nthree'}); assert.equal(r.correctQuestions,2); assert.equal(r.blankQuestions,1); });
test('omitted trailing learner responses are padded as blanks', () => { const r=S.scoreAnswerKey({keysText:'one\ntwo\nthree',answersText:'one\ntwo'}); assert.equal(r.questionCount,3); assert.equal(r.blankQuestions,1); });
test('too many learner answer rows are rejected', () => assert.throws(() => S.scoreAnswerKey({keysText:'one\ntwo',answersText:'one\ntwo\nthree'}), /more|ko.p/i));
test('empty or blank answer key row is rejected', () => assert.throws(() => S.scoreAnswerKey({keysText:'one\n\ntwo',answersText:'one\ntwo\nthree'}), /bo.sh/i));
test('answer key question count is capped at 40', () => assert.throws(() => S.scoreAnswerKey({keysText:Array(41).fill('x').join('\n'),answersText:''}), /1–40/));
test('custom question marks affect weighted raw score', () => { const r=S.scoreAnswerKey({keysText:'a\nb\nc',answersText:'a\nx\nc',marksText:'2\n3\n1'}); assert.equal(r.correctMarks,3); assert.equal(r.totalMarks,6); assert.equal(r.accuracyPct,50); });
test('marks default to one per question', () => { const r=S.scoreAnswerKey({keysText:'a\nb\nc',answersText:'a\nb\nc'}); assert.equal(r.totalMarks,3); });
test('marks count mismatch is rejected', () => assert.throws(() => S.scoreAnswerKey({keysText:'a\nb',answersText:'a\nb',marksText:'1'}), /marks qatorlari/i));
test('marks must be whole numbers 1 through 4', () => { for (const bad of ['0','5','1.5','-1','abc']) assert.throws(() => S.scoreAnswerKey({keysText:'a',answersText:'a',marksText:bad}), /marks 1–4/); });
test('unordered multi-selection can ignore order when requested', () => assert.equal(S.scoreAnswerKey({keysText:'A, C',answersText:'C A',unordered:true}).correctQuestions,1));
test('multi-selection remains order-sensitive by default', () => assert.equal(S.scoreAnswerKey({keysText:'A, C',answersText:'C A'}).correctQuestions,0));
test('full-width text is Unicode-normalized', () => assert.equal(S.scoreAnswerKey({keysText:'ＡＢＣ',answersText:'ABC'}).correctQuestions,1));
test('multiple marks show question and mark counts separately', () => { const r=S.scoreAnswerKey({keysText:'a\nb\nc',answersText:'a\nb\nx',marksText:'2\n1\n2'}); assert.equal(r.correctQuestions,2); assert.equal(r.questionCount,3); assert.equal(r.correctMarks,3); assert.equal(r.totalMarks,5); });
test('correct mark percentage is rounded to two decimals', () => assert.equal(S.scoreAnswerKey({keysText:'a\nb\nc',answersText:'a\nb\nx'}).accuracyPct,66.67));
test('writing Task 1 requires a real response and records 150-word target', () => { const r=S.rubricScore({type:'writing1',criteria:baseCriteria,responseText:words(150)}); assert.equal(r.wordCount,150); assert.equal(r.wordTarget,150); assert.equal(r.wordTargetReached,true); assert.equal(r.score,6.5); });
test('writing below 150 words is flagged but not mathematically penalized', () => { const r=S.rubricScore({type:'writing1',criteria:baseCriteria,responseText:words(80)}); assert.equal(r.wordTargetReached,false); assert.equal(r.score,6.5); });
test('Task 2 target is 250 words and remains advisory', () => { const r=S.rubricScore({type:'writing2',criteria:baseCriteria,responseText:words(120)}); assert.equal(r.wordTarget,250); assert.equal(r.wordTargetReached,false); assert.equal(r.score,6.5); });
test('writing text minimum prevents blank/no-evidence review', () => assert.throws(() => S.rubricScore({type:'writing2',criteria:baseCriteria,responseText:'Only five short words today.'}), /20 so.z/i));
test('four criterion ratings are equally averaged', () => { const c=baseCriteria.map((x,i)=>({...x,rating:[5,6,7,8][i]})); const r=S.rubricScore({type:'writing2',criteria:c,responseText:words(260)}); assert.equal(r.score,6.5); });
test('criterion ratings accept half-band steps', () => { const c=baseCriteria.map(x=>({...x,rating:6.5})); assert.equal(S.rubricScore({type:'writing1',criteria:c,responseText:words(151)}).score,6.5); });
test('criterion ratings reject quarter-band increments', () => { const c=baseCriteria.map(x=>({...x,rating:6.25})); assert.throws(() => S.rubricScore({type:'writing1',criteria:c,responseText:words(151)}), /0.5 qadam/i); });
test('all four criteria are required', () => assert.throws(() => S.rubricScore({type:'writing1',criteria:baseCriteria.slice(0,3),responseText:words(160)}), /To.rtta mezon/i));
test('every criterion needs a specific evidence note', () => { const c=baseCriteria.map(x=>({...x})); c[2].evidence='too short'; assert.throws(() => S.rubricScore({type:'writing1',criteria:c,responseText:words(160)}), /kamida 12/i); });
test('feedback source is validated per criterion', () => { const c=baseCriteria.map(x=>({...x})); c[0].source='unknown'; assert.throws(() => S.rubricScore({type:'writing1',criteria:c,responseText:words(160)}), /manbasi/i); });
test('self-review source is explicitly labelled as unverified', () => { const c=baseCriteria.map(x=>({...x,source:'self'})); const r=S.rubricScore({type:'writing2',criteria:c,responseText:words(260)}); assert.match(r.sourceLabel,/independent verification absent/i); });
test('outside feedback sources are labelled reported but not authenticated', () => { const r=S.rubricScore({type:'writing2',criteria:baseCriteria,responseText:words(260)}); assert.match(r.sourceLabel,/credentials are not verified/i); });
test('speaking cannot be scored without a saved audio ID', () => assert.throws(() => S.rubricScore({type:'speaking',criteria:baseCriteria,responseText:'',audioId:'',audioReviewed:true}), /saqlangan audio/i));
test('speaking cannot use transcript as substitute for replay confirmation', () => assert.throws(() => S.rubricScore({type:'speaking',criteria:baseCriteria,responseText:words(60),audioId:'clip-1',audioReviewed:false}), /tinglab chiqqaningni/i));
test('speaking score requires actual audio ID and review attestation', () => { const r=S.rubricScore({type:'speaking',criteria:baseCriteria,responseText:words(60),audioId:'clip-1',audioReviewed:true}); assert.equal(r.audioId,'clip-1'); assert.equal(r.audioReviewed,true); assert.equal(r.score,6.5); });
test('Task 1 plus twice Task 2 weighting is calculated correctly', () => assert.equal(S.writingOverall(6,7.5),7));
test('writing combined index refuses a missing task score', () => assert.equal(S.writingOverall(null,7.5),null));
test('writing combined index refuses non-numeric task score', () => assert.equal(S.writingOverall('x',7.5),null));
test('descriptor guides exist for Writing Task 1, Task 2 and Speaking', () => { for (const k of ['writing1','writing2','speaking']) { assert.equal(S.guides[k].length,4); for (const c of S.guides[k]) for (const b of [5,6,7,8,9]) assert.ok(c.anchors[b]); } });

test('legacy Stage 58 score data remains a separate record format', () => { const p=fs.readFileSync(path.join(ROOT,'assets/js/modules/advanced-studio.js'),'utf8'); assert.match(p,/legacy practice index/); assert.match(p,/Old Stage 44–58 records remain intact/); });

test('Stage 58 accuracy adapter receives 0–1 ratio for new raw results', () => { const r=S.scoreAnswerKey({keysText:'a\nb',answersText:'a\nx'}); assert.equal(r.accuracyPct/100,0.5); assert.equal(r.practiceIndex10,5); });

const failed=results.filter(x=>x.status==='FAIL');
const report={release:'59.0.0-precision-scoring',suite:'Stage 59 deterministic scoring-engine unit tests',passed:results.length-failed.length,failed:failed.length,total:results.length,results,limitations:['Answer-key source is user-declared and is not authenticated by the offline app.','Writing and Speaking criterion ratings are human-entered formative reviews, not automatic examiner grades.','The app does not convert raw Reading/Listening marks to a generic band because test-version conversions can vary.']};
fs.writeFileSync(path.join(ROOT,'docs/STAGE59_SCORING_ENGINE_TESTS.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({release:report.release,passed:report.passed,failed:report.failed,total:report.total,failures:failed},null,2));
if(failed.length) process.exit(1);
