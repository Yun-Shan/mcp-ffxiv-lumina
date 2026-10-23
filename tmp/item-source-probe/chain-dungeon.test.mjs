import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildDungeonIndex } from './chain-dungeon.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const supplemental = read('inputs/supplemental.json');
const tables = new Map(['ContentFinderCondition', 'BNpcName'].map(name => [name, read(`details/${name}.json`)]));
const real = buildDungeonIndex({ supplemental, tables });
const tiny = (datasets, customTables = new Map()) => buildDungeonIndex({ supplemental: { datasets: Object.fromEntries(Object.entries(datasets).map(([name, rows]) => [name, { rows }])) }, tables: customTables });

test('real 35247: direct boss chest has exact duty, boss, zero-based fight and coffer evidence', () => {
  const route = real.get(35247)?.find(r => r.evidence[0].dataset === 'DungeonBossChest' && r.evidence[0].rowId === 8994);
  assert.ok(route);
  assert.equal(route.kind, 'boss_chest');
  assert.equal(route.duty.cfcId, 801);
  assert.equal(route.duty.instanceId, 30108);
  assert.equal(route.fightNo, 0);
  assert.equal(route.cofferNo, 1);
  assert.deepEqual(route.bosses.map(b => b.bnpcNameId), [10742]);
  assert.ok(route.evidence.some(e => e.dataset === 'DungeonBoss' && e.rowId === 570));
});

test('real 35734: scene chest with BossId=0 remains unknown and overlap does not merge evidence', () => {
  const routes = real.get(35734);
  const boss = routes.find(r => r.evidence[0].dataset === 'DungeonBossChest' && r.evidence[0].rowId === 9014);
  const scene = routes.find(r => r.evidence[0].dataset === 'DungeonChestItem' && r.evidence[0].rowId === 17320);
  assert.ok(boss && scene);
  assert.notEqual(boss.id, scene.id);
  assert.equal(scene.kind, 'scene_chest');
  assert.equal(scene.chest.id, 1131);
  assert.equal(scene.chest.dungeonBossId, 0);
  assert.equal(scene.bosses.length, 0);
  assert.ok(scene.qualityWarnings.includes('unlinked_boss_id'));
  assert.equal(boss.potentialOverlapGroup, scene.potentialOverlapGroup);
  assert.equal(scene.quantity.probability, 100);
  assert.notEqual(scene.quantity.probabilityKind, 'personal_guarantee');
  assert.match(scene.notes.join('\n'), /不能.*刷取次数/);
});

test('real 35826: a boss drop preserves quantity 1 without computed clear count', () => {
  const route = real.get(35826)?.find(r => r.evidence[0].dataset === 'DungeonBossDrop' && r.evidence[0].rowId === 273);
  assert.ok(route);
  assert.equal(route.kind, 'boss_drop');
  assert.equal(route.quantity.min, 1);
  assert.equal(route.quantity.max, 1);
  assert.equal(route.quantity.probability, null);
  assert.equal(route.clearsRequired, undefined);
});

test('real 12674: token retains source alternatives across all three duties', () => {
  const ids = [...new Set(real.get(12674).map(r => r.duty.cfcId))].sort((a, b) => a - b);
  assert.deepEqual(ids, [112, 113, 114]);
});

test('missing chest row preserves item edge with unresolved reference', () => {
  const result = tiny({ DungeonChestItem: [{ RowId: 9, ItemId: 1, ChestId: 404, Min: 1, Max: 1, Probability: 100 }] });
  const [route] = result.get(1);
  assert.equal(route.chest.id, 404);
  assert.equal(route.duty.cfcId, null);
  assert.ok(route.qualityWarnings.includes('unresolved_chest'));
  assert.equal(route.evidence[0].rowId, 9);
});

test('duplicate chest ID preserves both conflicting associations', () => {
  const result = tiny({
    DungeonChestItem: [{ RowId: 9, ItemId: 1, ChestId: 404, Min: 1, Max: 1 }],
    DungeonChest: [
      { RowId: 404, ContentFinderConditionId: 1, ChestNo: 1 },
      { RowId: 404, ContentFinderConditionId: 2, ChestNo: 9 },
    ],
  });
  const routes = result.get(1);
  assert.equal(routes.length, 2);
  assert.equal(new Set(routes.map(r => r.id)).size, 2);
  assert.deepEqual(routes.map(r => r.duty.cfcId), [1, 2]);
  for (const route of routes) assert.ok(route.qualityWarnings.includes('duplicate_chest_id'));
});

test('malformed quantity, missing duty and boss link remain diagnostics rather than invented facts', () => {
  const result = tiny({ DungeonBossDrop: [{ RowId: 1, ItemId: 2, ContentFinderConditionId: 9999, FightNo: 0, Quantity: 0 }] });
  const [route] = result.get(2);
  assert.equal(route.duty.cfcId, 9999);
  assert.equal(route.duty.name, null);
  assert.equal(route.bosses.length, 0);
  assert.ok(route.qualityWarnings.includes('unresolved_duty_id'));
  assert.ok(route.qualityWarnings.includes('unresolved_boss'));
  assert.ok(route.qualityWarnings.includes('invalid_quantity'));
  assert.ok(!route.qualityWarnings.includes('invalid_fight_number'));
});
