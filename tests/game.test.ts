import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/game/GameEngine';
import { levels, getLevel } from '../src/config/levels';
import { foodSizes, itemOrder, levelItemOrder } from '../src/config/items';
import { checkAllLevels } from '../src/game/SolvabilityChecker';
import { isClickable, visibleRatio, pickAt, pose, surfaceSpeed } from '../src/game/PhysicsEngine';
import { matchesPhrase } from '../src/services/SpeechService';
import { pickRenderedPixel } from '../src/game/FoodHitTest';
import { gameConfig } from '../src/config/gameConfig';
import { spawn } from '../src/game/SpawnManager';
// # Integration tests exercise real inventory/state transitions rather than mirroring implementation.
function failWithHolding(e:GameEngine){
  const active=e.snapshot.targets.map(t=>t.kind);
  const candidates=e.snapshot.board.filter(i=>!active.includes(i.kind));
  const chosen=candidates.filter((i,j,arr)=>arr.findIndex(x=>x.kind===i.kind)===j).slice(0,3);
  expect(chosen).toHaveLength(3);for(const i of chosen)expect(e.pick(i.id,true)).toBe(true);
  expect(e.snapshot.status).toBe('FAILED');
}
describe('level configuration and stock-only solution witness',()=>{
  it('keeps 99 pieces and fifteen food kinds in every level, from the expanded library',()=>{
    expect(levels).toHaveLength(50);expect(itemOrder.length).toBeGreaterThanOrEqual(20);expect(getLevel(1).totalItems).toBe(99);expect(getLevel(1).categoryCount).toBe(15);
    expect(getLevel(2).categoryCount).toBe(15);expect(getLevel(2).totalItems).toBe(99);expect(new Set(spawn(getLevel(2),17).map(i=>i.kind)).size).toBe(15);
    for(let i=0;i<50;i++){
      const l=levels[i];expect(l.level).toBe(i+1);expect(l.totalItems%3).toBe(0);expect(l.totalItems).toBeLessThanOrEqual(99);expect(l.targetTrayCount).toBe(4);expect(l.lockedTrayCount).toBe(2);
      if(i){expect(l.totalItems).toBeGreaterThanOrEqual(levels[i-1].totalItems);expect(l.categoryCount).toBeGreaterThanOrEqual(levels[i-1].categoryCount);}
    }
    expect(getLevel(50).totalItems).toBe(99);expect(getLevel(50).categoryCount).toBe(15);
  });
  it('checks random target inventory and stock-only completion across all 50 levels',()=>{
    const report=checkAllLevels(5);expect(report.runs).toBe(250);expect(report.clicks).toBe(24750);expect(report.scope).toBe('inventory-only');
  },120000);
  it('allocates enough physical layers for the fixed category sizes and makes the full library reachable',()=>{
    const final=spawn(getLevel(50),1729);expect(new Set(final.map(i=>i.depth)).size).toBeGreaterThanOrEqual(getLevel(50).depthLayers);
    for(const depth of new Set(final.map(food=>food.depth)))expect(final.filter(food=>food.depth===depth).length).toBeLessThanOrEqual(7);
    const allKinds=new Set(levels.flatMap(l=>spawn(l,l.level*1729).map(i=>i.kind)));expect(allKinds.size).toBe(28);
  });
  it('spawns repeatable scattered layouts and each participating category in triples',()=>{
    const board=spawn(getLevel(50),1729);expect(board).toEqual(spawn(getLevel(50),1729));
    expect(new Set(board.map(i=>i.x)).size).toBe(99);expect(new Set(board.map(i=>i.angle)).size).toBe(99);
    for(const k of new Set(board.map(i=>i.kind)))expect(board.filter(i=>i.kind===k).length%3).toBe(0);
  });
  it('fixes size per food category and independently shuffles depth order',()=>{
    const board=spawn(getLevel(2),17),sizes=board.map(i=>i.size);
    expect(Math.max(...sizes)/Math.min(...sizes)).toBeGreaterThanOrEqual(4);
    for(const kind of new Set(board.map(i=>i.kind))){expect(new Set(board.filter(i=>i.kind===kind).map(i=>i.size)).size).toBe(1);expect(board.find(i=>i.kind===kind)!.size).toBe(foodSizes[kind]);}
    const top=[...board].sort((a,b)=>b.z-a.z).slice(0,18);expect(new Set(top.map(i=>i.kind)).size).toBeGreaterThan(5);
  });
  it('drifts slowly, stays in the bowl and respects the reduced-motion setting',()=>{
    const config=getLevel(2),item={...spawn(config,17)[0],phase:0,x:.5,y:.5,angle:0};
    const a=pose(item,0,config),b=pose(item,2,config),distance=Math.hypot(a.x-b.x,a.y-b.y)*350;
    expect(distance).toBeGreaterThan(7);expect(distance).toBeLessThan(12);
    expect(Math.abs(a.angle-b.angle)*180/Math.PI).toBeLessThan(2);
    for(const config of levels){expect(Math.PI*2/surfaceSpeed(config)).toBeGreaterThan(25);expect(Math.PI*2/surfaceSpeed(config)).toBeLessThan(29);}
    expect(pose(item,0,config,true)).toEqual(pose(item,20,config,true));
    for(const food of spawn(config,17))for(const time of [0,6,12,18,24,30,36]){const p=pose(food,time,config);expect(Math.hypot(p.x-.5,p.y-.5)+food.size*.63).toBeLessThanOrEqual(.480001);}
  });
});
describe('collection, holding and state gates',()=>{
  it('has two active/two locked trays; three same foods eliminate and refresh safely',()=>{
    const e=new GameEngine(1,4);expect(e.snapshot.status).toBe('READY');expect(e.snapshot.targets.filter(t=>t.locked)).toHaveLength(2);e.start();
    const kind=e.snapshot.targets[0].kind!;
    const ids=e.snapshot.board.filter(i=>i.kind===kind).slice(0,3).map(i=>i.id);
    ids.forEach((id,i)=>{expect(e.pick(id,true)).toBe(true);if(i<2)expect(e.snapshot.targets[0].count).toBe(i+1);});
    expect(e.snapshot.eliminated).toBe(3);expect(e.snapshot.targets[0].count).toBe(0);expect(e.snapshot.status).toBe('PLAYING');
  });
  it('three identical holding foods remain stored and trigger failure without elimination',()=>{
    const e=new GameEngine(20,8);e.start();const kind=e.snapshot.board.find(i=>!e.snapshot.targets.some(t=>t.kind===i.kind))!.kind;
    const ids=e.snapshot.board.filter(i=>i.kind===kind).slice(0,3).map(i=>i.id);ids.forEach(id=>e.pick(id,true));
    expect(e.snapshot.holding).toHaveLength(3);expect(e.snapshot.eliminated).toBe(0);expect(e.snapshot.status).toBe('FAILED');
  });
  it('fails on three unmatched holding items and prohibits subsequent/paused taps',()=>{
    const e=new GameEngine(50,19);e.start();failWithHolding(e);const n=e.snapshot.board.length;expect(e.pick(e.snapshot.board[0].id,true)).toBe(false);expect(e.snapshot.board.length).toBe(n);
    const p=new GameEngine();p.start();p.transition('PLAYING','PAUSED');expect(p.pick(p.snapshot.board[0].id,true)).toBe(false);
  });
  it('stored items automatically transfer when their target unlocks',()=>{
    const e=new GameEngine(50,6);e.start();const target=e.snapshot.board.find(i=>!e.snapshot.targets.some(t=>t.kind===i.kind))!;
    // # This fixture supplies a matching random outcome; unlocking itself does not force the stored kind.
    e.pick(target.id,true);expect(e.snapshot.holding).toHaveLength(1);e.snapshot.targets[2].kind=target.kind;e.transition('PLAYING','VOICE_CHALLENGE');expect(e.unlock(2)).toBe(true);
    expect(e.snapshot.targets[2].kind).toBe(target.kind);expect(e.snapshot.targets[2].count).toBe(1);expect(e.snapshot.holding).toHaveLength(0);expect(e.snapshot.targets[3].locked).toBe(true);
  });
  it('covered bottom items cannot be picked, but reveal after removing the top',()=>{
    // # Explicit sizes make this a full-coverage fixture independent of randomized spawn sizes.
    const e=new GameEngine(1,9);e.start();const bottom=e.snapshot.board[0],top=e.snapshot.board[1];bottom.x=top.x=.5;bottom.y=top.y=.5;bottom.size=.20;top.size=.25;bottom.z=1;top.z=1000;
    const board=[bottom,top];expect(visibleRatio(bottom,board)).toBeLessThan(.38);expect(isClickable(bottom,board)).toBe(false);expect(isClickable(bottom,[bottom])).toBe(true);
    expect(pickAt(board,.5,.5,0,getLevel(1),true)?.id).toBe(top.id);
  });
  it('checks animated taps against the drawn positions and rejects incomplete scene projections',()=>{
    const e=new GameEngine(2,19);e.start();const bottom=e.snapshot.board[0],top=e.snapshot.board[1];
    bottom.x=top.x=.5;bottom.y=top.y=.5;bottom.size=.1;top.size=.3;bottom.z=1;top.z=100000;
    expect(e.pick(bottom.id)).toBe(false);
    const scene=e.snapshot.board.map(i=>({...i,x:i.id===bottom.id ? .03 : i.x,y:i.id===bottom.id ? .03 : i.y}));
    expect(e.pick(bottom.id,false,scene.slice(1))).toBe(false);
    const masks=new Map(itemOrder.map(kind=>[kind,{width:1,height:1,data:new Uint8Array([255])}]));
    expect(pickRenderedPixel(scene,.03,.03,300,300,masks)?.id).toBe(bottom.id);
    expect(e.pick(bottom.id,false,scene)).toBe(true);
    expect(e.drainEffects().find(effect=>effect.type==='pick')?.item?.x).toBe(.03);
  });
});
describe('tools, voice and revival',()=>{
  it('shuffle preserves exact food inventory; return restores holding without duplication',()=>{
    const e=new GameEngine(50,29);e.start();const before=e.snapshot.board.map(i=>[i.id,i.kind]).sort();expect(e.useTool('shuffle').used).toBe(true);expect(e.snapshot.board.map(i=>[i.id,i.kind]).sort()).toEqual(before);
    const item=e.snapshot.board.find(i=>!e.snapshot.targets.some(t=>t.kind===i.kind))!;e.pick(item.id,true);expect(e.snapshot.holding).toHaveLength(1);expect(e.useTool('return').used).toBe(true);expect(e.snapshot.holding).toHaveLength(0);expect(e.snapshot.board).toHaveLength(99);expect(new Set(e.snapshot.board.map(i=>i.id)).size).toBe(99);
  });
  it('does not consume unavailable matches or return tools on empty holding',()=>{
    const e=new GameEngine(50,39);e.start();const before=e.snapshot.tools.return;expect(e.useTool('return').used).toBe(false);expect(e.snapshot.tools.return).toBe(before);
    // # The final pool now includes every food; explicitly bury the target instead of assuming it is absent.
    for(const i of e.snapshot.board.filter(i=>i.kind==='donut')){i.x=.5;i.y=.5;i.size=.1;i.z=1;}
    const blocker=e.snapshot.board.find(i=>i.kind!=='donut')!;blocker.x=.5;blocker.y=.5;blocker.size=.3;blocker.z=100000;
    for(const t of e.snapshot.targets)if(!t.locked)t.kind='donut';const stock=e.snapshot.tools.match;expect(e.useTool('match').used).toBe(false);expect(e.snapshot.tools.match).toBe(stock);
  });
  it('automatic match can complete a visible partial target and charges exactly once',()=>{
    const e=new GameEngine(1,39);e.start();const kind=e.snapshot.targets[0].kind!;const targetItems=e.snapshot.board.filter(i=>i.kind===kind).slice(0,3);
    targetItems.forEach((i,n)=>{i.x=.25+n*.25;i.y=.5;i.z=10000+n;});e.pick(targetItems[0].id,true);const stock=e.snapshot.tools.match;
    expect(e.useTool('match').used).toBe(true);expect(e.snapshot.eliminated).toBe(3);expect(e.snapshot.tools.match).toBe(stock-1);
    const moves=e.drainEffects().filter(effect=>effect.type==='pick');expect(moves.map(effect=>effect.slot)).toEqual([0,1,2]);
    expect(e.effects).toHaveLength(0);
  });
  it('voice grants only the selected inventory and unlocks each tray independently',()=>{
    const e=new GameEngine(1,7);e.start();expect(e.unlock(2)).toBe(false);e.transition('PLAYING','VOICE_CHALLENGE');expect(e.unlock(2)).toBe(true);expect(e.snapshot.targets[3].locked).toBe(true);
    const before={...e.snapshot.tools};e.transition('PLAYING','VOICE_CHALLENGE');expect(e.grant('return')).toBe(true);expect(e.snapshot.tools.return).toBe(before.return+1);expect(e.snapshot.tools.shuffle).toBe(before.shuffle);expect(e.snapshot.tools.match).toBe(before.match);expect(e.grant('return')).toBe(false);
  });
  it('accepts whitespace/punctuation but rejects wrong names, phrases and negative sentences',()=>{
    expect(matchesPhrase('蒋雨童 发大财！','蒋雨童发大财')).toBe(true);expect(matchesPhrase('蒋雨童是天才','蒋雨童是天才')).toBe(true);
    expect(matchesPhrase('蒋雨童不是天才','蒋雨童是天才')).toBe(false);expect(matchesPhrase('蒋雨童发大财','蒋雨童是天才')).toBe(false);expect(matchesPhrase('蒋雨桐发大财','蒋雨童发大财')).toBe(false);
  });
  it('canceled ads do not revive; completed ads return all stored food and permit only one revival',()=>{
    const e=new GameEngine(50,13);e.start();failWithHolding(e);expect(e.beginAd()).toBe(true);expect(e.completeAd(false)).toBe(false);expect(e.snapshot.revives).toBe(0);expect(e.snapshot.status).toBe('FAILED');
    expect(e.beginAd()).toBe(true);expect(e.completeAd(true)).toBe(true);expect(e.snapshot.status).toBe('REVIVING');expect(e.snapshot.holding).toHaveLength(0);expect(e.snapshot.board).toHaveLength(99);expect(e.snapshot.revives).toBe(1);
    e.finishRevive();expect(e.snapshot.status).toBe('PLAYING');failWithHolding(e);expect(e.beginAd()).toBe(false);
  });
});

describe('silhouette picking, natural surfacing and holding reward',()=>{
  it('picks exposed lower pixels through transparent upper pixels without penetrating opaque pixels',()=>{
    const base=spawn(getLevel(1),2)[0],lower={...base,kind:'shrimp' as const,x:.5,y:.5,size:.4,angle:0,z:1},upper={...lower,id:999,kind:'dumpling' as const,z:2};
    const masks=new Map([['shrimp' as const,{width:2,height:2,data:new Uint8Array([255,255,255,255])}],['dumpling' as const,{width:2,height:2,data:new Uint8Array([0,255,255,255])}]]);
    expect(pickRenderedPixel([lower,upper],.45,.45,300,300,masks)?.id).toBe(lower.id);
    expect(pickRenderedPixel([lower,upper],.55,.45,300,300,masks)?.id).toBe(999);
    upper.angle=Math.PI/2;expect(pickRenderedPixel([lower,upper],.55,.45,300,300,masks)?.id).toBe(lower.id);
    expect(pickRenderedPixel([lower,upper],.1,.1,300,300,masks)).toBeUndefined();
  });
  it('drifts without changing the upper food or raising targets on a timer',()=>{
    const e=new GameEngine(2,71),before=e.snapshot.board.map(i=>i.z);e.start();
    expect(e.snapshot.board.map(i=>i.z)).toEqual(before);
    const a={...e.snapshot.board[0],phase:0,z:1},b={...e.snapshot.board[1],phase:Math.PI,z:999};
    const omega=surfaceSpeed(getLevel(2));for(const time of [0,Math.PI/2/omega,Math.PI*1.5/omega]){expect(pose(a,time,getLevel(2)).z).toBe(1);expect(pose(b,time,getLevel(2)).z).toBe(999);}
    for(const i of e.snapshot.board)for(const time of [0,1,2,3,4,5]){const p=pose(i,time,getLevel(2));expect(Math.hypot(p.x-.5,p.y-.5)+i.size*.63).toBeLessThanOrEqual(.480001);}
  });
  it('accepts only the new phrase and expands holding once per level without clearing stored triples',()=>{
    expect(matchesPhrase('蒋雨童最棒！',gameConfig.holdingPhrase)).toBe(true);
    expect(matchesPhrase(gameConfig.unlockPhrase,gameConfig.holdingPhrase)).toBe(false);
    expect(matchesPhrase('蒋雨童不是最棒',gameConfig.holdingPhrase)).toBe(false);
    const e=new GameEngine(2,17);e.start();expect(e.snapshot.holdingCapacity).toBe(3);expect(e.unlockHolding()).toBe(false);
    e.transition('PLAYING','VOICE_CHALLENGE');expect(e.unlockHolding()).toBe(true);expect(e.snapshot.holdingCapacity).toBe(4);expect(e.snapshot.targets.filter(t=>t.locked)).toHaveLength(2);
    e.transition('PLAYING','VOICE_CHALLENGE');expect(e.unlockHolding()).toBe(false);e.transition('VOICE_CHALLENGE','PLAYING');
    const kind=e.snapshot.board.find(i=>!e.snapshot.targets.some(t=>t.kind===i.kind))!.kind;
    e.snapshot.board.filter(i=>i.kind===kind).slice(0,3).forEach(i=>e.pick(i.id,true));
    expect(e.snapshot.holding).toHaveLength(3);expect(e.snapshot.eliminated).toBe(0);expect(e.snapshot.status).toBe('PLAYING');
    const fourth=e.snapshot.board.find(i=>!e.snapshot.targets.some(t=>t.kind===i.kind))!;e.pick(fourth.id,true);
    expect(e.snapshot.holding).toHaveLength(4);expect(e.snapshot.status).toBe('FAILED');expect(new GameEngine(2,17).snapshot.holdingCapacity).toBe(3);
  });
});

it('automatic match reads the animated scene instead of collecting logically high but visually covered targets',()=>{
  const e=new GameEngine(2,39);e.start();const kinds=e.snapshot.targets.filter(t=>!t.locked).map(t=>t.kind);
  const scene=e.snapshot.board.map(i=>({...i,x:.5,y:.5,size:kinds.includes(i.kind)?.1:.3,z:kinds.includes(i.kind)?-1:1}));
  const stock=e.snapshot.tools.match;expect(e.useTool('match',scene).used).toBe(false);expect(e.snapshot.tools.match).toBe(stock);
  expect(e.useTool('match',scene.slice(1)).used).toBe(false);expect(e.snapshot.tools.match).toBe(stock);
});

it('rotates fifteen-kind menus across the full library while keeping totals and motion speed bounded',()=>{
  expect(getLevel(1).totalItems).toBe(99);expect(getLevel(50).totalItems).toBe(99);
  const encountered=new Set(levels.flatMap(config=>{const board=spawn(config,config.level*7);expect(new Set(board.map(i=>i.kind)).size).toBe(15);return board.map(i=>i.kind);}));
  expect(encountered.size).toBe(itemOrder.length);
  const first=spawn(getLevel(1),15);for(const kind of ['sushi','sausage','grapes','peach','ice-pop'])expect(first.some(i=>i.kind===kind)).toBe(true);
  expect(new Set(levelItemOrder).size).toBe(itemOrder.length);
});
