> **Joriy deployment target:** `davronegamberdiyev42-svg/finally-`, GitHub Pages path `/finally-/`. Local HTTP/browser suite’lari ushbu release bilan birga `/finally-/` ostida qayta ishga tushiriladi. Repository paket tayyorlangan paytda public va empty; public deployment hali bajarilmagan.

# Stage 60 — yakuniy sifat nazorati hisoboti

**Release:** `60.0.0-real-listening`  
**Baseline:** Stage 59 final ZIP’ning aniq extract qilingan versiyasi  
**QA sanasi:** 15 November 2026

## Yakuniy avtomatik testlar

| Suite | PASS | FAIL | NOT TESTED | Jami |
|---|---:|---:|---:|---:|
| Listening engine / parser / WER | 19 | 0 | 0 | 19 |
| Architecture & release contract | 17 | 0 | 0 | 17 |
| Browser acceptance (Chromium) | 47 | 0 | 0 | 47 |
| HTTP smoke, `/finally-/` subpath | 119 | 0 | 0 | 119 |
| JavaScript syntax sweep | 11 | 0 | 0 | 11 |
| Backup / Restore simulation | 14 | 0 | 0 | 14 |
| Service Worker / Cache / Range simulation | 11 | 0 | 0 | 11 |
| Production release preflight harness | 27 | 0 | 1 | 28 |
| Static QA + Stage 59 checksum audit | 20 | 0 | 0 | 20 |
| **Jami** | **285** | **0** | **1** | **286** |

**Talqin:** 285 avtomatik assertion PASS, 0 FAIL va 1 NOT TESTED. Suite’lar ayrim funksiyalarni turli qatlamlarda qayta tekshiradi, shuning uchun bu son mustaqil featurelar soniga teng emas.

## Browser acceptance’da tekshirilgan oqimlar

- Stage 57 baseline runtime, Stage 58 adaptive va Stage 59 scoring’dan keyin Stage 60 modul boot bo‘lishi.
- 84 ta built-in track, 84 script, 84 local MP3 path va 420 savol banki.
- 3 ta noyob built-in daily answer-key quiz, raw marks va Stage 58 Adaptive Listening profile’ga uzatish.
- Strict one-play: transcriptni yashirish, active playback vaqtida reveal/pause/seeking/repeat’ni bloklash va practice mode’ga qaytish.
- Dictation matn taqqoslash, 0.0% WER fixture va xato turini/repair strategy’ni saqlash.
- British Council Audio Zone external source link; source audio’ni ZIP’ga ko‘chirmaslik.
- User-authorised WAV + timed VTT import, answer-key quiz va Stage 58 adaptive sync.
- Stage 55 Full-device Backup snapshot’ida Stage 60 metadata/audio blob, quiz attempt, dictation va error records.
- 390px Chromium viewport, gorizontal overflow yo‘qligi va desktop/mobile focus restoration.
- Page JavaScript error, console error va local asset HTTP failure yo‘qligi.

Browser environment microphone device, real speaker output yoki public internetga chiqmagan; audio API’ning ayrim qismlari deterministik browser harness bilan tekshirilgan.

## Unit / integration QA

### Listening engine (19/19)

84 track banki, transcript parsing (VTT/SRT/JSON/plain text), timestamp parsing, segment count/length limits, malformed transcript rejection, WER’ning substitution/insertion/deletion va empty reference holatlari, answer-key matching va accent/provenance metama’lumotlari tekshirildi.

### Architecture (17/17)

Release contract, app-data/vocabulary fingerprint, Stage58/59 dependencies, Stage60 CSS/JS assets, 84×5 question mapping, 84 MP3, manifest/cache version, local IndexedDB extension store, external source links, user rights/privacy confirmation va Stage52 fallback saqlangani tekshirildi.

### Service Worker (11/11)

Stage60 shell asset caching, 60 shell cache namespace, eski umumiy audio/vocabulary cache’larini saqlash, MP3 Range `206`, suffix range va invalid range `416` javoblari test double orqali tekshirildi. Bu haqiqiy offline PWA install testi emas.

### Backup / Restore (14/14)

Stage60 metadata, import qilingan audio blob, shadowing blob, Stage58/59 oldingi state, cancellation/rollback, restore va reset ssenariylari deterministic IndexedDB/localStorage test double’da tekshirildi.

### HTTP smoke (119/119)

Local test server’da `finally-` subpath ostida entry point, assets, data, docs va 84 MP3’ning mavjudligi hamda HTTP status tekshirildi. Bu GitHub Pages public deployment tasdig‘i emas.

### Static QA / baseline preservation (20/20)

Stage59’dagi barcha fayllar saqlangan; `data/app-data.json`, vocabulary index, Stage58/59 engine/style, legacy core, Stage55 backup manager, `standalone.html` va 84 MP3 byte-identical. Stage60 uchun ruxsat etilgan runtime o‘zgarishlar va yangi ikki asset bilan cheklangan. Stage59 tarixiy browser report asl checksum bilan qaytarilib saqlandi.

## NOT TESTED — alohida haqiqiy qurilmada bajarish kerak

1. **Real Android / iOS device acceptance:** install, audio output, backgrounding, storage quota va screen rotation.
2. **Physical microphone / MediaRecorder:** ruxsat so‘rovi, yozib olish, stop, replay, export va permission denial.
3. **Public GitHub Pages deployment:** `https://<owner>.github.io/finally-/`, HTTPS scope, manifest, service worker install/update.
4. **Real offline cold-start:** PWA o‘rnatilgach internetni uzib qayta ishga tushirish va MP3’lar byte-range playback’ini tasdiqlash.
5. **Codec matrix:** MP3/WAV/M4A/AAC/OGG/OPUS/WEBM/FLAC’ni turli haqiqiy brauzer/device’larda ijro etish.
6. **Browser speech recognition/ASR:** Stage 60 hozir ASR orqali avtomatik transcript yaratmaydi; bu feature bor deb e’lon qilinmaydi.

## Cheklovlar va halollik

- 84 bundled MP3 synthetic computer-generated speech; official IELTS recording yoki authentic accent material emas.
- Tabiiy audio resurslariga external provider link bor, ammo provider audio ZIP ichiga nusxalanmagan.
- Custom audio/transcript uchun rights checkbox foydalanuvchining tasdig‘i; ilova litsenziyani tasdiqlamaydi.
- WER — text-level metric; IELTS score, pronunciation yoki ma’no bahosi emas.
- Shadowing audio user tomonidan yoziladi; avtomatik pronunciation score yo‘q.
- Stage 60 IELTS Band 6.5/7.0 natijasini kafolatlamaydi.

Machine-readable suite reports: `docs/STAGE60_LISTENING_ENGINE_TESTS.json`, `docs/ARCHITECTURE_CONTRACT_60_0.json`, `docs/BROWSER_RUNTIME_60_0.json`, `docs/HTTP_SMOKE_60_0.json`, `docs/NODE_SYNTAX_60_0.json`, `docs/BACKUP_MANAGER_TESTS_60_0.json`, `docs/SERVICE_WORKER_SIM_60_0.json`, `docs/RELEASE_CHECK_HARNESS_60_0.json` va `docs/STATIC_QA_60_0.json`.
