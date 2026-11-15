#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),checks=[];
function test(id,fn){try{fn();checks.push({id,pass:true});}catch(e){checks.push({id,pass:false,error:String(e.message||e)});}}
const window={};const ctx=vm.createContext({window,Object,Map,Set,Date,TypeError,Error,String,Array});
for(const file of ['assets/js/core/contract.js','assets/js/core/module-registry.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});
const c=window.IELTSBoostContract,a=window.IELTSBoostArchitecture;
test('release-59-contract-and-registry',()=>{assert.equal(c.release,'59.0.0-precision-scoring');assert.equal(c.version,'1.0.0');assert.equal(a.release,'59.0.0');});
test('all-existing-storage-namespaces-unchanged',()=>{assert.equal(c.storage.main,'ielts-boost-rebuilt-1.0');assert.equal(c.storage.mainLegacy,'ielts-boost-state-v1');assert.equal(c.storage.advancedStudio,'IELTSBoost_PlanA_Stage4050_v1');assert.equal(c.storage.mainAudio,'IELTSBoostMedia');assert.equal(c.storage.studioAudio,'IELTSBoostPlanA_Audio_v1');});
test('curriculum-contract-remains-84-day-and-original-volume',()=>{assert.equal(c.requiredCurriculum.days,84);assert.equal(c.requiredCurriculum.readingQuestions,840);assert.equal(c.requiredCurriculum.listeningQuestions,420);assert.equal(c.requiredCurriculum.vocabularyIndex,19000);assert.equal(c.requiredCurriculum.patterns,864);assert.equal(c.requiredCurriculum.articles,61);});
test('registry-dependency-chain-stage59-before-studio-before-stage58',()=>{
 a.registerModule({id:'app-data',version:'57.0.0'});
 a.registerModule({id:'legacy-core',version:'52-compat',dependencies:['app-data']});
 a.registerModule({id:'backup-manager',version:'55.0.0',dependencies:['legacy-core']});
 a.registerModule({id:'stage59-scoring',version:'59.0.0',dependencies:['legacy-core','backup-manager']});
 a.registerModule({id:'advanced-studio',version:'59.0.0',dependencies:['legacy-core','backup-manager','stage59-scoring']});
 a.registerModule({id:'stage58-adaptive',version:'58.0.0',dependencies:['legacy-core','backup-manager','advanced-studio']});
 assert.throws(()=>a.assertDependencies('stage59-scoring'),/not ready/i);
 for(const id of ['app-data','legacy-core','backup-manager'])a.setModuleStatus(id,'ready');
 assert.equal(a.assertDependencies('stage59-scoring'),true);a.setModuleStatus('stage59-scoring','ready');
 assert.equal(a.assertDependencies('advanced-studio'),true);a.setModuleStatus('advanced-studio','ready');
 assert.equal(a.assertDependencies('stage58-adaptive'),true);a.setModuleStatus('stage58-adaptive','ready');
 assert.equal(a.report().filter(x=>x.status==='ready').length,6);
});
test('boot-orders-stage59-scoring-before-advanced-studio-and-stage58',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/core/boot.js'),'utf8');const positions=['backup-manager','stage59-scoring','advanced-studio','stage58-adaptive'].map(x=>s.indexOf(`{id:'${x}'`));assert(positions.every(x=>x>=0));assert(positions.every((x,i)=>!i||positions[i-1]<x));assert.match(s,/IELTSBoostStage59Scoring/);assert.match(s,/IELTSBoostStage58/);assert.match(s,/release:'59\.0\.0', ready:false/);});
test('stage59-engine-api-present-and-immutable',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/stages/stage59-scoring-engine.js'),'utf8');for(const m of ['scoreAnswerKey','rubricScore','writingOverall','normalizeAnswer','countWords'])assert(s.includes(m),m);assert.match(s,/Object\.freeze\(/);});
test('objective-score-adapter-keeps-old-scale-and-stage59-ratio',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/stages/stage58-adaptive.js'),'utf8');assert.match(s,/x\.format === 'stage59-answer-key-v1' \? 100 : 10/);assert.match(s,/type === skill/);});
test('advanced-studio-uses-evidence-led-four-criteria-and-writing-task-weight',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/modules/advanced-studio.js'),'utf8');assert.match(s,/window\.IELTSBoostStage59Scoring\.writingOverall/);assert.match(s,/data-s59-evidence/);assert.match(s,/data-s59-source/);assert.match(s,/getAudioClip\(audioId\)/);assert.match(s,/rawResult/);assert.match(s,/Old Stage 44–58 records remain intact/);});
test('full-backup-schema-remains-the-existing-stage55-manager',()=>{const s=fs.readFileSync(path.join(ROOT,'assets/js/modules/backup-manager.js'),'utf8');assert.match(s,/IELTSBoost\.FullDeviceBackup/);assert.match(s,/IELTSBoost_PlanA_Stage4050_v1/);});
test('service-worker-precache-includes-stage59-and-retains-stage58',()=>{const s=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');for(const p of ['assets/css/stage58.css','assets/css/stage59-scoring.css','assets/js/stages/stage58-adaptive.js','assets/js/stages/stage59-scoring-engine.js','data/stage58-vocabulary.json'])assert(s.includes(p),p);assert.match(s,/ielts-boost-final-sss-59-shell-v1/);assert.match(s,/59\.0\.0-precision-scoring/);});
test('html-manifest-and-release-check-advertise-stage59',()=>{const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8')),pre=fs.readFileSync(path.join(ROOT,'release-check.html'),'utf8'),prejs=fs.readFileSync(path.join(ROOT,'assets/js/release-check.js'),'utf8');assert.match(html,/stage59-scoring\.css/);assert.match(html,/59/);assert.match(manifest.name,/Stage 59/);assert.match(manifest.description,/precision raw-mark and criterion scoring/);assert.match(pre,/Stage 59 Production Preflight/);assert.match(prejs,/59\.0\.0-precision-scoring/);assert.match(prejs,/ielts-boost-final-sss-59-shell-v1/);assert.match(prejs,/Stage 59 precision-scoring assets/);assert.doesNotMatch(prejs,/58\.0\.0-adaptive-release/);});
const passed=checks.filter(x=>x.pass).length,out={release:'59.0.0-precision-scoring',passed,failed:checks.length-passed,total:checks.length,checks};
fs.writeFileSync(path.join(ROOT,'docs/ARCHITECTURE_CONTRACT_TESTS_59_0.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));if(passed!==checks.length)process.exit(1);
