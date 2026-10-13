import { useEffect, useRef, useState } from 'react';
import type { GameEffect, ItemKind } from '../game/types';
import { FoodIcon } from './FoodIcon';
// # Fixed-position food flights use compositor transforms and never reflow the playfield.
interface Flight {id:number;kind:ItemKind;x:number;y:number;dx:number;dy:number;delay:number;}
interface Burst {id:number;x:number;y:number;}
export function EffectsLayer({effects,reduced}:{effects:GameEffect[];reduced:boolean}) {
  const [flights,setFlights]=useState<Flight[]>([]),[bursts,setBursts]=useState<Burst[]>([]);
  const timers=useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);timers.current.clear();},[]);
  useEffect(()=>{
    if(reduced){setFlights([]);setBursts([]);return;}if(!effects.length)return;
    const canvas=document.querySelector('[data-pot] canvas')?.getBoundingClientRect();
    const newFlights:Flight[]=[],newBursts:Burst[]=[];
    effects.forEach((effect,index)=>{
      const dest=document.querySelector(effect.tray!==undefined?`[data-target="${effect.tray}"] ${effect.slot!==undefined?`[data-meal-slot="${effect.slot}"]`:'.plate'}`:effect.holding!==undefined?`[data-holding="${effect.holding}"]`:effect.tool?`[data-tool="${effect.tool}"]`: '[data-pot]')?.getBoundingClientRect();
      if(effect.type==='pick'&&effect.item&&canvas&&dest) {
        const origin=effect.tray!==undefined&&effect.holding!==undefined?document.querySelector(`[data-holding="${effect.holding}"]`)?.getBoundingClientRect():null;
        const x=origin?origin.x+origin.width/2:canvas.x+effect.item.x*canvas.width,y=origin?origin.y+origin.height/2:canvas.y+effect.item.y*canvas.height;
        newFlights.push({id:performance.now()+index,kind:effect.item.kind,x,y,dx:dest.x+dest.width/2-x,dy:dest.y+dest.height/2-y,delay:index*45});
      }
      if(effect.type==='return'&&effect.items&&canvas)effect.items.forEach((item,k)=> {
        const origin=document.querySelector(`[data-holding="${k}"]`)?.getBoundingClientRect();if(!origin)return;
        const x=origin.x+origin.width/2,y=origin.y+origin.height/2;
        newFlights.push({id:performance.now()+index+k+.1,kind:item.kind,x,y,dx:canvas.x+item.x*canvas.width-x,dy:canvas.y+item.y*canvas.height-y,delay:k*50});
      });
      if(['match','unlock','reward','revive'].includes(effect.type)&&dest)newBursts.push({id:performance.now()+index,x:dest.x+dest.width/2,y:dest.y+dest.height/2});
    });
    // # Each flight finishes independently, even when the player taps again quickly.
    setFlights(old=>[...old,...newFlights]);setBursts(old=>[...old,...newBursts]);
    const flightIds=new Set(newFlights.map(f=>f.id)),burstIds=new Set(newBursts.map(b=>b.id));
    const timeout=setTimeout(()=>{setFlights(old=>old.filter(f=>!flightIds.has(f.id)));setBursts(old=>old.filter(b=>!burstIds.has(b.id)));timers.current.delete(timeout);},1000);timers.current.add(timeout);
  },[effects,reduced]);
  return <div className="effects-layer" aria-hidden="true">{flights.map(f=><div className="food-flight" key={f.id} style={{left:f.x,top:f.y,'--dx':`${f.dx}px`,'--dy':`${f.dy}px`,animationDelay:`${f.delay}ms`} as React.CSSProperties}><FoodIcon kind={f.kind}/></div>)}{bursts.map(b=><div className="burst" key={b.id} style={{left:b.x,top:b.y}}>{Array.from({length:10},(_,i)=><i key={i} style={{'--angle':`${i*36}deg`,'--color':['#ffd438','#ed6a2b','#87b944'][i%3]} as React.CSSProperties}/>)}</div>)}</div>;
}
