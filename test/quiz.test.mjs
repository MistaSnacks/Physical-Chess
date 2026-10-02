// SPEC-v3 WP11 groundwork: question kinds (R11.1), pure scoring (R11.2), the
// content-check rules (R11.3) and the sheet importer (R11.4). The matching
// and fill-in-the-blank questions here are test fixtures only: until D6 no
// live lesson uses them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  QUIZ_KINDS, QUIZ_HEARTS, kindOf, normalizeAnswer, hasAnswer, questionProblems, quizProblems,
  correctAnswer, scoreQuestion, answerPayload, startAttempt, submitAnswer, resetAttempt,
  attemptSummary, attemptAnswers,
} from '../src/lib/quiz.js';
import { parseCsv, importSheet } from '../scripts/quiz-import.mjs';
import { LESSONS } from '../src/content/lessons.js';
import { makeEvent, withAllowedXp, starsFor, derivePlayer, EVENT } from '../src/lib/game/index.js';

// ------------------------------------------------------------- fixtures

const MC = { id: 'f1', prompt: 'Which instrument leads the roda?', choices: ['Pandeiro', 'Berimbau', 'Atabaque'], correctIndex: 1, explain: 'The berimbau sets the game.' };
const MATCH = {
  id: 'f2', kind: 'matching', prompt: 'Match each instrument to what it is.',
  pairs: [
    { left: 'Berimbau', right: 'A bow with one steel string' },
    { left: 'Pandeiro', right: 'A tambourine with jingles' },
    { left: 'Atabaque', right: 'A tall hand drum' },
  ],
};
const BLANK = { id: 'f3', kind: 'fillBlank', prompt: 'Capoeira was born in ____.', accepted: ['Brazil', 'Brasil'] };
const BLANK_STRICT = { id: 'f4', kind: 'fillBlank', prompt: 'The word for positive energy is ____.', accepted: ['Axé'] };
const BLANK_FOLD = { id: 'f5', kind: 'fillBlank', prompt: 'The Cor after Ametista is ____.', accepted: ['Camaleão'], foldAccents: true, explain: 'Camaleão is brown.' };
const FIXTURE_QUIZ = [MC, MATCH, BLANK, BLANK_STRICT, BLANK_FOLD];
const RIGHT = {
  f1: 1,
  f2: { Berimbau: 'A bow with one steel string', Pandeiro: 'A tambourine with jingles', Atabaque: 'A tall hand drum' },
  f3: 'Brazil',
  f4: 'Axé',
  f5: 'camaleao',
};

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}
deepFreeze(FIXTURE_QUIZ);

const liveQuizzes = LESSONS.filter((l) => l.type === 'quiz');

// ---------------------------------------------------------- R11.1 schema

test('kind defaults to multipleChoice; the three kinds are known', () => {
  assert.deepEqual(QUIZ_KINDS, ['multipleChoice', 'matching', 'fillBlank']);
  assert.equal(kindOf(MC), 'multipleChoice');
  assert.equal(kindOf(MATCH), 'matching');
  assert.equal(kindOf(BLANK), 'fillBlank');
});

test('every live quiz question still validates, has no kind, and scores as before', () => {
  assert.ok(liveQuizzes.length >= 3);
  for (const l of liveQuizzes) {
    assert.deepEqual(quizProblems(l.quiz), [], `${l.id} validates`);
    for (const q of l.quiz) {
      assert.equal(q.kind, undefined, `${l.id} ${q.id} stays legacy multiple choice until D6`);
      assert.equal(kindOf(q), 'multipleChoice');
      q.choices.forEach((_, i) => {
        assert.equal(scoreQuestion(q, i).correct, i === q.correctIndex, `${l.id} ${q.id} choice ${i}`);
      });
    }
  }
});

test('the pinned live quizzes are untouched: 5 Music, 5 Culture, 3 Roda Ready, Music q1-q3 word for word', () => {
  const byId = (id) => LESSONS.find((l) => l.id === id);
  const music = byId('music-quiz').quiz;
  assert.equal(music.length, 5);
  assert.equal(byId('culture-quiz').quiz.length, 5);
  assert.equal(byId('roda-ready-check').quiz.length, 3);
  assert.deepEqual(music.slice(0, 3).map((q) => [q.prompt, q.correctIndex]), [
    ['Which instrument leads the roda?', 1],
    ['Which country was capoeira born in?', 2],
    ['What does "Axé" mean?', 0],
  ]);
});

test('explain is optional text on every kind', () => {
  assert.equal(scoreQuestion(MC, 0).explain, 'The berimbau sets the game.');
  assert.equal(scoreQuestion(BLANK, 'x').explain, null);
  assert.deepEqual(questionProblems({ ...BLANK, explain: '   ' }), ['explain must be text when present']);
});

// ------------------------------------------------------ normalization

test('normalizeAnswer trims, ignores case and collapses spaces', () => {
  assert.equal(normalizeAnswer('  Puxada   de\tRede \n'), 'puxada de rede');
  assert.equal(normalizeAnswer('PUXADA DE REDE'), 'puxada de rede', 'a no-break space is a space');
  assert.equal(normalizeAnswer(''), '');
  assert.equal(normalizeAnswer(null), '');
  assert.equal(normalizeAnswer(42), '42');
});

test('normalizeAnswer keeps accents unless foldAccents is set', () => {
  assert.equal(normalizeAnswer('Axé'), 'axé');
  assert.equal(normalizeAnswer('Axé', { foldAccents: true }), 'axe');
  assert.equal(normalizeAnswer('Camaleão', { foldAccents: true }), 'camaleao');
  assert.equal(normalizeAnswer('Maculelê', { foldAccents: true }), 'maculele');
  assert.equal(normalizeAnswer('Açúcar', { foldAccents: true }), 'acucar');
  // the same accented letter typed two ways (precomposed vs combining) is equal without folding
  assert.equal(normalizeAnswer('Axé'), normalizeAnswer('Axé'));
});

test('normalizeAnswer turns smart quotes into plain ones', () => {
  assert.equal(normalizeAnswer('Pai d’Égua'), "pai d'égua");
  assert.equal(normalizeAnswer('“Axé”'), '"axé"');
});

// ------------------------------------------------------ fill in the blank

test('fillBlank accepts any listed variant, any case, any spacing', () => {
  for (const typed of ['Brazil', 'brazil', 'BRASIL', '  brasil ', 'Brasil\n']) {
    assert.equal(scoreQuestion(BLANK, typed).correct, true, JSON.stringify(typed));
  }
  assert.equal(scoreQuestion({ ...BLANK, accepted: ['Puxada de rede'] }, '  puxada   DE rede ').correct, true);
});

test('fillBlank is wrong when the answer matches no accepted answer', () => {
  for (const typed of ['Portugal', 'Brazi', 'Brazil!', 'the Brazil', '', '   ', undefined, null]) {
    assert.equal(scoreQuestion(BLANK, typed).correct, false, JSON.stringify(typed));
  }
});

test('fillBlank accents: strict unless the question sets foldAccents', () => {
  assert.equal(scoreQuestion(BLANK_STRICT, 'Axé').correct, true);
  assert.equal(scoreQuestion(BLANK_STRICT, 'axé').correct, true);
  assert.equal(scoreQuestion(BLANK_STRICT, 'Axé').correct, true, 'combining accent is the same letter');
  assert.equal(scoreQuestion(BLANK_STRICT, 'Axe').correct, false, 'no accent fold without approval');
  assert.equal(scoreQuestion(BLANK_FOLD, 'camaleao').correct, true);
  assert.equal(scoreQuestion(BLANK_FOLD, 'CAMALEÃO').correct, true);
  assert.equal(scoreQuestion(BLANK_FOLD, 'camaleon').correct, false, 'folding accents does not fix spelling');
  // foldAccents must be exactly true; a truthy string does not fold
  assert.equal(scoreQuestion({ ...BLANK_STRICT, foldAccents: 'yes' }, 'Axe').correct, false);
});

test('a wrong blank reveals the first accepted answer', () => {
  const r = scoreQuestion(BLANK, 'Portugal');
  assert.equal(r.correct, false);
  assert.equal(r.answer, 'Brazil');
});

// ------------------------------------------------------------ matching

test('matching is right only when every pair is right', () => {
  assert.equal(scoreQuestion(MATCH, RIGHT.f2).correct, true);
  const swapped = { ...RIGHT.f2, Pandeiro: 'A tall hand drum', Atabaque: 'A tambourine with jingles' };
  const r = scoreQuestion(MATCH, swapped);
  assert.equal(r.correct, false, 'two wrong pairs');
  assert.deepEqual(r.pairs.map((p) => p.correct), [true, false, false]);
  const oneWrong = { ...RIGHT.f2, Atabaque: 'A bow with one steel string' };
  assert.equal(scoreQuestion(MATCH, oneWrong).correct, false, 'any wrong pair makes it wrong');
});

test('matching is wrong when a pair is missing or the response adds an unknown left', () => {
  const { Atabaque, ...missing } = RIGHT.f2;
  assert.ok(Atabaque);
  const r = scoreQuestion(MATCH, missing);
  assert.equal(r.correct, false);
  assert.equal(r.pairs[2].chosen, null);
  assert.equal(scoreQuestion(MATCH, { ...RIGHT.f2, Agogô: 'A double bell' }).correct, false);
  assert.equal(scoreQuestion(MATCH, {}).correct, false);
  assert.equal(scoreQuestion(MATCH, undefined).correct, false);
});

test('matching accepts an array of pairs and forgives case and spacing', () => {
  const asArray = MATCH.pairs.map((p) => ({ left: ` ${p.left.toUpperCase()} `, right: p.right.toLowerCase() }));
  assert.equal(scoreQuestion(MATCH, asArray).correct, true);
});

test('matching yields one result for the question, never one per pair', () => {
  const r = scoreQuestion(MATCH, RIGHT.f2);
  assert.equal(typeof r.correct, 'boolean');
  assert.deepEqual(answerPayload(r), { questionId: 'f2', correct: true });
  assert.deepEqual(r.answer, MATCH.pairs);
});

// ------------------------------------------------------ multiple choice

test('multipleChoice scores the chosen index exactly as Quiz.astro does', () => {
  assert.equal(scoreQuestion(MC, 1).correct, true);
  assert.equal(scoreQuestion(MC, '1').correct, true);
  for (const bad of [0, 2, -1, 1.5, '', 'Berimbau', undefined, null]) assert.equal(scoreQuestion(MC, bad).correct, false, JSON.stringify(bad));
  assert.deepEqual(correctAnswer(MC), { index: 1, text: 'Berimbau' });
});

test('scoring is pure: same input, same result, inputs untouched', () => {
  for (const q of FIXTURE_QUIZ) {
    const a = scoreQuestion(q, RIGHT[q.id]);
    const b = scoreQuestion(q, RIGHT[q.id]);
    assert.deepEqual(a, b);
    assert.equal(a.correct, true, `${q.id} right answer`);
  }
  // FIXTURE_QUIZ is deep-frozen, so any mutation above would have thrown
});

// ------------------------------------------- R11.3 validation (content-check)

test('the fixtures of every kind validate', () => {
  for (const q of FIXTURE_QUIZ) assert.deepEqual(questionProblems(q), [], q.id);
  assert.deepEqual(quizProblems(FIXTURE_QUIZ), []);
});

test('a question with no answer is rejected, whatever its kind', () => {
  const noAnswer = 'has no answer (needs correctIndex, pairs or accepted)';
  const { correctIndex, ...mcNo } = MC;
  const { pairs, ...matchNo } = MATCH;
  const { accepted, ...blankNo } = BLANK;
  assert.ok(correctIndex === 1 && pairs && accepted);
  assert.deepEqual(questionProblems(mcNo), [noAnswer]);
  assert.deepEqual(questionProblems(matchNo), [noAnswer]);
  assert.deepEqual(questionProblems(blankNo), [noAnswer]);
  assert.deepEqual(questionProblems({ ...MATCH, pairs: [] }), [noAnswer]);
  assert.deepEqual(questionProblems({ ...BLANK, accepted: [] }), [noAnswer]);
  assert.equal(hasAnswer(mcNo), false);
  assert.equal(hasAnswer(MC), true);
});

test('validation catches malformed questions of each kind', () => {
  assert.deepEqual(questionProblems({ ...MC, kind: 'dragDrop' }), ['unknown kind "dragDrop" (use multipleChoice, matching, fillBlank)']);
  assert.deepEqual(questionProblems({ ...MC, correctIndex: 3 }), ['correctIndex out of range']);
  assert.deepEqual(questionProblems({ ...MC, choices: ['Berimbau'], correctIndex: 0 }), ['needs choices']);
  assert.deepEqual(questionProblems({ ...MC, choices: ['Berimbau', ' berimbau '], correctIndex: 0 }), ['has the same choice twice']);
  assert.deepEqual(questionProblems({ ...MATCH, pairs: [MATCH.pairs[0]] }), ['matching needs at least 2 pairs']);
  assert.deepEqual(questionProblems({ ...MATCH, pairs: [...MATCH.pairs, { left: 'berimbau', right: 'A double bell' }] }), ['pair 4: "berimbau" is on the left twice']);
  assert.deepEqual(questionProblems({ ...MATCH, pairs: [...MATCH.pairs, { left: 'Agogô', right: 'a tall hand drum' }] }), ['pair 4: "a tall hand drum" is on the right twice']);
  assert.deepEqual(questionProblems({ ...MATCH, pairs: [...MATCH.pairs, { left: 'Agogô' }] }), ['pair 4 needs a left and a right']);
  assert.deepEqual(questionProblems({ ...BLANK, accepted: ['Brazil', ''] }), ['has an empty accepted answer']);
  assert.deepEqual(questionProblems({ ...BLANK, foldAccents: 'yes' }), ['foldAccents must be true or false']);
  assert.deepEqual(questionProblems({ kind: 'fillBlank', accepted: ['x'] }), ['missing id', 'missing prompt']);
  assert.deepEqual(quizProblems([MC, { ...BLANK, id: 'f1' }]), ['q2: duplicate id "f1"']);
  assert.deepEqual(quizProblems([]), ['quiz needs questions']);
});

test('content-check validates quizzes with quizProblems and keeps its pins', () => {
  const src = readFileSync(new URL('../scripts/content-check.mjs', import.meta.url), 'utf8');
  assert.match(src, /import \{ quizProblems, kindOf \} from '\.\.\/src\/lib\/quiz\.js'/);
  assert.match(src, /quizProblems\(l\.quiz\)/);
  assert.match(src, /music-quiz must have 5 questions/);
  assert.match(src, /culture-quiz must have 5 questions/);
  assert.match(src, /roda-ready-check must have 3 questions/);
  assert.match(src, /q1\.prompt !== 'Which instrument leads the roda\?'/);
});

// -------------------------------- attempts: hearts, reset, double submit

test('a wrong answer costs one heart and reveals the answer', () => {
  let s = startAttempt([MC, BLANK]);
  assert.equal(s.hearts, QUIZ_HEARTS);
  s = submitAnswer(s, 'f1', 0);
  assert.equal(s.hearts, QUIZ_HEARTS - 1);
  assert.equal(s.results[0].correct, false);
  assert.deepEqual(s.results[0].answer, { index: 1, text: 'Berimbau' });
  s = submitAnswer(s, 'f3', 'Brasil');
  assert.equal(s.hearts, QUIZ_HEARTS - 1, 'a right answer costs nothing');
  assert.equal(s.status, 'done');
  assert.deepEqual(attemptSummary(s), { score: 1, total: 2 });
});

test('double submit is a no-op: one result per question', () => {
  const s0 = startAttempt(FIXTURE_QUIZ);
  const s1 = submitAnswer(s0, 'f2', RIGHT.f2);
  const s2 = submitAnswer(s1, 'f2', RIGHT.f2);
  const s3 = submitAnswer(s2, 'f2', {});
  assert.equal(s2, s1, 'same state back on a double submit');
  assert.equal(s3, s1, 'a different second answer is ignored too');
  assert.equal(s1.results.length, 1);
  assert.equal(s0.results.length, 0, 'the old state is untouched');
  assert.throws(() => submitAnswer(s1, 'nope', 1), /no question "nope"/);
});

test('three wrong answers end the try; its answers are thrown away', () => {
  let s = startAttempt(FIXTURE_QUIZ);
  s = submitAnswer(s, 'f1', 0);
  s = submitAnswer(s, 'f3', 'Portugal');
  s = submitAnswer(s, 'f4', 'Axe');
  assert.equal(s.hearts, 0);
  assert.equal(s.status, 'retry');
  assert.equal(submitAnswer(s, 'f5', 'camaleao'), s, 'no answers after the hearts run out');
  assert.deepEqual(attemptAnswers(s), [], 'a failed try records nothing');
  assert.equal(attemptSummary(s), null);
});

test('reset starts clean, and resetting twice equals resetting once', () => {
  let s = startAttempt(FIXTURE_QUIZ);
  s = submitAnswer(s, 'f1', 1);
  s = submitAnswer(s, 'f3', 'nope');
  const r1 = resetAttempt(s);
  const r2 = resetAttempt(resetAttempt(s));
  assert.deepEqual(r1, startAttempt(FIXTURE_QUIZ));
  assert.deepEqual(r2, r1);
  assert.equal(s.results.length, 2, 'reset leaves the old state alone');
});

/** Record an attempt's answers + quiz.done the way the lesson page does, xp via allowedXp. */
function recordAttempt(ledger, state, lessonId = 'fixture-quiz') {
  const P = { playerId: 'p1', accountId: 'a1', moduleId: 'culture', lessonId };
  const at = () => new Date(Date.UTC(2026, 9, 1, 12, 0, ledger.length));
  for (const payload of attemptAnswers(state)) ledger.push(withAllowedXp(makeEvent({ ...P, type: EVENT.QUIZ_ANSWERED, payload, occurredAt: at() }), ledger));
  const summary = attemptSummary(state);
  if (summary) ledger.push(withAllowedXp(makeEvent({ ...P, type: EVENT.QUIZ_DONE, payload: summary, occurredAt: at() }), ledger));
  return ledger;
}

function playAll(answers) {
  let s = startAttempt(FIXTURE_QUIZ);
  for (const q of FIXTURE_QUIZ) s = submitAnswer(s, q.id, answers[q.id]);
  return s;
}

test('credit: each question pays 10 once (a matching question is 10, not 10 per pair)', () => {
  const s = playAll(RIGHT);
  const answers = attemptAnswers(s);
  assert.equal(answers.length, FIXTURE_QUIZ.length, 'one quiz.answered per question');
  const ledger = recordAttempt([], s);
  const xp = ledger.map((e) => e.xp);
  assert.deepEqual(xp, [10, 10, 10, 10, 10, 25]);
  assert.equal(starsFor(EVENT.QUIZ_DONE, attemptSummary(s)), 3, 'stars stay as today');
});

test('credit: reset and replay, or double submit, never duplicate XP', () => {
  const ledger = recordAttempt([], playAll(RIGHT));
  const once = derivePlayer(ledger).xp;
  // double submit every question, then reset and replay perfectly twice
  let s = startAttempt(FIXTURE_QUIZ);
  for (const q of FIXTURE_QUIZ) s = submitAnswer(submitAnswer(s, q.id, RIGHT[q.id]), q.id, RIGHT[q.id]);
  assert.equal(attemptAnswers(s).length, FIXTURE_QUIZ.length);
  recordAttempt(ledger, s);
  recordAttempt(ledger, playAll(RIGHT));
  recordAttempt(ledger, resetAttempt(s));
  assert.equal(derivePlayer(ledger).xp, once, 'no extra XP for replays');
  assert.equal(ledger.filter((e) => e.type === EVENT.QUIZ_DONE).length, 3, 'the replays are still recorded');
});

test('credit: wrong-then-right across tries pays the 10 once', () => {
  const wrongFirst = { ...RIGHT, f2: { ...RIGHT.f2, Atabaque: 'A bow with one steel string' } };
  const ledger = recordAttempt([], playAll(wrongFirst));
  assert.deepEqual(ledger.map((e) => e.xp), [10, 0, 10, 10, 10, 0], 'f2 wrong, no perfect bonus');
  recordAttempt(ledger, playAll(RIGHT));
  assert.deepEqual(ledger.slice(6).map((e) => e.xp), [0, 10, 0, 0, 0, 25], 'only f2 and the first perfect pay');
});

// ----------------------------------------------------- R11.4 importer

test('parseCsv handles quotes, escaped quotes, commas and line breaks inside quotes', () => {
  const text = '﻿a,b,c\r\n"one, two","say ""Axé""","line1\nline2"\r\nx,,\n';
  assert.deepEqual(parseCsv(text), [
    ['a', 'b', 'c'],
    ['one, two', 'say "Axé"', 'line1\nline2'],
    ['x', '', ''],
  ]);
  assert.deepEqual(parseCsv('a,b'), [['a', 'b']], 'no trailing newline');
  assert.deepEqual(parseCsv('a\rb'), [['a'], ['b']], 'old Mac line ends');
  assert.throws(() => parseCsv('a,"open\nb,c'), /never closed/);
});

test('the shipped template imports: one example row per kind', () => {
  const text = readFileSync(new URL('../docs/quiz-sheet-template.csv', import.meta.url), 'utf8');
  const r = importSheet(text, { source: 'quiz-sheet-template.csv' });
  assert.deepEqual(r.errors, []);
  assert.equal(r.questionCount, 3);
  const qs = r.quizzes.flatMap((q) => q.questions);
  assert.deepEqual(qs.map((q) => q.kind).sort(), ['fillBlank', 'matching', 'multipleChoice']);
  for (const q of qs) assert.match(q.prompt, /^EXAMPLE: /, 'template rows are marked as examples');
  assert.equal(r.warnings.filter((w) => /example row/.test(w)).length, 3);
  for (const quiz of r.quizzes) assert.deepEqual(quizProblems(quiz.questions), [], 'importer output passes content-check rules');
  const blank = qs.find((q) => q.kind === 'fillBlank');
  assert.equal(blank.foldAccents, true);
  assert.equal(scoreQuestion(blank, 'axe').correct, true);
});

const HEAD = 'Cor,module,topic,kind,prompt,options or pairs,accepted answers,explanation,ignore accents\n';

test('importer builds each kind, groups by module and topic, and numbers ids', () => {
  const r = importSheet(HEAD + [
    'Crua,Music,Instruments,,Which instrument leads the roda?,Pandeiro | Berimbau | Atabaque,berimbau,,',
    'Camaleao,music,Instruments,Matching,Match them.,"Berimbau = Bow\nPandeiro = Tambourine",,"Good, right?",',
    ',Culture,Portuguese,fill in the blank,Born in ____.,,Brasil | Brazil,,',
  ].join('\n'));
  assert.deepEqual(r.errors, []);
  assert.equal(r.quizzes.length, 2);
  const [instruments, portuguese] = r.quizzes;
  assert.equal(instruments.moduleId, 'music');
  assert.deepEqual(instruments.questions.map((q) => q.id), ['instruments-1', 'instruments-2']);
  assert.deepEqual(instruments.questions[0], {
    id: 'instruments-1', cor: 'crua', kind: 'multipleChoice', prompt: 'Which instrument leads the roda?',
    choices: ['Pandeiro', 'Berimbau', 'Atabaque'], correctIndex: 1, sourceRow: 2,
  });
  assert.equal(instruments.questions[1].cor, 'camaleao', 'Cor matched without the accent');
  assert.deepEqual(instruments.questions[1].pairs, [{ left: 'Berimbau', right: 'Bow' }, { left: 'Pandeiro', right: 'Tambourine' }]);
  assert.equal(instruments.questions[1].explain, 'Good, right?');
  assert.equal(portuguese.questions[0].cor, undefined, 'a blank Cor is allowed');
  assert.deepEqual(portuguese.questions[0].accepted, ['Brasil', 'Brazil']);
  assert.equal(portuguese.questions[0].foldAccents, undefined, 'accents are strict unless the row says yes');
});

test('importer rejects every row without an answer, with the row number and what to fix', () => {
  const r = importSheet(HEAD + [
    'Crua,Music,Instruments,multiple choice,Which instrument leads the roda?,Pandeiro | Berimbau,,,',
    'Crua,Music,Instruments,matching,Match them.,,,,',
    'Crua,Culture,Portuguese,fill in the blank,Born in ____.,,,,',
    'Crua,Music,Instruments,multiple choice,Good row,A | B,A,,',
  ].join('\n'));
  assert.equal(r.quizzes.length, 0, 'nothing imports while any row is bad');
  assert.equal(r.errors.length, 3);
  assert.match(r.errors[0], /^Row 2 \("Which instrument leads the roda\?"\): no answer\. Put the right option in "accepted answers"/);
  assert.match(r.errors[1], /^Row 3 \("Match them\."\): no answer\. List the pairs/);
  assert.match(r.errors[2], /^Row 4 \("Born in ____\."\): no answer\. Put every answer you will accept/);
});

test('importer explains other mistakes clearly', () => {
  const r = importSheet(HEAD + [
    'Azul,Musc,Songs,drag and drop,Sing it.,,x,,',
    'Crua,Music,Instruments,multiple choice,What is a pandeiro?,A drum | A tambourine,A whistle,,',
    'Crua,Music,Instruments,multiple choice,Two answers?,A | B,A | B,,',
    'Crua,Music,Instruments,matching,Pairs?,Berimbau = Bow | Pandeiro,,,',
    'Crua,Music,Instruments,matching,One pair?,Berimbau = Bow,,,',
    'Crua,Music,Instruments,fill in the blank,Accents?,,Axé,,maybe',
    'Crua,Music,Instruments,multiple choice,,A | B,A,,',
  ].join('\n'));
  const all = r.errors.join('\n');
  assert.match(all, /Row 2 \("Sing it\."\): unknown module "Musc"\. Use one of: Movements, Music, Culture, Graduation\./);
  assert.match(all, /Row 2 \("Sing it\."\): unknown kind "drag and drop"/);
  assert.match(all, /Row 2 \("Sing it\."\): unknown Cor "Azul"/);
  assert.match(all, /Row 3 .*the answer "A whistle" is not one of the options \(A drum, A tambourine\)/);
  assert.match(all, /Row 4 .*multiple choice takes one right answer/);
  assert.match(all, /Row 5 .*the pair "Pandeiro" needs both sides around an =/);
  assert.match(all, /Row 6 .*matching needs at least 2 pairs/);
  assert.match(all, /Row 7 .*"ignore accents" must be yes or no/);
  assert.match(all, /Row 8: the prompt is empty/);
});

test('importer catches duplicate pairs and ids with the content-check rules', () => {
  const head = HEAD.trim() + ',id\n';
  const r = importSheet(head + [
    'Crua,Music,Instruments,matching,Pairs?,Berimbau = Bow | berimbau = Drum,,,,',
    'Crua,Music,Instruments,multiple choice,One,A | B,A,,,same',
    'Crua,Music,Instruments,multiple choice,Two,A | B,B,,,same',
  ].join('\n'));
  assert.match(r.errors.join('\n'), /Row 2 \(Instruments\): pair 2: "berimbau" is on the left twice/);
  assert.match(r.errors.join('\n'), /Row 4 \(Instruments\): duplicate id "same"/);
});

test('importer needs the column headers and at least one question', () => {
  const r = importSheet('module,prompt\nMusic,Hi\n');
  assert.ok(r.errors.some((e) => /Missing column "Cor"/.test(e)));
  assert.ok(r.errors.some((e) => /Missing column "accepted answers"/.test(e)));
  assert.deepEqual(importSheet('').errors, ['The sheet is empty.']);
  assert.deepEqual(importSheet(HEAD).errors, ['The sheet has a header row but no questions.']);
  const loose = importSheet('COR (optional),Module,Topic,Kind,Prompt,Options / Pairs,Accepted Answers,Explanation,Notes\nCrua,Music,X,,Q?,A | B,A,,ignored\n');
  assert.deepEqual(loose.errors, [], 'header names match loosely');
  assert.ok(loose.warnings.some((w) => /Column "Notes" is not one the importer knows/.test(w)));
});
