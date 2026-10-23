// Temporary acquisition graph: item alternatives are OR; one exchange's costs are AND.
// All inputs are captured data. No executable launch, network, or product API calls.
import { buildDungeonIndex } from './chain-dungeon.mjs';
import { buildAdditionalIndex } from './chain-additional.mjs';
import { resolveShopCost } from './chain-currency.mjs';
import { buildCurrencyEarningIndex } from './chain-currency-earning.mjs';

const has = (o,k) => Object.hasOwn(o ?? {},k);
const validId = x => Number.isSafeInteger(x) && x > 0;
const positive = x => Number.isFinite(x) && x > 0;
const add = (map,key,value) => { if (!map.has(key)) map.set(key,[]); map.get(key).push(value); };
const rows = (tables,sheet) => tables.get(sheet)?.rows ?? [];
const fieldIndex = (s,re) => { const m=re.exec(s); return m ? m.slice(1).map(Number) : null; };

export function buildAcquisitionGraph({tables,supplemental,dungeonIndex}) {
  const itemMap = new Map(rows(tables,'Item').map(r=>[r.rowId,r.fields]));
  const leaves = dungeonIndex ?? buildDungeonIndex({tables,supplemental});
  const additional = buildAdditionalIndex({tables,supplemental});
  const earning = buildCurrencyEarningIndex({tables});
  const shops = new Map(), containers = new Map();
  for (const shop of rows(tables,'SpecialShop')) {
    for (const [key,itemId] of Object.entries(shop.fields)) {
      const index = fieldIndex(key,/^Item\[(\d+)\]Item\[(\d+)\]$/);
      if (index && validId(itemId)) add(shops,itemId,{shop,index:index[0],outputIndex:index[1]});
    }
  }
  for (const [recordIndex,r] of (supplemental.datasets.ItemSupplement?.rows ?? []).entries()) {
    if (validId(r.ItemId) && validId(r.SourceItemId) && [3,6,7].includes(r.ItemSupplementSource)) add(containers,r.ItemId,{...r,recordIndex});
  }
  const name = itemId => itemMap.get(itemId)?.Name ?? null;
  const itemRef = itemId => ({itemId,name:name(itemId)});
  const neededShopFields = index => {
    const p=`Item[${index}]`;
    return ['UseCurrencyType', ...[0,1].flatMap(i=>[`${p}Item[${i}]`,`${p}ReceiveCount[${i}]`,`${p}ReceiveHq[${i}]`]),
      ...[0,1,2].flatMap(i=>[`${p}ItemCost[${i}]`,`${p}CurrencyCost[${i}]`,`${p}CostType[${i}]`,`${p}CollectabilityCost[${i}]`])];
  };
  function exchange(ref) {
    const {shop,index,outputIndex}=ref, f=shop.fields, p=`Item[${index}]`;
    const missingFields=neededShopFields(index).filter(k=>!has(f,k));
    const outputs=[0,1].map(slot=>({slot,itemId:f[`${p}Item[${slot}]`],quantity:f[`${p}ReceiveCount[${slot}]`],hq:f[`${p}ReceiveHq[${slot}]`]})).filter(x=>validId(x.itemId));
    const costs=[0,1,2].map(slot=>({slot,rawItemId:f[`${p}ItemCost[${slot}]`],quantity:f[`${p}CurrencyCost[${slot}]`],costType:f[`${p}CostType[${slot}]`],collectability:f[`${p}CollectabilityCost[${slot}]`]})).filter(x=>validId(x.rawItemId)||positive(x.quantity));
    const decodedCosts=costs.map(c=>({...resolveShopCost({...c,useCurrencyType:f.UseCurrencyType,outputItemId:f[`${p}Item[${outputIndex}]`]}, {tables}),slot:c.slot,collectability:c.collectability}));
    const encodingVerified=decodedCosts.every(c=>c.status==='resolved');
    const validCosts=decodedCosts.length>0&&decodedCosts.every(c=>validId(c.itemId)&&positive(c.quantity));
    const q=f[`${p}ReceiveCount[${outputIndex}]`];
    return {id:`SpecialShop:${shop.rowId}:${index}:${outputIndex}`,kind:'exchange',shop:{shopId:shop.rowId,name:f.Name,offerIndex:index,outputIndex,useCurrencyType:f.UseCurrencyType},
      output:{itemId:f[`${p}Item[${outputIndex}]`],quantity:q,hq:f[`${p}ReceiveHq[${outputIndex}]`]},outputs,
      requirementMode:'all',rawCosts:costs,decodedCosts,encodingStatus:encodingVerified?'resolved_cost_types':'unverified',
      dataStatus:missingFields.length?'missing_offer_fields':!encodingVerified?'unknown_currency_encoding':!validCosts||!positive(q)?'invalid_quantity_or_cost':'ready',
      missingFields,conditions:{shop:Object.fromEntries(['Quest','CustomTalk','RequiredContentFinderCondition','RequiredContentFinderConditionComplete','RequiredFestival','RequiredFestivalPhase'].filter(k=>has(f,k)).map(k=>[k,f[k]])),offer:Object.fromEntries(['Quest','AchievementUnlock','PatchNumber'].filter(k=>has(f,p+k)).map(k=>[k,f[p+k]])),verification:'raw_refs_only'},
      evidence:[{sheet:'SpecialShop',rowId:shop.rowId,offerIndex:index,outputIndex}],notes:['商店解锁/单行条件保留原始引用，未推导为已满足。','按每个成本槽的 CostType 解码；保留 HQ 和收藏价值要求，获取材料不等于满足品质门槛。']};
  }
  function container(r) {
    const f=itemMap.get(r.SourceItemId)??{}, description=f.Description??null;
    const byJob=typeof description==='string' && /相应职业或特职|对应职业或特职/.test(description);
    return {id:`ItemSupplement:${r.recordIndex}`,kind:'container',source:itemRef(r.SourceItemId),output:itemRef(r.ItemId),
      sourceEnum:r.ItemSupplementSource,sourceQuantityRaw:{min:r.Min,max:r.Max,probability:r.Probability},
      outcomeMode:byJob?'job_dependent_from_item_description':r.ItemSupplementSource===6?'card_pack_unknown_outcome':'unknown_outcome',
      conditions:{description,itemActionId:f.ItemAction??null,outputClassJobCategory:itemMap.get(r.ItemId)?.ClassJobCategory??null,verification:'description_only'},
      evidence:[{dataset:'ItemSupplement',recordIndex:r.recordIndex},{sheet:'Item',rowId:r.SourceItemId}],
      notes:['按消耗 1 个来源容器进行一次开箱尝试展开上游；输入单位是本原型的开箱约定。','未由 Min/Max/社区概率推算保证开箱数或期望成本。',...(byJob?['职业依赖只由物品说明识别；未证明目标职业、开箱等级与全部使用限制均已满足。']:['开箱条件未结构化；不能把所有产物视作同时获得或均匀随机。'])]};
  }
  function alternatives(itemId) {
    return [...(leaves.get(itemId)??[]),...(additional.get(itemId)??[]),...(earning.get(itemId)??[]),...(shops.get(itemId)??[]).map(exchange),...(containers.get(itemId)??[]).map(container)].sort((a,b)=>a.id.localeCompare(b.id));
  }
  function expand(itemId, requestedQuantity=1, options={}) {
    if (!validId(itemId)||!Number.isSafeInteger(requestedQuantity)||requestedQuantity<1) throw new Error('Positive integer itemId and quantity required');
    const config={maxDepth:4,maxNodes:1200,maxAlternatives:40,...options};
    for (const key of ['maxDepth','maxNodes','maxAlternatives']) if(!Number.isSafeInteger(config[key])||config[key]<(key==='maxDepth'?0:1))throw new Error(`Invalid ${key}`);
    const pendingShops=new Map(), pendingItems=new Set(), pendingRecipes=new Set(), stops={}, state={nodes:0};
    const stop=(node,status)=>{node.status=status;stops[status]=(stops[status]??0)+1;return node;};
    function walk(id,quantity,depth,ancestors,basis='requested_output',qualifiers={}) {
      const node={...itemRef(id),requestedQuantity:quantity,quantityBasis:basis,qualifiers,alternativeMode:'any',alternatives:[]};
      if(ancestors.includes(id)){node.cyclePath=[...ancestors,id];return stop(node,'cycle');}
      if(depth>config.maxDepth)return stop(node,'depth_limit');
      if(state.nodes>=config.maxNodes)return stop(node,'node_limit');
      state.nodes++;
      const all=alternatives(id);
      node.totalKnownAlternatives=all.length;
      node.omittedAlternatives=Math.max(0,all.length-config.maxAlternatives);
      node.coverage='Dungeon, SpecialShop, ItemSupplement 3/6/7, recipe, gathering, retainer, quest, mob and selected validated duty currency rewards; finite snapshots, not exhaustive';
      if(!all.length)return stop(node,'no_supported_source');
      node.status=node.omittedAlternatives?'alternatives_truncated':'expanded';
      if(node.omittedAlternatives)stops.alternatives_truncated=(stops.alternatives_truncated??0)+1;
      for(const raw of all.slice(0,config.maxAlternatives)) {
        const edge={...raw};
        if(edge.kind==='exchange') {
          if(edge.dataStatus==='missing_offer_fields') {
            if(!pendingShops.has(edge.shop.shopId))pendingShops.set(edge.shop.shopId,new Set());
            pendingShops.get(edge.shop.shopId).add(edge.shop.offerIndex);
            edge.expansionStatus='missing_data';
          } else if(edge.dataStatus!=='ready')edge.expansionStatus=edge.dataStatus;
          else if(qualifiers.hq===true&&edge.output.hq!==true)edge.expansionStatus='does_not_satisfy_hq';
          else {
            edge.batches=Math.ceil(quantity/edge.output.quantity);
            edge.producedQuantity=edge.batches*edge.output.quantity;
            // Same material in separate slots is still jointly required; aggregate its units.
            const costs=new Map();
            for(const c of edge.decodedCosts){const key=`${c.itemId}:${c.hq}:${c.collectability}`;if(!costs.has(key))costs.set(key,{itemId:c.itemId,quantityPerBatch:0,collectability:c.collectability,hq:c.hq,slots:[]});const cost=costs.get(key);cost.quantityPerBatch+=c.quantity;cost.slots.push(c.slot);}
            edge.requirements=[...costs.values()].map(c=>({...c,...itemRef(c.itemId),quantity:c.quantityPerBatch*edge.batches}));
            edge.inputs=edge.requirements.map(c=>walk(c.itemId,c.quantity,depth+1,[...ancestors,id],basis,{collectability:c.collectability,hq:c.hq===true?true:'any'}));
            edge.expansionStatus='expanded';
          }
        } else if(edge.kind==='recipe') {
          if(edge.dataStatus==='missing_recipe_fields') {
            pendingRecipes.add(edge.sourceRef.rowId);edge.expansionStatus='missing_data';
          } else if(edge.dataStatus!=='ready')edge.expansionStatus=edge.dataStatus;
          else if(qualifiers.hq===true&&edge.output.canHq!==true)edge.expansionStatus='does_not_satisfy_hq';
          else {
            edge.batches=Math.ceil(quantity/edge.output.quantity);
            edge.producedQuantity=edge.batches*edge.output.quantity;
            edge.requirements=edge.requirements.map(c=>({...c,quantity:c.quantityPerBatch*edge.batches}));
            edge.inputs=edge.requirements.map(c=>walk(c.itemId,c.quantity,depth+1,[...ancestors,id],basis,c.qualifiers));
            edge.expansionStatus='expanded';
          }
        } else if(edge.kind==='container') {
          if(!has(itemMap.get(edge.source.itemId),'Description'))pendingItems.add(edge.source.itemId);
          if(!has(itemMap.get(id),'ClassJobCategory'))pendingItems.add(id);
          edge.requiredOpeningsForRequestedQuantity=null;
          edge.requirements=[{...edge.source,quantity:1,basis:'one_opening_attempt',assumedInputUnit:true}];
          edge.inputs=[walk(edge.source.itemId,1,depth+1,[...ancestors,id],'one_opening_attempt')];
          edge.expansionStatus='one_attempt_only';
        } else {
          edge.expansionStatus='terminal_evidence';
          edge.requiredRuns=null;
          edge.personalObtainGuarantee='unverified';
          edge.notes=[...(edge.notes??[]),'这里只确认来源关系；行动资格、品质、次数、个人产量和全部前置未通过验收。'];
          if(positive(qualifiers.collectability))edge.notes.push('上游记录未证明满足下游收藏价值要求。');
        }
        node.alternatives.push(edge);
      }
      return node;
    }
    const tree=walk(itemId,requestedQuantity,0,[]);
    const edgeStatuses={};
    function inspect(node){
      for(const edge of node.alternatives){
        edgeStatuses[edge.expansionStatus]=(edgeStatuses[edge.expansionStatus]??0)+1;
        for(const input of edge.inputs??[])inspect(input);
        edge.hasSupportedTerminalPath=edge.expansionStatus==='terminal_evidence'
          ? validId(edge.duty?.cfcId)||edge.terminalEvidence===true
          : ['expanded','one_attempt_only'].includes(edge.expansionStatus) && (edge.inputs?.length??0)>0 && edge.inputs.every(input=>input.hasSupportedTerminalPath);
      }
      node.hasSupportedTerminalPath=node.alternatives.some(edge=>edge.hasSupportedTerminalPath);
      node.terminalPathMeaning='At least one alternative reaches supported source evidence for every AND input; not availability, quantity/yield or condition validation.';
    }
    inspect(tree);
    return {schemaVersion:2,config,tree,visitedNodes:state.nodes,stops,edgeStatuses,verificationStatus:'partial_evidence_only',
      pending:{shops:[...pendingShops].map(([shopId,indices])=>({shopId,indices:[...indices].sort((a,b)=>a-b)})),items:[...pendingItems].sort((a,b)=>a-b),recipes:[...pendingRecipes].sort((a,b)=>a-b)},
      limitations:['Node status=expanded means traversal completed at this node, never that all routes or conditions are validated.','Finite snapshot graph with explicit unresolved and truncated branches.','Alternatives are OR; all costs of one quote are AND.','Potentially overlapping chest records are evidence alternatives, not independent drop chances.']};
  }
  return {expand,itemRef,alternatives};
}
