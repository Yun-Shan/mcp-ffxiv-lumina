// A read-only diagnostic; external rows never enter chains/inputs or the graph.
import fs from 'node:fs';
const root=new URL('./chains/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const fields='Item@as(raw),RequiredQuest@as(raw),LevelMin,LevelMax,CollectablesShopRefine@as(raw),CollectablesShopRewardScrip@as(raw)';
const url=`https://v2.xivapi.com/api/sheet/CollectablesShopItem/1:0?fields=${encodeURIComponent(fields)}`;
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
const remote=await response.json();
if(!response.ok)throw new Error(`XIVAPI ${response.status}`);
const local=read('subrow-diagnostic-mcp.json').rows[0];
const normalized=Object.fromEntries(Object.entries(remote.fields).map(([k,v])=>[k.replace('@as(raw)',''),v]));
const output={capturedAt:new Date().toISOString(),purpose:'External diagnostic only, never evidence of local-version parity or an input to the graph',request:url,httpStatus:response.status,raw:remote,
 local,comparison:Object.keys(normalized).map(field=>({field,local:local.fields[field],external:normalized[field],equal:local.fields[field]===normalized[field]})),
 localReward:read('inputs/CollectablesShopRewardScrip-earning.json').rows.find(r=>r.rowId===normalized.CollectablesShopRewardScrip),
 localRefine:read('inputs/CollectablesShopRefine-earning.json').rows.find(r=>r.rowId===normalized.CollectablesShopRefine),
 conclusion:'The generic MCP has no subrow-id argument and returns invalid Item/quest values. External subrow identifies a candidate join but has a separate game version; do not repair local bytes by shifting fields or count the candidate as a closed chain.'};
fs.writeFileSync(new URL('subrow-diagnostic.json',root),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({file:'chains/subrow-diagnostic.json',externalVersion:remote.version,comparison:output.comparison},null,2));
