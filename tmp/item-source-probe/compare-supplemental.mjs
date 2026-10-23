// Temporary conservative experiment. Source rows come from fixed Supplemental CSVs;
// all Wiki comparisons use the captured Data JSON, never get_item_sources.
import { getSupplementalRelations, ITEM_SUPPLEMENT_TYPES } from './supplemental-adapters.mjs';

const own = (o, key) => Object.hasOwn(o ?? {}, key);
const list = value => Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : null;
const numberId = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 && value !== null ? Number(value) : null;
const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const unique = values => [...new Map(values.map(value => [stable(value), value])).values()].sort((a, b) => stable(a).localeCompare(stable(b)));
const typed = (type, id) => `${type}:${id}`;
const normalizedName = value => typeof value === 'string' ? value.replace(/\s+/g, '').normalize('NFC') : undefined;
function tableRows(context, sheet) {
  const get = tables => tables instanceof Map ? tables.get(sheet) : tables?.[sheet];
  const rows = new Map();
  for (const dataset of [get(context.tables), get(context.detailTables)]) for (const row of dataset?.rows ?? []) {
    const previous = rows.get(Number(row.rowId));
    rows.set(Number(row.rowId), { ...previous, ...row, fields: { ...previous?.fields, ...row.fields } });
  }
  return [...rows.values()];
}
const rowFor = (context, sheet, id) => tableRows(context, sheet).find(row => Number(row.rowId) === Number(id));
function identity(result, local, remote, comparable, note) {
  local = unique(local); remote = unique(remote ?? []);
  const l = new Set(local.map(stable)), r = new Set(remote.map(stable));
  const localOnly = comparable ? local.filter(x => !r.has(stable(x))) : [];
  const wikiOnly = comparable ? remote.filter(x => !l.has(stable(x))) : [];
  result.identity = { status: comparable ? localOnly.length || wikiOnly.length ? 'mismatch' : 'match' : 'unverified', local, remote, localOnly, wikiOnly, ...(note ? { note } : {}) };
}
function check(result, field, local, wiki, comparable = false, note) {
  result.checks.push({ field, status: comparable && local !== undefined && wiki !== undefined ? stable(local) === stable(wiki) ? 'match' : 'mismatch' : 'unverified', local: local ?? null, wiki: wiki ?? null, ...(note ? { note } : {}) });
}
function missing(result, ...fields) { result.missingDetails.push(...fields.filter(field => !result.missingDetails.includes(field))); }
const rowsOf = (context, dataset) => context.supplemental.datasets[dataset]?.rows ?? [];
const derivationGroup = type => ['loot', 'card_pack', 'coffer'].includes(type) ? [3, 6, 7]
  : Object.entries(ITEM_SUPPLEMENT_TYPES).some(([id, value]) => value === type && Number(id) >= 8 && Number(id) <= 19) ? [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  : [Number(Object.entries(ITEM_SUPPLEMENT_TYPES).find(([, value]) => value === type)?.[0])];
const categoryKeys = {
  mob_drop: ['掉落'], dungeon_chest: ['副本'], dungeon_boss: ['副本'], dungeon_boss_chest: ['副本'], dungeon_drop: ['副本'],
  fate: ['危命任务'], gardening: ['栽培'], gardening_crossbreed: ['种子'], retainer_random: ['雇员探险'], submarine: ['潜水艇'], airship: ['部队探索'], store: ['道具商城'], fieldop_coffer: ['特殊场景探索'],
  desynth: ['道具分解'], reduction: ['精选'], loot: ['物品箱'], card_pack: ['物品箱'], coffer: ['物品箱'],
  skybuilder_handin: [],
};

export function compareSupplemental(sample, context) {
  const source = context.wiki?.['来源'];
  const validSource = source && typeof source === 'object' && !Array.isArray(source);
  const type = sample.type;
  const group = derivationGroup(type);
  const keys = categoryKeys[type] ?? (group.length > 1 ? ['鉴定'] : []);
  const result = { categoryPresent: validSource && keys.length ? keys.some(key => own(source, key)) : null, wikiKeys: validSource ? Object.keys(source) : [], identity: { status: 'unverified', local: [], remote: [], localOnly: [], wikiOnly: [] }, checks: [], missingDetails: [], notes: [] };
  const remote = key => validSource ? source[key] : undefined;
  const relations = getSupplementalRelations(context.supplemental, type, sample.itemId);
  const localRows = relations.map(entry => entry.row);
  if (!validSource) result.notes.push('Wiki 来源未取得或形状未知，不能解释为没有来源。');
  if (result.categoryPresent === false) result.notes.push('本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。');
  if (!keys.length) result.notes.push('本比较器尚未建立该机制与 Wiki 的语义映射；类别存在与否无法判定。');
  if (type.startsWith('dungeon_')) {
    // Wiki combines dungeon drop mechanisms. Compare the complete known duty set,
    // rather than calling another local subtype a false Wiki-only source.
    const all = ['dungeon_chest', 'dungeon_boss', 'dungeon_boss_chest', 'dungeon_drop'].flatMap(kind => getSupplementalRelations(context.supplemental, kind, sample.itemId));
    const duties = unique(all.flatMap(relation => relation.row.ContentFinderConditionId != null ? [relation.row.ContentFinderConditionId] : relation.joins.filter(join => join.dataset === 'DungeonChest').map(join => join.row.ContentFinderConditionId)));
    const cfc = duties.map(id => ({ cfcId: id, fields: rowFor(context, 'ContentFinderCondition', id)?.fields }));
    const wiki = list(remote('副本'));
    const mapValid = cfc.length > 0 && cfc.every(row => numberId(row.fields?.Content) > 0);
    const wikiValid = Boolean(wiki && wiki.every(row => numberId(row.ID) > 0));
    identity(result, cfc.map(row => mapValid ? typed('InstanceContent', row.fields.Content) : typed('ContentFinderCondition', row.cfcId)), wiki?.map(row => typed('InstanceContent', row.ID)), mapValid && wikiValid,
      '汇总四类本地副本关系的副本实体；ContentFinderCondition.Content 对 Wiki 副本.ID，不把 CFC RowId 当 Wiki ID。');
    if (!mapValid) missing(result, 'ContentFinderCondition.Content 完整映射');
    const sharedIds = new Set(cfc.map(row => row.fields?.Content).filter(id => wiki?.some(row => row.ID === id)));
    const localNames = unique(cfc.filter(row => sharedIds.has(row.fields?.Content)).map(row => ({ instanceId: row.fields.Content, name: normalizedName(row.fields.Name) })));
    const wikiNames = wiki ? unique(wiki.filter(row => sharedIds.has(row.ID)).map(row => ({ instanceId: row.ID, name: normalizedName(row['中文名']) }))) : undefined;
    check(result, '共有副本的名称', localNames, wikiNames, mapValid && wikiValid && localNames.length > 0 && localNames.every(row => row.name), '只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。');
    const localBosses = unique(all.filter(relation => ['DungeonBossDrop', 'DungeonBossChest'].includes(relation.dataset)).flatMap(relation => relation.joins.filter(join => join.dataset === 'DungeonBoss').map(join => ({ instanceId: rowFor(context, 'ContentFinderCondition', join.row.ContentFinderConditionId)?.fields?.Content, bnpcNameId: join.row.BNpcNameId }))));
    const wikiBosses = wiki ? unique(wiki.filter(row => row['数据类型'] === '首领').flatMap(row => (row.BNpcNames_ID ?? []).map(id => ({ instanceId: row.ID, bnpcNameId: id })))) : undefined;
    const explicitBossScope = ['dungeon_boss', 'dungeon_boss_chest'].includes(type);
    check(result, '明确首领掉落/首领宝箱的首领实体', localBosses, wikiBosses,
      explicitBossScope && mapValid && wikiValid && localBosses.length > 0 && wiki.filter(row => row['数据类型'] === '首领').every(row => Array.isArray(row.BNpcNames_ID)),
      '只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。');
    check(result, '抽中子类型的数量/宝箱/坐标/概率', localRows, wiki, false, 'Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。');
    missing(result, '具体箱子身份、地图坐标转换、数量与概率逐项对照');
  } else if (type === 'mob_drop') {
    const wiki = list(remote('掉落'));
    const localIds = unique(localRows.map(row => row.BNpcNameId));
    const wikiIds = wiki?.map(row => row.BASE_ID);
    const shared = wiki?.filter(row => localIds.includes(row.BASE_ID)) ?? [];
    const names = shared.map(row => ({ id: row.BASE_ID, local: normalizedName(rowFor(context, 'BNpcName', row.BASE_ID)?.fields?.Singular), wiki: normalizedName(row['中文名']) }));
    const namespaceConfirmed = names.length > 0 && names.every(row => row.local && row.local === row.wiki);
    identity(result, localIds.map(id => typed('BNpcName', id)), wikiIds?.map(id => typed('BNpcName', id)), Boolean(wiki && wiki.every(row => numberId(row.BASE_ID) > 0) && namespaceConfirmed),
      'Wiki 字段虽称 BASE_ID，需经 BNpcName.Singular 与中文名交叉确认命名空间；不按字段名连到 BNpcBase。');
    check(result, '共享怪物ID的名称校验', names.map(row => ({ id: row.id, name: row.local })), names.map(row => ({ id: row.id, name: row.wiki })), names.length > 0 && names.every(row => row.local), '作为 Wiki BASE_ID -> BNpcName 的本次样本证据。');
    check(result, '怪物分布', unique(relations.flatMap(entry => entry.joins.filter(join => join.dataset === 'MobSpawn').map(join => join.row))), wiki?.map(row => ({ bnpcNameId: row.BASE_ID, distributions: row['分布'] })), false, '本地 TerritoryType/坐标与 Wiki AreaID/等级分布不是同一维度；保留原值而不伪造位置等价。');
    missing(result, '分布区域命名空间与等级/坐标对齐', '数量、掉率、特殊出现条件');
  } else if (type === 'fate') {
    const wiki = list(remote('危命任务'));
    identity(result, localRows.map(row => typed('Fate', row.FateId)), wiki?.map(row => typed('Fate', row.ID)), Boolean(wiki && wiki.every(row => numberId(row.ID) > 0)), '仅比较危命任务，不将紧急遭遇战 ID 与 Fate ID 混用。');
    check(result, '贡献等级与奖励数量', localRows, wiki?.map(row => ({ fateId: row.ID, bronzeIds: row['铜牌ID'], bronzeQuantities: row['铜牌数量'], silverIds: row['银牌ID'], silverQuantities: row['银牌数量'], goldIds: row['金牌ID'], goldQuantities: row['金牌数量'], rareIds: row['稀有ID'], rareQuantities: row['稀有数量'] })), false, 'FateItem CSV 没有贡献档位或奖励数量；Wiki 该类含这些字段。');
    missing(result, 'FATE 贡献等级、数量、稀有奖励和触发条件');
  } else if (type === 'gardening_crossbreed') {
    const wiki = remote('种子');
    const pairs = localRows.map(row => [row.ItemRequirement1Id, row.ItemRequirement2Id].sort((a, b) => a - b));
    const remoteRows = Array.isArray(wiki?.['杂交数据']) ? wiki['杂交数据'].filter(row => Array.isArray(row['结果']) && row['结果'].includes(sample.itemId)) : null;
    const valid = remoteRows && remoteRows.every(row => Array.isArray(row['种子']) && row['种子'].length === 2 && row['种子'].every(id => numberId(id) > 0));
    identity(result, pairs.map(pair => ({ inputItems: pair.map(id => typed('Item', id)), outputItem: typed('Item', sample.itemId) })), remoteRows?.map(row => ({ inputItems: [...row['种子']].sort((a,b) => a-b).map(id => typed('Item', id)), outputItem: typed('Item', sample.itemId) })), Boolean(valid), '比较无序双种子组合；不把双向、方向性、土壤或效率当作已验证。');
    check(result, '杂交方向/效率与生长时间', localRows, wiki, false);
    missing(result, '杂交方向、效率、土壤、成长时间和作物/种子产量');
  } else if (type === 'gardening') {
    const wiki = list(remote('栽培'));
    identity(result, localRows.map(row => typed('Item', row.SourceItemId)), wiki?.map(row => typed('Item', row['种子物品']?.ID ?? row['物品ID'])), Boolean(wiki && wiki.every(row => numberId(row['种子物品']?.ID ?? row['物品ID']) > 0)), '比较种子物品 ID，不能将 Wiki 种子ID/GardenID 当 Item ID。');
    check(result, '本物品是否为栽培产物', unique(localRows.map(row => typed('Item', row.ItemId))), wiki ? unique(wiki.flatMap(row => row['作物ID列表'] ?? [row['作物ID']]).filter(id => id === sample.itemId).map(id => typed('Item', id))) : undefined, Boolean(wiki && wiki.every(row => Array.isArray(row['作物ID列表']) || numberId(row['作物ID']) > 0)), '花卉颜色分支使用作物ID列表，不把基础作物ID误当唯一输出。');
    check(result, '栽培产量/生长时间/颜色条件', localRows, wiki, false);
    missing(result, '土壤对应产量、成长时间及颜色培养条件');
  } else if (type === 'retainer_random') {
    const randomIds = new Set(localRows.map(row => row.RetainerTaskRandomId));
    const tasks = tableRows(context, 'RetainerTask').filter(row => row.fields.IsRandom === true && randomIds.has(row.fields.Task));
    const allWiki = list(remote('雇员探险'));
    const wiki = allWiki?.filter(row => row['随机任务'] === true);
    result.categoryPresent = Boolean(wiki?.length);
    identity(result, tasks.map(row => typed('RetainerTask', row.rowId)), wiki?.map(row => typed('RetainerTask', row.ID)), tasks.length > 0 && Boolean(allWiki && allWiki.every(row => typeof row['随机任务'] === 'boolean')),
      'RetainerTaskRandom ID 经 RetainerTask.IsRandom + Task 映射；Wiki 普通筹集任务不算随机探索来源。');
    check(result, '随机任务等级/职业/耗时/需求', tasks.map(row => ({ taskId: row.rowId, ...row.fields })), wiki, false);
    missing(result, '随机探索物品数量/概率及完整职业/装备条件逐项核验');
    if (allWiki?.length && !wiki.length) result.notes.push('Wiki 有雇员探险键，但本样本全部为普通筹集任务，没有列出 Supplemental 的随机探索任务。');
  } else if (type === 'submarine') {
    const wiki = list(remote('潜水艇'));
    identity(result, localRows.map(row => typed('SubmarineExploration', row.SubmarineExplorationId)), wiki?.map(row => typed('SubmarineExploration', row.id)), Boolean(wiki && wiki.every(row => numberId(row.id) > 0)), '比较航区实体，保留本地按战利品档位的多行记录。');
    check(result, '潜艇战利品档位/数量范围/解锁', localRows, wiki, false, 'Wiki Item Data 航区摘要没有 Supplemental 的 Normal/Poor/Optimal 数量范围；未读航区详情。');
    missing(result, '航区名称、解锁路线、能力门槛及按档位数量/概率');
  } else if (type === 'airship') {
    const wiki = list(remote('部队探索'));
    const local = localRows.map(row => { const name = rowFor(context, 'AirshipExplorationPoint', row.AirshipExplorationPointId)?.fields?.Name; const match = typeof name === 'string' ? /^(?:Sea of Clouds\s*-\s*Sector\s*|云海\s*)(\d+)\s*$/i.exec(name) : null; return { rowId: row.AirshipExplorationPointId, name, sector: match ? Number(match[1]) : null }; });
    const mappingValid = local.length > 0 && local.every(row => row.sector !== null);
    const wikiValid = Boolean(wiki && wiki.every(row => row['地图'] === '云海' && /^\d+$/.test(String(row['区域']))));
    identity(result, local.map(row => mappingValid ? typed('AirshipCloudSeaSector', row.sector) : typed('AirshipExplorationPoint', row.rowId)), wiki?.map(row => typed('AirshipCloudSeaSector', Number(row['区域']))), mappingValid && wikiValid,
      '通过 AirshipExplorationPoint.Name 的海域序号映射 Wiki 云海区域；禁止仅凭 RowId + 1 猜测。');
    check(result, '航区名称及奖励明细', local, wiki, false);
    missing(result, '飞空艇航区命名/解锁/等级与物品数量概率');
  } else if (type === 'store') {
    const wiki = list(remote('道具商城'));
    identity(result, localRows.map(row => ({ region: 'international', productId: String(row.StoreId), url: row.StoreUrl })), wiki?.map(row => ({ region: 'cn', productLinkId: String(row['链接ID']), productName: row['商品名称'] })), false, '国际商城与国服商城商品 ID、地区及币种不同，未建立跨区商品映射。Wiki 大整数商品 ID 不作数值等价比较。');
    check(result, '商城价格/套装物品/当前销售状态', localRows, wiki, false, 'PriceCentsUSD 不是国服价格；固定 CSV 不能证明当前上架状态。');
    missing(result, '跨区商品对应关系、国服价格、套装数量及有效期');
  } else if (type === 'fieldop_coffer') {
    const wiki = list(remote('特殊场景探索'));
    identity(result, localRows.map(row => ({ type: row.Type, chestType: row.ChestType })), wiki?.map(row => ({ area: row['中文名'], acquisitionMethods: row['获取途径'] })), false,
      '本地英文区域枚举/铜银金箱与 Wiki 中文场景及数值数组尚未有版本化字典，不能凭出现同类键判定实体匹配。');
    check(result, '特殊场景箱子与数量概率', localRows, wiki, false);
    missing(result, '特殊场景枚举和箱子等级映射', '数量/概率及开箱条件');
  } else if (own(ITEM_SUPPLEMENT_TYPES, String(group[0])) || keys.length) {
    const key = keys[0];
    const wiki = list(remote(key));
    const allRows = rowsOf(context, 'ItemSupplement').filter(row => row.ItemId === sample.itemId && group.includes(row.ItemSupplementSource));
    const sourceId = row => key === '精选' ? row.id : row.ID;
    const valid = Boolean(key && wiki && wiki.every(row => numberId(sourceId(row)) > 0));
    identity(result, allRows.map(row => typed('Item', row.SourceItemId)), wiki?.map(row => typed('Item', sourceId(row))), valid,
      group.length > 1 ? `Wiki ${key} 合并多个本地子类型，因此比较 ItemSupplementSource ${group.join(',')} 的全部本物品来源集合；不是只拿抽中子类型与整个 Wiki 类别比。` : '以来源 Item ID 比较有向转化边，数量与条件另外验证。');
    result.sampledSubtypeSourceItems = unique(localRows.map(row => typed('Item', row.SourceItemId)));
    check(result, '转化数量范围/概率/条件', allRows.map(row => ({ sourceItemId: row.SourceItemId, outputItemId: row.ItemId, min: row.Min, max: row.Max, probability: row.Probability })), wiki, false,
      '本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。');
    missing(result, '来源物品获取链、转化条件与数量/概率');
    if (type === 'skybuilder_handin') result.notes.push('这是检验前物品到检验后物品的转换；本轮 Wiki Item Data 未提供结构化同类来源，未强行归到鉴定。');
  } else {
    check(result, '未实现机制的原始关系', localRows, source, false);
    missing(result, '此来源机制的 Wiki 语义映射');
  }
  return result;
}
