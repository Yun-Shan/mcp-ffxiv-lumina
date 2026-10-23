// Temporary source providers. Relations come only from captured tables / pinned CSVs.
// Crafting consumes every positive ingredient slot. It is never a terminal source.
const rows = (tables, sheet) => tables.get(sheet)?.rows ?? [];
const has = (f, key) => Object.hasOwn(f ?? {}, key);
const validId = n => Number.isSafeInteger(n) && n > 0;
const positive = n => Number.isSafeInteger(n) && n > 0;
const pick = (f, keys) => Object.fromEntries(keys.filter(k => has(f, k)).map(k => [k, f[k]]));
const append = (map, item, edge) => { if (!validId(item)) return; if (!map.has(item)) map.set(item, []); map.get(item).push(edge); };
const ref = (sheet, rowId) => ({sheet, rowId});

export function buildAdditionalIndex({tables, supplemental}) {
  const index = new Map();
  const maps = new Map();
  const map = sheet => { if (!maps.has(sheet)) maps.set(sheet, new Map(rows(tables, sheet).map(r => [r.rowId, r.fields]))); return maps.get(sheet); };
  const item = id => ({itemId: id, name: map('Item').get(id)?.Name ?? null});
  const terminal = (kind, sourceRef, extra) => ({kind, terminalKind: kind, terminalEvidence: true, sourceRef,
    yieldVerified: false, availabilityVerified: false, ...extra});

  for (const row of rows(tables, 'Recipe')) {
    const f = row.fields;
    if (!validId(f.ItemResult)) continue;
    const needed = ['ItemResult', 'AmountResult', 'CanHq', 'CraftType', 'RecipeLevelTable',
      ...Array.from({length: 8}, (_, slot) => [`Ingredient[${slot}]`, `AmountIngredient[${slot}]`]).flat()];
    const missingFields = needed.filter(k => !has(f, k));
    const ingredients = Array.from({length: 8}, (_, slot) => ({slot, itemId: f[`Ingredient[${slot}]`], quantityPerBatch: f[`AmountIngredient[${slot}]`]}))
      .filter(x => validId(x.itemId) || positive(x.quantityPerBatch));
    const invalid = !positive(f.AmountResult) || !ingredients.length || ingredients.some(x => !validId(x.itemId) || !positive(x.quantityPerBatch));
    const grouped = new Map();
    for (const r of ingredients) {
      if (!grouped.has(r.itemId)) grouped.set(r.itemId, {...item(r.itemId), quantityPerBatch: 0, slots: [], qualifiers: {hq: 'any'}});
      const g = grouped.get(r.itemId); g.quantityPerBatch += r.quantityPerBatch; g.slots.push(r.slot);
    }
    const level = map('RecipeLevelTable').get(f.RecipeLevelTable);
    append(index, f.ItemResult, {id: `Recipe:${row.rowId}`, kind: 'recipe', terminalEvidence: false,
      sourceRef: ref('Recipe', row.rowId), output: {...item(f.ItemResult), quantity: f.AmountResult, hq: null, canHq: f.CanHq ?? null},
      requirementMode: 'all', requirements: [...grouped.values()], rawIngredients: ingredients,
      dataStatus: missingFields.length ? 'missing_recipe_fields' : invalid ? 'invalid_recipe_quantity' : 'ready', missingFields,
      conditions: {recipe: pick(f, ['Quest', 'CraftType', 'RecipeLevelTable', 'RequiredCraftsmanship', 'RequiredControl', 'SecretRecipeBook',
        'ItemRequired', 'StatusRequired', 'RequiredQuality', 'IsSpecializationRequired', 'IsExpert', 'CollectableMetadata', 'CollectableMetadataKey']),
        craftName: map('CraftType').get(f.CraftType)?.Name ?? null, recipeLevel: level ?? null,
        secretRecipeBook: map('SecretRecipeBook').get(f.SecretRecipeBook) ?? null, verification: 'raw_refs_only'},
      evidence: [ref('Recipe', row.rowId), ...(level ? [ref('RecipeLevelTable', f.RecipeLevelTable)] : [])],
      notes: ['数量为一次成功制作的配方产量；不等于已验证的成功率、HQ 率或收藏价值。',
        'CanHq 仅表示配方支持 HQ，不能当成必定产出 HQ；原料允许 NQ/HQ 不代表品质条件已满足。',
        '8 个材料槽含水晶均参与 AND 需求；缺字段时停止，不把有限索引当作完整配方。']});
  }

  const pointBases = new Map();
  for (const row of rows(tables, 'GatheringPointBase')) for (const [key, gatheringItemId] of Object.entries(row.fields)) {
    if (!/^Item\[\d+\]$/.test(key) || !validId(gatheringItemId)) continue;
    if (!pointBases.has(gatheringItemId)) pointBases.set(gatheringItemId, []);
    pointBases.get(gatheringItemId).push({rowId: row.rowId, fields: row.fields, slot: Number(key.match(/\d+/)[0])});
  }
  const pointsByBase = new Map();
  for (const row of rows(tables, 'GatheringPoint')) {
    const id = row.fields.GatheringPointBase;
    if (!pointsByBase.has(id)) pointsByBase.set(id, []);
    pointsByBase.get(id).push(row);
  }
  for (const row of rows(tables, 'GatheringItem')) {
    const f = row.fields;
    if (!validId(f.Item)) continue;
    const bases = pointBases.get(row.rowId) ?? [];
    const locations = bases.flatMap(base => (pointsByBase.get(base.rowId) ?? []).map(point => ({
      gatheringPointId: point.rowId, gatheringPointBaseId: base.rowId, slot: base.slot,
      ...pick(base.fields, ['GatheringType', 'GatheringLevel', 'IsLimited']),
      ...pick(point.fields, ['TerritoryType', 'PlaceName']),
      transient: map('GatheringPointTransient').get(point.rowId) ?? null
    })));
    if (!locations.length) continue; // An isolated catalogue entry is not proof of a gathering place.
    append(index, f.Item, terminal('gathering', ref('GatheringItem', row.rowId), {
      id: `GatheringItem:${row.rowId}`, output: {...item(f.Item), quantity: null, hq: null}, locations,
      conditions: {gatheringItem: {...f}, level: map('GatheringItemLevelConvertTable').get(f.GatheringItemLevel) ?? null,
        verification: 'location_join_verified_conditions_raw'},
      evidence: [ref('GatheringItem', row.rowId), ...bases.map(b => ref('GatheringPointBase', b.rowId)),
        ...locations.map(p => ref('GatheringPoint', p.gatheringPointId))],
      notes: ['GatheringItem → GatheringPointBase 槽位 → GatheringPoint 已关联；不是仅有采集日志就认定可采。',
        '未推算单次采集产量、HQ 或收藏价值；限时/天气/解锁等条件仍为原始引用。']
    }));
  }

  const tasksByType = new Map();
  for (const task of rows(tables, 'RetainerTask')) {
    const key = `${task.fields.IsRandom === true ? 'random' : 'normal'}:${task.fields.Task}`;
    if (!tasksByType.has(key)) tasksByType.set(key, []);
    tasksByType.get(key).push(task);
  }
  const retainerEdge = (itemId, task, sourceRef, extra = {}) => terminal(task.fields.IsRandom ? 'retainer_random' : 'retainer_normal', sourceRef, {
    id: `RetainerTask:${task.rowId}:${itemId}`, output: {...item(itemId), quantity: null, hq: null},
    task: {taskId: task.rowId, ...task.fields, name: task.fields.IsRandom ? map('RetainerTaskRandom').get(task.fields.Task)?.Name ?? null : null},
    conditions: {task: {...task.fields}, parameter: map('RetainerTaskParameter').get(task.fields.RetainerTaskParameter) ?? null,
      verification: 'task_join_verified_conditions_raw'},
    evidence: [ref('RetainerTask', task.rowId), sourceRef],
    notes: ['来源关联指向外层 RetainerTask；表内 Task 是产出子表引用，不能当作用户任务编号。',
      '保留探险币消耗、时长、等级、装备条件；零值和随机奖励不解释成无门槛或必得。',
      '探险币属于行动条件成本，本提供者不把币的所有获取机制继续展开；不计算保证委托次数。'], ...extra
  });
  for (const row of rows(tables, 'RetainerTaskNormal')) {
    if (!validId(row.fields.Item)) continue;
    for (const task of tasksByType.get(`normal:${row.rowId}`) ?? []) append(index, row.fields.Item,
      retainerEdge(row.fields.Item, task, ref('RetainerTaskNormal', row.rowId), {
        quantityTiersRaw: Array.from({length: 5}, (_, slot) => ({slot, quantity: row.fields[`Quantity[${slot}]`]})),
        logRequirements: pick(row.fields, ['GatheringLog', 'FishingLog'])
      }));
  }
  for (const [recordIndex, row] of (supplemental.datasets?.RetainerVentureItem?.rows ?? []).entries()) {
    if (!validId(row.ItemId)) continue;
    for (const task of tasksByType.get(`random:${row.RetainerTaskRandomId}`) ?? []) append(index, row.ItemId,
      retainerEdge(row.ItemId, task, {dataset: 'RetainerVentureItem', recordIndex}, {
        randomTaskRef: ref('RetainerTaskRandom', row.RetainerTaskRandomId), outcomeMode: 'random_pool_membership_only',
        evidence: [ref('RetainerTask', task.rowId), ref('RetainerTaskRandom', row.RetainerTaskRandomId), {dataset: 'RetainerVentureItem', recordIndex}]
      }));
  }

  for (const row of rows(tables, 'Quest')) {
    const f = row.fields;
    for (const [key, id] of Object.entries(f)) {
      const m = /^(Reward|OptionalItemReward)\[(\d+)\]$/.exec(key);
      if (!m || !validId(id)) continue;
      const optional = m[1] === 'OptionalItemReward', slot = Number(m[2]);
      const quantity = f[`${optional ? 'OptionalItemCountReward' : 'ItemCountReward'}[${slot}]`];
      if (!positive(quantity)) continue;
      append(index, id, terminal('quest_reward', ref('Quest', row.rowId), {
        id: `Quest:${row.rowId}:${optional ? 'optional' : 'fixed'}:${slot}`, output: {...item(id), quantity,
          hq: optional ? f[`OptionalItemIsHQReward[${slot}]`] ?? null : null},
        quest: {questId: row.rowId, name: f.Name, optional, rewardSlot: slot, repeatable: f.IsRepeatable ?? null},
        outcomeMode: optional ? 'choose_one_reward' : 'fixed_reward',
        conditions: {quest: pick(f, ['IsRepeatable', 'RepeatIntervalType', 'QuestRepeatFlag', 'PreviousQuest[0]', 'PreviousQuest[1]', 'PreviousQuest[2]',
          'PreviousQuestJoin', 'ClassJobLevel[0]', 'ClassJobLevel[1]', 'ClassJobCategory0', 'ClassJobCategory1', 'Festival',
          'FestivalBegin', 'FestivalEnd', 'IssuerStart', 'IssuerLocation', 'ItemRewardType']), verification: 'raw_refs_only'},
        evidence: [ref('Quest', row.rowId)], notes: ['这是任务奖励来源；任务前置与完成条件未展开为物品成本。',
          '一次性任务不能按数量重复刷取；可选奖励是 OR，不能将同任务所有候选同时计入。',
          '固定奖励的 HQ 语义未从 ItemRewardType 推断，显式保持未知。']
      }));
    }
  }

  const spawnByName = new Map();
  for (const [recordIndex, spawn] of (supplemental.datasets?.MobSpawn?.rows ?? []).entries()) {
    if (!spawnByName.has(spawn.BNpcNameId)) spawnByName.set(spawn.BNpcNameId, []);
    spawnByName.get(spawn.BNpcNameId).push({recordIndex, ...spawn});
  }
  for (const [recordIndex, drop] of (supplemental.datasets?.MobDrop?.rows ?? []).entries()) {
    if (!validId(drop.ItemId) || !validId(drop.BNpcNameId)) continue;
    append(index, drop.ItemId, terminal('mob_drop', {dataset: 'MobDrop', recordIndex}, {
      id: `MobDrop:${recordIndex}`, output: {...item(drop.ItemId), quantity: null, hq: null},
      enemy: {bnpcNameId: drop.BNpcNameId, name: map('BNpcName').get(drop.BNpcNameId)?.Singular ?? null},
      spawns: spawnByName.get(drop.BNpcNameId) ?? [], evidence: [{dataset: 'MobDrop', recordIndex}, ref('BNpcName', drop.BNpcNameId)],
      notes: ['使用 BNpcName 身份匹配，不把名字编号当 BNpcBase 编号。', '掉率、产量与个人必得性未知；位置是独立社区观测记录。']
    }));
  }
  return index;
}
