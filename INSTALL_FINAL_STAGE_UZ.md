# IELTS Boost Stage 60 — o‘rnatish

1. `IELTS_Boost_Finally_Stage60_GITHUB_READY.zip` arxivini extract qiling.
2. Ichidagi barcha fayl va papkalarni `davronegamberdiyev42-svg/finally-` repository root’iga joylang; enclosing folder yaratmang.
3. Birinchi commitni `main` branch’ga yarating.
4. GitHub → Settings → Pages: **Deploy from a branch**, branch `main`, folder `/(root)`.
5. Deployment tugagach `https://davronegamberdiyev42-svg.github.io/finally-/` ni HTTPS orqali oching.
6. `https://davronegamberdiyev42-svg.github.io/finally-/release-check.html` orqali production preflight bajaring.
7. `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_UZ.md` bo‘yicha haqiqiy Android va offline sinovlarini bajaring.

## Foydalanish

- Asosiy entrypoint: `index.html`.
- Barcha papkalar (`assets/`, `data/`, `audio/`, `icons/`) birga qolishi kerak.
- `standalone.html` eski Stage 52 fallback nusxasi; Stage 60 o‘rniga undan foydalanmang.
- `release-check.html` — production preflight sahifasi.

## Ma’lumotlar xavfsizligi

Progress, essay, transcript, import qilingan audio va shadowing recording’lar brauzer/qurilmada lokal saqlanadi. Cloud sync yo‘q. Full-device backup shaxsiy matn va ovoz yozuvlarini saqlashi mumkin; uni public GitHub repository’ga joylamang.
