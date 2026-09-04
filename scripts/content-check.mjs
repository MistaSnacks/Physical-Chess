#!/usr/bin/env node
// content-check.mjs — fail the build if curriculum content is incomplete
// or points at media keys that do not exist.
import { LESSONS } from '../src/content/lessons.js';
import { MODULES } from '../src/content/modules.js';
import { GLOSSARY } from '../src/content/glossary.js';
import { BIRA } from '../src/content/bira.js';
import { EDUCATORS, FAQ, ABOUT, THE_ACE, ABADA, CORDAS_PAGE, SHOP } from '../src/content/site.js';
import { PHOTOS, YOUTUBE, WIX_VIDEOS } from '../src/data/media.js';

const errors = [];
const warn = [];
const fail = (msg) => errors.push(msg);

const REQUIRED_ALL = ['id', 'moduleId', 'group', 'title', 'type', 'minutes', 'summary', 'reviewNeeded'];
const TYPES = new Set(['video', 'reading', 'drill', 'quiz']);
const BIRA_MOMENTS = [
  'welcome', 'firstLesson', 'correct', 'wrong', 'levelUp', 'streakSaved', 'streakLost',
  'readinessFull', 'patch', 'lessonDone', 'demo', 'desafio', 'readingCheckWrong', 'quizPerfect', 'classMode',
];

function words(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function mediaPhoto(key, where) {
  if (!key) return;
  if (!PHOTOS[key]) fail(`${where}: unknown photoKey "${key}"`);
}
function mediaVideo(key, where) {
  if (!key) return;
  if (!YOUTUBE[key]) fail(`${where}: unknown videoKey "${key}"`);
}
function mediaWixVideo(key, where) {
  if (!key) return;
  if (!WIX_VIDEOS[key]) fail(`${where}: unknown wixVideoKey "${key}"`);
}

const ids = new Set();
const byModule = {};
for (const m of MODULES) byModule[m.id] = [];

for (const l of LESSONS) {
  const where = `lesson ${l.id || '(missing id)'}`;
  if (!l.id) fail(`${where}: missing id`);
  else if (ids.has(l.id)) fail(`${where}: duplicate id`);
  else ids.add(l.id);

  for (const k of REQUIRED_ALL) {
    if (l[k] === undefined || l[k] === null || l[k] === '') fail(`${where}: missing ${k}`);
  }
  if (!TYPES.has(l.type)) fail(`${where}: bad type "${l.type}"`);
  if (typeof l.reviewNeeded !== 'boolean') fail(`${where}: reviewNeeded must be boolean`);
  if (typeof l.minutes !== 'number' || l.minutes <= 0) fail(`${where}: minutes must be a positive number`);
  if (!l.summary || /lorem ipsum/i.test(l.summary)) fail(`${where}: summary missing or placeholder`);

  const mod = MODULES.find((m) => m.id === l.moduleId);
  if (!mod) fail(`${where}: unknown moduleId "${l.moduleId}"`);
  else {
    byModule[mod.id].push(l);
    if (!mod.groups.some((g) => g.id === l.group)) fail(`${where}: unknown group "${l.group}" on module ${mod.id}`);
  }

  mediaPhoto(l.photoKey, where);
  if (Array.isArray(l.photoKeys)) l.photoKeys.forEach((k) => mediaPhoto(k, `${where} photoKeys`));

  if (l.type === 'video') {
    if (!l.videoKey && !l.wixVideoKey) fail(`${where}: video needs videoKey or wixVideoKey`);
    mediaVideo(l.videoKey, where);
    mediaWixVideo(l.wixVideoKey, where);
  }

  if (l.type === 'reading') {
    if (!l.body || typeof l.body !== 'string') fail(`${where}: reading needs body`);
    else {
      if (/lorem ipsum/i.test(l.body)) fail(`${where}: placeholder text in body`);
      const n = words(l.body);
      const skipCount = l.id === 'what-is-batizado';
      if (!skipCount && (n < 120 || n > 220)) warn.push(`${where}: body is ${n} words (want 120–220)`);
    }
    if (!l.check) fail(`${where}: reading needs check`);
    else {
      const { prompt, choices, correctIndex } = l.check;
      if (!prompt) fail(`${where}: check.prompt missing`);
      if (!Array.isArray(choices) || choices.length !== 3) fail(`${where}: check needs exactly 3 choices`);
      if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex > 2) fail(`${where}: check.correctIndex out of range`);
    }
  }

  if (l.type === 'drill') {
    const d = l.drill;
    if (!d) fail(`${where}: drill object missing`);
    else {
      if (typeof d.seconds !== 'number' || d.seconds <= 0) fail(`${where}: drill.seconds must be a positive number`);
      if (!Array.isArray(d.steps) || d.steps.length < 4 || d.steps.length > 7) fail(`${where}: drill needs 4–7 steps (has ${d.steps?.length})`);
      else {
        d.steps.forEach((s, i) => {
          if (!s || !s.text) fail(`${where}: step ${i + 1} missing text`);
          mediaPhoto(s.photoKey, `${where} step ${i + 1}`);
        });
      }
    }
  }

  if (l.type === 'quiz') {
    if (!Array.isArray(l.quiz) || l.quiz.length < 1) fail(`${where}: quiz needs questions`);
    else {
      l.quiz.forEach((q, i) => {
        const qw = `${where} q${i + 1}`;
        if (!q.id) fail(`${qw}: missing id`);
        if (!q.prompt) fail(`${qw}: missing prompt`);
        if (!Array.isArray(q.choices) || q.choices.length < 2) fail(`${qw}: needs choices`);
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.choices.length) fail(`${qw}: correctIndex out of range`);
        mediaPhoto(q.photoKey, qw);
      });
    }
  }
}

for (const m of MODULES) {
  const n = (byModule[m.id] || []).length;
  if (n < 3) fail(`module ${m.id}: ${n} lessons (need ≥ 3)`);
}

if (GLOSSARY.length !== 12) fail(`glossary: ${GLOSSARY.length} words (need 12)`);
GLOSSARY.forEach((g, i) => {
  const w = `glossary[${i}] ${g.word || ''}`;
  if (!g.word || !g.say || !g.meaning) fail(`${w}: need word, say, meaning`);
  if (!g.example || typeof g.example !== 'string') fail(`${w}: missing example sentence`);
});

for (const moment of BIRA_MOMENTS) {
  const list = BIRA[moment];
  if (!Array.isArray(list)) fail(`bira.${moment}: missing`);
  else if (list.length < 3 || list.length > 5) fail(`bira.${moment}: ${list.length} lines (need 3–5)`);
  else if (list.some((line) => !line || typeof line !== 'string')) fail(`bira.${moment}: empty line`);
}

{ const paras = ABOUT?.paragraphs || ABOUT?.mission; if (!paras || paras.length < 2) fail('site.ABOUT needs 2 paragraphs'); }
if (!THE_ACE?.paragraphs?.length) fail('site.THE_ACE missing');
if (!ABADA?.paragraphs?.length) fail('site.ABADA missing');
if (!Array.isArray(EDUCATORS) || EDUCATORS.length < 5) fail('site.EDUCATORS needs 5 portraits');
else {
  EDUCATORS.forEach((e, i) => {
    if (!e.name || !e.title || !e.portraitKey || !e.bio) fail(`EDUCATORS[${i}]: need name, title, portraitKey, bio`);
    mediaPhoto(e.portraitKey, `EDUCATORS ${e.name}`);
  });
}
if (!Array.isArray(FAQ) || FAQ.length !== 8) fail(`site.FAQ: ${FAQ?.length} items (need 8)`);
if (!CORDAS_PAGE?.ladder?.length && !CORDAS_PAGE?.paragraphs?.length) fail('site.CORDAS_PAGE missing ladder or paragraphs');
if (!SHOP?.fields || (Array.isArray(SHOP.fields) ? !SHOP.fields.length : !Object.keys(SHOP.fields).length)) fail('site.SHOP missing fields');
if (SHOP && String(SHOP.price).toLowerCase() !== 'ask ace') fail('site.SHOP.price should be "Ask ACE"');

const musicQuiz = LESSONS.find((l) => l.id === 'music-quiz');
if (!musicQuiz || musicQuiz.quiz.length !== 5) fail('music-quiz must have 5 questions');
else {
  const q1 = musicQuiz.quiz[0];
  const q2 = musicQuiz.quiz[1];
  const q3 = musicQuiz.quiz[2];
  if (q1.prompt !== 'Which instrument leads the roda?' || q1.correctIndex !== 1) fail('music-quiz q1 must stay exactly as written');
  if (q2.prompt !== 'Which country was capoeira born in?' || q2.correctIndex !== 2) fail('music-quiz q2 must stay exactly as written');
  if (q3.prompt !== 'What does "Axé" mean?' || q3.correctIndex !== 0) fail('music-quiz q3 must stay exactly as written');
}
const cultureQuiz = LESSONS.find((l) => l.id === 'culture-quiz');
if (!cultureQuiz || cultureQuiz.quiz.length !== 5) fail('culture-quiz must have 5 questions');
const ready = LESSONS.find((l) => l.id === 'roda-ready-check');
if (!ready || ready.quiz.length !== 3) fail('roda-ready-check must have 3 questions');

const requiredIds = [
  'ginga-basics', 'meia-lua-de-frente', 'esquiva-cocorinha', 'au', 'bencao-armada',
  'ginga-workout-10', 'kick-combo', 'jogos-first-game', 'roda-etiquette',
  'meet-the-berimbau', 'pandeiro-atabaque', 'agogo-reco-reco', 'sing-the-roda', 'music-quiz',
  'portuguese-for-the-roda', 'abada-capoeira', 'folklore-manifestations', 'folklore', 'history-maps', 'culture-quiz',
  'what-is-batizado', 'cordas', 'batizado-2026', 'roda-ready-check',
];
for (const id of requiredIds) {
  if (!ids.has(id)) fail(`missing required lesson id "${id}"`);
}

if (warn.length) {
  console.warn('content-check warnings:');
  for (const w of warn) console.warn('  ·', w);
}
if (errors.length) {
  console.error(`content-check failed (${errors.length}):`);
  for (const e of errors) console.error('  ·', e);
  process.exit(1);
}
console.log(`content-check OK · ${LESSONS.length} lessons · ${GLOSSARY.length} glossary words · ${Object.keys(BIRA).length} Bira moments`);
