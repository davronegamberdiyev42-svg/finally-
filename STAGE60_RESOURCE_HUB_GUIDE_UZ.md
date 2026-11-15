# Stage 60 — Listening Hub qo‘llanmasi

## Hub’ni ochish

Asosiy `index.html` ilovasida chap navigatsiyadagi **Listening Hub** tugmasini (telefonda pastki navigatsiyadagi **Listen**) bosing. Listening skill sahifasidagi CTA ham xuddi shu oynani ochadi.

## A. 84 kunlik ichki audio bank

1. `Audio library` → `84 kunlik audio bankni ochish`.
2. Kerakli Day’ni tanlab `Open daily audio` bosing.
3. Player’da audio tinglang, 5 ta savolga javob bering.
4. `Check answers with Stage 59` tugmasi raw marks, to‘g‘ri savollar, accuracy va mavjud explanation/evidence’ni ko‘rsatadi.
5. Answer-key bilan tekshirilgan natija Stage 58 Adaptive Learning Listening profiliga uzatiladi.

**Eslatma:** 84 ta ichki MP3 synthetic voice. Ular real aksent yoki official IELTS recording emas.

## B. O‘z audio faylingizni import qilish

1. Audio Library’dagi `Audio + transcript + task pack` formasini to‘ldiring.
2. Audio title kiriting va Part/Level tanlang. Agar material haqiqiy IELTS formatiga mos bo‘lmasa, `General / not IELTS`ni tanlang.
3. Accent maydonini faqat manba aniq aytgan bo‘lsa belgilang; bilmasangiz `Unknown / not labelled` qolsin.
4. Audio fayl tanlang: MP3, WAV, M4A, AAC, OGG/OGA, OPUS, WEBM yoki FLAC. Bir fayl 60 MB’dan katta bo‘lmasin. Playback codec’ga bog‘liq.
5. Transcript’ni `.vtt`, `.srt`, `.json` yoki oddiy `.txt` sifatida tanlang yoki plain text joylashtiring.
6. Quiz yaratmoqchi bo‘lsangiz, `Question prompts` va `Answer key` maydoniga qatorma-qator bir xil miqdorda savol/javob kiriting (1–40).
7. Audio manbasini, ixtiyoriy HTTPS URL va foydalanish asosini yozing.
8. Faqat audio/transcriptdan foydalanishga haqiqatda huquqingiz bo‘lsa rights confirmation’ni belgilang. Answer key tekshirilgan manbadan ekanini tasdiqlamasangiz, `checked` katagini belgilamang.
9. Import’ni yuboring. Audio blob local IndexedDB’da, metama’lumot Advanced Studio extension state’da saqlanadi.

## C. Timed transcript

- VTT/SRT segmentlari audio playback vaqtiga bog‘lanadi.
- JSON formati: array yoki `{ "segments": [...] }`; har segmentda `start`, `end`, `text` ishlatiladi. `startTime`, `endTime`, `caption` aliaslari ham taniladi.
- Vaqtlar soniya ko‘rinishida JSON’da yoki VTT/SRT timestamp ko‘rinishida bo‘lishi mumkin.
- Plain text transcript o‘qiladi, ammo cue-level sync bo‘lmaydi.
- Maximum: 220,000 belgi va 5,000 timed cue.

## D. Practice va strict one-play rejimi

**Practice:** pause/resume, playback speed, cue seeking va cue repeat. Transcriptni ko‘rish mumkin.

**Strict one-play:** exam mode checkbox’ini yoqing va play bosing. Transcript yashiriladi, playback bir marta uzluksiz ishlaydi; app orqali pause, seeking va repeat taqiqlanadi. Audio tugagach transcript ochish mumkin. Practice replay uchun exam mode’ni o‘chiring.

Bu shaxsiy o‘quv simulyatsiyasi; rasmiy IELTS proctoring/security tizimi emas.

## E. Dictation Lab

1. Timed transcript bo‘lsa cue tanlang; aks holda to‘liq transcript reference bo‘ladi.
2. Audio’ni tinglang va javobingizni yozing.
3. `Compare` / dictation check’ni bosing.
4. WER, word edits va normalized token similarity indikatorini ko‘ring.
5. Xato turini tanlang; keyingi urinish uchun repair strategy yozib saqlang.

WER talaffuz yoki ma’no bahosi emas va IELTS band score emas.

## F. Shadowing

1. Shadowing tab’ini oching.
2. Source audio/cue’ni tinglang.
3. `Record` tugmasini o‘zingiz bosib, mikrofon ruxsatini bering.
4. O‘z ovozingizni yozing; `Stop & save` tugmasi bilan saqlang.
5. Qayta tinglang, o‘z reflection’ingizni yozing yoki shaxsiy yozuvni export qiling.

Mikrofon uchun HTTPS yoki localhost va brauzer ruxsati kerak. Ilova pronunciation score ishlab chiqarmaydi. Boshqa insonlarning ruxsatsiz suhbatini yozmang.

## G. Backup va maxfiylik

Advanced Studio → Full-device Backup & Restore’dan backup yarating. Stage 60 import audio va shadowing bloblari ham backup’ga qo‘shiladi. Backup 200 MB ceiling’iga yaqinlashishi mumkin. Audio/transcript va voice recording shaxsiy bo‘lishi mumkin — ZIP yoki backup’ni ommaviy GitHub’ga joylamang. Cloud sync mavjud emas.
