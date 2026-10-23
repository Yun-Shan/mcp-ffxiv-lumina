// Temporary, conservative comparison of base game tables with observed Wiki shapes.
// No network calls and no product APIs. Unknown fields/namespaces remain unverified.
const own = (object, key) => Object.hasOwn(object ?? {}, key);
const numericId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const list = value => Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : null;
const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const unique = values => [...new Map(values.map(value => [stable(value), value])).values()].sort((a, b) => stable(a).localeCompare(stable(b)));
const ordered = values => [...values].sort((a, b) => stable(a).localeCompare(stable(b)));
const typed = (sheet, id) => `${sheet}:${id}`;

function tableRows(context, sheet) {
  const get = (tables, name) => tables instanceof Map ? tables.get(name) : tables?.[name];
  const rows = new Map();
  for (const data of [get(context.tables, sheet), get(context.detailTables, sheet)]) {
    for (const row of data?.rows ?? []) {
      const key = `${row.rowId}:${row.subrowId ?? ''}`;
      const previous = rows.get(key);
      rows.set(key, { ...previous, ...row, fields: { ...previous?.fields, ...row.fields } });
    }
  }
  return [...rows.values()];
}
function rowFor(context, sheet, id) { return tableRows(context, sheet).find(row => Number(row.rowId) === Number(id)); }
function indexed(fields, prefix) {
  const expression = new RegExp(`^${prefix}\\[(\\d+)\\]$`);
  return Object.entries(fields ?? {}).flatMap(([key, value]) => {
    const match = expression.exec(key);
    return match ? [{ index: Number(match[1]), value }] : [];
  }).sort((a, b) => a.index - b.index);
}
function matches(context, sheet, field, itemId) {
  return tableRows(context, sheet).filter(row => Number(row.fields?.[field]) === Number(itemId));
}
function equality(result, field, local, wiki, comparable = true, note) {
  result.checks.push({ field, status: comparable && local !== undefined && wiki !== undefined ? stable(local) === stable(wiki) ? 'match' : 'mismatch' : 'unverified', local: local ?? null, wiki: wiki ?? null, ...(note ? { note } : {}) });
}
function identity(result, local, remote, comparable = true, note) {
  local = unique(local);
  remote = unique(remote ?? []);
  const localSet = new Set(local.map(stable)); const remoteSet = new Set(remote.map(stable));
  const localOnly = comparable ? local.filter(value => !remoteSet.has(stable(value))) : [];
  const wikiOnly = comparable ? remote.filter(value => !localSet.has(stable(value))) : [];
  result.identity = { status: !comparable ? 'unverified' : localOnly.length || wikiOnly.length ? 'mismatch' : 'match', local, remote, localOnly, wikiOnly, ...(note ? { note } : {}) };
}
function detail(result, field) { if (!result.missingDetails.includes(field)) result.missingDetails.push(field); }
function quantities(fields, prefix) { return indexed(fields, prefix).map(entry => entry.value); }

const categoryKeys = {
  recipe: ['制作'], gathering: ['采集', '采集点'], fishing: ['钓鱼'],
  spearfishing: ['采集', '采集点'], quest: ['任务'], achievement: ['成就'],
  retainer_normal: ['雇员探险'], special_vendor: ['特殊商店'],
  leve: ['理符'], gil_vendor: ['商店'],
};

function localRecipe(sample, context) {
  return matches(context, 'Recipe', 'ItemResult', sample.itemId).map(row => {
    const f = row.fields;
    const level = rowFor(context, 'RecipeLevelTable', f.RecipeLevelTable)?.fields;
    const craft = rowFor(context, 'CraftType', f.CraftType)?.fields;
    return {
      recipeId: row.rowId, craftType: f.CraftType, craftName: craft?.Name,
      recipeLevelTable: f.RecipeLevelTable, level: level?.ClassJobLevel, stars: level?.Stars,
      outputItemId: f.ItemResult, outputQuantity: f.AmountResult, quest: f.Quest, secretRecipeBook: f.SecretRecipeBook,
      conditions: { RequiredCraftsmanship: f.RequiredCraftsmanship, RequiredControl: f.RequiredControl, IsSpecializationRequired: f.IsSpecializationRequired, CanHq: f.CanHq, IsExpert: f.IsExpert },
      ingredients: indexed(f, 'Ingredient').filter(entry => numericId(entry.value)).map(entry => ({ itemId: entry.value, quantity: f[`AmountIngredient[${entry.index}]`] })),
      ingredientSlotsComplete: Array.from({ length: 8 }, (_, i) => own(f, `Ingredient[${i}]`) && own(f, `AmountIngredient[${i}]`)).every(Boolean),
    };
  });
}
function localGathering(sample, context) {
  const items = matches(context, 'GatheringItem', 'Item', sample.itemId);
  const ids = new Set(items.map(row => row.rowId));
  const bases = tableRows(context, 'GatheringPointBase').filter(row => indexed(row.fields, 'Item').some(entry => ids.has(entry.value)));
  const baseIds = new Set(bases.map(row => row.rowId));
  const points = tableRows(context, 'GatheringPoint').filter(row => baseIds.has(row.fields.GatheringPointBase));
  return { items: items.map(row => ({ gatheringItemId: row.rowId, ...row.fields, levelFields: rowFor(context, 'GatheringItemLevelConvertTable', row.fields.GatheringItemLevel)?.fields ?? null })), bases: bases.map(row => ({ rowId: row.rowId, ...row.fields })), points: points.map(row => ({ rowId: row.rowId, ...row.fields })) };
}
function localQuest(sample, context) {
  return tableRows(context, 'Quest').flatMap(row => {
    const rewards = [];
    for (const [prefix, count, mode] of [['Reward', 'ItemCountReward', 'fixed'], ['OptionalItemReward', 'OptionalItemCountReward', 'choose_one']]) {
      for (const entry of indexed(row.fields, prefix)) if (entry.value === sample.itemId) rewards.push({ mode, index: entry.index, quantity: row.fields[`${count}[${entry.index}]`] });
    }
    return rewards.length ? [{ questId: row.rowId, name: row.fields.Name, repeatable: row.fields.IsRepeatable, rewards }] : [];
  });
}
function localRetainer(sample, context) {
  return matches(context, 'RetainerTaskNormal', 'Item', sample.itemId).flatMap(normal => tableRows(context, 'RetainerTask')
    .filter(task => task.fields.IsRandom === false && task.fields.Task === normal.rowId)
    .map(task => ({ normalId: normal.rowId, taskId: task.rowId, ...task.fields, quantities: quantities(normal.fields, 'Quantity'), parameter: rowFor(context, 'RetainerTaskParameter', task.fields.RetainerTaskParameter)?.fields ?? null })));
}
function localLeve(sample, context) {
  const groups = tableRows(context, 'LeveRewardItemGroup').filter(row => indexed(row.fields, 'Item').some(entry => entry.value === sample.itemId));
  const groupIds = new Set(groups.map(row => row.rowId));
  const rewards = tableRows(context, 'LeveRewardItem').filter(row => indexed(row.fields, 'LeveRewardItemGroup').some(entry => groupIds.has(entry.value)));
  const rewardIds = new Set(rewards.map(row => row.rowId));
  return {
    leves: tableRows(context, 'Leve').filter(row => rewardIds.has(row.fields.LeveRewardItem)).map(row => ({ leveId: row.rowId, ...row.fields })),
    groups: groups.map(row => ({ groupId: row.rowId, entries: indexed(row.fields, 'Item').filter(entry => entry.value === sample.itemId).map(entry => ({ itemId: entry.value, quantity: row.fields[`Count[${entry.index}]`], hq: row.fields[`IsHQ[${entry.index}]`] })) })),
    rewards: rewards.map(row => ({ rewardId: row.rowId, groups: indexed(row.fields, 'LeveRewardItemGroup').filter(entry => groupIds.has(entry.value)).map(entry => ({ groupId: entry.value, groupProbabilityPercent: row.fields[`ProbabilityPercent[${entry.index}]`] })) })),
  };
}
function localSpecial(sample, context) {
  return tableRows(context, 'SpecialShop').flatMap(row => {
    const result = [];
    for (const [key, value] of Object.entries(row.fields)) {
      const match = /^Item\[(\d+)\]Item\[(\d+)\]$/.exec(key);
      if (!match || value !== sample.itemId) continue;
      const f = row.fields; const index = Number(match[1]); const prefix = `Item[${index}]`;
      const costs = [0, 1, 2].map(costIndex => ({ rawItemId: f[`${prefix}ItemCost[${costIndex}]`], quantity: f[`${prefix}CurrencyCost[${costIndex}]`], costType: f[`${prefix}CostType[${costIndex}]`], hq: f[`${prefix}CostHq[${costIndex}]`], collectability: f[`${prefix}CollectabilityCost[${costIndex}]`] })).filter(cost => numericId(cost.rawItemId) || Number(cost.quantity) > 0);
      const outputs = [0, 1].map(outputIndex => ({ itemId: f[`${prefix}Item[${outputIndex}]`], quantity: f[`${prefix}ReceiveCount[${outputIndex}]`], hq: f[`${prefix}ReceiveHq[${outputIndex}]`] })).filter(output => numericId(output.itemId));
      result.push({ shopId: row.rowId, shopName: f.Name, index, outputIndex: Number(match[2]), useCurrencyType: f.UseCurrencyType, outputs, costs, shopQuest: f.Quest, quest: f[`${prefix}Quest`], achievement: f[`${prefix}AchievementUnlock`], shopConditions: Object.fromEntries(['Quest', 'CustomTalk', 'RequiredContentFinderCondition', 'RequiredFestival'].filter(field => own(f, field)).map(field => [field, f[field]])), costsComplete: [0, 1, 2].every(i => own(f, `${prefix}ItemCost[${i}]`) && own(f, `${prefix}CurrencyCost[${i}]`)) });
    }
    return result;
  });
}

export function compareBase(sample, context) {
  const source = context.wiki?.['来源'];
  const validSource = source && typeof source === 'object' && !Array.isArray(source);
  const keys = categoryKeys[sample.type] ?? [];
  const result = { categoryPresent: validSource && keys.length ? keys.some(key => own(source, key)) : null, wikiKeys: validSource ? Object.keys(source) : [], identity: { status: 'unverified', local: [], remote: [], localOnly: [], wikiOnly: [] }, checks: [], missingDetails: [], notes: [] };
  if (!validSource) result.notes.push('Wiki 来源未取得或形状未知，不能按无来源处理。');
  const remote = key => validSource ? source[key] : undefined;
  if (sample.type === 'recipe') {
    const local = localRecipe(sample, context); const wiki = list(remote('制作'));
    const recipePages = context.wikiRecipes?.pages ?? [];
    const validPages = recipePages.filter(page => page.data?.data_type === 'Recipe' && Number(page.data['成品ID']) === Number(sample.itemId) && page.title === `Data:Recipe/${page.data.ID}.json`);
    identity(result, local.map(row => typed('Recipe', row.recipeId)), validPages.map(page => typed('Recipe', page.data.ID)), validPages.length > 0, '关联 Recipe Data 按本地候选配方 ID 请求；验证这些配方存在，不独立证明 Wiki 无其他配方。');
    const summaryLocal = local.map(row => ({ recipeLevel: row.recipeLevelTable, level: row.level, stars: row.stars })).sort((a, b) => stable(a).localeCompare(stable(b)));
    const summaryWiki = wiki?.map(row => ({ recipeLevel: row['配方等级'], level: row['等级'], stars: row['星级'] })).sort((a, b) => stable(a).localeCompare(stable(b)));
    equality(result, '配方等级/职业等级/星级摘要', summaryLocal, summaryWiki,
      Boolean(local.length && wiki && [...summaryLocal, ...summaryWiki].every(row => row.recipeLevel !== undefined && row.level !== undefined && row.stars !== undefined)), '保留多条配方的数量；职业等级读取 RecipeLevelTable.ClassJobLevel，非直接使用 row ID。');
    for (const entry of local) {
      const page = validPages.find(value => Number(value.data.ID) === entry.recipeId); const recipe = page?.data;
      const prefix = `Recipe:${entry.recipeId}`;
      for (const [field, key] of [['craftType', '制作类型ID'], ['recipeLevelTable', '配方等级'], ['level', '制作等级'], ['stars', '制作星级'], ['outputItemId', '成品ID'], ['outputQuantity', '成品数量']]) equality(result, `${prefix}/${field}`, entry[field], recipe?.[key], Boolean(recipe));
      const remoteMaterials = recipe && Array.isArray(recipe['材料']) && Array.isArray(recipe['水晶']) ? [...recipe['材料'], ...recipe['水晶']].map(material => ({ itemId: material.ID, quantity: material['数量'] })) : undefined;
      equality(result, `${prefix}/全部直接材料和水晶`, ordered(entry.ingredients), remoteMaterials ? ordered(remoteMaterials) : undefined, Boolean(entry.ingredientSlotsComplete && remoteMaterials?.every(material => numericId(material.itemId) && material.quantity !== undefined)), '保留重复材料项，仅使用 Recipe Data 顶层材料/水晶，不把递归展示的上游材料重复计入当前配方成本。');
      for (const [field, key] of [['RequiredCraftsmanship', '作业精度要求'], ['RequiredControl', '加工精度要求'], ['IsSpecializationRequired', '需要专精'], ['CanHq', '可HQ'], ['IsExpert', '高难度配方']]) equality(result, `${prefix}/${field}`, entry.conditions[field], recipe?.[key], Boolean(recipe));
      const book = entry.secretRecipeBook > 0 ? rowFor(context, 'SecretRecipeBook', entry.secretRecipeBook)?.fields : null;
      equality(result, `${prefix}/秘籍解锁物品`, entry.secretRecipeBook === 0 ? 0 : book?.Item, recipe?.['解锁物品']?.ID ?? (recipe ? 0 : undefined), entry.secretRecipeBook === 0 || book?.Item !== undefined, 'SecretRecipeBook ID 与 Item ID 分开，经 SecretRecipeBook.Item 映射。');
      if (entry.secretRecipeBook > 0 && book?.Item === undefined) detail(result, `SecretRecipeBook:${entry.secretRecipeBook}→Item 映射`);
      if (page) result.notes.push(`${prefix} Wiki revision ${page.revisionId}，${page.revisionTimestamp}。`);
    }
    if (local.some(row => !row.ingredientSlotsComplete)) detail(result, '部分 Recipe 材料槽未读取');
    detail(result, 'Wiki 完整配方集合、任务/场景触发与上游材料路线未穷举');
  } else if (sample.type === 'gathering') {
    const local = localGathering(sample, context); const wiki = remote('采集点');
    const validIds = Array.isArray(wiki) && wiki.every(value => numericId(value));
    identity(result, local.bases.map(row => typed('GatheringPointBase', row.rowId)), validIds ? wiki.map(id => typed('GatheringPointBase', id)) : [], validIds, 'Wiki 采集点数组与 GatheringPointBase 对照，非物理 GatheringPoint。');
    const localLevels = unique(local.items.map(row => ({ level: row.levelFields?.GatheringItemLevel, stars: row.levelFields?.Stars })));
    const wikiSummary = list(remote('采集'));
    equality(result, '采集物品等级/星级', localLevels, wikiSummary ? unique(wikiSummary.map(row => ({ level: row['等级'], stars: row['星级'] }))) : undefined, Boolean(wikiSummary && localLevels.every(row => row.level !== undefined && row.stars !== undefined)), '按 GatheringItemLevelConvertTable 转换；只比等级集合，未以摘要数目推定职业集合。');
    equality(result, '采集等级/职业摘要及点位', local, remote('采集'), false, '原始等级引用与地图点位须经过对应表解码；未以相同裸数字推定语义。');
    detail(result, '采集职业、物品等级、地图坐标和限时/隐藏条件逐项验证');
  } else if (sample.type === 'fishing') {
    const local = tableRows(context, 'FishingSpot').filter(row => indexed(row.fields, 'Item').some(entry => entry.value === sample.itemId));
    const wiki = remote('钓鱼'); const validIds = Array.isArray(wiki) && wiki.every(value => numericId(value));
    identity(result, local.map(row => typed('FishingSpot', row.rowId)), validIds ? wiki.map(id => typed('FishingSpot', id)) : [], validIds, '反查全部 FishingSpot.Item 槽，不局限 FishParameter 主钓场。');
    equality(result, '钓场细节', local.map(row => ({ fishingSpotId: row.rowId, ...row.fields })), wiki, false, 'Item Data 只给钓场 ID，未比较关联钓场页面。');
    detail(result, '钓场地点和等级、鱼饵/天气/时间条件');
  } else if (sample.type === 'spearfishing') {
    const local = matches(context, 'SpearfishingItem', 'Item', sample.itemId).map(row => ({ spearfishingItemId: row.rowId, ...row.fields, notebook: rowFor(context, 'SpearfishingNotebook', row.fields.SpearfishingNotebook)?.fields ?? null }));
    const wiki = remote('采集点'); const validIds = Array.isArray(wiki) && wiki.every(value => numericId(value));
    const localValid = local.length > 0 && local.every(row => numericId(row.notebook?.GatheringPointBase));
    identity(result, local.map(row => row.notebook?.GatheringPointBase).filter(numericId).map(id => typed('GatheringPointBase', id)), validIds ? wiki.map(id => typed('GatheringPointBase', id)) : [], validIds && localValid, '刺鱼在 Wiki 使用采集/采集点；Notebook.GatheringPointBase 映射后比较，不直接比较 Notebook ID。');
    const localLevels = unique(local.map(row => rowFor(context, 'GatheringItemLevelConvertTable', row.GatheringItemLevel)?.fields).map(fields => ({ level: fields?.GatheringItemLevel, stars: fields?.Stars })));
    const wikiSummary = list(remote('采集'));
    equality(result, '刺鱼物品等级/星级', localLevels, wikiSummary ? unique(wikiSummary.map(row => ({ level: row['等级'], stars: row['星级'] }))) : undefined, Boolean(wikiSummary && localLevels.every(row => row.level !== undefined && row.stars !== undefined)), '物品等级由 ConvertTable 解码，与 Notebook 节点等级分开。');
    equality(result, '刺鱼关联及条件', local, { gathering: remote('采集'), gatheringPoints: wiki }, false);
    detail(result, '刺鱼水域/物品等级/鱼群条件与地图坐标');
  } else if (sample.type === 'quest') {
    const local = localQuest(sample, context); const wiki = list(remote('任务'));
    const wikiId = row => typeof row === 'number' ? row : row?.ID;
    const idsValid = wiki && wiki.every(row => numericId(wikiId(row)));
    identity(result, local.map(row => typed('Quest', row.questId)), idsValid ? wiki.map(row => typed('Quest', wikiId(row))) : [], idsValid, '兼容本轮实测的单个任务对象与数字任务 ID 数组。');
    equality(result, '任务奖励数量/固定或择一/重复性', local, wiki, false, 'Item Data 任务来源对象未必含奖励数量和选择模式，需任务数据补证。');
    detail(result, '任务奖励数量、HQ、选择模式、领取地点和条件');
  } else if (sample.type === 'achievement') {
    const local = matches(context, 'Achievement', 'Item', sample.itemId).map(row => ({ achievementId: row.rowId, ...row.fields }));
    const wiki = list(remote('成就')); const validIds = wiki && wiki.every(row => numericId(row.ID));
    identity(result, local.map(row => typed('Achievement', row.achievementId)), validIds ? wiki.map(row => typed('Achievement', row.ID)) : [], validIds);
    for (const entry of local) {
      const counterpart = wiki?.find(row => Number(row.ID) === entry.achievementId);
      equality(result, `Achievement:${entry.achievementId}/奖励物品ID`, entry.Item, counterpart?.['奖励物品']?.ID, Boolean(counterpart));
      equality(result, `Achievement:${entry.achievementId}/名称`, entry.Name, counterpart?.['中文名'], Boolean(counterpart), '语言字段仅作独立展示核对，不用于构建关系。');
      equality(result, `Achievement:${entry.achievementId}/目标描述`, entry.Description, counterpart?.['成就描述'], Boolean(counterpart));
      equality(result, `Achievement:${entry.achievementId}/成就点数`, entry.Points, counterpart?.['成就点数'], Boolean(counterpart));
    }
    equality(result, '成就目标及领取规则', local, wiki, false);
    detail(result, '成就目标规则与领取步骤');
  } else if (sample.type === 'retainer_normal') {
    const local = localRetainer(sample, context); const allWiki = list(remote('雇员探险'));
    const wiki = allWiki?.filter(row => row['随机任务'] === false);
    const idsValid = wiki && wiki.every(row => numericId(row.ID) && Number(row['物品ID']) === Number(sample.itemId));
    result.categoryPresent = Boolean(wiki?.length);
    identity(result, local.map(row => typed('RetainerTask', row.taskId)), idsValid ? wiki.map(row => typed('RetainerTask', row.ID)) : [], idsValid, '本轮三例证明 Wiki ID 指向外层 RetainerTask；通过 Task 字段连接 Normal 产物。');
    for (const entry of local) {
      const counterpart = wiki?.find(row => Number(row.ID) === Number(entry.taskId));
      for (const [field, key] of [['ClassJobCategory', '职业组ID'], ['RetainerLevel', '等级'], ['VentureCost', '探险币'], ['MaxTimemin', '时间'], ['Experience', '经验值'], ['quantities', '物品数量']]) {
        equality(result, `RetainerTask:${entry.taskId}/${field}`, entry[field], counterpart?.[key], Boolean(counterpart));
      }
      const parameterFamily = [17, 18].includes(entry.ClassJobCategory) ? 'PerceptionDoL' : entry.ClassJobCategory === 19 ? 'PerceptionFSH' : null;
      const tierValues = parameterFamily && entry.parameter ? quantities(entry.parameter, parameterFamily) : null;
      const attributes = tierValues ? [entry.RequiredGathering, ...tierValues] : undefined;
      equality(result, `RetainerTask:${entry.taskId}/属性需求档位`, attributes, counterpart?.['属性需求'], Boolean(tierValues?.length === 4 && counterpart), '首项是 RequiredGathering 采集力门槛，后四项来自 PerceptionDoL/FSH 鉴别力数量档位；数组不可排序，也不是单一属性单调递增序列。');
    }
    detail(result, '雇员任务实际解锁/物品发现条件未与 Wiki 展开页面核验');
  } else if (sample.type === 'leve') {
    const local = localLeve(sample, context); const wiki = remote('理符');
    identity(result, local.leves.map(row => typed('Leve', row.leveId)), [], false, 'Wiki 理符数值是摘要计数，不能当作 Leve ID。');
    equality(result, '理符来源数量摘要', unique(local.leves.map(row => row.leveId)).length, wiki, typeof wiki === 'number', '只比较数量，不证明任务身份/奖励组一致。');
    equality(result, '奖励分组/数量/组概率', local, wiki, false);
    detail(result, 'Wiki 理符身份及奖励分组、数量、HQ');
  } else if (sample.type === 'gil_vendor') {
    const local = matches(context, 'GilShopItem', 'Item', sample.itemId); const wiki = list(remote('商店'));
    const validIds = wiki && wiki.every(row => numericId(row['商店ID']));
    identity(result, local.map(row => typed('GilShop', row.rowId)), validIds ? wiki.map(row => typed('GilShop', row['商店ID'])) : [], validIds, 'GilShopItem 为子行表，当前快照缺 subrowId 时不可证明完整商品条目。');
    equality(result, '金币报价/NPC/条件', local, wiki, false, '未把 Item.PriceMid 当成已验证最终售价；NPC/坐标需额外链路。');
    detail(result, 'GilShopItem 子行完整性、实际售价、NPC/坐标/条件');
  } else if (sample.type === 'special_vendor') {
    const local = localSpecial(sample, context); const wiki = list(remote('特殊商店'));
    const validIds = wiki && wiki.every(row => numericId(row['商店ID']) && numericId(row['兑换信息']?.index));
    const offerKey = row => typed('SpecialShop', `${row.shopId}:${row.index}`);
    identity(result, local.map(offerKey), validIds ? wiki.map(row => typed('SpecialShop', `${row['商店ID']}:${row['兑换信息'].index - 1}`)) : [], validIds, 'Wiki index 按已验证 1 基转为客户端 0 基；同报价多个 NPC 聚合。');
    for (const entry of local) {
      const counterparts = wiki?.filter(row => Number(row['商店ID']) === entry.shopId && Number(row['兑换信息']?.index) - 1 === entry.index) ?? [];
      const variants = new Map();
      for (const counterpart of counterparts) {
        const variantKey = stable({ offer: counterpart['兑换信息'], conditions: counterpart['商店条件'] });
        if (!variants.has(variantKey)) variants.set(variantKey, { ...counterpart, npcRefs: [] });
        variants.get(variantKey).npcRefs.push({ npcId: counterpart.ID, location: counterpart['位置'] });
      }
      for (const [n, counterpart] of [...variants.values()].entries()) {
        const info = counterpart['兑换信息']; const prefix = `${offerKey(entry)}/Wiki条件组:${n}`;
        const outputs = list(info['兑换'])?.map(row => ({ itemId: row.ID, quantity: row['数量'], hq: row.HQ }));
        equality(result, `${prefix}/全部输出数量HQ`, ordered(entry.outputs), outputs ? ordered(outputs) : undefined, Boolean(outputs && entry.outputs.every(row => row.quantity !== undefined && row.hq !== undefined)));
        const costs = list(info['材料'])?.map(row => ({ itemId: row.ID, quantity: row['数量'], collectability: row['收藏值'] }));
        const localCosts = entry.costs.map(row => ({ itemId: row.rawItemId, quantity: row.quantity, collectability: row.collectability }));
        const rawItemCurrency = entry.useCurrencyType === 2 && entry.costs.every(row => row.costType === 0);
        equality(result, `${prefix}/AND成本物品数量收藏值`, ordered(localCosts), costs ? ordered(costs) : undefined, Boolean(rawItemCurrency && entry.costsComplete && costs && entry.costs.every(row => row.quantity !== undefined && row.collectability !== undefined)), rawItemCurrency ? '只对 UseCurrencyType=2、CostType=0 的原始物品编码与 Wiki 直接对照；不覆盖其他货币模式。' : `UseCurrencyType=${entry.useCurrencyType} 未验证解析，不把成本原码当 Item ID。`);
        equality(result, `${prefix}/成本HQ`, entry.costs.map(row => ({ rawItemId: row.rawItemId, costType: row.costType, hq: row.hq })), list(info['材料'])?.map(row => ({ itemId: row.ID, hq: row.HQ })), false, '当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。');
        equality(result, `${prefix}/单行任务`, entry.quest, info['任务']?.ID ?? (own(info, '任务') ? undefined : 0), entry.quest !== undefined);
        const wikiShopQuests = list(counterpart['商店条件'])?.filter(condition => condition['条件类型'] === '任务').map(condition => condition.ID);
        equality(result, `${prefix}/商店任务`, entry.shopQuest === undefined ? undefined : entry.shopQuest > 0 ? [entry.shopQuest] : [], wikiShopQuests ? unique(wikiShopQuests) : undefined, entry.shopQuest !== undefined && Array.isArray(counterpart['商店条件']));
        equality(result, `${prefix}/其他条件与NPC地点`, entry.shopConditions, { conditions: counterpart['商店条件'], npcs: counterpart.npcRefs }, false, '相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。');
      }
      if (!counterparts.length) equality(result, `${offerKey(entry)}/报价内容`, entry, null, false, '没有匹配的 Wiki 报价。');
      if (entry.useCurrencyType !== 2) detail(result, `SpecialShop:${entry.shopId} 货币模式 ${entry.useCurrencyType} 解析`);
    }
    detail(result, 'NPC/菜单/坐标及非任务条件');
  } else {
    result.notes.push(`compareBase 尚未实现类别 ${sample.type}`);
  }
  return result;
}
