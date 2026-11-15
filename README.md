# IELTS Boost — Stage 60 Final Release

**Release:** `60.0.0-real-listening`  
**Target repository:** [`davronegamberdiyev42-svg/finally-`](https://github.com/davronegamberdiyev42-svg/finally-)  
**Application entry:** [`index.html`](./index.html)  
**GitHub Pages URL:** `https://davronegamberdiyev42-svg.github.io/finally-/`  
**Project Pages path:** `/finally-/`

IELTS Boost is a local-first, four-skill IELTS learning platform. Stage 60 combines the 84-day curriculum with Stage 58 Adaptive Learning, Stage 59 evidence-aware practice scoring and the Stage 60 Listening Hub.

## Deploy to `finally-`

1. Download and extract `IELTS_Boost_Finally_Stage60_GITHUB_READY.zip`.
2. Upload all ZIP contents into the root of `davronegamberdiyev42-svg/finally-`; do not create an enclosing folder.
3. Create the first commit on branch `main` (the repository was empty at package preparation time).
4. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/(root)`.
5. After GitHub reports a successful deployment, open `https://davronegamberdiyev42-svg.github.io/finally-/`.
6. Run `/finally-/release-check.html` and complete `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_UZ.md`.

The package is flat-root: `index.html`, `assets/`, `data/`, `audio/`, `icons/`, `manifest.webmanifest`, `sw.js`, `release-check.html`, `docs/` and `tests/` must stay together at repository root. `index.html` by itself is only the app entry document. `standalone.html` is a historical Stage 52 fallback and is not the Stage 60 app.

## What is included

- 84-day four-skill IELTS curriculum.
- Stage 58 personalized adaptive pathways and contextual vocabulary.
- Stage 59 evidence-aware practice scoring.
- Stage 60 Listening Hub: 84 bundled practice MP3s, scripts and 420 questions, personal audio/transcript import, dictation, shadowing, error review and external natural-audio resources.
- Local-first storage, PWA shell caching and full-device backup/restore.

## Important limitations

Bundled MP3 tracks are synthetic practice audio, not official IELTS recordings or authentic accent samples. Natural audio resources are external links; third-party audio is not copied into this repository. Listening/Writing/Speaking practice outputs are not official IELTS band scores and do not guarantee a test result.

Learner progress, imported audio, transcripts and recordings are stored locally in the browser/device. No cloud sync is included. Full-device backups may contain private writing and voice recordings; never commit personal backups to this public repository.

See `README_UZ.md`, `GITHUB_UPLOAD_GUIDE_UZ.md`, `INSTALL_FINAL_STAGE_UZ.md`, `QA_REPORT_UZ.md`, `docs/STAGE60_MASTER_REPORT_UZ.md` and `docs/STAGE60_QA_REPORT_UZ.md`. Automated tests do not replace real Android microphone, public Pages and offline cold-start acceptance.
