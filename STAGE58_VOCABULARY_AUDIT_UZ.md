# Stage 58 — 50 contextual vocabulary concepts audit

`data/stage58-vocabulary.json` uses the 50 headword concepts present in the uploaded synonym guide. Each concept includes a newly written gap-fill context, three options, a best-fit key, an explanatory note, alternative nuances and an appropriate-use warning where needed.

## Pedagogical safeguards

- A synonym is not automatically interchangeable with its headword.
- The best-fit option is selected for the sentence context, not because it looks more advanced.
- The learner must create an original sentence after selecting the best-fit word.
- The app prompts the learner to check meaning, grammar and collocation before saving that sentence.
- Pressure test detects contextual alternatives used from the chosen five concepts; it does not claim to judge naturalness or award a Lexical Resource band.
- The source PDF itself warns against forcing impressive-sounding vocabulary. Stage 58 follows that principle.

## Data validation contract

- `schemaVersion`: 2
- `count`: 50
- IDs: unique consecutive integers 1–50
- Each card: non-empty headword, category, prompt, exactly 3 choices, best answer included in choices, alternatives, explanation
- Each alternative: term and nuance

See `data/stage58-vocabulary.json` for the authored cards and `tests/run_static_qa_58.py` for automated integrity checks.
