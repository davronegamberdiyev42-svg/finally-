# Stage 60 — Public / Android Production Acceptance Checklist

**Target:** `finally-`  
**Expected URL:** `https://davronegamberdiyev42-svg.github.io/finally-/`

Bu checklist manual. Local test yoki ZIP checksum public deployment va haqiqiy qurilma kuzatuvining o‘rnini bosmaydi. Har bir bo‘limda sana, qurilma, brauzer versiyasi va natijani qayd eting.

## A. GitHub Pages deployment

- [ ] ZIP tarkibi repository root’iga joylangan; wrapper papka yo‘q.
- [ ] `main` root’da `index.html`, `manifest.webmanifest`, `sw.js`, `release-check.html`, `assets/`, `data/`, `audio/`, `icons/` bor.
- [ ] Pages: Deploy from branch → `main` → `/(root)`.
- [ ] Public HTTPS `/finally-/` ilovani qaytaradi; HTML/JS assetlarda 404 yo‘q.
- [ ] Manifest scope, start_url va SW scope aynan `/finally-/` bilan mos.

## B. Live production preflight

- [ ] `/finally-/release-check.html` oching va Full production preflight bajaring.
- [ ] Stage 58 contract, Stage58 CSS/JS, 50 vocabulary item va manifest tekshiruvi PASS.
- [ ] App-data checksum, 84-day curriculum, 19K vocabulary checksum/IDs PASS.
- [ ] 84 MP3 HEAD endpoint PASS; MP3 Range natijasini kuzating.
- [ ] Service Worker active/controller va CacheStorage release cache tekshirilsin.
- [ ] Preflight JSON faylini saqlang; FAIL bo‘lsa release’ni qabul qilmang.

## C. Adaptive Learning

- [ ] Reading va Listening diagnostikasida answer key, savol soni va manba nomini kiriting.
- [ ] Takroriy attempt’larda mustaqil manba nomi ishlatilishini tekshiring; bir xil testni qayta urinish yangi dalil deb hisoblanmasin.
- [ ] Writing sample va Speaking transcript oynalarida sample cheklovlari/izohlarini ko‘ring.
- [ ] Pronunciation transcript asosida avtomatik baholanmasligini tekshiring.
- [ ] Tanlangan zaif task/criterion 7 kunlik booster vazifalarida ko‘rinishini tekshiring.
- [ ] Foundation/Core/Stretch nomlari rasmiy IELTS band deb talqin qilinmasin.

## D. Vocabulary va persistence

- [ ] 50 ta contextual concept yuklanadi; variant, javob izohi va Uzbek hint ko‘rinadi.
- [ ] Original gap saqlanadi; review interval va pressure test holati saqlanadi.
- [ ] Sahifani reload qiling; Stage58 diagnostic va vocabulary state tiklanadi.
- [ ] Stage55 Full-device backup’dan COMPLETE export qilib, JSON ichida `extensions.stage58` borligini tekshiring.
- [ ] Backup’ni xavfsiz joyda saqlang; public repository’ga commit qilmang.
- [ ] Test backup’ni restore qilib Stage58 progress tiklanishini tekshiring.

## E. Android / microphone / offline cold-start

- [ ] Real Android Chrome’da saytni oching va PWA installability’ni tekshiring.
- [ ] Speaking mic faqat foydalanuvchi aniq bosganda so‘ralsin; ruxsat rad etilganda manual transcript ishlasin.
- [ ] MediaRecorder/ASR mavjudligini va recording playback/restore’ni real qurilmada sinang.
- [ ] Online birinchi ishga tushirishdan keyin SW controller paydo bo‘lsin; keyin internetni o‘chirib cold-start qiling.
- [ ] Offline ishlashi keshga yuklangan resurslar bilan cheklanganini qayd eting; barcha MP3 oldindan offline mavjud deb da’vo qilmang.

## Release qarori

- Public URL: ____________________
- Qurilma / Android: ____________________
- Chrome version: ____________________
- Test sana: ____________________
- Preflight JSON: ____________________
- FAIL / WARN / NOT TESTED izohi: ____________________
- Qabul qilgan shaxs: ____________________

---

# Stage 60 — Real device acceptance

- [ ] On HTTPS GitHub Pages, open Listening Hub from desktop and mobile nav.
- [ ] Open Day 1 built-in practice. Confirm the synthetic-voice warning is visible; play MP3; answer five items; raw marks and accuracy render.
- [ ] Confirm at least three unique built-in answer-key quiz attempts are reflected in Stage 58 Adaptive Listening profile.
- [ ] Enable strict one-play mode; verify transcript stays hidden, cue seeking and pause/replay are unavailable during the active playback, and transcript unlocks when audio ends.
- [ ] Disable strict mode; verify practice pause, playback speed, cue jump and cue repeat.
- [ ] Import a small user-owned/authorised MP3 or WAV with a matching VTT/SRT transcript and one question/key. Verify timed cue sync, answer-key check and raw score.
- [ ] Import an unsupported/corrupt audio sample and a malformed VTT/JSON file; confirm clear validation error and no broken library record.
- [ ] Test Dictation with a known sentence; verify WER changes as expected when words are changed. Confirm UI states it is not IELTS/pronunciation scoring.
- [ ] Test Shadowing only after an explicit Record click; grant microphone permission; record, stop, replay and export; check that microphone indicator stops after recording.
- [ ] Run full-device backup. Confirm Stage 60 audio and metadata are included; restore into a test profile and verify playback.
- [ ] Test 390px and a real Android phone for keyboard visibility, modal focus return, scrolling and no horizontal overflow.
- [ ] Install PWA, close browser, disconnect network and cold-start; verify cached shell and intended offline content. Reconnect and confirm update.
- [ ] Check storage quota and low-space recovery; export/delete a test clip and verify metadata/blob deletion.
- [ ] Ensure personal voice recordings and full-device backups are not committed to the public repository.
