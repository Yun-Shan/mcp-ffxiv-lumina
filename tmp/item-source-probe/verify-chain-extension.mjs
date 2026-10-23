// Independent comparisons against saved Wiki responses; never edits graph inputs.
import fs from 'node:fs';
import {resolveShopCost} from './chain-currency.mjs';
const root=new URL('./',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
const result=read('chains/results.json');
const wiki=new Map(['extension-wiki-items.json','extension-wiki-upstream.json','extension-wiki-currency-cases.json'].flatMap(f=>read('chains/'+f).items).map(x=>[x.itemId,x]));
const nodes=new Map(),open=new Map(),edgeStates={};
function walk(n,target){
  if(!nodes.has(n.itemId))nodes.set(n.itemId,n);
  if(n.status==='no_supported_source'){
    if(!open.has(n.itemId))open.set(n.itemId,{itemId:n.itemId,name:n.name,targets:[]});
    const entry=open.get(n.itemId);if(!entry.targets.includes(target))entry.targets.push(target);
  }
  for(const e of n.alternatives){edgeStates[e.expansionStatus]=(edgeStates[e.expansionStatus]??0)+1;for(const input of e.inputs??[])walk(input,target);}
}
for(const r of result.results)walk(r.tree,r.tree.itemId);
const source=id=>wiki.get(id)?.data?.['来源']??{};
const list=x=>Array.isArray(x)?x:x?[x]:[];
const set=x=>[...new Set(x)].sort((a,b)=>a-b);
const checks=[];
function check(label,local,remote,itemId,note=''){
  checks.push({label,status:remote===undefined?'unverified':JSON.stringify(local)===JSON.stringify(remote)?'match':'difference',local,wiki:remote??null,itemId,revision:wiki.get(itemId)?.revisionId,note});
}
for(const id of [46314,41680,40091,41699]){
  const offers=new Map(list(source(id)['特殊商店']).map(x=>[`${x['商店ID']}:${x['兑换信息']?.index}`,x]));
  for(const r of offers.values()){
    const e=nodes.get(id)?.alternatives.find(e=>e.shop?.shopId===r['商店ID']&&e.shop.offerIndex===r['兑换信息'].index-1);
    const normalize=xs=>xs.sort((a,b)=>a.itemId-b.itemId||a.quantity-b.quantity);
    check(`报价 ${id} / ${r['商店ID']}:${r['兑换信息'].index-1}`,e?.requirements?normalize(e.requirements.map(c=>({itemId:c.itemId,quantity:c.quantity,hq:c.hq,collectability:c.collectability}))):null,
      normalize(r['兑换信息']['材料'].map(c=>({itemId:c.ID,quantity:c['数量'],hq:c.HQ,collectability:c['收藏值']}))),id,'材料为 AND；比较一次报价，不比较 NPC/解锁/可达性。');
  }
}
for(const id of [13722,34391])check(`来源箱集合 ${id}`,set(nodes.get(id).alternatives.filter(e=>e.kind==='container').map(e=>e.source.itemId)),set(list(source(id)['物品箱']).map(x=>x.ID)),id,'完整集合比较；找出一条路径不消除其他来源箱缺失。');
const task=nodes.get(32161)?.alternatives.find(e=>e.task?.taskId===395);
const remoteTask=list(source(32161)['雇员探险']).find(x=>x.ID===395);
check('雇员宝箱任务 ID / 探险币 / 分钟',task?{id:task.task.taskId,cost:task.task.VentureCost,minutes:task.task.MaxTimemin}:null,
 remoteTask?{id:remoteTask.ID,cost:remoteTask['探险币'],minutes:remoteTask['时间']}:undefined,32161);
check('弗里金武器箱任务集合',set(nodes.get(35686).alternatives.filter(e=>e.quest).map(e=>e.quest.questId)),set(list(source(35686)['任务']).map(x=>x.ID)),35686);
for(const id of [41080,49125])check(`书籍副本集合 ${id}`,set(nodes.get(id)?.alternatives.filter(e=>e.duty?.contentId).map(e=>e.duty.contentId)??[]),set(list(source(id)['副本']).map(x=>x.ID)),id,'Wiki 外部线索不注入本地图，保留缺失。');
for(const page of read('chains/extension-wiki-instances.json').payload.query.pages){
  const rev=page.revisions[0], d=JSON.parse(rev.slots.main.content);
  const e=nodes.get(28)?.alternatives.find(e=>e.kind==='duty_currency'&&e.duty.instanceId===d.ID);
  const others=d['道中BOSS'].map(x=>x['货币A']).filter(x=>x>0);
  for(const [label,local,remote] of [
    ['最终 Boss',e?.rewards.finalBoss,d.BOSS['货币A']],
    ['道中 Boss',e?.rewards.otherBosses.map(x=>x.quantity),others],
    ['基础合计',e?.rewards.baseTotal,d.BOSS['货币A']+others.reduce((s,n)=>s+n,0)],
    ['新手额外',e?.rewards.newPlayerBonus,d['新手奖励货币A']]]){
      check(`Instance ${d.ID} / ${label}`,local??null,remote,28,'只验证三个已选副本的 CurrencyA；不推广 B/C 或所需刷本次数。');
      checks.at(-1).revision=rev.revid;checks.at(-1).wikiTitle=page.title;
  }
}
const audit=read('chains/currency-evidence/special-shop-cost-audit.json');
const tables=new Map([['TomestonesItem',read('chains/inputs/TomestonesItem-currency.json')]]);
const currencySummary={slots:audit.slots.length,resolved:0,unverified:0,rules:{}};
for(const slot of audit.slots){const r=resolveShopCost(slot,{tables});currencySummary[r.status==='resolved'?'resolved':'unverified']++;currencySummary.rules[r.rule]=(currencySummary.rules[r.rule]??0)+1;}
const summary=checks.reduce((s,c)=>(s[c.status]=(s[c.status]??0)+1,s),{});
const out={generatedAt:new Date().toISOString(),scope:'Targeted integration checks, separate from random sample and from complete obtainability validation',summary,currencySummary,edgeStates,
  targetsWithSupportedPath:result.results.filter(r=>r.tree.hasSupportedTerminalPath).length,targets:result.results.length,
  openItems:[...open.values()].map(x=>({...x,wikiSourceKeys:Object.keys(source(x.itemId)),wikiUnobtainable:source(x.itemId).Unobtainable??null})),checks};
fs.writeFileSync(new URL('chains/extension-verification.json',root),JSON.stringify(out,null,2)+'\n');
let md=`# 货币与获取链增量核验\n\n${checks.length} 个定向集成字段/集合检查：${JSON.stringify(summary)}。22 个目标中 ${out.targetsWithSupportedPath} 个存在一条结构路径；不等于全部路线、品质或资格验证。\n\n`;
md+='| 检查 | 结果 | Wiki revision |\n|---|---|---|\n';
for(const c of checks)md+=`| ${c.label} | ${c.status} | ${c.revision??'未知'} |\n`;
md+='\n## 保留的差异\n';
for(const c of checks.filter(c=>c.status!=='match'))md+=`\n- ${c.label}：本地 ${JSON.stringify(c.local)}；Wiki ${JSON.stringify(c.wiki)}。${c.note}\n`;
md+=`\n## 全表成本槽解码\n\n${currencySummary.slots} 个非空成本槽：${currencySummary.resolved} 个身份及显式正数成本已解析；${currencySummary.unverified} 个为 mode8 隐式金币价格，保留未验证。不是全量报价有效性/NPC 可达性验收。\n\n## 仍无提供者的上游物品\n\n`;
md+='| Item | 名称 | 涉及目标 |\n|---|---|---|\n';
for(const x of out.openItems)md+=`| ${x.itemId} | ${x.name??'未命名'} | ${x.targets.join(', ')} |\n`;
md+='\n大部分出现在已有其他支持路径的 OR 分支中；不能把这些分支算已补齐。33913 是唯一仍阻断整个目标的上游。详见 [分析文档](../../../docs/research/currency-chain-extension.md)。\n';
fs.writeFileSync(new URL('chains/extension-verification.md',root),md);
console.log(JSON.stringify({summary,currencySummary,edgeStates,openItems:out.openItems,targetsWithSupportedPath:out.targetsWithSupportedPath},null,2));
