import type { LevelConfig } from '../game/types';
// # Fifteen kinds and 99 foods stay fixed; minimum physical layers leave enough room for same-layer contacts.
export const levels:LevelConfig[]=Array.from({length:50},(_,i)=>{
  const level=i+1,d=i/49;
  const categoryCount=15;
  return {level,categoryCount,totalItems:99,targetTrayCount:4,lockedTrayCount:2,
    floatSpeed:.30+d*.025,rotationSpeed:.055+d*.01,
    overlapFactor:.22+d*.24,rareItemRatio:level===1?0:.10+d*.18,
    initialToolCount:{shuffle:level<=5?2:1,match:level<=5?2:1,return:level<=5?2:1},
    depthLayers:level===1?10:level<=20?12:14,refreshMs:Math.round(360-d*140),
    specialRules:level===50?['finale','similar-silhouettes','rare-triples']:level<=3?['tutorial']:level>=21?['rare-triples','similar-silhouettes']:level>=11?['similar-silhouettes']:[],
  };
});
export function getLevel(n:number):LevelConfig{return levels[Math.max(0,Math.min(49,n-1))];}
