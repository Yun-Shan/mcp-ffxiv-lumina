/**
 * Source candidates from the pinned Supplemental CSVs. No sampling happens here.
 * itemMap, when provided, must contain only the caller's eligible named Item IDs.
 * Returns { [type]: { candidates: [{itemId,localRefs}], note, wikiKeys } }.
 * localRefs point at zero-based parsed records; CSV physical line = recordIndex + 2.
 * wikiKeys are discovery hints, NOT proof that a Wiki category is equivalent.
 */
export const ITEM_SUPPLEMENT_TYPES = {
  1: 'desynth', 2: 'reduction', 3: 'loot', 4: 'gardening',
  5: 'skybuilder_handin', 6: 'card_pack', 7: 'coffer',
  8: 'palace_of_the_dead', 9: 'heaven_on_high', 10: 'eureka_orthos',
  11: 'anemos', 12: 'pagos', 13: 'pyros', 14: 'hydatos',
  15: 'bozja', 16: 'logogram', 17: 'pilgrims_traverse',
  18: 'oizys', 19: 'auxesia', 999: 'supplement_unknown',
};

const definitions = [
  ['mob_drop', 'MobDrop', 'ItemId', ['怪物', '怪物掉落', '掉落', '其他'], 'ItemId -> BNpcNameId; MobSpawn can supply multiple observed places; quantities and probabilities absent.'],
  ['dungeon_chest', 'DungeonChestItem', 'ItemId', ['副本', '宝箱'], 'ItemId -> ChestId -> DungeonChest; concrete chest, coordinates, optional Min/Max/Probability.'],
  ['dungeon_boss', 'DungeonBossDrop', 'ItemId', ['副本'], 'ItemId -> duty + FightNo -> DungeonBoss; Quantity retained.'],
  ['dungeon_boss_chest', 'DungeonBossChest', 'ItemId', ['副本'], 'ItemId -> duty + FightNo + CofferNo; Quantity retained.'],
  ['dungeon_drop', 'DungeonDrop', 'ItemId', ['副本'], 'ItemId -> duty only; not silently upgraded to a particular boss or coffer.'],
  ['fate', 'FateItem', 'ItemId', ['危命任务', '危命', 'FATE', '其他'], 'ItemId -> FateId; no contribution tier, quantity, trigger or probability.'],
  ['gardening_crossbreed', 'GardeningCrossbreed', 'ItemResultId', ['栽培', '种植', '园艺', '其他'], 'ItemResultId is output, both ItemRequirement IDs are joint inputs; soil/layout/chance absent.'],
  ['retainer_random', 'RetainerVentureItem', 'ItemId', ['雇员探险'], 'ItemId -> RetainerTaskRandomId; join task metadata separately.'],
  ['submarine', 'SubmarineDrop', 'ItemId', ['潜水艇', '潜水艇探索', '潜水艇探险', '其他'], 'ItemId -> sector; LootTier and normal/poor/optimal quantity ranges retained.'],
  ['airship', 'AirshipDrop', 'ItemId', ['飞空艇', '飞空艇探索', '飞空艇探险', '其他'], 'ItemId -> AirshipExplorationPointId; quantity/probability absent.'],
  ['store', 'StoreItem', 'ItemId', ['商城', '道具商城', '其他'], 'International store product URL and USD cents; not equivalent to CN store availability/pricing.'],
  ['fieldop_coffer', 'FieldOpCoffer', 'ItemId', ['宝箱', '其他'], 'Type + ChestType + optional observed Min/Max/Probability; no item source ID.'],
];

const supplementWikiKeys = {
  desynth: ['分解', '其他'], reduction: ['精制', '以太精制', '其他'],
  gardening: ['栽培', '种植', '其他'], skybuilder_handin: ['其他'],
  coffer: ['宝箱', '其他'], card_pack: ['其他'], loot: ['其他', '宝箱'],
};

export function buildSupplementalPools(payload, itemMap) {
  const pools = {};
  const hasItem = id => !itemMap || (typeof itemMap.has === 'function' ? itemMap.has(id) || itemMap.has(String(id)) : Object.hasOwn(itemMap, id));
  function add(type, dataset, itemField, wikiKeys, note, predicate = () => true) {
    const rows = payload.datasets[dataset]?.rows;
    const grouped = new Map();
    for (let recordIndex = 0; recordIndex < (rows?.length ?? 0); recordIndex++) {
      const row = rows[recordIndex];
      const itemId = Number(row[itemField]);
      if (!Number.isSafeInteger(itemId) || itemId <= 0 || !hasItem(itemId) || !predicate(row)) continue;
      if (!grouped.has(itemId)) grouped.set(itemId, { itemId, localRefs: [] });
      const localRef = { dataset, recordIndex };
      if (row.RowId != null) localRef.rowId = row.RowId;
      grouped.get(itemId).localRefs.push(localRef);
    }
    pools[type] = { candidates: [...grouped.values()].sort((a, b) => a.itemId - b.itemId), note, wikiKeys, available: Boolean(rows) };
  }
  for (const [type, dataset, itemField, wikiKeys, note] of definitions) add(type, dataset, itemField, wikiKeys, note);
  for (const [enumId, type] of Object.entries(ITEM_SUPPLEMENT_TYPES)) {
    // Unknown is a documented enum with no records in this version; do not fabricate candidates.
    add(type, 'ItemSupplement', 'ItemId', supplementWikiKeys[type] ?? ['其他', '宝箱'],
      `ItemSupplementSource=${enumId}; SourceItemId is consumed/opened/converted to output ItemId. Min/Max/Probability preserved as nullable; no complete route/unlock proof.`,
      row => row.ItemSupplementSource === Number(enumId));
  }
  return pools;
}

/** Resolve records and safe ID joins for one sampled type/item, without language-dependent queries. */
export function getSupplementalRelations(payload, type, itemId) {
  const definition = definitions.find(entry => entry[0] === type);
  const enumId = Object.entries(ITEM_SUPPLEMENT_TYPES).find(([, key]) => key === type)?.[0];
  const dataset = definition?.[1] ?? (enumId ? 'ItemSupplement' : null);
  const itemField = definition?.[2] ?? 'ItemId';
  if (!dataset) throw new Error(`Unknown Supplemental source type: ${type}`);
  const rows = payload.datasets[dataset]?.rows ?? [];
  const related = (name, predicate) => (payload.datasets[name]?.rows ?? []).flatMap((row, recordIndex) => predicate(row) ? [{ dataset: name, recordIndex, row }] : []);
  return rows.flatMap((row, recordIndex) => {
    if (row[itemField] !== Number(itemId) || (enumId && row.ItemSupplementSource !== Number(enumId))) return [];
    const joins = [];
    if (dataset === 'DungeonChestItem') {
      const chests = related('DungeonChest', chest => chest.RowId === row.ChestId);
      joins.push(...chests);
      for (const chest of chests) joins.push(...related('DungeonBoss', boss => boss.RowId === chest.row.DungeonBossId));
    }
    if (dataset === 'DungeonBossDrop' || dataset === 'DungeonBossChest') joins.push(...related('DungeonBoss', boss => boss.ContentFinderConditionId === row.ContentFinderConditionId && boss.FightNo === row.FightNo));
    if (dataset === 'MobDrop') joins.push(...related('MobSpawn', spawn => spawn.BNpcNameId === row.BNpcNameId));
    // Unlock records are retained as raw metadata only: field names do not prove the prerequisite direction.
    if (dataset === 'SubmarineDrop') joins.push(...related('SubmarineUnlock', unlock => unlock.SubmarineExplorationId === row.SubmarineExplorationId || unlock.SubmarineExplorationUnlockId === row.SubmarineExplorationId));
    if (dataset === 'AirshipDrop') joins.push(...related('AirshipUnlock', unlock => unlock.AirshipExplorationPointId === row.AirshipExplorationPointId || unlock.AirshipExplorationPointUnlockId === row.AirshipExplorationPointId));
    return [{ dataset, recordIndex, row, joins }];
  });
}

export const EXCLUDED_AS_ACQUISITION = {
  QuestRequiredItem: 'Item is consumed/required by a quest, not a quest reward.',
  UnobtainableItem: 'Availability annotation; a lone ItemId is not an acquisition path.',
  RelicWeapon: 'Stage/previous-stage/quest metadata; does not prove actual acquisition output/costs.',
  RelicTool: 'Stage/previous-stage/quest metadata; does not prove actual acquisition output/costs.',
  Gearset: 'Membership metadata, not a source.',
  ItemPatch: 'Patch range metadata, not a source.',
};
