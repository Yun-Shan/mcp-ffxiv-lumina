import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAdditionalIndex} from './chain-additional.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const merged = new Map();
for (const dir of ['inputs', 'details', 'chains/inputs']) for (const file of fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(root, dir, file), 'utf8'));
  if (!d.sheet || !Array.isArray(d.rows)) continue;
  if (!merged.has(d.sheet)) merged.set(d.sheet, new Map());
  for (const row of d.rows) {
    const old = merged.get(d.sheet).get(row.rowId);
    merged.get(d.sheet).set(row.rowId, {...old, ...row, fields: {...old?.fields, ...row.fields}});
  }
}
const tables = new Map([...merged].map(([sheet, m]) => [sheet, {sheet, rows: [...m.values()]}]));
const supplemental = JSON.parse(fs.readFileSync(path.join(root, 'inputs/supplemental.json'), 'utf8'));
const actual = buildAdditionalIndex({tables, supplemental});
const fixture = sheets => buildAdditionalIndex({tables: new Map(Object.entries(sheets).map(([sheet, rows]) => [sheet, {sheet, rows}])), supplemental: {datasets: {}}});

test('actual 34391 recipe includes all six positive slots and remains a transformation', () => {
  const r = actual.get(34391).find(e => e.id === 'Recipe:4889');
  assert.equal(r.dataStatus, 'ready');
  assert.equal(r.terminalEvidence, false);
  assert.equal(r.output.quantity, 1);
  assert.equal(r.output.canHq, true);
  assert.equal(r.output.hq, null);
  assert.deepEqual(r.requirements.map(x => [x.itemId, x.quantityPerBatch]), [[36237, 2], [36249, 2], [36182, 1], [36210, 1], [13, 8], [12, 7]]);
});

test('target recipe dependency tree reaches source evidence for every material', () => {
  function closes(id, seen = []) {
    if (seen.includes(id)) return false;
    return (actual.get(id) ?? []).some(e => e.terminalEvidence === true ||
      e.kind === 'recipe' && e.dataStatus === 'ready' && e.requirements.length > 0 && e.requirements.every(r => closes(r.itemId, [...seen, id])));
  }
  assert.equal(closes(34391), true);
  for (const id of [36237, 36249, 36182, 36210, 36188]) assert.equal(closes(id), true, String(id));
  assert.equal(actual.get(36237).find(e => e.kind === 'recipe').requirements.find(r => r.itemId === 27782)?.quantityPerBatch, 1);
});

test('incomplete recipe index cannot silently lose ingredient slots', () => {
  const r = fixture({Recipe: [{rowId: 1, fields: {ItemResult: 42, AmountResult: 1, 'Ingredient[0]': 10, 'AmountIngredient[0]': 2}}]}).get(42)[0];
  assert.equal(r.dataStatus, 'missing_recipe_fields');
  assert.ok(r.missingFields.includes('Ingredient[2]'));
  assert.ok(r.missingFields.includes('AmountIngredient[7]'));
  assert.equal(r.terminalEvidence, false);
});

test('recipe input aggregation preserves AND quantity and rejects zero output', () => {
  const f = {...tables.get('Recipe').rows.find(r => r.rowId === 4889).fields};
  f['Ingredient[1]'] = f['Ingredient[0]'];
  let r = fixture({Recipe: [{rowId: 1, fields: f}]}).get(34391)[0];
  assert.equal(r.requirements.find(r => r.itemId === 36237).quantityPerBatch, 4);
  f.AmountResult = 0;
  r = fixture({Recipe: [{rowId: 1, fields: f}]}).get(34391)[0];
  assert.equal(r.dataStatus, 'invalid_recipe_quantity');
});

test('venture coffer resolves inner Random 30053 to outer Task 395', () => {
  const r = actual.get(32161).find(e => e.kind === 'retainer_random');
  assert.equal(r.task.taskId, 395);
  assert.equal(r.randomTaskRef.rowId, 30053);
  assert.equal(r.task.VentureCost, 2);
  assert.equal(r.task.MaxTimemin, 60);
  assert.equal(r.output.quantity, null);
  assert.equal(r.outcomeMode, 'random_pool_membership_only');
});

test('weapon coffer is a nonrepeatable fixed reward of Quest 69935', () => {
  const r = actual.get(35686).find(e => e.kind === 'quest_reward');
  assert.equal(r.quest.questId, 69935);
  assert.equal(r.output.quantity, 1);
  assert.equal(r.quest.repeatable, false);
  assert.equal(r.quest.optional, false);
  assert.equal(r.output.hq, null);
});

test('gathering relation uses GatheringItem row id and requires a real point join', () => {
  const g = actual.get(13).find(e => e.kind === 'gathering');
  assert.equal(g.sourceRef.rowId, 12);
  assert.ok(g.locations.length > 0);
  assert.equal(fixture({GatheringItem: [{rowId: 12, fields: {Item: 13}}]}).has(13), false);
});

test('optional quest reward retains choose-one and explicit HQ', () => {
  const r = fixture({Quest: [{rowId: 1, fields: {'OptionalItemReward[0]': 42, 'OptionalItemCountReward[0]': 2, 'OptionalItemIsHQReward[0]': true}}]}).get(42)[0];
  assert.equal(r.outcomeMode, 'choose_one_reward');
  assert.equal(r.output.hq, true);
  assert.equal(r.output.quantity, 2);
});
