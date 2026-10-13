import { LockKeyhole } from 'lucide-react';
import { FoodIcon } from './FoodIcon';
import type { FoodItem } from '../game/types';
// # The fourth position stays visibly locked until its independent voice challenge succeeds.
export function HoldingTray({holding,capacity,onUnlock}:{holding:FoodItem[];capacity:number;onUnlock:()=>void}) {
  return <section className={`holding-section ${holding.length>=capacity-1?'warning':''}`} aria-label={`暂存盘，剩余 ${capacity-holding.length} 个位置`}><div className="holding-caption"><span>暂存</span><span>{holding.length}/{capacity}</span></div><div className="holding-row">{Array.from({length:capacity},(_,i)=><div className={`holding-plate ${holding[i]?'occupied':''}`} data-holding={i} key={i}>{holding[i]&&<FoodIcon kind={holding[i].kind}/>}</div>)}{capacity<4&&<button className="holding-plate holding-lock" onClick={onUnlock} aria-label="语音解锁暂存格"><LockKeyhole size={17}/></button>}</div></section>;
}
