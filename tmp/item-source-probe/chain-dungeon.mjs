/**
 * Dungeon acquisition leaves built only from pinned Supplemental records and
 * the caller's raw Lumina sheet snapshots. No MCP query or executable is run.
 *
 * A leaf is one source record, not proof of a distinct physical chest. In
 * particular, DungeonChest and DungeonBossChest have no verified shared key.
 * FightNo, CofferNo and ChestNo retain their source numbering without +1.
 */
export function buildDungeonIndex({ supplemental, tables }) {
  const index = new Map();
  const datasets = supplemental?.datasets ?? {};
  const sheet = name => tables?.get(name)?.rows ?? [];
  const tableIndex = name => new Map(sheet(name).map((row, recordIndex) => [Number(row.rowId), { row, recordIndex }]));
  const cfcRows = tableIndex('ContentFinderCondition');
  const npcRows = tableIndex('BNpcName');
  // Verified subset only: ServerConstants.cs labels 2=dungeon, 4=trial,
  // 5=raid. Other content families need their own typed Content mapping.
  const instanceContentTypes = new Set([2, 4, 5]);
  const bossesById = new Map();
  const bossesByFight = new Map();
  const chestsById = new Map();
  const numeric = value => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  const ref = (dataset, row, recordIndex) => ({ dataset, recordIndex, ...(row.RowId !== undefined ? { rowId: row.RowId } : {}) });

  for (const [recordIndex, row] of (datasets.DungeonBoss?.rows ?? []).entries()) {
    const value = { row, recordIndex };
    const id = numeric(row.RowId);
    if (!bossesById.has(id)) bossesById.set(id, []);
    bossesById.get(id).push(value);
    const key = `${row.ContentFinderConditionId}:${row.FightNo}`;
    if (!bossesByFight.has(key)) bossesByFight.set(key, []);
    bossesByFight.get(key).push(value);
  }
  for (const [recordIndex, row] of (datasets.DungeonChest?.rows ?? []).entries()) {
    const id = numeric(row.RowId);
    if (!chestsById.has(id)) chestsById.set(id, []);
    chestsById.get(id).push({ row, recordIndex });
  }

  function warn(route, code, note) {
    if (!route.qualityWarnings.includes(code)) route.qualityWarnings.push(code);
    if (!route.notes.includes(note)) route.notes.push(note);
  }

  function dutyFor(route, cfcId) {
    const id = numeric(cfcId);
    const record = cfcRows.get(id);
    if (!(id > 0)) warn(route, 'missing_duty_id', '来源记录的副本 ID 无效或为 0，不能定位副本。');
    if (!record) {
      warn(route, 'unresolved_duty_id', `ContentFinderCondition/${id} 不在当前表快照；保留原 ID，不推断副本或野外区域。`);
      return { cfcId: id, contentId: null, contentType: null, instanceId: null, name: null };
    }
    route.evidence.push({ dataset: 'ContentFinderCondition', rowId: id, recordIndex: record.recordIndex });
    const fields = record.row.fields ?? {};
    const contentId = numeric(fields.Content), contentType = numeric(fields.ContentType);
    const isInstance = instanceContentTypes.has(contentType);
    if (!(contentId > 0)) warn(route, 'missing_content_id', '副本表的 Content 为 0 或缺失，不能完成 Wiki 实例编号映射。');
    if (!isInstance) warn(route, 'content_namespace_unverified', `ContentType=${contentType} 不在本次验证的 InstanceContent 类型 2/4/5 内；保留 Content 原值，不推断 Wiki 实例编号。`);
    if (!fields.Name) warn(route, 'missing_duty_name', '副本名称为空；保留 ID，不依赖语言查询补猜名称。');
    return { cfcId: id, contentId, contentType, instanceId: isInstance && contentId > 0 ? contentId : null, name: fields.Name || null };
  }

  function attachBosses(route, records, expectedCfcId) {
    const names = new Map();
    for (const { row, recordIndex } of records) {
      route.evidence.push(ref('DungeonBoss', row, recordIndex));
      if (numeric(row.ContentFinderConditionId) !== numeric(expectedCfcId)) {
        warn(route, 'boss_duty_conflict', `DungeonBoss/${row.RowId} 的副本 ID 与箱子记录不同；该关联存在冲突。`);
      }
      const id = numeric(row.BNpcNameId);
      const npc = npcRows.get(id);
      const name = npc?.row.fields?.Singular || null;
      if (!(id > 0)) warn(route, 'missing_boss_name_id', 'Boss 记录的 BNpcNameId 为 0 或无效。');
      else if (!name) warn(route, 'unresolved_boss_name', `BNpcName/${id} 缺失或名称为空。`);
      if (npc) route.evidence.push({ dataset: 'BNpcName', rowId: id, recordIndex: npc.recordIndex });
      names.set(id, { bnpcNameId: id, name });
    }
    route.bosses = [...names.values()];
    if (records.length === 0) warn(route, 'unresolved_boss', '没有可核验的 Boss 关联；不能据此断言这是道中箱或某个特定首领。');
  }

  function quantityFor(route, row, observed = false) {
    route.sourceQuantityRaw = Object.fromEntries(['Quantity', 'Min', 'Max', 'Probability'].filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]));
    if (Object.hasOwn(row, 'Quantity')) {
      const quantity = numeric(row.Quantity);
      if (!(quantity > 0)) warn(route, 'invalid_quantity', '源记录 Quantity 为 0、负数或不可解析，不能据此计算刷取次数。');
      return { min: quantity, max: quantity, probability: null, probabilityKind: 'unknown' };
    }
    const min = numeric(row.Min), max = numeric(row.Max), probability = numeric(row.Probability);
    if (min === null && max === null && probability === null) return null;
    if (min === null || max === null) warn(route, 'incomplete_quantity_range', '源记录未给出完整数量范围。');
    if ((min !== null && min < 0) || (max !== null && max < 0) || (min !== null && max !== null && min > max)) warn(route, 'invalid_quantity_range', '源记录数量范围无效，保留原值供检查。');
    if (probability !== null && (probability < 0 || probability > 100)) warn(route, 'invalid_probability', '源记录概率不在 0–100 范围，保留原值供检查。');
    if (probability !== null && observed) route.notes.push('Probability 原值按百分数保留，属于社区观测，不能当作官方掉率或计算保底刷取次数。');
    return { min, max, probability, probabilityKind: probability !== null && observed ? 'community_observation' : 'unknown' };
  }

  function makeRoute(dataset, row, recordIndex, kind, suffix = '') {
    const itemId = numeric(row.ItemId);
    const route = {
      id: `supplemental:${dataset}:${row.RowId ?? 'no-row-id'}:${recordIndex}${suffix}`,
      kind, itemId, quantity: null, duty: null, bosses: [],
      evidence: [ref(dataset, row, recordIndex)], notes: [], qualityWarnings: [],
    };
    if (!(Number.isSafeInteger(itemId) && itemId > 0)) warn(route, 'invalid_item_id', '来源记录 ItemId 无效或为 0；保留记录，但不能把它当作有效物品来源。');
    return route;
  }
  function add(route) {
    if (!index.has(route.itemId)) index.set(route.itemId, []);
    index.get(route.itemId).push(route);
  }

  for (const [dataset, kind] of [['DungeonBossChest', 'boss_chest'], ['DungeonBossDrop', 'boss_drop'], ['DungeonDrop', 'duty_unspecified']]) {
    for (const [recordIndex, row] of (datasets[dataset]?.rows ?? []).entries()) {
      const route = makeRoute(dataset, row, recordIndex, kind);
      route.duty = dutyFor(route, row.ContentFinderConditionId);
      route.quantity = quantityFor(route, row);
      if (kind !== 'duty_unspecified') {
        route.fightNo = numeric(row.FightNo);
        if (route.fightNo === null || route.fightNo < 0) warn(route, 'invalid_fight_number', '源记录 FightNo 无效；0 是有效原始编号，不进行加一转换。');
        attachBosses(route, bossesByFight.get(`${row.ContentFinderConditionId}:${row.FightNo}`) ?? [], row.ContentFinderConditionId);
      } else {
        route.notes.push('DungeonDrop 仅指向副本，尚不能确定首领、箱子或发放机制。');
      }
      if (kind === 'boss_chest') {
        route.cofferNo = numeric(row.CofferNo);
        if (route.cofferNo === null || route.cofferNo < 0) warn(route, 'invalid_coffer_number', '源记录 CofferNo 无效；0 是有效原始编号，不进行加一转换。');
        route.notes.push('CofferNo 是本表原始编号，未建立其与 DungeonChest.ChestNo 的对应关系。');
      }
      add(route);
    }
  }

  for (const [recordIndex, row] of (datasets.DungeonChestItem?.rows ?? []).entries()) {
    const linkedChests = chestsById.get(numeric(row.ChestId)) ?? [];
    for (const chestRecord of linkedChests.length ? linkedChests : [null]) {
      const route = makeRoute('DungeonChestItem', row, recordIndex, 'scene_chest', linkedChests.length > 1 ? `:chest-record:${chestRecord.recordIndex}` : '');
      route.quantity = quantityFor(route, row, true);
      const chest = chestRecord?.row;
      route.chest = {
        id: numeric(row.ChestId), chestNo: numeric(chest?.ChestNo), mapId: numeric(chest?.MapId),
        territoryTypeId: numeric(chest?.TerritoryTypeId), treasureId: numeric(chest?.TreasureId),
        positionRaw: chest?.Position ?? null, dungeonBossId: numeric(chest?.DungeonBossId),
      };
      route.notes.push('scene_chest 表示场景箱；它可能是首领箱，不能直接称为道中箱。Position 保留游戏世界坐标原值。');
      if (!chest) {
        warn(route, 'unresolved_chest', `DungeonChest/${row.ChestId} 不在当前快照，箱子关联不完整。`);
        route.duty = { cfcId: null, contentId: null, contentType: null, instanceId: null, name: null };
      } else {
        route.evidence.push(ref('DungeonChest', chest, chestRecord.recordIndex));
        route.duty = dutyFor(route, chest.ContentFinderConditionId);
        if (!(route.chest.mapId > 0)) warn(route, 'missing_map_id', '场景箱 MapId 为 0 或缺失，不能定位地图。');
        if (!(route.chest.territoryTypeId > 0)) warn(route, 'missing_territory_id', '场景箱 TerritoryTypeId 为 0 或缺失。');
        if (!(route.chest.treasureId > 0)) warn(route, 'missing_treasure_id', '场景箱 TreasureId 为 0 或缺失，不能关联游戏 Treasure 记录。');
        if (!route.chest.positionRaw) warn(route, 'missing_position', '场景箱没有位置原值。');
        if (route.chest.chestNo === null || route.chest.chestNo < 0) warn(route, 'invalid_chest_number', '场景箱 ChestNo 无效，保留原编号。');
        const linkedBosses = route.chest.dungeonBossId > 0 ? bossesById.get(route.chest.dungeonBossId) ?? [] : [];
        if (!(route.chest.dungeonBossId > 0)) warn(route, 'unlinked_boss_id', 'DungeonBossId 为 0 或缺失只表示未关联，不能作为道中箱判据。');
        attachBosses(route, linkedBosses, chest.ContentFinderConditionId);
        const fights = [...new Set(linkedBosses.map(({ row: boss }) => numeric(boss.FightNo)))];
        if (fights.length === 1 && fights[0] !== null) route.fightNo = fights[0];
        if (linkedChests.length > 1) warn(route, 'duplicate_chest_id', '同一 ChestId 对应多个场景箱记录；分别保留，未选择其中一个。');
      }
      add(route);
    }
  }

  // Same item + same duty across datasets is only a possible overlap. It does
  // not prove two coffer numbers describe one object, nor justify summing them.
  for (const [itemId, routes] of index) {
    const byDuty = new Map();
    for (const route of routes) {
      const cfcId = route.duty?.cfcId;
      if (!(cfcId > 0)) continue;
      if (!byDuty.has(cfcId)) byDuty.set(cfcId, []);
      byDuty.get(cfcId).push(route);
    }
    for (const [cfcId, group] of byDuty) {
      if (new Set(group.map(route => route.evidence[0].dataset)).size < 2) continue;
      for (const route of group) {
        route.potentialOverlapGroup = `item:${itemId}:cfc:${cfcId}`;
        route.notes.push('同一物品和副本在其他来源表也有记录，可能重叠；保留各条证据，不认定同一个箱子、不合计掉落次数。');
      }
    }
  }
  return index;
}
