import {expect,it} from 'vitest';
import {FloatingScene,refillSeconds} from '../src/game/FloatingScene';
import {cleanSpritePixels} from '../src/game/SpriteSanitizer';
import {getLevel} from '../src/config/levels';
import {spawn} from '../src/game/SpawnManager';
import {GameEngine} from '../src/game/GameEngine';
import {createBody,contactBetween} from '../src/game/CollisionGeometry';
import {pickRenderedPixel} from '../src/game/FoodHitTest';
import type {FoodItem} from '../src/game/types';
const contact={x:0,y:0,distance:0};
function food(id:number,x:number,y:number,depth=0,size=.16,phase=0):FoodItem{return {id,kind:'fishball',x,y,z:id,depth,size,phase,angle:0};}
function assertContained(board:readonly FoodItem[]){for(const item of board){const body=createBody(item);for(let i=0;i<body.points.length;i+=2)expect(Math.hypot(body.points[i]-.5,body.points[i+1]-.5)).toBeLessThanOrEqual(.478001);}}
// # Continuity limits test ordinary and click-induced movement independently of actual browser frame rate.
it('drifts visibly without jumps and freezes exactly on pause',()=>{
  const config=getLevel(2),board=spawn(config,41),floating=new FloatingScene();let scene=floating.update(board,0,0,config);
  const initial=scene.map(item=>({...item}));let time=0;
  for(let frame=0;frame<600;frame++){
    const previous=scene.map(item=>({x:item.x,y:item.y}));time+=1/60;scene=floating.update(board,time,1/60,config);
    for(let i=0;i<scene.length;i++)expect(Math.hypot(scene[i].x-previous[i].x,scene[i].y-previous[i].y)*430).toBeLessThan(.7);
  }
  const travels=scene.map((item,i)=>Math.hypot(item.x-initial[i].x,item.y-initial[i].y)*430);
  expect(travels.reduce((a,b)=>a+b)/travels.length).toBeGreaterThan(12);expect(Math.max(...travels)).toBeGreaterThan(25);
  const paused=scene.map(item=>({...item}));expect(floating.update(board,time,0,config)).toEqual(paused);
  const previous=new Map(scene.map(item=>[item.id,{...item}])),top=scene.reduce((a,b)=>a.z>b.z?a:b);
  board.splice(board.findIndex(item=>item.id===top.id),1);const after=floating.update(board,time+1/60,1/60,config);
  expect(after).toHaveLength(98);expect(floating.pendingRefills).toBeGreaterThan(0);expect(floating.pendingRefills).toBeLessThanOrEqual(5);
  for(const item of after){const before=previous.get(item.id)!;expect(Math.hypot(item.x-before.x,item.y-before.y)*430).toBeLessThan(.7);expect(item.z).toBe(before.z);}
});
it('keeps inventory, depth, draw order and object identities throughout forty seconds of idle motion',()=>{
  const config=getLevel(2),board=spawn(config,71),floating=new FloatingScene(),initial=floating.update(board,0,0,config);
  const identities=new Map(initial.map(item=>[item.id,item])),order=floating.drawOrder,ids=order.map(item=>item.id);
  for(let frame=1;frame<=2400;frame++){
    const scene=floating.update(board,frame/60,1/60,config);expect(floating.drawOrder).toBe(order);expect(scene).toHaveLength(99);expect(floating.pendingRefills).toBe(0);
    for(let i=0;i<scene.length;i++){expect(scene[i]).toBe(identities.get(scene[i].id));expect(scene[i].z).toBe(board[i].z);expect('surface' in scene[i]).toBe(false);}
  }
  expect(order.map(item=>item.id)).toEqual(ids);
},15_000); // # Allow shared CI runners time for 2400 frames while retaining every invariant assertion.
it('packs each physical layer without intersecting artwork hulls and fills its centre across seeds',()=>{
  for(const level of [1,2,25,50])for(let seed=1;seed<=20;seed++){
    const config=getLevel(level),board=spawn(config,seed),bodies=board.map(createBody);assertContained(board);
    for(const depth of new Set(board.map(item=>item.depth))){
      const layer=bodies.filter(body=>body.food.depth===depth);
      expect(layer.some(body=>Math.hypot(body.food.x-.5,body.food.y-.5)<.015)).toBe(true);
      for(let i=0;i<layer.length;i++)for(let j=i+1;j<layer.length;j++)expect(contactBetween(layer[i],layer[j],contact)).toBe(false);
    }
  }
});
it('retains opaque upper foods and does not collide foods on different layers',()=>{
  const lower=food(1,.5,.5,0,.1),upper=food(999,.5,.5,1,.3),board=[lower,upper],floating=new FloatingScene(),config=getLevel(2);
  const masks=new Map([['fishball' as const,{width:1,height:1,data:new Uint8Array([255])}]]);
  for(let frame=0;frame<=2400;frame++){
    const scene=floating.update(board,frame/60,frame?1/60:0,config);
    if(frame%120===0){expect(pickRenderedPixel(scene,.5,.5,350,350,masks)?.id).toBe(999);expect(Math.hypot(scene[0].x-scene[1].x,scene[0].y-scene[1].y)).toBeLessThan(.00001);}
  }
});
it('a pick gradually moves both same-layer and lower neighbours, retaining distant foods and pause progress',()=>{
  const config={...getLevel(2),floatSpeed:0,rotationSpeed:0},board=[food(1,.63,.5,1,.12),food(2,.72,.5,2,.12),food(3,.5,.5,2,.3),food(4,.1,.5,3,.12)];
  const floating=new FloatingScene();floating.update(board,0,0,config);board.splice(2,1);floating.update(board,1/60,1/60,config);
  expect(floating.pendingRefills).toBe(2);
  for(let frame=2;frame<=60;frame++)floating.update(board,frame/60,1/60,config);
  const first=floating.drawOrder.find(item=>item.id===1)!;
  expect(.63-first.x).toBeGreaterThan(.002);expect(.63-first.x).toBeLessThan(.03);
  const paused=floating.drawOrder.map(item=>({...item}));floating.update(board,1,0,config);expect(floating.drawOrder).toEqual(paused);expect(floating.pendingRefills).toBe(2);
  for(let frame=61;frame<=Math.ceil((refillSeconds+.5)*60);frame++){
    const before=new Map(floating.drawOrder.map(item=>[item.id,{...item}]));floating.update(board,frame/60,1/60,config);
    for(const item of floating.drawOrder){const old=before.get(item.id)!;expect(Math.hypot(item.x-old.x,item.y-old.y)*430).toBeLessThan(.7);expect(item.z).toBe(old.z);}
    assertContained(floating.drawOrder);
  }
  expect(.63-floating.drawOrder.find(item=>item.id===1)!.x).toBeGreaterThan(.07);
  expect(.72-floating.drawOrder.find(item=>item.id===2)!.x).toBeGreaterThan(.10);
  expect(floating.drawOrder.find(item=>item.id===4)!.x).toBe(.1);expect(floating.pendingRefills).toBe(0);
});
it('a small food picked at the rim still pulls visible neighbours into the nearby gap',()=>{
  const config={...getLevel(2),floatSpeed:0,rotationSpeed:0},board=[food(1,.4,.5,1,.16),food(2,.1,.5,1,.1)],scene=new FloatingScene();
  scene.update(board,0,0,config);board.splice(1,1);
  for(let frame=1;frame<=228;frame++)scene.update(board,frame/60,1/60,config);
  expect(.4-scene.drawOrder[0].x).toBeGreaterThan(.10);assertContained(scene.drawOrder);
});
it('interpolates the shuffle tool into its packed destination without an initial teleport',()=>{
  const config={...getLevel(2),rotationSpeed:0},engine=new GameEngine(2,41),board=engine.snapshot.board,floating=new FloatingScene();engine.start();
  const before=new Map(floating.update(board,0,0,config).map(item=>[item.id,{...item}]));expect(engine.useTool('shuffle').used).toBe(true);
  const next=floating.update(board,1/60,1/60,config,false,true);
  for(const item of next){const old=before.get(item.id)!;expect(Math.hypot(item.x-old.x,item.y-old.y)*430).toBeLessThan(1);}
  for(let frame=2;frame<=39;frame++)floating.update(board,frame/60,1/60,config,false,true);
  for(let i=0;i<board.length;i++)expect(Math.hypot(next[i].x-board[i].x,next[i].y-board[i].y)*430).toBeLessThan(.01);
  assertContained(next);expect(new Set(next.map(item=>item.id)).size).toBe(99);
});
it('approaching same-layer foods bounce rather than passing through each other',()=>{
  const config={...getLevel(2),rotationSpeed:0},board=[food(1,.415,.5,0,.16,0),food(2,.585,.5,0,.16,Math.PI)];
  const separate=board.map((item,index)=>({...item,depth:index})),scene=new FloatingScene(),control=new FloatingScene();scene.update(board,0,0,config);control.update(separate,0,0,config);
  let minVelocity=Infinity,minControlVelocity=Infinity;
  for(let frame=1;frame<=300;frame++){
    const x=scene.drawOrder[0].x,cx=control.drawOrder[0].x;scene.update(board,frame/60,1/60,config);control.update(separate,frame/60,1/60,config);
    minVelocity=Math.min(minVelocity,(scene.drawOrder[0].x-x)*60);minControlVelocity=Math.min(minControlVelocity,(control.drawOrder[0].x-cx)*60);
    if(contactBetween(createBody(scene.drawOrder[0]),createBody(scene.drawOrder[1]),contact))expect(contact.distance*430).toBeLessThan(.02);
    expect(scene.drawOrder[0].x).toBeLessThan(scene.drawOrder[1].x);
  }
  expect(minVelocity).toBeLessThan(-.001);expect(minControlVelocity).toBeGreaterThan(0);
  expect(control.drawOrder[0].x-scene.drawOrder[0].x).toBeGreaterThan(.02);
});
it('smaller bodies yield more than larger bodies in the same contact',()=>{
  // # Explicit fixture sizes isolate the mass response; production size remains fixed per food category.
  const config={...getLevel(2),rotationSpeed:0},board=[food(1,.40,.5,0,.12,0),food(2,.60,.5,0,.24,Math.PI)],separate=board.map((item,index)=>({...item,depth:index}));
  const scene=new FloatingScene(),control=new FloatingScene();scene.update(board,0,0,config);control.update(separate,0,0,config);
  for(let frame=1;frame<=180;frame++){scene.update(board,frame/60,1/60,config);control.update(separate,frame/60,1/60,config);}
  const small=Math.abs(scene.drawOrder[0].x-control.drawOrder[0].x),large=Math.abs(scene.drawOrder[1].x-control.drawOrder[1].x);
  expect(small).toBeGreaterThan(.01);expect(small).toBeGreaterThan(large*2);
});
it('keeps contact motion consistent when frame intervals vary',()=>{
  const config=getLevel(2),board=spawn(config,14),fast=new FloatingScene(),slow=new FloatingScene();fast.update(board,0,0,config);slow.update(board,0,0,config);
  for(let frame=1;frame<=600;frame++)fast.update(board,frame/60,1/60,config);
  for(let frame=1;frame<=300;frame++)slow.update(board,frame/30,1/30,config);
  for(let i=0;i<board.length;i++)expect(Math.hypot(fast.drawOrder[i].x-slow.drawOrder[i].x,fast.drawOrder[i].y-slow.drawOrder[i].y)*430).toBeLessThan(.01);
});
it('resolves an opted-in reduced-motion refill without starting idle motion',()=>{
  const config=getLevel(2),board=[food(1,.65,.5,0,.12),food(2,.5,.5,1,.30)],scene=new FloatingScene();
  const initial=scene.update(board,0,0,config,true).map(item=>({...item}));expect(scene.update(board,8,1/60,config,true)).toEqual(initial);
  board.splice(1,1);scene.update(board,8,1/60,config,true);expect(scene.pendingRefills).toBe(0);expect(scene.drawOrder[0].x).toBeLessThan(.55);assertContained(scene.drawOrder);
});
it('removes detached atlas neighbours while preserving the food body, holes and edge antialiasing',()=>{
  const width=24,height=24,pixels=new Uint8ClampedArray(width*height*4);
  const set=(x:number,y:number,alpha=255)=>{const at=(y*width+x)*4;pixels[at]=237;pixels[at+1]=91;pixels[at+3]=alpha;};
  for(let y=6;y<17;y++)for(let x=7;x<18;x++)if(!(x===11&&y===11))set(x,y);
  for(let y=5;y<14;y++)set(0,y);set(6,10,20);
  const result=cleanSpritePixels(pixels,width,height);
  expect(result.pixels[(10*width)*4+3]).toBe(0);expect(result.pixels[(10*width+6)*4+3]).toBe(20);expect(result.pixels[(11*width+11)*4+3]).toBe(0);expect(result.pixels[(12*width+12)*4+3]).toBe(255);
  expect(result.bounds.x).toBe(6);expect(result.bounds.width).toBe(12);expect(pixels[(10*width)*4+3]).toBe(255);
});
