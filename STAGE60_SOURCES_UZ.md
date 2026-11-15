# Stage 60 — Manbalar va metodika

**Release:** `60.0.0-real-listening`  
**Tekshiruv sanasi:** 15 November 2026

## 1. Rasmiy IELTS manbalari

### IELTS Listening test format

https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening

Stage 60 format eslatmasida ushbu rasmiy sahifadagi asosiy tuzilma qo‘llanadi: 4 qism, har birida 10 savol, jami 40 savol; recording bir marta eshittiriladi; British, Australian, New Zealand va North American aksentlari uchrashi mumkin. Sahifa turli task formatlari va test bo‘yicha ko‘rsatmalarni ham beradi.

### IELTS sample test questions

https://ielts.org/take-a-test/preparation-resources/sample-test-questions

Foydalanuvchi rasmiy sample testlarni o‘z saytidan alohida ochishi mumkin. Protected content ZIP’ga ko‘chirilmadi.

## 2. Tabiiy audio va qo‘shimcha nutq manbalari

### British Council — Audio zone

https://learnenglish.britishcouncil.org/free-resources/general/audio-zone

Tabiiy speaker nutqi, xalqaro aksentlar, transcript va comprehension mashqlari bo‘lgan tashqi o‘quv resursi. Stage 60 faqat manba sahifasiga link beradi; audio fayllarni mirror yoki ZIP’ga ko‘chirmaydi. Audio formatining darajasi va maqsadi IELTS Listening mock test bilan aynan teng emas.

### British Council — Listening skills

https://learnenglish.britishcouncil.org/skills/listening

Darajaga mos listening darslari va mashqlar uchun tashqi yo‘naltiruvchi manba.

### Mozilla Common Voice — Datasets

https://commonvoice.mozilla.org/en/datasets

Nutq namunalarining turli speaker/locale’larini tanish uchun qo‘shimcha dataset manbasi. Common Voice materialini IELTS test deb qabul qilmaslik kerak. Dataset yuklab olinayotganda English locale, release, format, dataset sahifasidagi amaldagi shart va hajmni foydalanuvchi qayta tekshirishi kerak. ZIP ichiga Common Voice audio yoki dataset nusxalanmagan.

## 3. Loyihaning mavjud shaxsiy resurslari

### IELTS Boost Stage 57/59 baseline

Mavjud `data/app-data.json` ichidagi 84 kunlik listening script/question pack va `audio/listening-day-01.mp3` … `audio/listening-day-84.mp3` Stage 60’da qayta ishlatildi. Bu 84 MP3 synthetic computer-generated speech. Har kuni beshtadan savol; jami 420 ta in-app practice savoli. Fayllar Stage 59 baseline bilan checksum bo‘yicha byte-identical saqlandi.

### Foydalanuvchi yuklagan Barron’s IELTS PDF

361 sahifali foydalanuvchi PDF’si 6 ta Academic va 6 ta General Training practice test tuzilmasi, answer sheet, answer key, answer explanation va Listening scriptlar borligini ko‘rsatadi. Stage 60 uchun undan umumiy metodika — audio bilan ishlash, keyin transcript/answer explanation orqali xatoni o‘rganish — tushunchasi olindi. PDF’dagi to‘liq savol matnlari, answer explanation va audio scriptlar ZIP’ga ko‘chirilmadi.

### Foydalanuvchi yuklagan “50 Synonyms That Actually Boost Your Score” PDF

50 ta kontekstga bog‘liq vocabulary concept Stage 58 Vocabulary Lab’da allaqachon ishlatiladi; Stage 60 bu bazani o‘zgartirmaydi. Mazkur PDF ham Stage 60 ZIP’iga qayta ko‘chirilmagan.

## 4. Muhim metodik ajratish

- IELTS official format = test tuzilmasi haqidagi manba.
- British Council Audio Zone = tabiiy umumiy inglizcha listening practice.
- Common Voice = nutq dataset; IELTS mock test emas.
- IELTS Boost 84 MP3 = synthetic in-app practice; authentic natural accent yoki official IELTS audio emas.
- Foydalanuvchi import qilgan audio = huquq tasdig‘i foydalanuvchining zimmasida; ilova litsenziyani tekshirmaydi.
- Dictation WER = text similarity/error metric; IELTS score yoki pronunciation assessment emas.
