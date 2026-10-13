import { useLayoutEffect, useState } from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import type { ItemKind, Target } from '../game/types';
import { items } from '../config/items';
import { FoodIcon } from './FoodIcon';
// # Three real positions, followed by a full plate departing and its replacement arriving.
export interface PlateCompletion {id:number;kind:ItemKind;}
// # Longer compositor-driven travel replaces the short overshooting arrival.
export const plateMotion={fill:200,depart:360,arrive:380,total:940};
type Phase='idle'|'full'|'departing'|'arriving';
export function TargetTray({target,index,onUnlock,pulse,completion,reduced}:{target:Target;index:number;onUnlock:()=>void;pulse:number;completion:PlateCompletion|null;reduced:boolean}) {
  const [phase,setPhase]=useState<Phase>('idle');
  useLayoutEffect(()=>{
    if(!completion||reduced){setPhase('idle');return;}
    setPhase('full');
    const depart=setTimeout(()=>setPhase('departing'),plateMotion.fill);
    const arrive=setTimeout(()=>setPhase('arriving'),plateMotion.fill+plateMotion.depart);
    const done=setTimeout(()=>setPhase('idle'),plateMotion.total);
    return()=>{clearTimeout(depart);clearTimeout(arrive);clearTimeout(done);};
  },[completion,reduced]);
  const oldPlate=!!completion&&(phase==='full'||phase==='departing');
  const kind=oldPlate?completion.kind:target.kind,count=oldPlate?3:target.count;
  return <div className={`target ${target.locked?'locked':''}`} data-target={index} data-plate-phase={phase} style={{'--plate-depart':`${plateMotion.depart}ms`,'--plate-arrive':`${plateMotion.arrive}ms`} as React.CSSProperties}>
    {target.locked?<button className="plate locked-plate" aria-label={`语音解锁盘子 ${index+1}`} onClick={onUnlock}><LockKeyhole size={23}/><strong className="tray-lock-label">解锁</strong><span className="lock-glint"><Sparkles size={13}/></span></button>:<div className={`plate meal-plate plate-${phase} ${phase==='idle'&&pulse?'plate-pop':''}`} key={phase==='idle'?pulse:phase} aria-label={`${kind?items[kind].name:'已完成'}盘，已放入 ${count} 个，共 3 个位置`}>
      {kind?<div className="meal-slots">{[0,1,2].map(slot=><div key={slot} data-meal-slot={slot} className={`meal-slot meal-slot-${slot} ${slot<count?'slot-filled':'slot-empty'}`}>{slot<count?<FoodIcon kind={kind}/>:<span/>}</div>)}</div>:<Sparkles className="empty-target" size={25}/>}
      {phase==='full'&&<span className="full-plate-star">✦</span>}
    </div>}
    <div className="target-label">{target.locked?null:kind?<><FoodIcon kind={kind}/><b>×3</b></>:null}</div>
  </div>;
}
