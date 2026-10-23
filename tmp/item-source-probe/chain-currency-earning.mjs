// Scope deliberately limited to three duties whose CurrencyA identity and amounts
// were independently checked against Wiki. B/C are not guessed from rotation order.
export function buildCurrencyEarningIndex({tables}) {
  const sheet=name=>tables.get(name)?.rows??[];
  const instances=new Map(sheet('InstanceContent').map(r=>[r.rowId,r.fields]));
  const cfc=new Map(sheet('ContentFinderCondition').map(r=>[r.rowId,r.fields]));
  const poetics=[];
  for(const instanceId of [24,90,91]) {
    const f=instances.get(instanceId), duty=cfc.get(f?.ContentFinderCondition);
    if(!f||duty?.Content!==instanceId||duty.ContentType!==2)continue;
    const fields=['FinalBossCurrencyA',...Array.from({length:5},(_,i)=>`BossCurrencyA[${i}]`),'NewPlayerBonusA'];
    if(fields.some(k=>!Number.isSafeInteger(f[k])||f[k]<0))continue;
    const bosses=Array.from({length:5},(_,slot)=>({slot,quantity:f[`BossCurrencyA[${slot}]`]})).filter(x=>x.quantity>0);
    const total=f.FinalBossCurrencyA+bosses.reduce((n,b)=>n+b.quantity,0);
    if(total<=0)continue;
    poetics.push({id:`InstanceContent:${instanceId}:CurrencyA`,kind:'duty_currency',terminalEvidence:true,
      output:{itemId:28,quantity:total,hq:false},duty:{cfcId:f.ContentFinderCondition,contentId:instanceId,instanceId,contentType:duty.ContentType,name:duty.Name},
      rewards:{finalBoss:f.FinalBossCurrencyA,otherBosses:bosses,baseTotal:total,newPlayerBonus:f.NewPlayerBonusA},
      conditions:{WeekRestriction:f.WeekRestriction,verification:'amounts_and_currency_checked_conditions_unverified'},
      evidence:[{sheet:'InstanceContent',rowId:instanceId,fields},{sheet:'ContentFinderCondition',rowId:f.ContentFinderCondition}],
      identityValidation:{file:'chains/extension-wiki-instance-verification.json',scope:'three_checked_duties_only'},
      notes:['基础合计为所有 Boss 奖励相加；最终 Boss 数额不是整本总额。','新手奖励单列，不并入每次基础奖励；未验证解除限制等奖励条件，不反推必需刷本次数。']});
  }
  return new Map(poetics.length?[[28,poetics]]:[]);
}
