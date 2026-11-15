> **Tarixiy Stage 59 QA report.** `final-sss` ushbu bosqichdagi eski test subpath’idir; joriy Stage 60 target `finally-`.

# IELTS Boost — Stage 59 Final QA Report

**Release:** `59.0.0-precision-scoring`  
**Target:** `final-sss` repository root; GitHub Pages subpath `/final-sss/`.

## Automated test natijalari

| Suite | PASS | FAIL | Usul / izoh |
|---|---:|---:|---|
| Scoring engine unit | 43 | 0 | Answer matching, blank rows, weights, 4-criteria rubrics, word targets, source labels, Speaking audio gate, Task 2 weighting |
| Browser acceptance | 31 | 0 | Chromium DOM/runtime, Stage58 adaptive, raw score, rubric, backup, focus, 390px mobile, console and assets |
| Architecture contract | 11 | 0 | Release ID, storage namespace, boot dependencies, legacy compatibility, PWA paths |
| Service Worker simulation | 11 | 0 | Stage59 shell, Stage58 retention, cache migration, shared cache retention, lazy vocabulary, audio Range |
| Full backup/restore | 14 | 0 | Main/legacy/Studio namespaces, Stage58 extension, Stage59 score fixtures, audio stores, rollback and reset |
| Local HTTP subpath smoke | 117 | 0 | `/final-sss/`, Stage59 assets, existing app files/data and 84 MP3 HEAD requests |
| Static + SHA diff QA | 16 | 0 | Required files, local references, Stage58 preservation, protected assets, scoring rules |
| Production preflight VM | 25 | 0 | Release 59 contract, Stage59 scoring assets, Stage58 adaptive retention, `/final-sss/` scope, PWA caches, 84 MP3 endpoints; plus 1 physical acceptance NOT TESTED |
| JavaScript syntax sweep | 10 | 0 | `node --check` over every `assets/js/**/*.js` file |
| **Jami** | **278** | **0** | Suite natijalari; testlar ayrim runtime qismlarini qayta tekshiradi va mustaqil examiner validation emas. |

Machine-readable hisobotlar `docs/` ichida:
- `STAGE59_SCORING_ENGINE_TESTS.json`
- `BROWSER_RUNTIME_59_0.json`
- `ARCHITECTURE_CONTRACT_TESTS_59_0.json`
- `SERVICE_WORKER_SIM_59_0.json`
- `BACKUP_MANAGER_TESTS_59_0.json`
- `HTTP_SMOKE_59_0.json`
- `STATIC_QA_59_0.json`
- `NODE_SYNTAX_59_0.json`
- `RELEASE_CHECK_HARNESS_59_0.json`

Ishga tushirish:

```bash
node tests/run_stage59_scoring_engine.js
python tests/run_browser_acceptance_59.py
node tests/run_architecture_contract_59.js
node tests/run_service_worker_sim_59.js
node tests/run_backup_manager_tests_59.js
python tests/run_http_smoke_59.py
python tests/run_static_qa_59.py
python tests/run_node_syntax_59.py
node tests/run_release_check_harness_59.js
```

## Xususan tekshirilganlar

- Reading/Listening: exact key comparison, accepted alternatives, case/punctuation handling, blank answers, spelling non-autocorrection, optional per-question marks, raw percentage, no generic band conversion.
- Writing: Task 1/Task 2 alohida to‘rtta kriteriya, evidence per criterion, source provenance, 150/250-word indicator, Task 2 double weight.
- Speaking: four criteria, transcript not accepted as pronunciation evidence, saved audio ID + learner replay attestation required, app checks that the actual IndexedDB Blob exists and is non-empty before saving.
- Stage58 adaptive: Stage59 Reading AND Listening `accuracy` 0–1 ratios are correctly bridged; legacy Stage44–58 Reading scale branch retained.
- Backup: Stage59 scores and Stage58 extension survive the existing Stage55 full-device backup schema.
- UX: 390px mobile render has no horizontal overflow; keyboard focus returns after dialogs close; browser reports no JavaScript errors, console errors or missing local assets.
- Baseline: 84-day curriculum, question banks, 19K vocabulary index, Stage58 content, backup manager, core app styles and `standalone.html` byte-identical.

## QA chegaralari va NOT TESTED

1. Real Android qurilma va haqiqiy mikrofon/ASR permission sinovi bu muhitda bajarilmadi.
2. Public GitHub Pages deploy va real installable PWA cold-start (offline) bu muhitda bajarilmadi; HTTP subpath va Service Worker alohida simulyatsiya qilindi.
3. Ilova answer-key manbasini, peer/teacher/examiner feedback muallifini yoki ularning malakasini autentifikatsiya qilmaydi.
4. Writing/Speaking ratings human-entered formative assessment; avtomatik IELTS examiner scoring emas.
5. Raw Reading/Listening marks rasmiy band konversiyasiga avtomatik aylantirilmaydi. IELTS’ning o‘zi raw-to-band chegaralari test versiyasiga qarab biroz farq qilishi mumkinligini aytadi.

Manual production acceptance real Android/Chrome va HTTPS deploydan keyin `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_UZ.md` bo‘yicha bajariladi.
