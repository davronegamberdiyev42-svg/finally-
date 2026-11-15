# IELTS Boost Stage 59 — Precision Scoring System

**Release:** `59.0.0-precision-scoring`  
**Baza:** Stage 58 final release  
**Maqsad:** Stage 58 auditidagi baholashning obyektivligi va manba ishonchliligi muammosini tuzatish.

## Qisqa natija

Stage 59 baholashni uch xil ma'lumot qatlamiga ajratadi:

1. **Reading / Listening raw result** — answer key va o‘quvchi javoblari savolma-savol solishtiriladi; to‘g‘ri javoblar, bo‘sh javoblar, jami raw marks va aniqlik foizi saqlanadi.
2. **Writing / Speaking formative review** — IELTS’ning tegishli to‘rtta kriteriyasi bo‘yicha 0–9 oralig‘ida, 0.5 qadamli practice rating, kuzatilgan dalil va feedback manbasi qayd qilinadi.
3. **Evidence provenance** — natija qayerdan kelgani va manba mustaqil tekshirilganmi-yo‘qmi ochiq ko‘rsatiladi. Offline ilova teacher, examiner yoki publisher nomini autentifikatsiya qila olmaydi.

Stage 59 hech bir natijani rasmiy IELTS band score deb taqdim etmaydi va Reading/Listening raw marks’ni umumiy konversiya jadvali orqali bandga aylantirmaydi.

## 1. Reading va Listening — answer-key raw scoring

### Kiritish tartibi

Advanced Studio → Scoring engine → Reading yoki Listening:

- Har bir savolning javob kalitini alohida qatorda kiriting.
- O‘quvchi javoblarini xuddi shu tartibda, har savolga bitta qatorda kiriting.
- Bir nechta ruxsat etilgan variant bo‘lsa `||` bilan ajrating. Masalan: `colour || color`.
- Kerak bo‘lsa marks qatoriga har savol uchun 1–4 butun ball kiriting. Kiritilmasa, har savol 1 ball.
- Multiple-selection savolida javob tartibi ahamiyatsiz bo‘lsa, “ignore answer order”ni yoqing.
- Noyob Attempt / Prompt ID belgilang.

### Hisoblash

`Raw accuracy = correct marks ÷ total marks × 100`.

Bo‘sh javob noto‘g‘ri deb sanaladi. Javoblarni avtomatik imlo tuzatish, lemmatise qilish yoki avtomatik sinonim deb qabul qilish yo‘q. Tashqi answer key’da ruxsat etilgan variantlarni o‘zingiz aniq `||` bilan ko‘rsating. Dastur case va ortiqcha tashqi tinish belgilarini normallashtiradi, lekin imlo va ichki tinish belgilarini o‘zgartirmaydi.

Ilova 1–40 savolni qabul qiladi. Bu 40 savollik IELTS Listening/Reading testiga mos keladi, lekin custom practice set’larni ham qo‘llaydi. Test formati Academic Reading, General Training Reading, Listening yoki Custom deb qayd qilinadi.

### Manba ishonchliligi

Answer-key manbasi `Official sample / published key`, `Publisher`, `Teacher-checked`, yoki `Self-created` sifatida foydalanuvchi tomonidan tanlanadi. Bu tanlov audit trail uchun yoziladi; ilova manbani mustaqil tekshirmaydi. UI’da `user-selected`, `user-reported` yoki `not independently checked` iboralari aniq ko‘rsatiladi.

### Nega raw accuracy ko‘rsatiladi?

IELTS’ning rasmiy scoring izohiga ko‘ra Listening va Reading 40 savoldan iborat, to‘g‘ri javoblar xom ball beradi va bandga aylantirish talab qiladigan aniq marks test versiyasiga qarab biroz o‘zgaradi. Shuning uchun Stage 59 umumiy band-konversiya jadvalini taxmin qilmaydi; raw marks va raw accuracy’ni saqlaydi.

## 2. Writing — kriteriya va dalil

Task 1 va Task 2 alohida baholanadi. Har bir taskda to‘rtta kriteriya teng vaznda o‘rtachalanadi.

**Writing Task 1:**
- Task Achievement
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

**Writing Task 2:**
- Task Response
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

Har bir kriteriya uchun:
- 0–9 oralig‘ida, 0.5 qadam bilan practice rating tanlanadi;
- kamida 12 belgili aniq kuzatilgan dalil yoziladi;
- dalil manbasi self, peer, teacher yoki examiner feedback reported sifatida belgilanadi.

Javob matni saqlanadi; bo‘sh yoki juda qisqa matnni dalilsiz baholashning oldi olinadi. Task 1 uchun 150, Task 2 uchun 250 so‘zlik target ko‘rsatiladi. Bu target Stage 59’da indikator sifatida qayd qilinadi; dastur so‘z soni kamligi uchun kriteriya ballini avtomatik kamaytirmaydi.

Agar ikkala task bahosi mavjud bo‘lsa, platformaning Writing practice index’i:

`(Task 1 × 1 + Task 2 × 2) ÷ 3`.

Bu formuladagi Task 2 ikki karra vazn rasmiy IELTS Writing scoring qoidasi bilan mos. Biroq ilova ichidagi rating’lar learner/peer/teacher tomonidan kiritilgan formative review bo‘lib qoladi, rasmiy examiner score emas.

## 3. Speaking — audio bilan dalillash

Speaking uchun to‘rtta kriteriya teng vaznda:
- Fluency & Coherence
- Lexical Resource
- Grammatical Range & Accuracy
- Pronunciation

Har biri uchun 0–9, 0.5 qadamli practice rating va aniq kuzatuv dalili kiritiladi. Transcript matni fluency/lexical/grammar bo‘yicha fikr yuritishga ko‘mak berishi mumkin, ammo **pronunciation’ni transcriptdan baholash mumkin emas**.

Speaking rubric’ni saqlash uchun:
1. Advanced Studio → Speaking Transcript’dan shu qurilmada audio yozuv saqlangan bo‘lishi kerak.
2. Scoring form’da aynan o‘sha audio clip tanlanadi.
3. O‘quvchi uni qayta tinglab pronunciation’ni ko‘rib chiqqanini tasdiqlaydi.
4. Save paytida ilova clip metadata bilan cheklanmay, IndexedDB’dagi haqiqiy audio Blob mavjudligi va bo‘sh emasligini ham tekshiradi.

Mikrofon ruxsati yoki haqiqiy audio saqlanmagan bo‘lsa, pronunciation’li Speaking overall review saqlanmaydi. Transcript/audio yozuvni bir-birining o‘rniga qo‘yish yo‘q.

## 4. Bahoning ishonchliligi va talqini

Stage 59 descriptor guide rasmiy IELTS band 5/6/7/8/9 tavsiflarining ixcham, qayta ifodalangan o‘quvchi yo‘riqnomasidir. Bu to‘liq rasmiy descriptor matni emas.

- To‘rtta self-review bo‘lsa: `Learner self-review · independent verification absent`.
- Peer/teacher/examiner feedback tanlansa: `Additional feedback source reported · reviewer credentials are not verified by this app`.
- Answer-key source esa foydalanuvchi tanloviga asoslanadi; offline app litsenziya yoki haqiqiy publisher manbasini tekshirmaydi.
- Har bir kriteriyaga dalil kerak; dalil yozilgani o‘z-o‘zidan bahoning to‘g‘riligini kafolatlamaydi.

Demak, Stage 59 score’ni rasmiy examiner bahosi deb emas, evidence-led formative practice record deb tushunish kerak.

## 5. Stage 58 adaptive bilan integratsiya

Reading va Listening Stage 59 raw accuracy’lari `0–1` nisbatida saqlanadi va Stage 58 adaptive profiliga 0–100 raw accuracy sifatida uzatiladi. Har ikkala skill ham endi answer-key natijalaridan foydalana oladi.

Oldingi Stage 44–58 score yozuvlari o‘z formatida qoladi. Ular yangi scoring formulasi bilan yashirincha qayta hisoblanmaydi. Stage 58 legacy Reading scale’i uchun oldingi ko‘paytirish qoidasi saqlanadi; Stage 59 raw format alohida nisbat sifatida aniqlanadi.

## 6. Saqlash va backup

- Yangi scoring yozuvlari Advanced Studio mavjud `IELTSBoost_PlanA_Stage4050_v1` storage namespace’ida saqlanadi.
- Stage 55 Full-device Backup formatiga yangi score yozuvlari kiradi.
- Speaking audio Blob’lar avvalgi IndexedDB audio store’da qoladi; full-device backup ularni mavjud backup mexanizmi orqali birga eksport qiladi.
- Yangi cloud/server sync нэмэгдээгүй. Ma’lumotlar local-first saqlanadi.
- Backup ichida shaxsiy essay, transcript, feedback va audio bo‘lishi mumkin; uni ochiq repository yoki begona qurilmaga yuklamang.

## 7. O‘zgargan runtime fayllar chegarasi

Stage 58 bilan taqqoslaganda faqat quyidagi mavjud runtime fayllarga maqsadli o‘zgarish kiritildi:

- `index.html`, `manifest.webmanifest`, `release-check.html`, `sw.js`
- `assets/js/core/boot.js`, `contract.js`, `module-registry.js`
- `assets/js/modules/advanced-studio.js`
- `assets/js/stages/stage58-adaptive.js` — Stage 59 raw accuracy bridge va eski legacy scale compatibility

Yangi runtime modullar:
- `assets/js/stages/stage59-scoring-engine.js`
- `assets/css/stage59-scoring.css`

84 kunlik curriculum, Reading/Listening bank, 19K index, vocabulary material, 84 MP3, Game Arena, Error Lab, Stage58 adaptive content, Stage55 backup manager va legacy `standalone.html` byte-identical saqlandi.

## 8. QA holati

Stage 59 release QA natijalari `STAGE59_QA_REPORT_UZ.md` va machine-readable JSON hisobotlarda berilgan. Testlar avtomatik format va saqlash oqimini tekshiradi; real IELTS examiner performance’ni sertifikatlamaydi.
