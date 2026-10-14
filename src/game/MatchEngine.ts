import type { FoodItem, ItemKind, Target } from './types';
// # Uniformly draw a stocked category, without favouring the holding area or the highest food.
export function targetCandidates(board:readonly FoodItem[],holding:readonly FoodItem[],targets:readonly Target[]):ItemKind[] {
  const occupied=new Set(targets.filter(t=>!t.locked).map(t=>t.kind));
  const counts=new Map<ItemKind,number>();
  [...board,...holding].forEach(i=>counts.set(i.kind,(counts.get(i.kind)??0)+1));
  return [...counts].filter(([kind,n])=>n>=3&&!occupied.has(kind)).map(([kind])=>kind).sort();
}
export function chooseTarget(board:readonly FoodItem[],holding:readonly FoodItem[],targets:readonly Target[],random:()=>number=Math.random):ItemKind|null {
  const candidates=targetCandidates(board,holding,targets);
  if(!candidates.length)return null;
  return candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
}
