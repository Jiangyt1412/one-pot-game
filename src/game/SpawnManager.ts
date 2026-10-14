import { foodSizes, levelItemOrder } from '../config/items';
import type { FoodItem, ItemKind, LevelConfig } from './types';
import {createBody,updateBody,radialLimit,contactBetween,type CollisionBody} from './CollisionGeometry';
// # Seeded randomness lets tests reproduce a player's layout precisely.
export function seededRandom(seed:number) {
  return () => { let t=seed+=0x6D2B79F5; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
function place(body:CollisionBody,random:()=>number,angle?:number):void {
  const theta=angle??random()*Math.PI*2,nx=Math.cos(theta),ny=Math.sin(theta);
  const radius=Math.sqrt(random())*Math.max(0,radialLimit(body,nx,ny)-.008);
  body.food.x=.5+nx*radius;body.food.y=.5+ny*radius;updateBody(body);
}
export function scatter(item:FoodItem, random:()=>number,_config:LevelConfig):void {
  item.angle=(random()-.5)*1.55;place(createBody(item),random);
}
// # Shuffle all sizes fairly; each layer begins at a random legal point, with no largest-food centre anchor.
export function packFoods(board:FoodItem[],random:()=>number,config:LevelConfig,upcoming:readonly (ItemKind|null)[]=[]):void {
  const pool=[...board],layers:CollisionBody[][]=[],contact={x:0,y:0,distance:0};
  const capacity=Math.max(5,Math.floor(config.totalItems/config.depthLayers));
  const pockets=new Map<ItemKind,number>();for(const kind of upcoming)if(kind&&!pockets.has(kind))pockets.set(kind,random()*Math.PI*2);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(pool.length){
    const first=pool.shift()!;first.angle=(random()-.5)*1.55;const firstBody=createBody(first);place(firstBody,random);
    const layer=[firstBody];
    for(let index=0;index<pool.length&&layer.length<capacity;){
      const item=pool[index];item.angle=(random()-.5)*1.55;const body=createBody(item);let placed=false;
      for(let attempt=0;attempt<40&&!placed;attempt++){
        // # A future order gently favours a freshly randomized sector on some trials; it never overrides collision checks.
        const pocket=pockets.get(item.kind),angle=pocket!==undefined&&random()<.3?pocket+(random()-.5)*1.5:undefined;
        place(body,random,angle);
        placed=!layer.some(other=>contactBetween(body,other,contact,.008));
      }
      if(placed){pool.splice(index,1);layer.push(body);}else index++;
    }
    layers.push(layer);
  }
  // # Put any incomplete remainder below the fuller layers, avoiding a lone food on the top of the pot.
  layers.sort((a,b)=>a.length-b.length);let z=0;
  layers.forEach((layer,depth)=>layer.forEach(({food})=>{food.depth=depth;food.z=z++;food.phase=random()*Math.PI*2;}));
}
export function spawn(config:LevelConfig,seed:number,plan?:(stock:FoodItem[])=>readonly (ItemKind|null)[]):FoodItem[] {
  const random=seededRandom(seed);
  // # Rotate a whole fifteen-kind menu from the full library; keep newcomers present from the first level.
  const staples=levelItemOrder.slice(0,5),extras=levelItemOrder.slice(5);
  const offset=((config.level-1)*3)%extras.length;
  const menu=[...extras.slice(offset),...extras.slice(0,offset)];
  const kinds=[...staples,...menu].slice(0,config.categoryCount);
  const groups=[...kinds];
  const rare=config.rareItemRatio>0?Math.max(1,Math.floor(kinds.length*config.rareItemRatio)):0;
  while(groups.length<config.totalItems/3) groups.push(kinds[Math.floor(random()*(kinds.length-rare))]);
  // # Shuffle complete triples, then scatter all members independently; there is no placement grid.
  for(let i=groups.length-1;i>0;i--) {const j=Math.floor(random()*(i+1)); [groups[i],groups[j]]=[groups[j],groups[i]];}
  const board=groups.flatMap((kind,g)=>Array.from({length:3},(_,j)=> {
    // # Identical foods always share the category size, independently of their depth.
    const size=foodSizes[kind];
    const item:FoodItem={id:g*3+j,kind,x:0,y:0,z:g*3+j,depth:0,angle:0,size,phase:random()*Math.PI*2};
    scatter(item,random,config); return item;
  }));
  // # Orders are sampled from complete stock before geometry, so placement cannot select the next menu.
  packFoods(board,random,config,plan?.(board));
  return board;
}
