import { expect, it } from 'vitest';
import { chooseTarget } from '../src/game/MatchEngine';
import { GameEngine } from '../src/game/GameEngine';
import { spawn } from '../src/game/SpawnManager';
import { getLevel } from '../src/config/levels';
import type { FoodItem, ItemKind, Target } from '../src/game/types';
// # Fixtures isolate category probability from stack depth, count weighting and stored-food preference.
function pool(kinds:ItemKind[]){const base=spawn(getLevel(1),2)[0];return kinds.flatMap((kind,index)=>Array.from({length:3},(_,slot)=>({...base,id:index*3+slot,kind,z:slot})));}
it('draws equally from stocked kinds without preferring holding food or high stack positions',()=>{
  const board=pool(['carrot','shrimp','tofu']),holding:FoodItem[]=[board.pop()!],targets:Target[]=[];
  board.filter(food=>food.kind==='carrot').forEach(food=>food.z=10000);
  const draws=Array.from({length:300},(_,index)=>chooseTarget(board,holding,targets,()=>((index%3)+.5)/3));
  for(const kind of ['carrot','shrimp','tofu'])expect(draws.filter(value=>value===kind)).toHaveLength(100);
  const before=[0,.35,.7].map(value=>chooseTarget(board,holding,targets,()=>value));
  board.push(holding.pop()!);holding.push(board.splice(board.findIndex(food=>food.kind==='shrimp'),1)[0]);
  expect([0,.35,.7].map(value=>chooseTarget(board,holding,targets,()=>value))).toEqual(before);
});
it('excludes occupied orders and insufficient stock while allowing a valid kind whose food is stored',()=>{
  const board=pool(['carrot','shrimp','tofu']);board.splice(board.findIndex(food=>food.kind==='shrimp'),1);
  const targets:Target[]=[{kind:'tofu',count:1,locked:false}];
  expect(chooseTarget(board,[],targets,()=>.9)).toBe('carrot');
  targets.push({kind:'carrot',count:0,locked:false});expect(chooseTarget(board,[],targets,()=>0)).toBeNull();
  const holding=board.splice(board.findIndex(food=>food.kind==='carrot'),1);targets.pop();
  expect(chooseTarget(board,holding,targets,()=>.9)).toBe('carrot');
});
it('randomly refreshes a completed plate and only then transfers matching stored food',()=>{
  let matched=0,retained=0;
  for(let seed=1;seed<=200;seed++){
    const engine=new GameEngine(2,seed);engine.start();const state=engine.snapshot;
    const stored=state.board.find(food=>!state.targets.some(target=>target.kind===food.kind))!;
    engine.pick(stored.id,true);const oldKind=state.targets[0].kind!;
    const ids=state.board.filter(food=>food.kind===oldKind).slice(0,3).map(food=>food.id);ids.forEach(id=>engine.pick(id,true));
    if(state.targets[0].kind===stored.kind){matched++;expect(state.holding).toHaveLength(0);expect(state.targets[0].count).toBe(1);}
    else{retained++;expect(state.holding.map(food=>food.id)).toEqual([stored.id]);expect(state.targets[0].count).toBe(0);}
  }
  expect(matched).toBeGreaterThan(0);expect(retained).toBeGreaterThan(matched);
});
it('reproduces a seeded target sequence and lets every starting menu kind become a target',()=>{
  const seen=new Set<ItemKind>();
  for(let seed=1;seed<=200;seed++){
    const engine=new GameEngine(2,seed),copy=new GameEngine(2,seed);
    expect(engine.snapshot.targets).toEqual(copy.snapshot.targets);
    for(const target of engine.snapshot.targets)if(!target.locked&&target.kind)seen.add(target.kind);
  }
  expect(seen.size).toBe(15);
});
