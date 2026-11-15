# IELTS Boost — Stage 58 Intelligent Adaptive Learning

**Release:** `58.0.0-adaptive-release`  
**Base:** Stage 57 final release  
**Primary entry:** `index.html`  
**Deployment target:** `finally-` GitHub Pages root at `/finally-/`

## Maqsad va o‘zgarish chegarasi

Stage 58 faqat oldingi auditda aniqlangan individual moslashtirish muammosini yaxshilash uchun qo‘shilgan. Stage 57 ning 84 kunlik curriculum, Reading/Listening/Writing/Speaking modullari, Game Arena, Error Lab, 19K lug‘at, 84 MP3, Advanced Studio, PWA/offline yo‘li va backup funksiyalari qayta yozilmadi. Yangi qatlam ular ustiga alohida, ixtiyoriy Adaptive Learning oynasi sifatida ishlaydi.

## Yangi imkoniyatlar

1. **Four-skill diagnostics** — Reading va Listening uchun answer-key bilan tekshirilgan raw accuracy; Writing uchun qisqa yozma namuna va to‘rtta learner reflection; Speaking uchun transcript, to‘rtta reflection va audio’ni tinglab ko‘rganini tasdiqlash.
2. **Evidence-aware routing** — diagnostika yo‘q bo‘lsa `Diagnostika kerak`; o‘lchangan natijaga qarab `Foundation`, `Core` yoki `Stretch`. Yo‘nalishlar faqat qo‘shimcha mashqni tavsiya qilish uchun ishlatiladi.
3. **Repeated objective signal** — uch yoki undan ortiq noyob answer-key manbasi mavjud bo‘lganda oxirgi 12 tagacha urinishning raw accuracy ko‘rsatkichi birlashtiriladi. Stage 57 Licensed Mock answer-sheet natijalari Reading va Listening uchun ishlatilishi mumkin. Advanced Studio’dagi answer-key-backed Reading accuracy ham foydalaniladi; Listening self-review natijasi obyektiv deb qabul qilinmaydi.
4. **Seven-day booster** — har bir skillga kamida bitta joy ajratiladi; qo‘shimcha mashqlar o‘lchangan zaiflik va ochiq xatolar bo‘yicha tanlanadi. Diagnostika yo‘q bo‘lsa, tizim taxminiy zaif skillni uydirmaydi.
5. **50 contextual vocabulary concepts** — yuklangan “50 Synonyms That Actually Boost Your Score” PDF’dagi 50 bosh tushuncha bo‘yicha original cloze promptlar, kontekstli tanlov, izoh, nuance, ehtiyot eslatmasi, o‘quvchining o‘z gapi, pressure practice va review queue.
6. **Cross-skill transfer loop** — bitta manbani Read → Note → Paraphrase → Speak/Record → Transcribe → Correct → Repeat zanjiri orqali qayta ishlash.
7. **Local-first persistence** — Stage 58 state `Advanced Studio` `extensions.stage58` maydonida saqlanadi; Stage 55 Unified Full-device Backup butun Advanced Studio state’ini olgani uchun yangi progress ham backup ichiga kiradi. Fallback localStorage ham saqlanadi.
8. **Official reference links** — rasmiy IELTS Academic sample tasks, Writing assessment guidance va Speaking public descriptors havolalari mavjud.

## Diagnostika va routing qoidalari

- Reading/Listening: `<55%` → Foundation; `55–79.9%` → Core; `≥80%` → Stretch. Bu Stage 58 ichki mashq threshold’i, IELTS Band Score konversiyasi emas.
- Bitta answer-key sample “single sample” sifatida ko‘rsatiladi. Kamida uchta noyob manba bo‘lsa `Repeated answer-key evidence` darajasi ko‘rsatiladi.
- Har bir Reading/Listening urinishida manba nomini alohida va to‘g‘ri yozish kerak. Aynan bir testni qayta yechish mustaqil yangi dalil sifatida hisoblanmasligi kerak.
- Writing sample minimum 120 so‘z va kamida ikki paragraf. Bu qisqa diagnostika; rasmiy IELTS Academic Task 2 emas. Rasmiy Task 2 kamida 250 so‘z talab qiladi.
- Speaking transcript minimum 70 so‘z. Bu diagnostika namunasi; 11–14 daqiqalik rasmiy Speaking suhbatining o‘rnini bosmaydi. Pronunciation transcript orqali baholanmaydi.
- Writing/Speaking route learner reflection va matnning oddiy strukturaviy signallariga tayangan. Ular examiner bahosi yoki band prediction emas.

## Vocabulary learning design

- Avval 5 ta boshlang‘ich concept tanlanadi.
- Har bir concept uchun bir javob kontekstga eng mos; izoh boshqa variantlarning ma’no farqini ko‘rsatadi.
- O‘quvchi to‘g‘ri tanlovdan keyin o‘zining original gapini tuzadi.
- Pressure test tanlangan concept’larning alternativ iboralarini topadi; oddiy bosh so‘zning takrorlanishini “advanced vocabulary” deb hisoblamaydi.
- Review interval: Again 1 kun, Hard 2 kun, Good 4 kun, Easy 7 kun. Bu oddiy mahalliy SRS jadvali; ilmiy/rasmiy band o‘lchovi emas.

## Saqlangan va o‘zgartirilgan fayllar

**Yangi:** `assets/css/stage58.css`, `assets/js/stages/stage58-adaptive.js`, `data/stage58-vocabulary.json`.

**Integratsiya uchun o‘zgargan:** `index.html`, `assets/js/core/contract.js`, `assets/js/core/module-registry.js`, `assets/js/core/boot.js`, `assets/js/modules/advanced-studio.js` (faqat backward-compatible `extensions` state qo‘shildi), `sw.js`, `manifest.webmanifest`, `release-check.html`, `assets/js/release-check.js`.

Stage 57 test natijalari tarixiy hujjat sifatida saqlanadi; Stage 58 uchun alohida test suite va hisobot qo‘shiladi.

## Cheklovlar

- Hech qanday avtomatik Writing/Speaking IELTS band berilmaydi.
- Stage 58 raw accuracy’dan rasmiy Listening/Reading band chiqarmaydi. IELTS rasmiy ma’lumotida raw mark-to-band chegara test versiyasiga qarab biroz o‘zgarishi aytilgan.
- External examiner tekshiruvi, haqiqiy IELTS imtihoni yoki Band 7 natijasi kafolatlanmaydi.
- Foydalanuvchi kiritgan answer key yoki manba nomining to‘g‘riligini tizim mustaqil tekshira olmaydi; u faqat learner tasdiqlagan dalil bilan ishlaydi.
- Public HTTPS deploy, real Android qurilma, haqiqiy microphone/ASR va offline cold-start build muhitida tasdiqlanmagan; manual acceptance checklist talab qilinadi.
