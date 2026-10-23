#!/usr/bin/env node
// Temporary read-only experiment. Never starts the MCP exe and never changes product data.
// Inputs are snapshots exported through the configured Lumina MCP plus pinned Supplemental CSVs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, data) => fs.writeFileSync(path.join(root, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
const inputTables = new Map(fs.readdirSync(path.join(root, 'inputs')).filter(n => n.endsWith('.json')).map(n => {
  const data = read('inputs/' + n);
  return [data.sheet, data];
}).filter(([sheet]) => sheet));
const rows = name => inputTables.get(name)?.rows ?? [];
const itemMap = new Map(rows('Item').filter(r => r.fields.Name?.trim()).map(r => [r.rowId, r.fields.Name]));
const seed = process.env.PROBE_SEED ?? '2026-10-24-lumina-wiki-01';
const perType = Number(process.env.PROBE_PER_TYPE ?? 3);
if (!Number.isInteger(perType) || perType < 1 || perType > 20) throw new Error('PROBE_PER_TYPE must be 1..20');
const pools = new Map();
function add(type, itemId, ref) {
  if (!itemMap.has(Number(itemId))) return;
  if (!pools.has(type)) pools.set(type, new Map());
  const pool = pools.get(type);
  if (!pool.has(Number(itemId))) pool.set(Number(itemId), []);
  pool.get(Number(itemId)).push(ref);
}
function basic(type, sheet, field) {
  for (const row of rows(sheet)) add(type, row.fields[field], { sheet, rowId: row.rowId });
}
function basePools() {
  basic('recipe', 'Recipe', 'ItemResult');
  basic('gathering', 'GatheringItem', 'Item');
  basic('fishing', 'FishParameter', 'Item');
  basic('spearfishing', 'SpearfishingItem', 'Item');
  basic('achievement', 'Achievement', 'Item');
  basic('retainer_normal', 'RetainerTaskNormal', 'Item');
  // Current generic MCP only exposes row identity, not an explicit subrow identity.
  basic('gil_vendor', 'GilShopItem', 'Item');
  for (const row of rows('Quest')) for (const [key, value] of Object.entries(row.fields)) {
    if (/^(Reward|OptionalItemReward)\[\d+\]$/.test(key)) add('quest', value, { sheet: 'Quest', rowId: row.rowId, field: key });
  }
  for (const row of rows('SpecialShop')) for (const [key, value] of Object.entries(row.fields)) {
    const match = /^Item\[(\d+)\]Item\[(\d+)\]$/.exec(key);
    if (match) add('special_vendor', value, { sheet: 'SpecialShop', rowId: row.rowId, offerIndex: +match[1], outputIndex: +match[2] });
  }
  const rewards = new Map(rows('LeveRewardItem').map(r => [r.rowId, r.fields]));
  const groups = new Map(rows('LeveRewardItemGroup').map(r => [r.rowId, r.fields]));
  for (const leve of rows('Leve')) {
    const reward = rewards.get(leve.fields.LeveRewardItem);
    if (!reward) continue;
    for (let i = 0; i < 8; i++) {
      const groupId = reward['LeveRewardItemGroup[' + i + ']'];
      const group = groups.get(groupId);
      if (!group) continue;
      for (let j = 0; j < 9; j++) add('leve', group['Item[' + j + ']'], {
        sheet: 'Leve', rowId: leve.rowId, rewardId: leve.fields.LeveRewardItem, groupId,
        groupIndex: i, itemIndex: j, groupProbabilityPercent: reward['ProbabilityPercent[' + i + ']']
      });
    }
  }
}
async function select() {
  basePools();
  if (!fs.existsSync(path.join(root, 'inputs/supplemental.json'))) throw new Error('Pinned supplemental inputs missing; selection must finish before Wiki lookup.');
  const { buildSupplementalPools } = await import('./supplemental-adapters.mjs');
  const extra = buildSupplementalPools(read('inputs/supplemental.json'), itemMap);
  for (const [type, data] of Object.entries(extra)) for (const entry of data.candidates) for (const ref of entry.localRefs) add(type, entry.itemId, ref);
  const samples = [], categories = [];
  for (const [type, pool] of [...pools].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...pool].map(([itemId, refs]) => ({
      itemId, refs, randomKey: crypto.createHash('sha256').update(seed + '|' + type + '|' + itemId).digest('hex')
    })).sort((a,b) => a.randomKey.localeCompare(b.randomKey) || a.itemId-b.itemId);
    categories.push({ type, eligibleUniqueItems: pool.size, sampleCount: Math.min(perType, pool.size) });
    for (const x of ordered.slice(0, perType)) samples.push({
      type, itemId: x.itemId, name: itemMap.get(x.itemId), randomKey: x.randomKey, localRefs: x.refs
    });
  }
  const manifest = {
    schemaVersion: 1, seed, perType,
    selection: 'Unique named local Item IDs, sorted by SHA-256(seed|type|itemId), first N per category; sampled BEFORE Wiki, no replacement on missing/mismatch.',
    createdAt: new Date().toISOString(), gameVersion: inputTables.get('Item')?.gameVersion,
    itemUniverse: itemMap.size, categories, samples,
    uniqueItems: [...new Set(samples.map(s => s.itemId))],
    unsampledTypes: [{type:'gil_vendor',reason:'GilShopItem generic MCP returned Item=0 in every row; subrow decoding unsupported/unreliable, no valid independent sampling pool.'},{type:'wiki_manual_only',reason:'No independent local source pool; not sampled from expected Wiki answers.'},...Object.entries(extra).filter(([,v])=>!v.candidates.length).map(([type,v])=>({type,reason:v.note}))],
    limitations: [
      'Candidate pools are known table/CSV references, not all obtainability mechanisms or current availability.',
      'GilShopItem generic MCP lacks subrow IDs; pool is not proven to enumerate all shop offers.',
      'No Wiki/manual-only category is invented from the local data.'
    ]
  };
  write('manifest.json', manifest);
  console.log(JSON.stringify({seed, categories, cases:samples.length, uniqueItems:manifest.uniqueItems.length, items:manifest.uniqueItems},null,2));
}
async function compare() {
  const manifest = read('manifest.json');
  const wikiFile = read('inputs/wiki-items.json');
  const { compareBase } = await import('./compare-base.mjs');
  const { compareSupplemental } = await import('./compare-supplemental.mjs');
  const details = new Map();
  const detailDir = path.join(root, 'details');
  if (fs.existsSync(detailDir)) for (const file of fs.readdirSync(detailDir).filter(n=>n.endsWith('.json'))) {
    const data = read('details/' + file); if (data.sheet) details.set(data.sheet, data);
  }
  // Wiki downloader stores keyed entries with status, revision and original Data JSON.
  const wikiEntries = wikiFile.items ?? wikiFile.results ?? [];
  const wikiMap = new Map((Array.isArray(wikiEntries)?wikiEntries:Object.values(wikiEntries)).map(e=>[Number(e.itemId ?? e.data?.ID),e]));
  const supplemental = read('inputs/supplemental.json');
  const wikiRecipes = fs.existsSync(path.join(root,'inputs/wiki-recipes-data.json')) ? read('inputs/wiki-recipes-data.json') : null;
  const results = manifest.samples.map(sample => {
    const wiki = wikiMap.get(sample.itemId);
    if (!wiki || wiki.status !== 'ok' || !wiki.data) return {...sample,verdict:'wiki_unavailable',wikiStatus:wiki?.status??'missing-response',checks:[],notes:[wiki?.error??'Wiki response not available; sample retained.']};
    const context = {tables:inputTables,detailTables:details,wiki:wiki.data,supplemental,wikiRecipes};
    const result = sample.localRefs.some(r=>r.dataset)
      ? compareSupplemental(sample,context) : compareBase(sample,context);
    const failed = result.checks?.some(c=>c.status==='mismatch') || result.identity?.status==='mismatch';
    const verified = result.checks?.some(c=>c.status==='match') || result.identity?.status==='match';
    const uncertain = result.checks?.some(c=>c.status==='unverified') || (result.missingDetails?.length??0)>0 || result.identity?.status==='unverified';
    const verdict = result.categoryPresent === null ? 'unverified'
      : result.categoryPresent === false ? 'wiki_category_absent'
      : failed ? 'difference'
      : verified ? (uncertain ? 'partial_match' : 'compared_fields_match')
      : 'unverified';
    return {...sample,...result,verdict,wikiRevision:wiki.revisionId??wiki.revision?.revid,wikiUrl:'https://ff14.huijiwiki.com/wiki/Data:Item/'+sample.itemId+'.json',wikiSourceTypes:Object.keys(wiki.data['来源']??{})};
  });
  const summary = {};
  for(const r of results){summary[r.type]??={total:0};summary[r.type].total++;summary[r.type][r.verdict]=(summary[r.type][r.verdict]??0)+1;}
  const totals = results.reduce((counts,r)=>{counts[r.verdict]=(counts[r.verdict]??0)+1;return counts;},{});
  const out={seed:manifest.seed,generatedAt:new Date().toISOString(),gameVersion:manifest.gameVersion,supplementalVersion:supplemental.packageVersion,supplementalCommit:supplemental.commit,manifestSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'manifest.json'))).digest('hex'),scope:'Per-category random proof of concept; compared_fields_match means only declared fields, never full Wiki equivalence.',totals,summary,results};
  write('results.json',out);
  const label={wiki_unavailable:'Wiki不可读',wiki_category_absent:'Wiki Data 未列该机制',difference:'存在差异',partial_match:'部分对齐',compared_fields_match:'已比字段一致',unverified:'无法比较'};
  let md='# 随机抽样来源对照结果\n\n';
  md+='固定 seed：`'+manifest.seed+'`；每类 '+manifest.perType+' 个有名物品；'+results.length+' 个类别样本，'+manifest.uniqueItems.length+' 个去重物品。先抽样后查 Wiki，失败不换样。\n\n';
  md+='这是临时 JS 原型基于本地表与固定补充数据拼接的结果，不代表现有 get_item_sources 的行为。已比字段一致也不等于完整复刻 Wiki。\n\n';
  md+='判定总计：'+Object.entries(totals).map(([key,count])=>label[key]+' '+count+' 例').join('；')+'。没有给任何样本做完整页面等价验收，也没有把抽样比例当成全量准确率。\n\n';
  md+='“Wiki Data 未列该机制”仅描述已读取的 Item Data 页；不等于 Wiki 展开页面一定没有、游戏中不能获取，或本地关系一定正确。尚无映射的类型单列“无法比较”。\n\n';
  md+='本轮未抽样：'+manifest.unsampledTypes.map(x=>'`'+x.type+'`（'+x.reason+'）').join('；')+'。军票/其他专用交易表及手工活动、寻宝等也未建立独立候选池，因此 40 个子类型不代表全部来源机制。\n\n';
  md+='| 类型 | 样本数 | 已比字段一致 | 部分对齐 | 差异 | 类别缺失 | 无法比较/读取 |\n|---|---:|---:|---:|---:|---:|---:|\n';
  for(const [t,s] of Object.entries(summary))md+='| '+t+' | '+s.total+' | '+(s.compared_fields_match??0)+' | '+(s.partial_match??0)+' | '+(s.difference??0)+' | '+(s.wiki_category_absent??0)+' | '+((s.unverified??0)+(s.wiki_unavailable??0))+' |\n';
  for(const r of results){
    md+='\n## '+r.type+' — '+r.name+' ('+r.itemId+')\n\n';
    md+='判定：**'+label[r.verdict]+'**。 [Wiki Data]('+r.wikiUrl+')，revision '+(r.wikiRevision??'未知')+'。\n\n';
    if(r.identity)md+='实体集合：'+r.identity.status+'；本地独有 '+JSON.stringify(r.identity.localOnly??[])+'；Wiki独有 '+JSON.stringify(r.identity.wikiOnly??[])+'。\n\n';
    for(const c of r.checks??[])md+='- '+c.field+'：'+c.status+(c.note?'；'+c.note:'')+'\n';
    if(r.missingDetails?.length)md+='\n尚缺/未核验：'+r.missingDetails.join('；')+'。\n';
    for(const note of r.notes??[])md+='\n'+note+'\n';
  }
  md+='\n## 证据与重跑\n\n- manifest.json：固定抽样和全部本地引用。\n- inputs/：MCP 表快照、固定依赖 CSV 数据、Wiki 原始 Data 页与修订。\n- details/：样本所需完整行/关联实体。\n- results.json：字段级本地/Wiki值、差集和判定。\n\n`node tmp/item-source-probe/probe.mjs compare` 可离线重跑。选择新样本运行 `select`，然后必须重新抓取 Wiki 和导出所需 MCP 明细。\n';
  write('results.md',md);
  console.log(JSON.stringify({cases:results.length,totals,summary},null,2));
}
const cmd=process.argv[2]??'compare';
if(cmd==='select')await select();else if(cmd==='compare')await compare();else throw new Error('Use select or compare');
