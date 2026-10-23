import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcquisitionGraph } from './chain-graph.mjs';

function shop(rowId, outputId, outputQty, costs, options = {}) {
  const fields = { Name: `shop${rowId}`, UseCurrencyType: options.mode ?? 2 };
  const outputs = [[outputId, outputQty], ...(options.otherOutput ? [options.otherOutput] : [])];
  for (let i = 0; i < 2; i++) {
    fields[`Item[0]Item[${i}]`] = outputs[i]?.[0] ?? 0;
    fields[`Item[0]ReceiveCount[${i}]`] = outputs[i]?.[1] ?? 0;
    fields[`Item[0]ReceiveHq[${i}]`] = false;
  }
  for (let i = 0; i < 3; i++) {
    fields[`Item[0]ItemCost[${i}]`] = costs[i]?.[0] ?? 0;
    fields[`Item[0]CurrencyCost[${i}]`] = costs[i]?.[1] ?? 0;
    fields[`Item[0]CostType[${i}]`] = costs[i]?.[2] ?? 0;
    fields[`Item[0]CollectabilityCost[${i}]`] = costs[i]?.[3] ?? 0;
  }
  return { rowId, fields };
}
const coffer = (output, source, extras = {}) => ({ ItemId: output, SourceItemId: source, ItemSupplementSource: 3, ...extras });
const leaf = (itemId, id = `boss:${itemId}`) => ({ id, itemId, kind: 'boss_drop', evidence: [{ dataset: 'fixture' }], notes: [], quantity: { min: 1, max: 1, probability: null } });
function graph({ shops = [], coffers = [], leaves = [], items = [] } = {}) {
  const tables = new Map([
    ['Item', { rows: items.map(([rowId, fields]) => ({ rowId, fields })) }],
    ['SpecialShop', { rows: shops }],
  ]);
  return buildAcquisitionGraph({ tables, supplemental: { datasets: { ItemSupplement: { rows: coffers } } }, dungeonIndex: new Map(leaves) });
}

test('known exchange yield rounds batch count up and requires every AND cost', () => {
  const g = graph({ shops: [shop(1, 101, 2, [[201, 3], [202, 4]])], leaves: [[201, [leaf(201)]], [202, [leaf(202)]]] });
  const { tree } = g.expand(101, 3);
  const e = tree.alternatives[0];
  assert.equal(tree.alternativeMode, 'any');
  assert.equal(e.requirementMode, 'all');
  assert.equal(e.batches, 2);
  assert.equal(e.producedQuantity, 4);
  assert.deepEqual(e.requirements.map(r => [r.itemId, r.quantity]), [[201, 6], [202, 8]]);
  assert.deepEqual(e.inputs.map(n => n.requestedQuantity), [6, 8]);
  assert.ok(e.inputs.every(n => n.alternatives[0].requiredRuns === null));
});

test('repeated cost slots jointly consume one aggregated material quantity', () => {
  const e = graph({ shops: [shop(1, 101, 1, [[201, 3], [201, 4]])] }).expand(101, 2).tree.alternatives[0];
  assert.equal(e.requirements.length, 1);
  assert.equal(e.requirements[0].quantity, 14);
  assert.deepEqual(e.requirements[0].slots, [0, 1]);
});

test('a joint different-item output quote is charged once for the requested target', () => {
  const e = graph({ shops: [shop(1, 101, 2, [[201, 3]], { otherOutput: [102, 1] })] }).expand(101, 3).tree.alternatives[0];
  assert.equal(e.outputs.length, 2);
  assert.equal(e.batches, 2);
  assert.equal(e.requirements[0].quantity, 6);
});

test('multi-hop coffer chain retains each opening edge and a dungeon leaf, without guarantee inference', () => {
  const g = graph({ coffers: [coffer(101, 201, { Min: 2, Max: 2, Probability: 100 }), coffer(201, 301)], leaves: [[301, [leaf(301)]]] });
  const { tree } = g.expand(101, 3);
  const opening1 = tree.alternatives[0];
  assert.equal(opening1.requiredOpeningsForRequestedQuantity, null);
  assert.equal(opening1.requirements[0].quantity, 1);
  assert.equal(opening1.expansionStatus, 'one_attempt_only');
  const box201 = opening1.inputs[0];
  assert.equal(box201.quantityBasis, 'one_opening_attempt');
  assert.equal(box201.itemId, 201);
  const box301 = box201.alternatives[0].inputs[0];
  assert.equal(box301.itemId, 301);
  assert.equal(box301.alternatives[0].kind, 'boss_drop');
  assert.equal(box301.alternatives[0].requiredRuns, null);
});

test('A-B-A cycle stops only the cyclic path while B direct source remains', () => {
  const g = graph({ coffers: [coffer(101, 201), coffer(201, 101)], leaves: [[201, [leaf(201)]]] });
  const result = g.expand(101);
  const b = result.tree.alternatives[0].inputs[0];
  assert.equal(b.alternatives.length, 2);
  assert.ok(b.alternatives.some(e => e.kind === 'boss_drop'));
  const back = b.alternatives.find(e => e.kind === 'container').inputs[0];
  assert.equal(back.status, 'cycle');
  assert.deepEqual(back.cyclePath, [101, 201, 101]);
  assert.equal(result.stops.cycle, 1);
});

test('shared source reached by two siblings expands on both paths', () => {
  const g = graph({ shops: [shop(1, 101, 1, [[201, 1], [202, 1]])], coffers: [coffer(201, 301), coffer(202, 301)], leaves: [[301, [leaf(301)]]] });
  const result = g.expand(101);
  const branches = result.tree.alternatives[0].inputs;
  assert.equal(branches.length, 2);
  for (const b of branches) {
    const shared = b.alternatives[0].inputs[0];
    assert.equal(shared.itemId, 301);
    assert.equal(shared.status, 'expanded');
    assert.equal(shared.alternatives[0].kind, 'boss_drop');
  }
  assert.equal(result.stops.cycle, undefined);
});

test('self-loop still preserves another direct source', () => {
  const result = graph({ coffers: [coffer(101, 101)], leaves: [[101, [leaf(101)]]] }).expand(101);
  assert.equal(result.tree.alternatives.length, 2);
  assert.equal(result.tree.alternatives.find(e => e.kind === 'container').inputs[0].status, 'cycle');
  assert.ok(result.tree.alternatives.some(e => e.kind === 'boss_drop'));
});

test('depth limit retains the known edge and unexpanded upstream identity', () => {
  const result = graph({ coffers: [coffer(101, 201), coffer(201, 301)], leaves: [[301, [leaf(301)]]] }).expand(101, 1, { maxDepth: 1 });
  const hidden = result.tree.alternatives[0].inputs[0].alternatives[0].inputs[0];
  assert.equal(hidden.itemId, 301);
  assert.equal(hidden.status, 'depth_limit');
  assert.equal(result.stops.depth_limit, 1);
});

test('branch cutoff is stable and reports omitted known alternatives', () => {
  const g = graph({ leaves: [[101, [leaf(101, 'z'), leaf(101, 'b'), leaf(101, 'a')]]] });
  const result = g.expand(101, 1, { maxAlternatives: 2 });
  assert.equal(result.tree.totalKnownAlternatives, 3);
  assert.equal(result.tree.omittedAlternatives, 1);
  assert.equal(result.tree.status, 'alternatives_truncated');
  assert.deepEqual(result.tree.alternatives.map(e => e.id), ['a', 'b']);
  assert.deepEqual(result, g.expand(101, 1, { maxAlternatives: 2 }));
});

test('node limit preserves each AND requirement as an explicit unresolved child', () => {
  const result = graph({ shops: [shop(1, 101, 1, [[201, 3], [202, 4]])], leaves: [[201, [leaf(201)]], [202, [leaf(202)]]] }).expand(101, 1, { maxNodes: 1 });
  assert.equal(result.visitedNodes, 1);
  assert.deepEqual(result.tree.alternatives[0].inputs.map(n => [n.itemId, n.status]), [[201, 'node_limit'], [202, 'node_limit']]);
  assert.equal(result.stops.node_limit, 2);
});

test('unknown special bucket preserves raw code without creating literal item requirement', () => {
  const result = graph({ shops: [shop(1, 101, 1, [[9, 500, 3]], { mode: 16 })], leaves: [[9, [leaf(9)]]] }).expand(101);
  const e = result.tree.alternatives[0];
  assert.equal(e.rawCosts[0].rawItemId, 9);
  assert.equal(e.encodingStatus, 'unverified');
  assert.equal(e.expansionStatus, 'unknown_currency_encoding');
  assert.equal(e.requirements, undefined);
  assert.equal(e.inputs, undefined);
  assert.equal(result.visitedNodes, 1);
});

test('missing fields request precise shop follow-up, never assume zero-cost/free acquisition', () => {
  const s = shop(71, 101, 1, [[201, 3]]);
  delete s.fields['Item[0]CostType[0]'];
  const result = graph({ shops: [s] }).expand(101);
  assert.equal(result.tree.alternatives[0].expansionStatus, 'missing_data');
  assert.deepEqual(result.pending.shops, [{ shopId: 71, indices: [0] }]);
  assert.equal(result.tree.alternatives[0].inputs, undefined);
});

test('unknown or zero output count is not silently substituted with one', () => {
  const s = shop(1, 101, 0, [[201, 3]]);
  const e = graph({ shops: [s] }).expand(101).tree.alternatives[0];
  assert.equal(e.dataStatus, 'invalid_quantity_or_cost');
  assert.equal(e.expansionStatus, 'invalid_quantity_or_cost');
  assert.equal(e.inputs, undefined);
});

test('job-dependent description and target category remain evidence, not proven eligibility', () => {
  const result = graph({ coffers: [coffer(101, 201)], items: [[201, { Name: 'box', Description: '使用后便能获得相应职业或特职的武器。', ItemAction: 388 }], [101, { Name: 'weapon', ClassJobCategory: 44 }]] }).expand(101);
  const e = result.tree.alternatives[0];
  assert.equal(e.outcomeMode, 'job_dependent_from_item_description');
  assert.equal(e.conditions.outputClassJobCategory, 44);
  assert.equal(e.conditions.verification, 'description_only');
  assert.equal(e.conditions.eligible, undefined);
  assert.equal(e.requiredOpeningsForRequestedQuantity, null);
});

test('unsupported source is distinct from impossible acquisition and input errors reject promptly', () => {
  const g = graph();
  assert.equal(g.expand(101).tree.status, 'no_supported_source');
  assert.throws(() => g.expand(0), /Positive integer/);
  assert.throws(() => g.expand(101, 0), /Positive integer/);
  assert.throws(() => g.expand(101, 1, { maxNodes: 0 }), /Invalid maxNodes/);
});
