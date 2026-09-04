import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventsToCsv, playerExportPayload, CSV_COLUMNS } from '../src/lib/export.js';
import { makeEvent, EVENT } from '../src/lib/game/index.js';

test('eventsToCsv writes the spec columns and escapes quotes', () => {
  const e = makeEvent({
    playerId: 'p1', accountId: 'a1', type: EVENT.DRILL_DONE,
    moduleId: 'movements', lessonId: 'esquiva-cocorinha',
    payload: { selfRating: 2, note: 'said "boa"' },
    occurredAt: '2026-09-01T12:00:00.000Z',
    clientEventId: 'evt-1',
  });
  const csv = eventsToCsv([e]);
  const [header, row] = csv.split('\n');
  assert.equal(header, CSV_COLUMNS.join(','));
  assert.match(row, /lesson\.drill\.done/);
  assert.match(row, /esquiva-cocorinha/);
  assert.match(row, /""boa""/);
});

test('playerExportPayload never lists other players', () => {
  const payload = playerExportPayload({
    player: { id: 'player-maya', firstName: 'Maya', apelido: 'Gatinha', avatar: { animal: 'frog', color: 'hibiscus' } },
    snapshot: { xp: 10 },
    events: [],
    account: { displayName: 'Demo Family', email: 'demo@physicalchess.org' },
  });
  assert.equal(payload.player.apelido, 'Gatinha');
  assert.equal(payload.guardian.email, 'demo@physicalchess.org');
  assert.equal(payload.events.length, 0);
  assert.equal('players' in payload, false);
});
