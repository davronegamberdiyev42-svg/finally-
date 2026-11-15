# GitHub upload guide — IELTS Boost Stage 60 / `finally-`

**Target:** https://github.com/davronegamberdiyev42-svg/finally-  
**Expected Pages URL:** https://davronegamberdiyev42-svg.github.io/finally-/  
**Pages path:** `/finally-/`

## 1. ZIP’ni joylash

1. `IELTS_Boost_Finally_Stage60_GITHUB_READY.zip` faylini yuklab olib extract qiling.
2. ZIP ichidagi barcha fayl va papkalarni `davronegamberdiyev42-svg/finally-` repository root’iga joylang. Enclosing papkani upload qilmang.
3. Birinchi commitni `main` branch’ga yarating. Repository hozircha bo‘sh bo‘lgani uchun birinchi commit `main` branch’ni yaratadi.
4. `.nojekyll` fayli repository root’da qolishi kerak.

## 2. GitHub Pages

1. Repository → Settings → Pages bo‘limini oching.
2. Source: **Deploy from a branch**.
3. Branch: `main`; folder: `/(root)`; Save.
4. GitHub Actions/Pages deployment muvaffaqiyatli tugaganini tekshiring.
5. Saytni `https://davronegamberdiyev42-svg.github.io/finally-/` orqali oching.
6. Production preflight: `https://davronegamberdiyev42-svg.github.io/finally-/release-check.html`.

## 3. Muhim fayllar

`index.html`, `assets/`, `data/`, `audio/`, `icons/`, `manifest.webmanifest`, `sw.js`, `release-check.html`, `docs/` va `tests/` birga saqlansin. Faqat `index.html`ni upload qilish platformani ishga tushirmaydi. `standalone.html` Stage 52 tarixiy fallback; Stage 60’ning asosiy entrypoint’i `index.html`.

## 4. Saqlanishi kerak bo‘lgan repository boshqaruv fayllari

Agar repository’da `.github/workflows/`, branch protection yoki boshqa boshqaruv fayllari bo‘lsa, ularni o‘chirib yubormang. Ushbu ZIP account secrets, repository secrets yoki GitHub settings’ni o‘z ichiga olmaydi.

## 5. Shaxsiy ma’lumotlar

O‘quvchi backup’lari essay, transcript, imported audio va mikrofon yozuvlarini o‘z ichiga olishi mumkin. Full-device backup’larni public repository’ga commit qilmang.
