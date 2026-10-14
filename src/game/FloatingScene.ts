import type {FoodItem,ItemKind,LevelConfig} from './types';
import {driftAmplitude,surfaceSpeed} from './PhysicsEngine';
import {createBody,updateBody,moveBody,containBody,contactBetween,type CollisionBody} from './CollisionGeometry';
interface MotionEntry {
  food:FoodItem;body:CollisionBody;vx:number;vy:number;anchorX:number;anchorY:number;baseAngle:number;
  fromX:number;fromY:number;toX:number;toY:number;elapsed:number;
  shuffleFromX:number;shuffleFromY:number;shuffleFromAngle:number;shuffleElapsed:number;
}
export const refillSeconds=3.8;
const shuffleSeconds=.65;
// # Persistent bodies collide only within their physical layer. Picking creates a local current without depth swaps.
export class FloatingScene {
  private source:readonly FoodItem[]|null=null;
  private entries=new Map<number,MotionEntry>();
  private scene:FoodItem[]=[];
  private ordered:FoodItem[]=[];
  private layers:MotionEntry[][]=[];
  private contact={x:0,y:0,distance:0};
  get drawOrder():readonly FoodItem[]{return this.ordered;}
  get pendingRefills(){let count=0;for(const entry of this.entries.values())if(entry.elapsed<refillSeconds)count++;return count;}
  reset(){this.source=null;this.entries.clear();this.scene=[];this.ordered=[];this.layers=[];}
  private fillVacancy(removed:FoodItem,ids:ReadonlySet<number>,upcoming:ReadonlySet<ItemKind>){
    const nearby=[...this.entries.values()].filter(entry=>{
      const food=entry.food,d=Math.hypot(food.x-removed.x,food.y-removed.y);
      const ripple=food.depth===removed.depth?.22:.11;
      return ids.has(food.id)&&d<(food.size+removed.size)*.48+ripple;
    });
    const distance=(entry:MotionEntry)=>Math.hypot(entry.food.x-removed.x,entry.food.y-removed.y);
    // # Future-order food receives a small tie-break among already-nearby neighbours, without promotion or teleporting.
    const priority=(entry:MotionEntry)=>distance(entry)*(upcoming.has(entry.food.kind)?.78:1);
    // # Prioritize the clicked layer so visible neighbours change layout, rather than moving only hidden central foods.
    const same=nearby.filter(entry=>entry.food.depth===removed.depth).sort((a,b)=>priority(a)-priority(b)).slice(0,3);
    const lower=nearby.filter(entry=>entry.food.depth<removed.depth).sort((a,b)=>b.food.depth-a.food.depth||priority(a)-priority(b)).slice(0,5-same.length);
    const neighbours=[...same,...lower];
    for(const entry of neighbours){
      const food=entry.food,dx=removed.x-food.x,dy=removed.y-food.y,d=Math.hypot(dx,dy),pull=Math.min(.13,d*.72);
      entry.fromX=food.x;entry.fromY=food.y;entry.toX=food.x+(d?dx/d*pull:0);entry.toY=food.y+(d?dy/d*pull:0);entry.elapsed=0;
    }
  }
  private contacts(reduced=false){
    const contact=this.contact;
    // # Extra short passes resolve crowded rim contacts; inverse area makes small foods yield more than large ones.
    for(let pass=0;pass<6;pass++)for(const layer of this.layers)for(let i=0;i<layer.length;i++)for(let j=i+1;j<layer.length;j++){
      const a=layer[i],b=layer[j];if(!contactBetween(a.body,b.body,contact))continue;
      const ia=1/(a.food.size*a.food.size),ib=1/(b.food.size*b.food.size),sum=ia+ib;
      const correction=Math.min(reduced?1:.003,Math.max(0,contact.distance-.00001)*.96);
      moveBody(a.body,-contact.x*correction*ia/sum,-contact.y*correction*ia/sum);
      moveBody(b.body,contact.x*correction*ib/sum,contact.y*correction*ib/sum);
      const approach=(b.vx-a.vx)*contact.x+(b.vy-a.vy)*contact.y;
      if(approach<0){const impulse=-1.28*approach/sum;a.vx-=impulse*ia*contact.x;a.vy-=impulse*ia*contact.y;b.vx+=impulse*ib*contact.x;b.vy+=impulse*ib*contact.y;}
      containBody(a.body);containBody(b.body);
    }
  }
  update(board:readonly FoodItem[],time:number,dt:number,config:LevelConfig,reduced=false,rearranging=false,upcoming:readonly (ItemKind|null)[]=[]):FoodItem[]{
    if(this.source!==board){this.reset();this.source=board;}
    let changed=this.scene.length!==board.length;
    const ids=changed?new Set(board.map(item=>item.id)):null;
    if(ids){const hints=new Set(upcoming.filter((kind):kind is ItemKind=>!!kind));for(const entry of this.entries.values())if(!ids.has(entry.food.id))this.fillVacancy(entry.food,ids,hints);for(const id of this.entries.keys())if(!ids.has(id))this.entries.delete(id);}
    for(let index=0;index<board.length;index++){
      const item=board[index];let entry=this.entries.get(item.id);
      if(!entry){const food={...item};entry={food,body:createBody(food),vx:0,vy:0,anchorX:item.x,anchorY:item.y,baseAngle:item.angle,fromX:item.x,fromY:item.y,toX:item.x,toY:item.y,elapsed:refillSeconds,shuffleFromX:item.x,shuffleFromY:item.y,shuffleFromAngle:item.angle,shuffleElapsed:shuffleSeconds};this.entries.set(item.id,entry);changed=true;}
      else if(entry.food.z!==item.z||entry.food.depth!==item.depth||entry.anchorX!==item.x||entry.anchorY!==item.y){
        entry.shuffleFromX=entry.food.x;entry.shuffleFromY=entry.food.y;entry.shuffleFromAngle=entry.food.angle;entry.shuffleElapsed=0;entry.elapsed=refillSeconds;
        entry.anchorX=item.x;entry.anchorY=item.y;entry.baseAngle=item.angle;changed=true;
      }
      entry.food.z=item.z;entry.food.depth=item.depth;entry.food.phase=item.phase;this.scene[index]=entry.food;
    }
    this.scene.length=board.length;
    if(changed){
      this.ordered=[...this.scene].sort((a,b)=>a.z-b.z);const layers=new Map<number,MotionEntry[]>();
      for(const entry of this.entries.values()){let layer=layers.get(entry.food.depth);if(!layer){layer=[];layers.set(entry.food.depth,layer);}layer.push(entry);}this.layers=[...layers.values()];
    }
    const step=Math.max(0,Math.min(dt,.05));if(!step&&!reduced)return this.scene;
    const substeps=Math.max(1,Math.ceil(step*60)),h=step/substeps,omega=surfaceSpeed(config);
    for(let sub=0;sub<substeps;sub++){
      const frameTime=time-step+(sub+1)*h;let shuffling=false;
      for(const entry of this.entries.values()){
        const food=entry.food,isShuffling=entry.shuffleElapsed<shuffleSeconds;
        if(isShuffling){
          entry.shuffleElapsed=reduced?shuffleSeconds:Math.min(shuffleSeconds,entry.shuffleElapsed+h);const t=entry.shuffleElapsed/shuffleSeconds,ease=t*t*(3-2*t);
          food.x=entry.shuffleFromX+(entry.anchorX-entry.shuffleFromX)*ease;food.y=entry.shuffleFromY+(entry.anchorY-entry.shuffleFromY)*ease;food.angle=entry.shuffleFromAngle+(entry.baseAngle-entry.shuffleFromAngle)*ease;entry.vx=entry.vy=0;shuffling=true;
        }else{
          let vx=driftAmplitude.x*omega*Math.cos(frameTime*omega+food.phase),vy=-driftAmplitude.y*omega*1.13*Math.sin(frameTime*omega*1.13+food.phase);
          const refilling=entry.elapsed<refillSeconds;
          if(refilling){
            entry.elapsed=reduced?refillSeconds:Math.min(refillSeconds,entry.elapsed+h);const t=entry.elapsed/refillSeconds,ease=t*t*(3-2*t),rate=6*t*(1-t)/refillSeconds;
            const desiredX=entry.fromX+(entry.toX-entry.fromX)*ease,desiredY=entry.fromY+(entry.toY-entry.fromY)*ease;
            vx=(entry.toX-entry.fromX)*rate+(desiredX-food.x)*2;vy=(entry.toY-entry.fromY)*rate+(desiredY-food.y)*2;
            if(reduced){food.x=desiredX;food.y=desiredY;}
          }
          if(reduced){entry.vx=entry.vy=0;}else{
            const follow=1-Math.exp(-h*(refilling?4:1.8));entry.vx+=(vx-entry.vx)*follow;entry.vy+=(vy-entry.vy)*follow;
            const speed=Math.hypot(entry.vx,entry.vy),limit=refilling?.075:.035;if(speed>limit){entry.vx*=limit/speed;entry.vy*=limit/speed;}
            food.x+=entry.vx*h;food.y+=entry.vy*h;
          }
        }
        if(!isShuffling){const angle=entry.baseAngle+(reduced?0:Math.sin(frameTime*omega+food.phase)*config.rotationSpeed);food.angle+=(angle-food.angle)*(reduced?1:1-Math.exp(-h*2));}updateBody(entry.body);
        if(containBody(entry.body)){const dx=food.x-.5,dy=food.y-.5,d=Math.hypot(dx,dy),outward=(entry.vx*dx+entry.vy*dy)/d;if(outward>0){entry.vx-=1.3*outward*dx/d;entry.vy-=1.3*outward*dy/d;}}
      }
      // # The shuffle tool intentionally changes layers; collision resolution resumes after its packed destination is reached.
      if(!shuffling&&!rearranging)this.contacts(reduced);
    }
    return this.scene;
  }
}
