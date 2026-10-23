import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildAcquisitionGraph } from './chain-graph.mjs';

const root = new URL('./', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8'));
const merged = new Map();
function merge(data) {
  if (!data.sheet || !Array.isArray(data.rows)) return;
  if (!merged.has(data.sheet)) merged.set(data.sheet, new Map());
  for (const row of data.rows) {
    const before = merged.get(data.sheet).get(row.rowId);
    merged.get(data.sheet).set(row.rowId, { rowId: row.rowId, fields: { ...before?.fields, ...row.fields } });
  }
}
for (const dir of ['inputs', 'details', 'chains/inputs']) {
  for (const name of fs.readdirSync(new URL(dir + '/', root)).filter(n => n.endsWith('.json')).sort()) merge(read(`${dir}/${name}`));
}
for (const name of ['dungeon-followup-Item.json', 'dungeon-followup-SpecialShop.json']) merge(read(name));
const tables = new Map([...merged].map(([sheet, entries]) => [sheet, { rows: [...entries.values()] }]));
const graph = buildAcquisitionGraph({ tables, supplemental: read('inputs/supplemental.json') });

test('real 35247 x2: direct, job-bound coffer and token exchange coexist; token requirement is16', () => {
  const result = graph.expand(35247, 2);
  assert.equal(result.tree.hasSupportedTerminalPath, true);
  const edges = result.tree.alternatives;
  assert.ok(edges.some(e => e.kind === 'boss_chest' && e.duty.cfcId === 801));
  const box = edges.find(e => e.kind === 'container' && e.source.itemId === 35734);
  assert.ok(box);
  assert.equal(box.outcomeMode, 'job_dependent_from_item_description');
  assert.equal(box.conditions.outputClassJobCategory, 44);
  assert.equal(box.inputs[0].requestedQuantity, 1);
  assert.equal(box.requiredOpeningsForRequestedQuantity, null);
  const exchange = edges.find(e => e.kind === 'exchange' && e.shop.shopId === 1770443);
  assert.equal(exchange.hasSupportedTerminalPath, true);
  assert.equal(exchange.batches, 2);
  assert.deepEqual(exchange.requirements.map(c => [c.itemId, c.quantity]), [[35826, 16]]);
  assert.equal(exchange.inputs[0].alternatives[0].kind, 'boss_drop');
  assert.equal(exchange.inputs[0].alternatives[0].requiredRuns, null);
  const alternate = edges.find(e => e.kind === 'exchange' && e.shop.shopId === 1770797);
  assert.equal(alternate.expansionStatus, 'expanded');
  assert.deepEqual(alternate.requirements.map(c => [c.itemId, c.quantity]), [[35826, 16]]);
  assert.deepEqual(result.pending, { shops: [], items: [], recipes: [] });
});

test('real 11450 x2: four lenses, whose three duties remain alternatives', () => {
  const result = graph.expand(11450, 2);
  assert.equal(result.tree.hasSupportedTerminalPath, true);
  const exchange = result.tree.alternatives.find(e => e.kind === 'exchange' && e.shop.shopId === 1769579);
  assert.equal(exchange.hasSupportedTerminalPath, true);
  assert.equal(exchange.requirementMode, 'all');
  assert.deepEqual(exchange.requirements.map(c => [c.itemId, c.quantity]), [[12674, 4]]);
  const upstream = exchange.inputs[0];
  assert.equal(upstream.alternativeMode, 'any');
  assert.deepEqual([...new Set(upstream.alternatives.map(e => e.duty.cfcId))].sort((a, b) => a - b), [112, 113, 114]);
});

test('real 41680: both upgrade inputs reach sources; unsupported alternative inputs remain explicit', () => {
  const result = graph.expand(41680);
  assert.equal(result.tree.hasSupportedTerminalPath, true);
  const exchange = result.tree.alternatives.find(e => e.shop?.shopId === 1770733);
  assert.equal(exchange.hasSupportedTerminalPath, true);
  assert.equal(exchange.requirementMode, 'all');
  assert.deepEqual(exchange.requirements.map(c => [c.itemId, c.quantity]), [[40091, 1], [41699, 1]]);
  const base = exchange.inputs.find(n => n.itemId === 40091);
  const upgrade = exchange.inputs.find(n => n.itemId === 41699);
  assert.ok(base && upgrade);
  assert.equal(base.hasSupportedTerminalPath, true);
  assert.equal(upgrade.hasSupportedTerminalPath, true);
  const poetics = base.alternatives.find(e => e.shop?.shopId === 1770699);
  assert.deepEqual(poetics.requirements.map(c=>[c.itemId,c.quantity]),[[28,600]]);
  assert.equal(poetics.hasSupportedTerminalPath,true);
  const featherRoute = base.alternatives.find(e => e.shop?.shopId === 1770756);
  assert.equal(featherRoute.inputs[0].itemId, 12995);
  assert.equal(featherRoute.inputs[0].status, 'no_supported_source');
  const bronzeRoute = upgrade.alternatives.find(e => e.shop?.shopId === 1771004);
  assert.equal(bronzeRoute.requirements[0].itemId, 50847);
  assert.equal(bronzeRoute.requirements[0].quantity, 40);
  assert.ok(bronzeRoute.inputs[0].alternatives.some(e => e.duty?.cfcId === 1084));
});

test('real dye follows coffer to outer retainer task, not random child row id',()=>{
  const edge=graph.expand(13722).tree.alternatives.find(e=>e.source?.itemId===32161);
  assert.equal(edge.hasSupportedTerminalPath,true);
  assert.ok(edge.inputs[0].alternatives.some(e=>e.kind==='retainer_random'&&e.task.taskId===395));
  assert.equal(edge.requiredOpeningsForRequestedQuantity,null);
});

test('real 34391 crafting has all ingredients and a separately supported quest coffer route',()=>{
  const result=graph.expand(34391,2);
  const recipe=result.tree.alternatives.find(e=>e.sourceRef?.sheet==='Recipe'&&e.sourceRef.rowId===4889);
  assert.equal(recipe.hasSupportedTerminalPath,true);
  assert.equal(recipe.requirements.length,6);
  assert.equal(recipe.batches,2);
  const coffer=result.tree.alternatives.find(e=>e.source?.itemId===35686);
  assert.equal(coffer.hasSupportedTerminalPath,true);
  const quest=coffer.inputs[0].alternatives.find(e=>e.quest?.questId===69935);
  assert.equal(quest.quest.repeatable,false);
});

test('purple scrip cost resolves, but missing trustworthy subrow data does not manufacture earning closure',()=>{
  const tree=graph.expand(46314).tree;
  assert.equal(tree.hasSupportedTerminalPath,false);
  const e=tree.alternatives.find(e=>e.shop?.shopId===1770627);
  assert.equal(e.expansionStatus,'expanded');
  assert.deepEqual(e.requirements.map(c=>[c.itemId,c.quantity]),[[33913,1200]]);
  assert.equal(e.inputs[0].status,'no_supported_source');
});

test('duty currency totals include all bosses but never repeatable new-player bonus',()=>{
  const edge=graph.expand(28).tree.alternatives.find(e=>e.kind==='duty_currency'&&e.duty.instanceId===90);
  assert.equal(edge.output.quantity,70);
  assert.equal(edge.rewards.finalBoss,35);
  assert.equal(edge.rewards.newPlayerBonus,70);
  assert.equal(edge.requiredRuns,null);
});

test('removing one AND input source invalidates the upgrade route',()=>{
  const withoutEarning=new Map(tables);withoutEarning.delete('InstanceContent');
  const noCurrencyGraph=buildAcquisitionGraph({tables:withoutEarning,supplemental:read('inputs/supplemental.json')});
  const tree=noCurrencyGraph.expand(41680).tree;
  const e=tree.alternatives.find(e=>e.shop?.shopId===1770733);
  assert.equal(e.inputs.find(n=>n.itemId===41699).hasSupportedTerminalPath,true);
  assert.equal(e.inputs.find(n=>n.itemId===40091).hasSupportedTerminalPath,false);
  assert.equal(e.hasSupportedTerminalPath,false);
});
