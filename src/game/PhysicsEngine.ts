import type { FoodItem, LevelConfig } from './types';
import { gameConfig } from '../config/gameConfig';
// # Cleaned sprites occupy 87.5% of the square; .63 bounds their opaque diagonal, not empty corners.
// # Idle floating changes position and angle only. Depth never rotates on a timer.
export const surfaceSpeed=(config:LevelConfig)=>config.floatSpeed*.75;
export const driftAmplitude={x:.058,y:.050};
export function containFood(item:{x:number;y:number},size:number){
  const radius=.48-size*.63,dx=item.x-.5,dy=item.y-.5,d=Math.hypot(dx,dy);
  if(d>radius){item.x=.5+dx/d*radius;item.y=.5+dy/d*radius;}
}
export interface FoodPose {x:number;y:number;angle:number;z:number;}
// # A reusable output avoids creating one temporary pose object per food on every animation frame.
export function writePose(item:FoodItem,time:number,config:LevelConfig,reduced:boolean,p:FoodPose) {
  const wave=reduced?0:Math.sin(time*surfaceSpeed(config)+item.phase);
  p.x=item.x+wave*driftAmplitude.x;p.y=item.y+(reduced?0:Math.cos(time*surfaceSpeed(config)*1.13+item.phase)*driftAmplitude.y);
  p.angle=item.angle+wave*config.rotationSpeed;p.z=item.z;
  containFood(p,item.size);return p;
}
export function pose(item:FoodItem,time:number,config:LevelConfig,reduced=false) {
  return writePose(item,time,config,reduced,{x:0,y:0,angle:0,z:0});
}
export function visibleRatio(item:FoodItem,board:readonly FoodItem[]):number {
  const above=board.filter(other=>other.id!==item.id&&other.z>item.z&&Math.hypot(other.x-item.x,other.y-item.y)<(other.size+item.size)*.43);
  if(!above.length)return 1;
  let clear=0, total=0;
  for(let ring=0;ring<3;ring++) for(let s=0;s<(ring===0?1:12);s++) {
    const a=s*Math.PI/6, r=item.size*0.38*ring/2;
    const x=item.x+Math.cos(a)*r,y=item.y+Math.sin(a)*r;
    if(!above.some(o=>Math.hypot(o.x-x,o.y-y)<o.size*0.38))clear++;
    total++;
  }
  return clear/total;
}
export function isClickable(item:FoodItem,board:readonly FoodItem[]) { return visibleRatio(item,board)>=gameConfig.visibilityThreshold; }
export function pickAt(board:readonly FoodItem[],x:number,y:number,time:number,config:LevelConfig,reduced=false,canvasWidth=375):FoodItem|undefined {
  const ordered=[...board].sort((a,b)=>b.z-a.z);
  // # First respect the topmost physical silhouette; expanded touch targets never pierce another object.
  const direct=ordered.find(i=> {const p=pose(i,time,config,reduced);return Math.hypot(p.x-x,p.y-y)<i.size*0.4;});
  if(direct)return isClickable(direct,board)?direct:undefined;
  return ordered.filter(i=>isClickable(i,board)&&Math.hypot(pose(i,time,config,reduced).x-x,pose(i,time,config,reduced).y-y)<Math.max(i.size*0.5,22/canvasWidth))
    .sort((a,b)=>{const pa=pose(a,time,config,reduced),pb=pose(b,time,config,reduced);return Math.hypot(pa.x-x,pa.y-y)-Math.hypot(pb.x-x,pb.y-y);})[0];
}
