// SPEC-v3 WP13: the Mestre registry (R13.1) and Mestre of the week (R13.3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESTRES, POPUP_MESTRES, mestreById, fullName, educatorsLabel } from '../src/content/mestres.js';
import { mestreOfWeek, mestreWeekIndex, weeksSinceEpoch, MESTRE_WEEK_EPOCH } from '../src/lib/game/mestres.js';
import { isoWeek } from '../src/lib/game/streaks.js';
import { PHOTOS } from '../src/data/media.js';
import { EDUCATORS } from '../src/content/site.js';

const CLIENT_NAMES = [
  'Mestre Bimba', 'Mestre Camisa Roxa', 'Mestre Camisa', 'Mestre Cobra', 'Mestre Morcego',
  'Mestra Cigarra', 'Mestre Pernilongo', 'Mestre Paulinho Velho', 'Mestre Apache', 'Mestre Piriquito Verde',
  'Mestre Cascão', 'Mestre Canguru', 'Mestre Bode', 'Mestre Tigre', 'Mestra Edna Lima',
];

const DAY = 86400000;
/** Noon New York time on a Monday `weeks` after the 2026-09-28 epoch (EDT/EST safe). */
const mondayNoon = (weeks) => new Date(Date.UTC(2026, 8, 28, 16) + weeks * 7 * DAY);

test('registry: the 15 pop-up names are the client names, in the client order', () => {
  assert.equal(POPUP_MESTRES.length, 15);
  assert.deepEqual(POPUP_MESTRES.map(fullName), CLIENT_NAMES);
  assert.deepEqual(POPUP_MESTRES.map((m) => m.order), Array.from({ length: 15 }, (_, i) => i + 1));
});

test('registry: unique ids, a title, an order, a portrait or a placeholder, no invented facts', () => {
  const ids = MESTRES.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  for (const m of MESTRES) {
    assert.ok(/^[a-z][a-z-]*$/.test(m.id), `${m.id}: kebab-case id`);
    assert.ok(m.title && m.name && m.educatorsName, `${m.id}: title, name, educatorsName`);
    assert.equal(typeof m.order, 'number');
    assert.equal(typeof m.popup, 'boolean');
    assert.equal(m.fact, '', `${m.id}: fact stays empty until ACE approves one`);
    if (m.portraitKey === null) assert.equal(m.portraitPlaceholder, true, `${m.id}: placeholder flag`);
    else {
      assert.ok(PHOTOS[m.portraitKey], `${m.id}: portraitKey "${m.portraitKey}" exists in PHOTOS`);
      assert.equal(m.portraitPlaceholder, false);
    }
  }
});

test('registry: four portraits on hand for the pop-up names; Yara is Educators-only', () => {
  const withPortrait = POPUP_MESTRES.filter((m) => m.portraitKey).map((m) => m.id).sort();
  assert.deepEqual(withPortrait, ['cigarra', 'cobra', 'edna-lima', 'pernilongo']);
  const yara = mestreById('yara');
  assert.equal(yara.popup, false);
  assert.equal(educatorsLabel(yara), 'Mestranda Yara');
  assert.equal(mestreById('cigarra').educatorsName, 'Marcia', 'Cigarra keeps today\'s "Marcia" until D5');
  assert.throws(() => mestreById('bira'), /unknown mestre id/);
});

test('registry: Educators and captions read today\'s text until D5', () => {
  assert.deepEqual(
    EDUCATORS.map((e) => [e.title, e.name, e.portraitKey]),
    [
      ['Mestre', 'Pernilongo', 'mestrePernilongo'],
      ['Mestra', 'Marcia', 'mestraMarciaBerimbau'],
      ['Mestra', 'Edna Lima', 'mestraEdnaLima'],
      ['Mestre', 'Cobra', 'mestreCobra'],
      ['Mestranda', 'Yara', 'mestrandaYara'],
    ],
  );
  assert.equal(EDUCATORS[1].bio, 'Mestra Marcia teaches with ACE in Brooklyn. Full bio pending ACE review.');
  assert.equal(PHOTOS.mestrePernilongo.caption, 'Mestre Pernilongo');
  assert.equal(PHOTOS.mestraMarciaBerimbau.caption, 'Mestra Marcia on the berimbau');
  assert.equal(PHOTOS.mestraEdnaLima.caption, 'Mestra Edna Lima');
  assert.equal(PHOTOS.mestreCobra.caption, 'Mestre Cobra');
  assert.equal(PHOTOS.mestrandaYara.caption, 'Mestranda Yara');
});

test('mestre of the week: 15 weeks across 2026-W53 into 2027-W01 show all 15 names in order', () => {
  const weeks = Array.from({ length: 15 }, (_, i) => mondayNoon(i));
  assert.equal(isoWeek(weeks[0]), '2026-W40');
  assert.equal(isoWeek(weeks[13]), '2026-W53');
  assert.equal(isoWeek(weeks[14]), '2027-W01');
  assert.deepEqual(weeks.map((d) => fullName(mestreOfWeek(d))), CLIENT_NAMES);
  // Week 15 wraps to the start again.
  assert.equal(isoWeek(mondayNoon(15)), '2027-W02');
  assert.equal(mestreOfWeek(mondayNoon(15)).id, 'bimba');
});

test('mestre of the week: a window that starts mid-rotation still crosses New Year in order', () => {
  // Start at 2026-W50 (index 10): W50, W51, W52, W53, 2027-W01, W02 ... W14.
  const seen = Array.from({ length: 15 }, (_, i) => mestreOfWeek(mondayNoon(10 + i)).id);
  const expected = Array.from({ length: 15 }, (_, i) => POPUP_MESTRES[(10 + i) % 15].id);
  assert.deepEqual(seen, expected);
  assert.equal(new Set(seen).size, 15, 'every name once');
  assert.equal(isoWeek(mondayNoon(13)), '2026-W53');
  assert.equal(mestreOfWeek(mondayNoon(13)).id, 'tigre');
  assert.equal(mestreOfWeek(mondayNoon(14)).id, 'edna-lima');
});

test('mestre of the week: the week turns at Monday midnight New York time, not UTC', () => {
  // Sunday 2026-10-04 23:30 EDT is 03:30 UTC Monday; still week 0 in New York.
  assert.equal(mestreOfWeek(new Date('2026-10-05T03:30:00Z')).id, 'bimba');
  assert.equal(mestreOfWeek(new Date('2026-10-05T04:00:00Z')).id, 'camisa-roxa', 'Monday 00:00 EDT');
  // After DST ends (2026-11-01), Monday midnight is 05:00 UTC.
  assert.equal(weeksSinceEpoch(new Date('2026-11-09T04:59:00Z')), 5);
  assert.equal(weeksSinceEpoch(new Date('2026-11-09T05:00:00Z')), 6);
  // Bare dates are New York calendar days.
  assert.equal(weeksSinceEpoch(MESTRE_WEEK_EPOCH), 0);
  assert.equal(weeksSinceEpoch('2026-10-04'), 0);
  assert.equal(weeksSinceEpoch('2026-10-05'), 1);
});

test('mestre of the week: every day of a week agrees, and dates before the epoch wrap', () => {
  for (let d = 0; d < 7; d++) {
    assert.equal(mestreOfWeek(new Date(mondayNoon(20).getTime() + d * DAY)).id, POPUP_MESTRES[5].id);
  }
  assert.equal(mestreWeekIndex('2026-09-27'), 14, 'the Sunday before the epoch is the last name');
  assert.equal(mestreWeekIndex('2026-09-21'), 14);
  assert.equal(mestreWeekIndex('2026-09-20'), 13);
});
