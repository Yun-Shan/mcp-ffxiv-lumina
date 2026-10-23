// Temporary, pure SpecialShop decoder. No network, executable or production API.
// Current CostType schema is authoritative; UseCurrencyType alone is not a namespace.
const SOURCES = {
  types: 'https://github.com/fae-industries/ffxiv-collect/blob/7c0249d3357d77b043290e92aaecf5eb4ef03fbd/lib/tasks/sources/shops.rake',
  tomestones: 'https://github.com/akarras/ultros/blob/11cc9ac1e2c0f161a024788011875613abcf93c0/xiv-gen/src/csv_to_rkyv.rs',
  buckets: 'https://github.com/akarras/ultros/blob/11cc9ac1e2c0f161a024788011875613abcf93c0/xiv-gen/src/lib.rs',
  hq: 'https://github.com/Critical-Impact/AllaganLib/blob/c34734f75e369777e7ac36dc57c09a8fc3e78fd4/AllaganLib.GameSheets/Sheets/SpecialShopListing.cs',
  gil: 'https://github.com/ffxiv-teamcraft/ffxiv-teamcraft/blob/f2918cca2b159d05f569e24b5828b5af38444d0a/apps/data-extraction/src/extractors/shops.extractor.ts',
};
export const CURRENT_SCRIP_BUCKETS = Object.freeze({2:33913,4:33914,6:41784,7:41785});
const integer = n => Number.isSafeInteger(n) && n >= 0;
const positive = n => integer(n) && n > 0;
const rows = (tables,sheet) => (tables instanceof Map ? tables.get(sheet) : tables?.[sheet])?.rows ?? [];
const source = key => ({kind:'primary_source_code',url:SOURCES[key]});

/** Resolve the cost namespace and preserve quality/collectability qualifiers.
 * Quantity is optional only to callers decoding identity alone; graph callers must
 * provide it. A missing/zero amount never silently becomes a free cost.
 * outputItemId is needed only for mode 8's implicit Item.PriceMid price.
 */
export function resolveShopCost({useCurrencyType,rawItemId,costType,quantity,collectability=0,outputItemId}, {tables}={}) {
  const raw={useCurrencyType,rawItemId,costType,quantity,collectability};
  const reject=(rule,notes=[],extra={})=>({status:'unverified',kind:'unknown',rule,evidence:[],notes,raw,...extra});
  if(!positive(rawItemId)||!integer(costType)||!integer(useCurrencyType)||!integer(collectability))return reject('invalid_or_missing_cost_fields');
  if(![2,3,4,5,8,16].includes(useCurrencyType))return reject('unobserved_shop_mode',['The snapshot has no populated cost slots for this mode; no legacy mode-only fallback.']);
  let result;
  if(costType===0||costType===1) {
    result={status:'resolved',itemId:rawItemId,hq:costType===1,kind:'item',rule:costType===1?'cost_type_1_hq_item':'cost_type_0_item',evidence:[source('types'),...(costType===1?[source('hq')]:[])],notes:[]};
  } else if(costType===2) {
    const candidates=rows(tables,'TomestonesItem').filter(r=>r.fields.Tomestones===rawItemId&&positive(r.fields.Item));
    const itemIds=[...new Set(candidates.map(r=>r.fields.Item))];
    if(itemIds.length!==1)return reject(itemIds.length?'ambiguous_tomestone_mapping':'missing_tomestone_mapping',[],{kind:'tomestone',evidence:candidates.map(r=>({sheet:'TomestonesItem',rowId:r.rowId,fields:r.fields}))});
    result={status:'resolved',itemId:itemIds[0],hq:false,kind:'tomestone',rule:'cost_type_2_tomestones_value_join',evidence:[source('tomestones'),...candidates.map(r=>({sheet:'TomestonesItem',rowId:r.rowId,fields:{Tomestones:r.fields.Tomestones,Item:r.fields.Item}}))],notes:['Join TomestonesItem.Tomestones, never rowId or CurrencyInventorySlot. This identity follows the captured game version.']};
  } else if(costType===3) {
    const itemId=CURRENT_SCRIP_BUCKETS[rawItemId];
    if(!itemId)return reject('unsupported_special_bucket',['Only buckets 2/4/6/7 observed in this snapshot are verified; deprecated mappings are not guessed.'],{kind:'special_bucket',evidence:[source('buckets')]});
    result={status:'resolved',itemId,hq:false,kind:'special_bucket',rule:'cost_type_3_verified_7x_scrip_bucket',evidence:[source('buckets'),source('types')],notes:['Version-scoped mapping: purple/orange scrips for the captured 7.x data; revalidate after currency rotation.']};
  } else return reject('unsupported_cost_type');
  if(collectability>0) {
    if(costType>1)return {...result,status:'unverified',rule:'unexpected_currency_collectability',collectability,raw};
    result.collectability=collectability;
    result.notes.push('Collectability requirement is retained; acquiring an NQ item is not proof that this quality threshold is met.');
  }
  if(quantity===0&&useCurrencyType===8&&costType===0&&rawItemId===1) {
    const output=rows(tables,'Item').find(r=>r.rowId===outputItemId);
    const price=output?.fields.PriceMid;
    if(!positive(price))return {...result,status:'unverified',rule:'implicit_gil_price_requires_output_price_mid',quantity:null,raw,notes:[...result.notes,'Mode 8 zero CurrencyCost is not free; the output Item.PriceMid is required.']};
    result={...result,status:'unverified',kind:'gil',rule:'mode_8_price_mid_candidate',quantity:null,candidateQuantity:price,evidence:[...result.evidence,source('gil'),{sheet:'Item',rowId:outputItemId,field:'PriceMid',value:price}],notes:[...result.notes,'PriceMid fallback is a source-code candidate. Wiki confirms the base price for the checked sample but exposes no matching shop source; actual payable quantity and NPC/event reachability are not verified.']};
  } else if(quantity!==undefined&&!positive(quantity))return {...result,status:'unverified',rule:'invalid_cost_quantity',quantity:null,raw};
  else if(quantity!==undefined)result.quantity=quantity;
  return {...result,raw};
}
