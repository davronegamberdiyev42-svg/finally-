# IELTS Boost — Stage 60 Final Release

**Release:** `60.0.0-real-listening`  
**Target repository:** `davronegamberdiyev42-svg/finally-`  
**GitHub Pages URL:** `https://davronegamberdiyev42-svg.github.io/finally-/`  
**Pages path:** `/finally-/`

ZIP flat-root formatda. Barcha fayllarni `finally-` repository root’iga extract/upload qiling. `index.html`, `manifest.webmanifest`, `sw.js`, `release-check.html`, `assets/`, `data/`, `audio/`, `icons/`, `docs/` va `tests/` root darajasida turishi kerak. ZIP’ning o‘zini GitHub’ga upload qilish saytni ishga tushirmaydi — avval extract qiling.

## GitHub Pages’ga chiqarish

1. `IELTS_Boost_Finally_Stage60_GITHUB_READY.zip` extract qiling.
2. Barcha fayl va papkalarni `davronegamberdiyev42-svg/finally-` repository root’iga yuklang.
3. Birinchi commit `main` branch’da bo‘lsin. Repository paket tayyorlangan paytda bo‘sh edi.
4. Settings → Pages → Deploy from a branch → `main` → `/(root)`.
5. Deploy tugagach `https://davronegamberdiyev42-svg.github.io/finally-/` ni HTTPS orqali oching.
6. `https://davronegamberdiyev42-svg.github.io/finally-/release-check.html` orqali production preflight bajaring.

## Paket tarkibi

- Stage 57 asosiy 84 kunlik platforma va mavjud resurslar.
- Stage 58 Adaptive Learning.
- Stage 59 Precision Scoring.
- Stage 60 Real Listening & Resource Hub.
- 84 MP3, original daily scripts va 420 ta listening practice savoli.
- Audio/transcript import, Dictation, Shadowing va Error Intelligence.

`standalone.html` eski Stage 52 fallback; Stage 60 uchun asosiy fayl `index.html`. Uni alohida Stage 60 app deb ishlatmang.

## Muhim cheklovlar

84 ta bundled MP3 synthetic practice voice; rasmiy IELTS audio emas. Tabiiy audio resurslari tashqi havola sifatida berilgan. Writing/Speaking/Listening practice natijalari rasmiy IELTS bandi emas va natijani kafolatlamaydi.

Progress va shaxsiy audio fayllar brauzer/qurilmada lokal saqlanadi; cloud sync yo‘q. Full-device backup ichida shaxsiy essay, transcript va ovoz yozuvlari bo‘lishi mumkin. Uni public repository’ga commit qilmang.

QA hujjatlari `docs/STAGE60_QA_REPORT_UZ.md` va `QA_REPORT_UZ.md` ichida. Android microphone/ASR, public Pages deployment va real offline cold-start qo‘lda tekshirilishi kerak.
