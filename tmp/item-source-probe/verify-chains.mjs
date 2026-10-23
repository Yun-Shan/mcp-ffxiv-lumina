// Compare concrete path segments with independently fetched Wiki Data; no graph edits.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const chains=read('chains/results.json');
const wiki=new Map([...read('inputs/wiki-items.json').items,...read('chains/wiki-items.json').items].filter(x=>x.status==='ok').map(x=>[x.itemId,x]));
const source=id=>wiki.get(id)?.data?.['来源']??{};
const tree=id=>chains.results.find(x=>x.tree.itemId===id)?.tree;
const set=x=>[...new Set(x)].sort();
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const checks=[];
function check(label,local,remote,itemId,note=''){
  checks.push({label,status:remote===undefined?'unverified':equal(local,remote)?'match':'difference',local,wiki:remote??null,wikiItemId:itemId,wikiRevision:wiki.get(itemId)?.revisionId??wiki.get(itemId)?.revision?.revid,note});
}
const list=x=>Array.isArray(x)?x:x&&typeof x==='object'?[x]:null;
function dutyCheck(label,node,id){const actual=set(node.alternatives.filter(e=>e.duty?.instanceId).map(e=>e.duty.instanceId));const remote=list(source(id)['副本']);check(label,actual,remote?set(remote.map(x=>x.ID)):undefined,id,'只比较直接副本实体集合，未验证宝箱身份/坐标/概率。');}
function bosses(label,node,id){const remote=list(source(id)['副本']);const local=set(node.alternatives.filter(e=>e.duty?.instanceId).flatMap(e=>(e.bosses??[]).map(b=>`${e.duty.instanceId}:${b.bnpcNameId}`)));check(label,local,remote?set(remote.flatMap(r=>(r.BNpcNames_ID??[]).map(b=>`${r.ID}:${b}`))):undefined,id,'本地缺 Boss 关联时保留差集，不借用 Wiki 反填成已恢复。');}
function quote(label,node,id,shopId,index){const local=node.alternatives.find(e=>e.kind==='exchange'&&e.shop.shopId===shopId&&e.shop.offerIndex===index);const candidates=list(source(id)['特殊商店'])?.filter(r=>r['商店ID']===shopId&&r['兑换信息']?.index===index+1);
  const normalized=(values)=>values.map(x=>({itemId:x.itemId,quantity:x.quantity})).sort((a,b)=>a.itemId-b.itemId||a.quantity-b.quantity);
  check(label,local?.requirements?normalized(local.requirements):null,candidates?.length?normalized(candidates[0]['兑换信息']['材料'].map(x=>({itemId:x.ID,quantity:x['数量']}))):undefined,id,'同一报价的材料是 AND；这里比较目标一件时的数量。NPC/条件另未验证。');
}
const hammer=tree(35247),helm=tree(11450);
dutyCheck('日影兰战锤直接副本',hammer,35247);bosses('日影兰战锤直接Boss',hammer,35247);
check('日影兰战锤来源容器',set(hammer.alternatives.filter(e=>e.kind==='container').map(e=>e.source.itemId)),set((source(35247)['物品箱']??[]).map(x=>x.ID)),35247);
quote('日影兰战锤：8断章兑换1件',hammer,35247,1770443,2);
const box=hammer.alternatives.find(e=>e.kind==='container'&&e.source.itemId===35734)?.inputs[0];
dutyCheck('武器箱上游副本',box,35734);bosses('武器箱上游Boss',box,35734);
const book=hammer.alternatives.find(e=>e.id==='SpecialShop:1770443:2:0')?.inputs.find(n=>n.itemId===35826);
dutyCheck('断章上游副本',book,35826);bosses('断章上游Boss',book,35826);
quote('戈耳狄原型头盔：2透镜兑换1件',helm,11450,1769579,2);
const lens=helm.alternatives.find(e=>e.id==='SpecialShop:1769579:2:0')?.inputs.find(n=>n.itemId===12674);
dutyCheck('透镜上游副本',lens,12674);bosses('透镜上游Boss',lens,12674);
quote('龙须拳·优雅：两种材料同时需要',tree(41680),41680,1770733,1);
const summary=checks.reduce((s,c)=>(s[c.status]=(s[c.status]??0)+1,s),{});
const out={generatedAt:new Date().toISOString(),scope:'Targeted path-segment verification, not independent random coverage or full route equality.',summary,checks};
fs.writeFileSync(path.join(root,'chains/verification.json'),JSON.stringify(out,null,2)+'\n');
let md='# 获取链分段 Wiki 核验\n\n';
md+=`共 ${checks.length} 个定向核验项：${JSON.stringify(summary)}。不计入原 120 例随机统计。\n\n`;
md+='| 核验项 | 结果 | Wiki Item / revision |\n|---|---|---|\n';
for(const c of checks)md+=`| ${c.label} | ${c.status} | ${c.wikiItemId} / ${c.wikiRevision} |\n`;
for(const c of checks.filter(c=>c.status!=='match'))md+=`\n## ${c.label}\n\n本地：\`${JSON.stringify(c.local)}\`\n\nWiki：\`${JSON.stringify(c.wiki)}\`\n\n${c.note}\n`;
md+='\n核验的是实体和成本分段，不代表完整可执行路线。开箱条件只取得物品说明；NPC、周限、个人分配规则、箱子坐标/编号等未完成对照。\n';
fs.writeFileSync(path.join(root,'chains/verification.md'),md);
console.log(JSON.stringify({summary,checks:checks.map(c=>({label:c.label,status:c.status}))},null,2));
