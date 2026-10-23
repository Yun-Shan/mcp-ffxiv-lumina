import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveShopCost} from './chain-currency.mjs';
const read = async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const tomes=await read('./chains/inputs/TomestonesItem-currency.json');
const items=await read('./chains/inputs/Item-currency-examples.json');
const shops=await read('./chains/inputs/SpecialShop-currency-examples.json');
const tables=new Map([['TomestonesItem',tomes],['Item',items]]);
const cost=(shopId,offer,slot=0)=>{const f=shops.rows.find(r=>r.rowId===shopId).fields,p=`Item[${offer}]`;return {useCurrencyType:f.UseCurrencyType,rawItemId:f[`${p}ItemCost[${slot}]`],costType:f[`${p}CostType[${slot}]`],quantity:f[`${p}CurrencyCost[${slot}]`],collectability:f[`${p}CollectabilityCost[${slot}]`],outputItemId:f[`${p}Item[0]`]};};
test('real mode16 raid book cost stays a literal Item',()=>{
  const r=resolveShopCost(cost(1770797,1),{tables});
  assert.equal(r.status,'resolved');assert.equal(r.itemId,35826);assert.equal(r.quantity,8);assert.equal(r.hq,false);
});
test('real CostType1 requires HQ, not a different base item ID',()=>{
  const r=resolveShopCost(cost(1769503,7),{tables});
  assert.equal(r.itemId,5379);assert.equal(r.hq,true);assert.equal(r.quantity,1);
});
test('mixed repair offer separates literal weapon from tomestone slot1',()=>{
  const a=resolveShopCost(cost(1769500,0,0),{tables}),b=resolveShopCost(cost(1769500,0,1),{tables});
  assert.equal(a.itemId,7228);assert.equal(a.quantity,1);assert.equal(b.itemId,28);assert.equal(b.quantity,100);
});
test('four observed special buckets resolve without using shop names',()=>{
  for(const [shop,id,q]of[[1770310,33913,999],[1770114,33914,50],[1770507,41784,500],[1770510,41785,500]]){
    const r=resolveShopCost(cost(shop,0),{tables});assert.equal(r.status,'resolved');assert.equal(r.itemId,id);assert.equal(r.quantity,q);assert.equal(r.hq,false);
  }
});
test('Tomestones is a field join: raw2 is Item48, not TomestonesItem row2 Item26',()=>{
  const r=resolveShopCost(cost(1770446,0),{tables});assert.equal(r.status,'resolved');assert.equal(r.itemId,48);assert.equal(r.quantity,350);
});
test('missing and ambiguous tomestone mapping never falls back to crystal item',()=>{
  const c=cost(1770446,0);assert.equal(resolveShopCost(c,{tables:new Map()}).status,'unverified');
  const bad=new Map([['TomestonesItem',{rows:[{rowId:1,fields:{Tomestones:2,Item:48}},{rowId:2,fields:{Tomestones:2,Item:2}}]}]]);
  assert.equal(resolveShopCost(c,{tables:bad}).rule,'ambiguous_tomestone_mapping');
});
test('obsolete bucket and unknown cost type remain unresolved',()=>{
  const c={...cost(1770310,0),rawItemId:1};assert.equal(resolveShopCost(c,{tables}).status,'unverified');
  assert.equal(resolveShopCost({...c,costType:7},{tables}).status,'unverified');
});
test('implicit gil pricing never treats CurrencyCost0 as free',()=>{
  const c=cost(1769933,0),r=resolveShopCost(c,{tables});assert.equal(r.itemId,1);assert.equal(r.status,'unverified');assert.equal(r.quantity,null);assert.equal(r.candidateQuantity,2);assert.equal(r.rule,'mode_8_price_mid_candidate');
  assert.equal(resolveShopCost({...c,outputItemId:undefined},{tables}).status,'unverified');
  assert.equal(resolveShopCost({...c,useCurrencyType:2},{tables}).status,'unverified');
});
test('nonzero collectability qualifier is retained without claiming quality is met',()=>{
  const r=resolveShopCost({...cost(1769503,7),collectability:450},{tables});assert.equal(r.collectability,450);assert.equal(r.hq,true);
});
test('captured all-shop cost audit resolves identities without raw-index leakage',async()=>{
  const audit=await read('./chains/currency-evidence/special-shop-cost-audit.json');
  assert.equal(audit.shopRows,1489);assert.equal(audit.slots.length,26025);
  const result=audit.slots.map(c=>({c,r:resolveShopCost(c,{tables})}));
  assert.equal(result.filter(x=>x.r.status==='resolved').length,25459);
  const unresolved=result.filter(x=>x.r.status!=='resolved');assert.equal(unresolved.length,566);
  assert.ok(unresolved.every(x=>x.c.useCurrencyType===8&&x.c.quantity===0&&x.r.itemId===1));
  assert.ok(result.filter(x=>[2,3].includes(x.c.costType)).every(x=>x.r.status==='resolved'&&x.r.itemId!==x.c.rawItemId));
});
