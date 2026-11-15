# IELTS Boost — Stage 60: Real Listening & Resource Hub

**Release:** `60.0.0-real-listening`  
**Asosiy kirish:** `index.html`  
**GitHub Pages path:** `/finally-/`  
**Arxitektura:** Stage 57 baseline + Stage 58 Adaptive Learning + Stage 59 Precision Scoring + Stage 60 Listening Hub

## Maqsad

Stage 60 avvalgi auditda topilgan uchinchi asosiy kamchilikni — Listening mashqlarining sun’iy audio bilan cheklanishini — hal qilishga qaratilgan. Bunda mavjud 84 kunlik audio material yo‘q qilinmadi yoki “real IELTS audio” deb qayta nomlanmadi. Ular qo‘shimcha, synthetic in-app practice sifatida saqlandi. Tabiiy nutq va aksentlar uchun ishonchli tashqi manbalarga havola berildi; foydalanuvchiga ishlatish huquqi bor audio va transcriptni o‘z qurilmasidan import qilish imkoniyati yaratildi.

## 1. 84 kunlik ichki Listening banki

- 84 ta mavjud MP3: `audio/listening-day-01.mp3` … `audio/listening-day-84.mp3`.
- 84 ta original in-app listening script (`data/app-data.json`, `core.days[].listening.script`).
- Har bir kun uchun 5 ta savol va answer key; jami 420 ta mashq savoli.
- Savol izohi va dalil matni mavjud bo‘lgan joyda natija oynasida ko‘rsatiladi.
- MP3 va data mazmuni Stage 59 baseline bilan byte-identical saqlandi.
- Ovoz synthetic computer-generated speech. Bu materiallar rasmiy IELTS, Cambridge yoki British Council recording emas; tabiiy aksent mashqining o‘rnini bosa olmaydi.

## 2. Listening Intelligence Hub — 6 ta bo‘lim

1. **Audio Library:** 84 kunlik bank, import qilingan materiallar, manba/huquq metama’lumoti va audio ombori hajmi.
2. **Player & Test:** audio player, savollar, answer-key tekshiruvi, dalil va explanation, raw marks/accuracy.
3. **Dictation Lab:** to‘liq transcript yoki vaqtli cue bo‘yicha yozib olish va Word Error Rate (WER) bilan matnni taqqoslash.
4. **Shadowing:** mikrofon ruxsati bilan foydalanuvchining o‘z ovozini yozish, qayta tinglash, eksport va self-review.
5. **Error Intelligence:** distractor/correction cue, paraphrase, raqam/ism, word-form, connected speech, accent, attention, note-taking kabi xato turlarini qayd etish va keyingi repair strategiyasini saqlash.
6. **Resources:** IELTS.org format tavsifi va sample tasks, British Council Audio Zone/Listening Skills hamda Mozilla Common Voice dataset sahifalariga tashqi havolalar.

## 3. Import qilinadigan shaxsiy audio

- Audio: MP3, WAV, M4A, AAC, OGG/OGA, OPUS, WEBM, FLAC. Amalda playback browser va device codec qo‘llab-quvvatlashiga bog‘liq.
- Bitta audio fayl: maksimal 60 MB.
- Stage 60 audio + shadowing storage limiti: 120 MB.
- Stage 55 umumiy IndexedDB audio ombori uchun mo‘ljallangan limit: 175 MB; full-device backup ceiling’i 200 MB.
- Har bir importda audio/transcriptdan foydalanish huquqini tasdiqlash majburiy.
- Manba nomi, ixtiyoriy HTTPS URL, ishlatish asosi va aksent (faqat manbada aniq bo‘lsa) yoziladi.
- Transcript: VTT, SRT, JSON timed segments yoki plain text. JSON segmentlar `start`, `end`, `text` (yoki mos aliaslari) maydonlarini qabul qiladi.
- Transcript maksimal 220,000 belgi va 5,000 timed segment; savollar 1–40, har bir prompt 500 belgigacha.
- Custom quiz’da prompt va answer-key qatorlari soni teng bo‘lishi kerak. `answerKeySource` katagiga belgi qo‘yish foydalanuvchining manbani tekshirganini bildiradi; ilova bu tasdiqni mustaqil tekshira olmaydi.

## 4. Practice mode va strict one-play mode

**Practice mode:** pauza/davom ettirish, tezlikni o‘zgartirish, timestamp cue’ga o‘tish va cue’ni qaytarish mumkin.

**Strict one-play mode:**
- transcript boshlanishidan oldin yashirinadi;
- yozuv boshlangach player orqali pauza qilish bloklanadi;
- cue seeking va cue repeat bloklanadi;
- qayta ijro faqat practice mode’ga qaytganda amalga oshadi;
- yozuv tugagach transcriptni ochishga ruxsat beriladi.

Bu brauzer ichidagi o‘quv simulyatsiyasi, rasmiy test platformasining xavfsizlik yoki proctoring tizimi emas. Foydalanuvchi strict mode’ni o‘chirib practice mode’ga qaytishi mumkin.

## 5. Dictation, WER va Shadowing chegaralari

WER reference transcript bilan o‘quvchi yozgan matn o‘rtasidagi so‘z darajasidagi almashtirish/qo‘shish/tushirib qoldirish farqlarini hisoblaydi. Punctuation va katta-kichik harf normallashtiriladi. WER:
- IELTS band score emas;
- talaffuzni baholamaydi;
- ma’noni tushunish yoki accent aniqligini o‘lchamaydi;
- reference transcript xatosiz ekanini kafolatlamaydi.

Shadowing foydalanuvchi roziligi bilan mikrofon API orqali audio yozadi va uni mahalliy saqlaydi. Ilova avtomatik pronunciation score bermaydi. Mikrofon yozuvi uchun HTTPS yoki localhost, brauzer ruxsati va MediaRecorder qo‘llab-quvvatlashi kerak.

## 6. Stage 58 / Stage 59 bilan bog‘lanish

- Har bir verified answer-key quiz `Stage59Scoring.scoreAnswerKey` engine’i orqali raw marks/accuracy sifatida tekshiriladi.
- Built-in daily answer key Stage 58 Adaptive Learning’ga obyektiv practice signal sifatida uzatiladi.
- Imported audio faqat foydalanuvchi answer key manbasini tekshirganini tasdiqlasa, Stage 58 profiliga uzatiladi. Bu user attestation bo‘lib, avtomatik publisher authentication emas.
- Unique `promptId` va attempt ID saqlanadi; bitta prompt qayta yuborilganda adaptive tizim uni takroriy mustaqil test deb sanamasligi kerak.
- Reading/Writing/Speaking yoki boshqa Stage 57/58/59 funksiyalari qayta yozilmadi.

## 7. Ma’lumotlar va backup

- Stage 60 metama’lumotlari Advanced Studio `extensions.stage60` ichida.
- Import audio bloblari va shadowing audio bloblari Stage 55 umumiy IndexedDB store’i `IELTSBoostPlanA_Audio_v1 / clips` ichida.
- Full-device Backup/Restore metadata va audio bloblarni bir snapshot’da saqlashga mo‘ljallangan.
- Cloud sync yo‘q: audio va transcript browser/device local storage’da qoladi.
- Backup ichida shaxsiy ovoz, transcript va o‘quv javoblari bo‘lishi mumkin. Uni ommaviy GitHub repository’ga yoki ulashiladigan joyga joylamang.

## 8. O‘zgarmagan qismlar

Stage 59 baseline’dagi barcha mavjud fayllar saqlandi. `data/app-data.json`, vocabulary index, Stage 58 materiallari, Stage 58 adaptive module, Stage 59 scoring engine/CSS, backup manager, eski core/UI modullari, `standalone.html` va 84 MP3 byte-identical. Runtime’dagi o‘zgarishlar Stage 60 entry point/contract/boot/cache/registry, Advanced Studio’dagi objective-answer-key bridge, release-check va yangi Stage 60 JS/CSS bilan cheklangan.

## 9. Natijani talqin qilish

Stage 60 tabiiy audio bilan shug‘ullanishni ancha kengaytiradi, lekin IELTS Band 6.5/7.0 natijasini kafolatlamaydi. Tabiiy audio manbalari ham to‘liq IELTS mock test bilan bir xil emas. Foydalanuvchi to‘liq 4-part/40-question practice pack yaratganda yoki rasmiy sample tasklardan foydalanganda test formatiga yaqinlashadi. Rasmiy IELTS examiner yoki real-device sinovi o‘rnini browser automation bosa olmaydi.
