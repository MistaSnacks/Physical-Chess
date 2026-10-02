#!/usr/bin/env node
// quiz-import.mjs — turn a CSV export of ACE's quiz sheet into quiz content
// (SPEC-v3 R11.4). The plain-language column guide for ACE is
// docs/quiz-sheet-guide.md; docs/quiz-sheet-template.csv has one example row
// per kind.
//
// Usage:
//   node scripts/quiz-import.mjs <sheet.csv>                    JSON to stdout
//   node scripts/quiz-import.mjs <sheet.csv> --out <file.json>  JSON to a file
//
// Rows are checked with the same rules as content:check (src/lib/quiz.js).
// Any bad row (no answer, unknown module or kind, a broken pair …) fails the
// whole import with one clear message per problem, and nothing is written.
// Warnings and the summary go to stderr, so stdout stays pure JSON.
//
// It never writes lessons.js or any .js file. Until D6 the output is not
// wired into live lessons: Quiz.astro renders multiple choice only.
//
// Columns (header names are matched loosely: case, spaces and punctuation
// don't matter):
//   Cor               optional; one of the nine Cores (src/content/cores.js)
//   module            Movements, Music, Culture or Graduation (title or id)
//   topic             groups rows into one quiz per module + topic
//   kind              multiple choice (default when blank), matching, fill in the blank
//   prompt            the question
//   options or pairs  multiple choice: options split by | ;
//                     matching: pairs "left = right" split by |
//   accepted answers  multiple choice: the right option, written as in options;
//                     fill in the blank: every answer to accept, split by |
//   explanation       optional; shown after the answer
//   ignore accents    optional column; "yes" lets a typed answer skip accents
//                     (fill in the blank only, D6: only where ACE approves)
//   id                optional column; pins a question id. Otherwise ids are
//                     "<topic>-<n>" in row order, so don't reorder a live quiz.
// Inside a cell, a line break works as well as | to split items.
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MODULES } from '../src/content/modules.js';
import { CORES } from '../src/content/cores.js';
import { normalizeAnswer, quizProblems } from '../src/lib/quiz.js';

/**
 * Parse CSV text (RFC 4180): commas, "quoted fields", "" for a quote inside
 * quotes, line breaks inside quotes, CRLF / LF / CR line ends, a UTF-8 BOM.
 * Returns an array of records, each an array of field strings.
 */
export function parseCsv(text) {
  const src = String(text).replace(/^﻿/, '');
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  let quoteStartRecord = 0;
  let i = 0;
  const endField = () => { record.push(field); field = ''; };
  const endRecord = () => { endField(); records.push(record); record = []; };
  while (i < src.length) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i += 1; continue;
      }
      field += ch; i += 1; continue;
    }
    if (ch === '"' && field === '') { quoted = true; quoteStartRecord = records.length + 1; i += 1; continue; }
    if (ch === ',') { endField(); i += 1; continue; }
    if (ch === '\r' || ch === '\n') {
      endRecord();
      i += ch === '\r' && src[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    field += ch; i += 1;
  }
  if (quoted) throw new Error(`CSV: a quote opened in row ${quoteStartRecord} is never closed`);
  if (field !== '' || record.length) endRecord();
  return records;
}

const key = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const COLUMNS = {
  cor: { names: ['cor', 'core', 'cores'], required: true, label: 'Cor' },
  module: { names: ['module'], required: true, label: 'module' },
  topic: { names: ['topic'], required: true, label: 'topic' },
  kind: { names: ['kind', 'type', 'format'], required: true, label: 'kind' },
  prompt: { names: ['prompt', 'question'], required: true, label: 'prompt' },
  options: { names: ['optionsorpairs', 'optionspairs', 'options', 'pairs', 'choices'], required: true, label: 'options or pairs' },
  accepted: { names: ['acceptedanswers', 'acceptedanswer', 'accepted', 'answers', 'answer', 'correctanswer'], required: true, label: 'accepted answers' },
  explain: { names: ['explanation', 'explain'], required: true, label: 'explanation' },
  foldAccents: { names: ['ignoreaccents', 'foldaccents'], required: false, label: 'ignore accents' },
  id: { names: ['id', 'questionid'], required: false, label: 'id' },
};

const KIND_NAMES = {
  multipleChoice: ['', 'multiplechoice', 'mc', 'choice', 'choices'],
  matching: ['matching', 'match', 'pairs'],
  fillBlank: ['fillintheblank', 'fillblank', 'blank', 'fill', 'fillin', 'typed'],
};
const KIND_HELP = 'multiple choice, matching or fill in the blank';

function kindFrom(raw) {
  const k = key(raw);
  for (const [kind, names] of Object.entries(KIND_NAMES)) if (names.includes(k)) return kind;
  return null;
}

function moduleFrom(raw) {
  const k = key(raw);
  return MODULES.find((m) => key(m.id) === k || key(m.title) === k) || null;
}

function corFrom(raw) {
  const k = normalizeAnswer(raw, { foldAccents: true });
  return CORES.find((c) => c.id === k || normalizeAnswer(c.title, { foldAccents: true }) === k) || null;
}

function yesNo(raw) {
  const k = key(raw);
  if (['', 'no', 'n', 'false'].includes(k) || String(raw).trim() === '0') return false;
  if (['yes', 'y', 'true', 'x'].includes(k) || String(raw).trim() === '1') return true;
  return null;
}

const split = (cell) => String(cell || '').split(/\s*\|\s*|\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);

function slug(s) {
  return normalizeAnswer(s, { foldAccents: true }).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'quiz';
}

/**
 * Turn the sheet's CSV text into quiz content.
 * Returns { quizzes, questionCount, errors, warnings }. `errors` non-empty
 * means the sheet must be fixed; callers write nothing then.
 */
export function importSheet(text, { source = 'sheet.csv' } = {}) {
  const errors = [];
  const warnings = [];
  let records;
  try {
    records = parseCsv(text);
  } catch (err) {
    return { quizzes: [], questionCount: 0, errors: [err.message], warnings };
  }
  const isBlank = (r) => r.every((c) => String(c).trim() === '');
  const headerAt = records.findIndex((r) => !isBlank(r));
  if (headerAt < 0) return { quizzes: [], questionCount: 0, errors: ['The sheet is empty.'], warnings };

  const header = records[headerAt].map((h) => key(String(h).replace(/\(.*?\)/g, '')));
  const col = {};
  for (const [name, spec] of Object.entries(COLUMNS)) {
    const at = header.findIndex((h) => spec.names.includes(h));
    if (at >= 0) col[name] = at;
    else if (spec.required) errors.push(`Missing column "${spec.label}". The first row must name the columns: ${Object.values(COLUMNS).filter((c) => c.required).map((c) => c.label).join(', ')}.`);
  }
  records[headerAt].forEach((h, i) => {
    if (String(h).trim() && !Object.values(col).includes(i)) warnings.push(`Column "${String(h).trim()}" is not one the importer knows; it is ignored.`);
  });
  if (errors.length) return { quizzes: [], questionCount: 0, errors, warnings };

  const cell = (r, name) => (col[name] === undefined ? '' : String(r[col[name]] ?? '').trim());
  const groups = new Map();
  let questionCount = 0;

  for (let ri = headerAt + 1; ri < records.length; ri++) {
    const r = records[ri];
    if (isBlank(r)) continue;
    const rowNo = ri + 1;
    const prompt = cell(r, 'prompt');
    const short = prompt.length > 40 ? `${prompt.slice(0, 40).trimEnd()}…` : prompt;
    const at = short ? `Row ${rowNo} ("${short}")` : `Row ${rowNo}`;
    const rowErrors = [];
    const bad = (msg) => rowErrors.push(`${at}: ${msg}`);

    if (/^example\b/i.test(prompt)) warnings.push(`Row ${rowNo} is an example row. Delete the example rows before importing real questions.`);
    if (!prompt) bad('the prompt is empty. Write the question in the "prompt" column.');

    const moduleRaw = cell(r, 'module');
    const mod = moduleFrom(moduleRaw);
    const moduleList = MODULES.map((m) => m.title).join(', ');
    if (!moduleRaw) bad(`the module is empty. Use one of: ${moduleList}.`);
    else if (!mod) bad(`unknown module "${moduleRaw}". Use one of: ${moduleList}.`);

    const kindRaw = cell(r, 'kind');
    const kind = kindFrom(kindRaw);
    if (!kind) bad(`unknown kind "${kindRaw}". Use ${KIND_HELP}.`);

    const corRaw = cell(r, 'cor');
    const cor = corRaw ? corFrom(corRaw) : null;
    if (corRaw && !cor) bad(`unknown Cor "${corRaw}". Use one of: ${CORES.map((c) => c.title).join(', ')}, or leave it blank.`);

    const fold = yesNo(cell(r, 'foldAccents'));
    if (fold === null) bad(`"ignore accents" must be yes or no (or blank), not "${cell(r, 'foldAccents')}".`);

    const options = split(cell(r, 'options'));
    const accepted = split(cell(r, 'accepted'));
    const topic = cell(r, 'topic') || 'General';
    const explain = cell(r, 'explain');
    const q = { id: cell(r, 'id') || null, cor: cor ? cor.id : null, kind, prompt };

    if (kind === 'multipleChoice') {
      if (!accepted.length) bad('no answer. Put the right option in "accepted answers", written the same as in "options or pairs".');
      else if (accepted.length > 1) bad(`multiple choice takes one right answer, but "accepted answers" has ${accepted.length}: ${accepted.join(', ')}.`);
      else if (options.length < 2) bad('multiple choice needs at least 2 options in "options or pairs", split by |.');
      else {
        const want = normalizeAnswer(accepted[0]);
        const idx = options.findIndex((o) => normalizeAnswer(o) === want);
        if (idx < 0) bad(`the answer "${accepted[0]}" is not one of the options (${options.join(', ')}). Write it the same way in both columns.`);
        q.choices = options;
        q.correctIndex = idx;
      }
      if (fold) warnings.push(`${at}: "ignore accents" only applies to fill in the blank; ignored here.`);
    } else if (kind === 'matching') {
      if (!options.length) bad('no answer. List the pairs in "options or pairs", like "Berimbau = Leads the roda | Pandeiro = Keeps the beat".');
      const pairs = [];
      for (const item of options) {
        const eq = item.indexOf('=');
        const left = eq < 0 ? '' : item.slice(0, eq).trim();
        const right = eq < 0 ? '' : item.slice(eq + 1).trim();
        if (!left || !right) bad(`the pair "${item}" needs both sides around an =, like "Berimbau = Leads the roda".`);
        else pairs.push({ left, right });
      }
      if (options.length === 1) bad('matching needs at least 2 pairs.');
      q.pairs = pairs;
      if (accepted.length) warnings.push(`${at}: matching uses the pairs as the answer; "accepted answers" is ignored.`);
      if (fold) warnings.push(`${at}: "ignore accents" only applies to fill in the blank; ignored here.`);
    } else if (kind === 'fillBlank') {
      if (!accepted.length) bad('no answer. Put every answer you will accept in "accepted answers", split by |.');
      q.accepted = accepted;
      if (fold) q.foldAccents = true;
      if (options.length) warnings.push(`${at}: fill in the blank doesn't use "options or pairs" yet; ignored.`);
    }
    if (explain) q.explain = explain;
    q.sourceRow = rowNo;

    if (rowErrors.length) { errors.push(...rowErrors); continue; }

    const gkey = `${mod.id}\u0000${key(topic)}`;
    if (!groups.has(gkey)) groups.set(gkey, { moduleId: mod.id, topic, questions: [] });
    const g = groups.get(gkey);
    if (!q.id) q.id = `${slug(topic)}-${g.questions.length + 1}`;
    if (!q.cor) delete q.cor;
    g.questions.push(q);
    questionCount += 1;
  }

  const quizzes = [...groups.values()];
  // Backstop: the same rules content:check uses.
  for (const quiz of quizzes) {
    for (const p of quizProblems(quiz.questions)) {
      const m = p.match(/^q(\d+): (.*)$/);
      const q = m ? quiz.questions[Number(m[1]) - 1] : null;
      errors.push(q ? `Row ${q.sourceRow} (${quiz.topic}): ${m[2]}` : `${quiz.topic}: ${p}`);
    }
  }
  if (!errors.length && !questionCount) errors.push('The sheet has a header row but no questions.');
  return { quizzes: errors.length ? [] : quizzes, questionCount: errors.length ? 0 : questionCount, errors, warnings, source };
}

/** The JSON document the importer writes. Deterministic: no timestamps. */
export function toDocument(result) {
  return {
    generatedBy: 'scripts/quiz-import.mjs',
    source: result.source,
    note: 'Imported from ACE\'s quiz sheet. Not wired into live lessons until D6 (SPEC-v3 R11.5).',
    questionCount: result.questionCount,
    quizzes: result.quizzes,
  };
}

function main(argv) {
  const args = argv.slice(2);
  const positional = [];
  let out = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') out = args[++i] || '';
    else positional.push(args[i]);
  }
  const file = positional[0];
  if (!file || out === '' || positional.length > 1) {
    console.error('Usage: node scripts/quiz-import.mjs <sheet.csv> [--out <file.json>]');
    return 2;
  }
  if (out) {
    const target = resolve(out);
    if (basename(target) === 'lessons.js' || !/\.json$/i.test(target)) {
      console.error(`quiz-import: refusing to write "${out}". Write to a .json file; lessons.js is never overwritten.`);
      return 2;
    }
  }
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`quiz-import: can't read "${file}": ${err.message}`);
    return 2;
  }
  const result = importSheet(text, { source: basename(file) });
  for (const w of result.warnings) console.error(`warning · ${w}`);
  if (result.errors.length) {
    console.error(`quiz-import: ${result.errors.length} problem${result.errors.length === 1 ? '' : 's'} in ${file}. Nothing was written.`);
    for (const e of result.errors) console.error(`  · ${e}`);
    return 1;
  }
  const json = `${JSON.stringify(toDocument(result), null, 2)}\n`;
  if (out) writeFileSync(out, json);
  else process.stdout.write(json);
  const n = result.quizzes.length;
  console.error(`quiz-import: ${result.questionCount} question${result.questionCount === 1 ? '' : 's'} in ${n} quiz${n === 1 ? '' : 'zes'} from ${file}${out ? ` → ${out}` : ''}.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv);
}
