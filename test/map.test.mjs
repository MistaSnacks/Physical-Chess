import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivePlayer } from '../src/lib/game/derive.js';
import { demoEvents } from '../src/lib/repo/demoSeed.js';
import { nodeState, clearedTrailPercent, lessonTrailItems } from '../src/lib/map.js';

test('Maya demo map: movements current, culture locked, trail follows done lessons', () => {
  const s = derivePlayer(demoEvents());
  assert.equal(nodeState('movements', s), 'current');
  assert.equal(nodeState('music', s), 'open');
  assert.equal(nodeState('culture', s), 'locked');
  assert.equal(nodeState('graduation', s), 'locked');
  const pct = clearedTrailPercent(s);
  assert.ok(pct > 4, `cleared trail ${pct} should be past the start`);
  assert.ok(pct < 100);
  assert.ok(lessonTrailItems().length === 16);
});

test('new player: first module current, gate not ready', () => {
  const s = derivePlayer([]);
  assert.equal(nodeState('movements', s), 'current');
  assert.equal(s.readiness.percent, 0);
  assert.equal(s.cordaCurrent, 'crua');
  assert.equal(clearedTrailPercent(s), 4);
});
