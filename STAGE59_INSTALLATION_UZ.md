> **Tarixiy Stage 59 yo‘riqnomasi.** Bu bosqichdagi `final-sss` yo‘li endi amaldagi deployment target emas. Stage 60 uchun `INSTALL_FINAL_STAGE_UZ.md` va `GITHUB_UPLOAD_GUIDE_UZ.md`dan foydalaning.

# IELTS Boost Stage 59 — Final Release o‘rnatish

## GitHub Pages

1. `IELTS_Boost_Stage59_Final_Release_final-sss_GITHUB_READY.zip` arxivini extract qiling.
2. ZIP ichidagi **barcha** fayl/papkalarni `final-sss` repository’ning `main` branch root qismiga joylang. ZIP yoki uning enclosing papkasini bevosita upload qilmang.
3. Root’da `index.html`, `manifest.webmanifest`, `sw.js`, `release-check.html`, `assets/`, `data/`, `audio/`, `icons/`, `docs/`, `tests/` байх ёстой.
4. GitHub → Settings → Pages → Deploy from a branch → `main` → `/(root)` ni belgilang.
5. Public HTTPS app manzilini oching; Service Worker ro‘yxatdan o‘tgach sahifani reload qiling.
6. `https://<owner>.github.io/final-sss/release-check.html` orqali production preflight’ni bajaring.

## Stage 59 scoring’dan foydalanish

1. Asosiy platformada Mastery / Advanced Studio’ni oching.
2. **Scoring engine** tab’iga o‘ting.
3. Reading yoki Listening uchun answer key va o‘quvchi javoblarini bir xil tartibda, har savol uchun alohida qatorda joylang. Ruxsat etilgan variantlarni `||` bilan ajrating. Agar bir savol bir nechta mark bo‘lsa, marks qatorlarini mos kiriting.
4. Har urinishga yangi Attempt / Prompt ID bering. Answer-key source’ni tanlang. Manba tanlovi ilova tomonidan tasdiqlanmaydi.
5. Writing Task 1 yoki Task 2 uchun prompt va to‘liq javob matnini kiriting; har bir kriteriyaga practice rating, konkret kuzatuv va feedback manbasini belgilang.
6. Speaking uchun avval Speaking Transcript tab’ida audio yozib saqlang, keyin Scoring’dagi saved recording ro‘yxatidan aynan shu yozuvni tanlang va qayta tinglaganingizni belgilang. Transcriptning o‘zi pronunciation dalili bo‘la olmaydi.
7. Writing Task 1 va Task 2 ikkalasi baholanganda, Task 2 ikki baravar vazn bilan umumiy practice index hisoblanadi.

## Natijani to‘g‘ri tushunish

- Reading/Listening: raw marks + xom aniqlik foizi. Umumiy band konversiyasi yo‘q.
- Writing/Speaking: kriteriya asosidagi formative practice rating; examiner score emas.
- Self-review mustaqil tekshiruv sifatida ko‘rsatilmaydi. Teacher/peer/examiner source esa o‘quvchi bildirgan manba sifatida saqlanadi, autentifikatsiya qilinmaydi.
- Eski Stage 44–58 score yozuvlari o‘zgarmaydi va yangi scoring formulasiga qayta hisoblanmaydi.

## Backup va maxfiylik

Settings → Full-device Backup & Restore orqali muntazam backup oling. Backup ichida shaxsiy Writing matni, Speaking transcript, score evidence va audio blob’lar bo‘lishi mumkin. Uni public GitHub repository’ga yoki ishonchsiz joyga joylamang.

`standalone.html` — eski Stage 52 fallback. Stage 59 uchun to‘liq project fayllari bilan birga `index.html`dan foydalaning.
