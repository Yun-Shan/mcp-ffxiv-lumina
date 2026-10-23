#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAcquisitionGraph} from './chain-graph.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const folder=path.join(root,'chains');fs.mkdirSync(folder,{recursive:true});
const merged=new Map();
function merge(data,file){if(!data.sheet||!Array.isArray(data.rows))return;if(!merged.has(data.sheet))merged.set(data.sheet,new Map());for(const row of data.rows){const prev=merged.get(data.sheet).get(row.rowId);merged.get(data.sheet).set(row.rowId,{...prev,...row,fields:{...prev?.fields,...row.fields},evidenceFiles:[...new Set([...(prev?.evidenceFiles??[]),file])]});}}
for(const dir of ['inputs','details','chains/inputs'])if(fs.existsSync(path.join(root,dir)))for(const f of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.json')).sort())merge(read(dir+'/'+f),dir+'/'+f);
for(const f of ['dungeon-followup-Item.json','dungeon-followup-SpecialShop.json'])if(fs.existsSync(path.join(root,f)))merge(read(f),f);
const tables=new Map([...merged].map(([sheet,map])=>[sheet,{sheet,rows:[...map.values()]}]));
const supplemental=read('inputs/supplemental.json');
const graph=buildAcquisitionGraph({tables,supplemental});
const args=process.argv.slice(2),option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const manifest=read('manifest.json');
const types=['dungeon_boss','dungeon_boss_chest','dungeon_chest','dungeon_drop','special_vendor','loot','coffer'];
const defaults=[...new Set([35247,11450,35734,...manifest.samples.filter(s=>types.includes(s.type)).map(s=>s.itemId)])];
const targetIds=option('--items')?option('--items').split(',').map(Number):defaults;
const quantity=Number(option('--quantity','1'));
const results=targetIds.map(id=>graph.expand(id,quantity,{maxDepth:Number(option('--depth','4')),maxNodes:Number(option('--nodes','1200')),maxAlternatives:Number(option('--alternatives','40'))}));
const shops=new Map(),items=new Set(),recipes=new Set();
for(const r of results){for(const s of r.pending.shops){if(!shops.has(s.shopId))shops.set(s.shopId,new Set());for(const i of s.indices)shops.get(s.shopId).add(i);}for(const id of r.pending.items)items.add(id);for(const id of r.pending.recipes)recipes.add(id);}
const plan={targets:targetIds,shops:[...shops].map(([shopId,indices])=>({shopId,indices:[...indices].sort((a,b)=>a-b)})),items:[...items].sort((a,b)=>a-b),recipes:[...recipes].sort((a,b)=>a-b)};
if(args[0]==='plan'){fs.writeFileSync(path.join(folder,'fetch-plan.json'),JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify(plan,null,2));}
else {
  const counts={};
  function count(node){for(const edge of node.alternatives){counts[edge.kind]=(counts[edge.kind]??0)+1;for(const n of edge.inputs??[])count(n);}}
  for(const r of results)count(r.tree);
  const out={generatedAt:new Date().toISOString(),gameVersion:read('inputs/Item.json').gameVersion,supplementalVersion:supplemental.packageVersion,supplementalCommit:supplemental.commit,scope:'Dungeon acquisition graph proof of concept; targeted extension, not a new random sample and not complete Wiki parity.',targets:targetIds,edgeOccurrences:counts,pending:plan,results};
  fs.writeFileSync(path.join(folder,'results.json'),JSON.stringify(out,null,2)+'\n');
  const kind={exchange:'兑换',container:'开箱',boss_chest:'首领箱',boss_drop:'首领掉落/奖励',scene_chest:'场景箱（道中/首领未定）',duty_unspecified:'副本来源（环节未定）',recipe:'制作',gathering:'采集',retainer_normal:'指定雇员任务',retainer_random:'随机雇员任务',quest_reward:'任务奖励',mob_drop:'怪物掉落',duty_currency:'副本货币奖励'};
  let md='# 副本获取链展开结果\n\n';
  md+=`本轮 ${results.length} 个目标，固定沿用原随机样本中的副本/兑换/开箱样本，并补日影兰武器箱。不是重新随机抽样。完整结构和原值在 results.json。\n\n`;
  md+='每个物品的路线是“任选其一”；一条兑换报价的材料是“同时满足”。开箱仅展开一次尝试的来源，不反推保证开箱数；副本叶不计算刷本次数。场景箱与首领箱的潜在重叠不会当成独立概率累加。\n\n';
  md+=`尚需 MCP 数据：${plan.shops.length} 个商店行、${plan.items.length} 个物品明细、${plan.recipes.length} 个配方明细。待办为零也不表示来源全集齐备；收藏品子行问题另见分析文档。\n\n`;
  for(const r of results){
    md+=`## ${r.tree.name??'未命名'}（${r.tree.itemId}）×${r.tree.requestedQuantity}\n\n至少一条路线的全部材料追到已支持来源：${r.tree.hasSupportedTerminalPath?'是':'否'}（仅关系结构，不代表条件、产量或可获取性通过）。节点 ${r.visitedNodes}；停止原因 ${JSON.stringify(r.stops)}；边展开状态 ${JSON.stringify(r.edgeStatuses)}。expanded 只表示遍历完成，不表示路线条件完整。\n\n`;
    let lines=0;const maxLines=220;
    function show(node,depth=0){if(lines>=maxLines)return;const pad='  '.repeat(depth);md+=`${pad}- **${node.name??'未命名'} [${node.itemId}] ×${node.requestedQuantity}**：${node.status}${node.quantityBasis==='one_opening_attempt'?'（一次开箱尝试的上游需求）':''}\n`;lines++;
      for(const e of node.alternatives){if(lines>=maxLines)break;let info='';
        if(e.kind==='exchange')info=`${e.shop.name??''} [${e.shop.shopId}:${e.shop.offerIndex}]；${e.expansionStatus}`+(e.requirements?`；同时需要 ${e.requirements.map(c=>`${c.name??c.itemId}×${c.quantity}`).join(' + ')}`:`；货币模式 ${e.shop.useCurrencyType}`);
        else if(e.kind==='container')info=`${e.source.name??e.source.itemId}；一次尝试，保证开箱数未知；${e.outcomeMode}`;
        else if(e.kind==='recipe')info=`Recipe:${e.sourceRef.rowId}；${e.expansionStatus}；每次产出 ${e.output.quantity}；${e.requirements.map(c=>`${c.name??c.itemId}×${c.quantity??c.quantityPerBatch}`).join(' + ')}；品质未证明`;
        else if(e.kind==='gathering')info=`GatheringItem:${e.sourceRef.rowId}；采集点 ${e.locations.map(p=>p.gatheringPointId).join(', ')}；产量、品质、开放条件未验证`;
        else if(e.kind.startsWith('retainer_'))info=`RetainerTask:${e.task.taskId} ${e.task.name??''}；产物${e.kind==='retainer_random'?'随机池成员':'按能力分档'}；消耗/时长见 JSON，不计算必得次数`;
        else if(e.kind==='quest_reward')info=`Quest:${e.quest.questId} ${e.quest.name??''}；${e.quest.optional?'可选':'固定'}奖励 ×${e.output.quantity}；可重复=${e.quest.repeatable}`;
        else if(e.kind==='mob_drop')info=`${e.enemy.name??'敌人未命名'} [BNpcName:${e.enemy.bnpcNameId}]；掉率未知`;
        else if(e.kind==='duty_currency')info=`${e.duty.name}；Boss 基础合计 ${e.rewards.baseTotal}（最终 Boss ${e.rewards.finalBoss}）；另有新手奖励 ${e.rewards.newPlayerBonus}，不并入重复奖励`;
        else info=`${e.duty?.name??'副本映射缺失'}；${e.bosses?.map(b=>b.name??b.bnpcNameId).join('、')||'Boss 未定位'}${e.fightNo!==undefined?`；原始 FightNo=${e.fightNo}`:''}${e.cofferNo!==undefined?` / CofferNo=${e.cofferNo}`:''}${e.chest?`；Chest=${e.chest.id} / ChestNo=${e.chest.chestNo}`:''}${e.potentialOverlapGroup?'；跨表可能重叠，未合并':''}`;
        md+=`${pad}  - ${kind[e.kind]??e.kind}：${info}\n`;lines++;
        for(const input of e.inputs??[])show(input,depth+2);
      }if(node.omittedAlternatives)md+=`${pad}  - 另有 ${node.omittedAlternatives} 条已知候选因分支上限未展开。\n`;
    }show(r.tree);if(lines>=maxLines)md+='\n此节展示达到 220 行限制；完整已生成结构见 JSON，并保留算法本身的截断状态。\n';md+='\n';
  }
  md+='## 范围与限制\n\n本轮覆盖副本数据、SpecialShop、ItemSupplement 3/6/7、制作、采集、雇员、任务、怪物掉落以及三个已核验副本的诗学奖励。无支持来源不等于游戏中不可获取；未知货币、循环、深度/节点/分支截断均显式保留。NPC、每周限制、全部开箱和品质条件未完成验收。任务/雇员/采集作为来源行动叶，前置任务和行动成本没有全部递归展开。原始箱号不转换为玩家“第几箱”。\n\n重跑：`node tmp/item-source-probe/acquisition-chains.mjs run`；单物品：`node tmp/item-source-probe/acquisition-chains.mjs run --items 35247 --quantity 1`。后者会覆盖本结果文件；默认目标集合可再次运行默认命令恢复。\n';
  fs.writeFileSync(path.join(folder,'results.md'),md);
  console.log(JSON.stringify({targets:results.length,targetsWithSupportedTerminalPath:results.filter(r=>r.tree.hasSupportedTerminalPath).length,edgeOccurrences:counts,pendingShopRows:plan.shops.length,pendingItems:plan.items.length,stops:results.map(r=>({itemId:r.tree.itemId,stops:r.stops}))},null,2));
}
