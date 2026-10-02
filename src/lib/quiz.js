// quiz.js — quiz question kinds, validation and scoring (SPEC-v3 WP11,
// R11.1-R11.2). Pure: no DOM, no store, no events.
//
// GROUNDWORK until client decision D6. Quiz.astro still renders and scores
// multiple choice itself, and the new kinds exist only in test fixtures and
// importer output, never in live lessons. scripts/content-check.mjs and
// scripts/quiz-import.mjs validate with questionProblems() below, so the
// rules live in one place.
//
// Question schema (a lesson's `quiz` array):
//   every kind   id, prompt, kind?, explain?, photoKey?
//   kind 'multipleChoice' (the default when `kind` is missing)
//                choices: string[] (2+), correctIndex: number
//   kind 'matching'
//                pairs: [{ left, right }] (2+; lefts unique, rights unique)
//   kind 'fillBlank'
//                accepted: string[] (1+), foldAccents?: boolean (D6: only
//                where ACE approves, per question)
//
// Responses scoreQuestion() takes:
//   multipleChoice  the chosen index (number)
//   matching        { [left]: right } or [{ left, right }]
//   fillBlank       the typed text (string)
//
// Each question yields exactly one result, never one per pair, so the
// existing quiz.answered payload ({ questionId, correct }) and allowedXp()
// (10 XP for the first correct answer per lessonId + questionId) hold for
// every kind. Stars still come from quiz.done ({ score, total }) in events.js.

export const QUIZ_KINDS = ['multipleChoice', 'matching', 'fillBlank'];
export const DEFAULT_KIND = 'multipleChoice';
/** Hearts per attempt; matches Quiz.astro. */
export const QUIZ_HEARTS = 3;

/** The question's kind; legacy questions without one are multiple choice. */
export function kindOf(q) {
  return (q && q.kind) || DEFAULT_KIND;
}

/**
 * Normalize a typed or chosen answer for comparison: Unicode NFC, smart
 * quotes to plain ones (tablet keyboards insert them), trim, collapse runs
 * of whitespace to one space, lower case. Accents fold away (é → e, ç → c,
 * ã → a) only when `foldAccents` is set.
 */
export function normalizeAnswer(text, { foldAccents = false } = {}) {
  let s = String(text ?? '').normalize('NFC');
  s = s.replace(/[‘’‛′]/g, "'").replace(/[“”‟″]/g, '"');
  s = s.trim().replace(/\s+/g, ' ').toLowerCase();
  if (foldAccents) s = s.normalize('NFD').replace(/\p{M}+/gu, '').normalize('NFC');
  return s;
}

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const hasPairs = (q) => Array.isArray(q.pairs) && q.pairs.length > 0;
const hasAccepted = (q) => Array.isArray(q.accepted) && q.accepted.length > 0;

/** True when the question carries some answer: correctIndex, pairs or accepted. */
export function hasAnswer(q) {
  if (!q) return false;
  return typeof q.correctIndex === 'number' || hasPairs(q) || hasAccepted(q);
}

/**
 * Everything wrong with one question, as short messages ([] when valid).
 * The legacy multiple-choice messages match content-check's originals.
 */
export function questionProblems(q) {
  if (!q || typeof q !== 'object') return ['is not a question'];
  const out = [];
  if (!q.id) out.push('missing id');
  if (!q.prompt) out.push('missing prompt');
  const kind = kindOf(q);
  if (!QUIZ_KINDS.includes(kind)) {
    out.push(`unknown kind "${kind}" (use ${QUIZ_KINDS.join(', ')})`);
    return out;
  }
  if (!hasAnswer(q)) {
    out.push('has no answer (needs correctIndex, pairs or accepted)');
    return out;
  }
  if (kind === 'multipleChoice') {
    if (!Array.isArray(q.choices) || q.choices.length < 2) out.push('needs choices');
    else if (q.choices.some((c) => !isText(c))) out.push('has an empty choice');
    else if (new Set(q.choices.map((c) => normalizeAnswer(c))).size !== q.choices.length) out.push('has the same choice twice');
    const n = Array.isArray(q.choices) ? q.choices.length : 0;
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= n) out.push('correctIndex out of range');
  }
  if (kind === 'matching') {
    if (!hasPairs(q)) out.push('matching needs pairs');
    else {
      if (q.pairs.length < 2) out.push('matching needs at least 2 pairs');
      const lefts = new Set();
      const rights = new Set();
      q.pairs.forEach((p, i) => {
        if (!p || !isText(p.left) || !isText(p.right)) {
          out.push(`pair ${i + 1} needs a left and a right`);
          return;
        }
        const l = normalizeAnswer(p.left);
        const r = normalizeAnswer(p.right);
        if (lefts.has(l)) out.push(`pair ${i + 1}: "${p.left}" is on the left twice`);
        if (rights.has(r)) out.push(`pair ${i + 1}: "${p.right}" is on the right twice`);
        lefts.add(l);
        rights.add(r);
      });
    }
  }
  if (kind === 'fillBlank') {
    if (!hasAccepted(q)) out.push('fillBlank needs accepted answers');
    else if (q.accepted.some((a) => !isText(a))) out.push('has an empty accepted answer');
    if (q.foldAccents !== undefined && typeof q.foldAccents !== 'boolean') out.push('foldAccents must be true or false');
  }
  if (q.explain !== undefined && !isText(q.explain)) out.push('explain must be text when present');
  return out;
}

/** Problems across a whole quiz: each question's, prefixed q1, q2, … plus duplicate ids. */
export function quizProblems(questions) {
  if (!Array.isArray(questions) || questions.length < 1) return ['quiz needs questions'];
  const out = [];
  const ids = new Set();
  questions.forEach((q, i) => {
    for (const p of questionProblems(q)) out.push(`q${i + 1}: ${p}`);
    if (q && q.id) {
      if (ids.has(q.id)) out.push(`q${i + 1}: duplicate id "${q.id}"`);
      ids.add(q.id);
    }
  });
  return out;
}

/** What to reveal after a wrong answer (or show after a right one). */
export function correctAnswer(q) {
  switch (kindOf(q)) {
    case 'matching': return q.pairs.map((p) => ({ left: p.left, right: p.right }));
    case 'fillBlank': return q.accepted[0];
    default: return { index: q.correctIndex, text: q.choices ? q.choices[q.correctIndex] : undefined };
  }
}

function matchingMap(response) {
  const map = new Map();
  if (Array.isArray(response)) {
    for (const p of response) if (p && p.left != null) map.set(normalizeAnswer(p.left), p.right);
  } else if (response && typeof response === 'object') {
    for (const [left, right] of Object.entries(response)) map.set(normalizeAnswer(left), right);
  }
  return map;
}

/**
 * Score one answer. Returns exactly one result per question:
 *   { questionId, kind, correct, answer, explain, pairs? }
 * `answer` is correctAnswer(q), for the reveal. Matching adds per-pair
 * detail for the screen, but the question is wrong if any pair is wrong or
 * missing, or the response names a left that isn't in the question.
 * Never mutates its inputs; the same call always returns the same result.
 */
export function scoreQuestion(q, response) {
  const kind = kindOf(q);
  const base = { questionId: q.id, kind, answer: correctAnswer(q), explain: q.explain || null };
  if (kind === 'matching') {
    const chosen = matchingMap(response);
    const lefts = new Set(q.pairs.map((p) => normalizeAnswer(p.left)));
    const pairs = q.pairs.map((p) => {
      const pick = chosen.get(normalizeAnswer(p.left));
      const ok = pick != null && normalizeAnswer(pick) === normalizeAnswer(p.right);
      return { left: p.left, right: p.right, chosen: pick ?? null, correct: ok };
    });
    const extra = [...chosen.keys()].some((k) => !lefts.has(k));
    return { ...base, correct: !extra && pairs.every((p) => p.correct), pairs };
  }
  if (kind === 'fillBlank') {
    const opts = { foldAccents: q.foldAccents === true };
    const typed = normalizeAnswer(response, opts);
    const correct = typed !== '' && q.accepted.some((a) => normalizeAnswer(a, opts) === typed);
    return { ...base, correct };
  }
  const index = typeof response === 'string' && response.trim() !== '' ? Number(response) : response;
  return { ...base, correct: Number.isInteger(index) && index === q.correctIndex };
}

/** The quiz.answered payload for a result; the same shape Quiz.astro's page records today. */
export function answerPayload(result) {
  return { questionId: result.questionId, correct: result.correct };
}

// ---------------------------------------------------------------------------
// An attempt: the state machine a quiz screen can drive after D6. Mirrors
// Quiz.astro: a wrong answer costs one heart; at 0 hearts the attempt goes
// to 'retry' and its answers are thrown away (no XP for that try). Every
// function returns a new state and never mutates the old one.

/** A fresh attempt at `questions`. */
export function startAttempt(questions, { hearts = QUIZ_HEARTS } = {}) {
  return { questions, maxHearts: hearts, hearts, results: [], status: 'active' };
}

/**
 * Submit an answer to one question. A second submit for an answered
 * question, or any submit once the attempt is done or out of hearts,
 * returns the same state unchanged: one result per question, ever.
 */
export function submitAnswer(state, questionId, response) {
  if (state.status !== 'active') return state;
  if (state.results.some((r) => r.questionId === questionId)) return state;
  const q = state.questions.find((x) => x.id === questionId);
  if (!q) throw new Error(`quiz: no question "${questionId}"`);
  const result = scoreQuestion(q, response);
  const results = [...state.results, result];
  const hearts = result.correct ? state.hearts : Math.max(0, state.hearts - 1);
  const status = hearts <= 0 ? 'retry' : results.length === state.questions.length ? 'done' : 'active';
  return { ...state, results, hearts, status };
}

/** Start over: full hearts, no results. Resetting twice is the same as once. */
export function resetAttempt(state) {
  return startAttempt(state.questions, { hearts: state.maxHearts });
}

/** { score, total } for quiz.done once the attempt is done; null before. */
export function attemptSummary(state) {
  if (state.status !== 'done') return null;
  return { score: state.results.filter((r) => r.correct).length, total: state.questions.length };
}

/** quiz.answered payloads to record when the attempt finishes; [] unless done. */
export function attemptAnswers(state) {
  return state.status === 'done' ? state.results.map(answerPayload) : [];
}
