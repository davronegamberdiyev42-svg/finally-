/* IELTS Boost Stage 59 · Precision Scoring Core
   Deterministic formative scoring helpers. Never predicts or guarantees an official IELTS band. */
(function (global) {
  'use strict';

  const SOURCES = Object.freeze({
    self: 'Learner self-review',
    peer: 'Study partner / peer feedback',
    teacher: 'Teacher feedback',
    examiner: 'Examiner feedback reported by learner'
  });

  const GUIDES = Object.freeze({
    writing1: [
      { name: 'Task Achievement', anchors: {
        5: 'Main information may be incomplete; description can be mechanical or lack a clear overview.',
        6: 'The task is addressed; an overview is present and key features are adequately selected, though details may be uneven.',
        7: 'Main requirements are covered, with a clear overview and relevant key features; some extension may be limited.',
        8: 'All requirements are covered sufficiently; key features are selected and illustrated clearly.',
        9: 'The task is fully and appropriately satisfied, with a fully developed response.'
      }},
      { name: 'Coherence & Cohesion', anchors: {
        5: 'Some organisation is visible, but progression or linking may be weak or mechanical.',
        6: 'There is an overall coherent progression, although links or paragraphing may sometimes be faulty.',
        7: 'Information is logically organised and progression is clear; cohesive devices are used with some flexibility.',
        8: 'Information is logically sequenced and cohesion is well managed.',
        9: 'The message is effortless to follow and paragraphing is skilfully managed.'
      }},
      { name: 'Lexical Resource', anchors: {
        5: 'Vocabulary is limited but adequate for the task; repetition and noticeable word-form errors may occur.',
        6: 'Vocabulary is adequate, with some attempts at less common wording and occasional imprecision.',
        7: 'Vocabulary allows some flexibility and precision; style and collocation are generally controlled.',
        8: 'A wide vocabulary range is used flexibly and precisely, with only occasional inaccuracies.',
        9: 'Vocabulary is wide, precise, natural and sophisticated within the task.'
      }},
      { name: 'Grammatical Range & Accuracy', anchors: {
        5: 'Structures are limited; frequent grammar or punctuation errors may make reading difficult.',
        6: 'Simple and complex forms are mixed; errors occur but rarely reduce communication.',
        7: 'A variety of complex structures is used; error-free sentences are frequent.',
        8: 'A wide range of structures is controlled; most sentences are error-free.',
        9: 'A wide range of structures is used flexibly and accurately, with only rare slips.'
      }}
    ],
    writing2: [
      { name: 'Task Response', anchors: {
        5: 'The task may be only partly addressed; the position or development of ideas can be unclear.',
        6: 'All parts are addressed, but some may be less developed; a relevant position is present.',
        7: 'All parts are addressed; the position is clear and main ideas are extended and supported.',
        8: 'All parts are sufficiently addressed with a well-developed, relevant and supported response.',
        9: 'The task is fully addressed and the position is fully developed with relevant, well-supported ideas.'
      }},
      { name: 'Coherence & Cohesion', anchors: {
        5: 'Some organisation is visible, but progression or linking may be weak or mechanical.',
        6: 'There is an overall coherent progression, though some links or paragraphing may be mechanical.',
        7: 'Ideas are logically organised with clear progression and a clear central topic in each paragraph.',
        8: 'Ideas are logically sequenced and cohesion is well managed.',
        9: 'The response is effortless to follow and paragraphing is skilfully managed.'
      }},
      { name: 'Lexical Resource', anchors: {
        5: 'Vocabulary is limited but adequate; repetition and noticeable word-form errors may occur.',
        6: 'Vocabulary is adequate, with attempts at less common wording and some inaccuracy.',
        7: 'Vocabulary allows flexibility and precision, with awareness of style and collocation.',
        8: 'A wide vocabulary range is used flexibly and precisely, with occasional inaccuracies.',
        9: 'Vocabulary is wide, precise, natural and sophisticated.'
      }},
      { name: 'Grammatical Range & Accuracy', anchors: {
        5: 'Structures are limited; frequent grammar or punctuation errors may cause difficulty.',
        6: 'Simple and complex forms are mixed; some errors occur but rarely reduce communication.',
        7: 'A variety of complex structures is used; error-free sentences are frequent.',
        8: 'A wide range of structures is controlled; most sentences are error-free.',
        9: 'A wide range of structures is used flexibly and accurately, with only rare slips.'
      }}
    ],
    speaking: [
      { name: 'Fluency & Coherence', anchors: {
        5: 'The speaker can usually continue, but pauses, repetition or self-correction may be frequent.',
        6: 'The speaker can talk at length, though repetition or hesitation may sometimes affect coherence.',
        7: 'Longer turns are produced with generally clear progression and flexible linking.',
        8: 'Speech is fluent and topics are developed coherently, with only occasional language-search pauses.',
        9: 'Speech is effortless, coherent and appropriately extended; hesitation is rarely language-related.'
      }},
      { name: 'Lexical Resource', anchors: {
        5: 'Vocabulary covers familiar topics but has limited flexibility and frequent word-search difficulty.',
        6: 'Vocabulary is adequate for longer discussion, although some word choice may be inaccurate.',
        7: 'Vocabulary is flexible across topics; less common language and paraphrase are used with some control.',
        8: 'A wide resource is used flexibly and precisely, with effective paraphrase.',
        9: 'Vocabulary is precise and flexible across contexts, with natural idiomatic control.'
      }},
      { name: 'Grammatical Range & Accuracy', anchors: {
        5: 'Basic forms are used; attempts at complex language often contain errors.',
        6: 'Simple and complex forms are used, but flexibility is limited and errors remain.',
        7: 'A range of structures is used flexibly; frequent sentences are error-free.',
        8: 'A wide range of structures is used flexibly and most sentences are accurate.',
        9: 'Structures are precise and accurate with only rare slips.'
      }},
      { name: 'Pronunciation', anchors: {
        5: 'Some pronunciation features are evident, but lapses can make parts of the speech difficult to follow.',
        6: 'A range of features is used with mixed control; the speaker is generally understood.',
        7: 'Most speech is easy to understand; stress, rhythm or intonation may have occasional lapses.',
        8: 'Speech is easy to understand throughout, with effective rhythm, stress and intonation.',
        9: 'A full range of features is used flexibly; speech is effortless to understand.'
      }}
    ]
  });

  function cleanLines(value, keepTrailing) {
    const lines = String(value ?? '').replace(/\r/g, '').split('\n');
    if (!keepTrailing) while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines;
  }

  function normalizeAnswer(value) {
    return String(value ?? '')
      .normalize('NFKC')
      .replace(/[‘’‛`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐‑‒–—]/g, '-')
      .toLocaleLowerCase('en')
      .trim()
      .replace(/^[.,!?;:]+|[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ');
  }

  function unorderedAnswer(value) {
    return normalizeAnswer(value)
      .split(/[\s,;/+]+/)
      .filter(Boolean)
      .sort()
      .join('|');
  }

  function answerMatches(keyLine, response, unordered) {
    const variants = String(keyLine ?? '').split('||').map(x => x.trim()).filter(Boolean);
    if (!variants.length) return false;
    const actual = unordered ? unorderedAnswer(response) : normalizeAnswer(response);
    return variants.some(variant => (unordered ? unorderedAnswer(variant) : normalizeAnswer(variant)) === actual);
  }

  function scoreAnswerKey(options) {
    const opts = options || {};
    const keys = cleanLines(opts.keysText, false).map(x => x.trim());
    let responses = cleanLines(opts.answersText, true);
    const weightsInput = String(opts.marksText ?? '').trim();
    const weights = weightsInput ? cleanLines(weightsInput, true).map(x => x.trim()) : [];
    if (!keys.length || keys.length > 40) throw new Error('Answer key 1–40 savol oralig‘ida bo‘lishi kerak.');
    if (keys.some(x => !x)) throw new Error('Answer key ichida bo‘sh savol qatori bor.');
    if (responses.length > keys.length) throw new Error('Javob qatorlari answer key savollaridan ko‘p.');
    while (responses.length < keys.length) responses.push('');
    if (weights.length && weights.length !== keys.length) throw new Error('Marks qatorlari savollar soniga teng bo‘lishi kerak.');
    const marks = keys.map((_, i) => {
      if (!weights.length || !weights[i]) return 1;
      const n = Number(weights[i]);
      if (!Number.isInteger(n) || n < 1 || n > 4) throw new Error(`Q${i + 1}: marks 1–4 oralig‘idagi butun son bo‘lsin.`);
      return n;
    });
    const items = keys.map((key, i) => {
      const response = String(responses[i] ?? '').trim();
      const correct = answerMatches(key, response, !!opts.unordered);
      return { question: i + 1, key, response, marks: marks[i], awarded: correct ? marks[i] : 0, correct };
    });
    const correctQuestions = items.filter(x => x.correct).length;
    const correctMarks = items.reduce((n, x) => n + x.awarded, 0);
    const totalMarks = marks.reduce((n, x) => n + x, 0);
    const accuracyPct = totalMarks ? correctMarks / totalMarks * 100 : 0;
    const blankQuestions = items.filter(x => !x.response).length;
    return {
      questionCount: keys.length,
      correctQuestions,
      blankQuestions,
      correctMarks,
      totalMarks,
      accuracyPct: Number(accuracyPct.toFixed(2)),
      practiceIndex10: Number((accuracyPct / 10).toFixed(2)),
      items,
      incorrect: items.filter(x => !x.correct)
    };
  }

  function countWords(text) {
    const matches = String(text ?? '').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
    return matches ? matches.length : 0;
  }

  function rubricScore(options) {
    const opts = options || {};
    const type = opts.type;
    if (!['writing1', 'writing2', 'speaking'].includes(type)) throw new Error('Rubric skill turi noto‘g‘ri.');
    const expected = GUIDES[type];
    const criteria = Array.isArray(opts.criteria) ? opts.criteria : [];
    if (criteria.length !== 4) throw new Error('To‘rtta mezon ham baholanishi kerak.');
    const allowedSources = Object.keys(SOURCES);
    const normalized = criteria.map((row, i) => {
      const rating = Number(row.rating);
      if (!Number.isFinite(rating) || rating < 0 || rating > 9 || Math.round(rating * 2) !== rating * 2) {
        throw new Error(`${expected[i].name}: 0–9 oralig‘ida 0.5 qadam bilan baho tanla.`);
      }
      const evidence = String(row.evidence ?? '').trim();
      if (evidence.length < 12) throw new Error(`${expected[i].name}: kuzatilgan dalil kamida 12 belgidan iborat bo‘lsin.`);
      const source = String(row.source || 'self');
      if (!allowedSources.includes(source)) throw new Error(`${expected[i].name}: dalil manbasi tanlanmagan.`);
      return { criterion: expected[i].name, rating, evidence, source, sourceLabel: SOURCES[source] };
    });

    const responseText = String(opts.responseText ?? '').trim();
    const words = countWords(responseText);
    const target = type === 'writing1' ? 150 : type === 'writing2' ? 250 : 0;
    if (type.startsWith('writing') && words < 20) throw new Error('Writing rubric uchun javob matnini kiriting (kamida 20 so‘z; to‘liq task javobi bo‘lishi tavsiya qilinadi).');
    if (responseText.length > 20000) throw new Error('Javob matni 20,000 belgidan oshmasin.');
    if (type === 'speaking') {
      if (!opts.audioId) throw new Error('Speaking pronunciation uchun saqlangan audio yozuvni tanla.');
      if (opts.audioReviewed !== true) throw new Error('Tanlangan real audioni tinglab chiqqaningni tasdiqla.');
    }
    const score = normalized.reduce((sum, row) => sum + row.rating, 0) / 4;
    const sources = [...new Set(normalized.map(x => x.source))];
    const onlySelf = sources.length === 1 && sources[0] === 'self';
    const includesExternal = sources.some(x => x !== 'self');
    return {
      score: Number(score.toFixed(3)),
      criteria: normalized,
      evidenceCoverage: normalized.filter(x => x.evidence.length >= 12).length,
      evidenceSources: sources,
      sourceLabel: onlySelf ? 'Learner self-review · independent verification absent' : 'Additional feedback source reported · reviewer credentials are not verified by this app',
      wordCount: words,
      wordTarget: target || null,
      wordTargetReached: target ? words >= target : null,
      responseText,
      audioId: type === 'speaking' ? String(opts.audioId) : null,
      audioReviewed: type === 'speaking' ? true : null,
      scoreMeaning: 'Descriptor-anchored formative practice rating; not an official IELTS examiner score.'
    };
  }

  function writingOverall(task1, task2) {
    if (task1 === null || task1 === undefined || task1 === '' || task2 === null || task2 === undefined || task2 === '' || !Number.isFinite(Number(task1)) || !Number.isFinite(Number(task2))) return null;
    return Number(((Number(task1) + 2 * Number(task2)) / 3).toFixed(3));
  }

  global.IELTSBoostStage59Scoring = Object.freeze({
    version: '59.0.0',
    sources: SOURCES,
    guides: GUIDES,
    cleanLines,
    normalizeAnswer,
    answerMatches,
    scoreAnswerKey,
    countWords,
    rubricScore,
    writingOverall
  });
})(window);
