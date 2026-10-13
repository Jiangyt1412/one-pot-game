import { foodSizes, levelItemOrder } from '../config/items';
import type { FoodItem, LevelConfig } from './types';
import {createBody,updateBody,containBody,contactBetween,type CollisionBody} from './CollisionGeometry';
// # Seeded randomness lets tests reproduce a player's layout precisely.
export function seededRandom(seed:number) {
  return () => { let t=seed+=0x6D2B79F5; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
export function scatter(item:FoodItem, random:()=>number, config:LevelConfig):void {
  // # Crowding directly contracts the scatter radius while preserving the rotated-sprite safety margin.
  const maxRadius=.48-item.size*.63-.012;
  const theta=random()*Math.PI*2, r=(.14+.86*Math.sqrt(random()))*maxRadius*(1-config.overlapFactor*.08);
  item.x=0.5+Math.cos(theta)*r; item.y=0.5+Math.sin(theta)*r;
  item.angle=(random()-0.5)*1.55;
}
// # Start each physical layer with a central food, then fit real artwork envelopes around it without overlap.
export function packFoods(board:FoodItem[],random:()=>number,config:LevelConfig):void {
  const pool=[...board],layers:CollisionBody[][]=[],contact={x:0,y:0,distance:0};
  const capacity=Math.max(5,Math.floor(config.totalItems/config.depthLayers));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(pool.length){
    let anchor=0;for(let i=1;i<Math.min(6,pool.length);i++)if(pool[i].size>pool[anchor].size)anchor=i;
    const [first]=pool.splice(anchor,1),theta=random()*Math.PI*2,r=random()*.014;
    first.x=.5+Math.cos(theta)*r;first.y=.5+Math.sin(theta)*r;first.angle=(random()-.5)*1.55;
    const layer=[createBody(first)];
    for(let index=0;index<pool.length&&layer.length<capacity;){
      const item=pool[index];item.angle=(random()-.5)*1.55;const body=createBody(item);let placed=false;
      for(let attempt=0;attempt<40&&!placed;attempt++){
        const a=random()*Math.PI*2,rad=Math.sqrt(random())*(.478-item.size*.32);
        item.x=.5+Math.cos(a)*rad;item.y=.5+Math.sin(a)*rad;updateBody(body);containBody(body);
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
export function spawn(config:LevelConfig,seed:number):FoodItem[] {
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
  packFoods(board,random,config);
  return board;
}
