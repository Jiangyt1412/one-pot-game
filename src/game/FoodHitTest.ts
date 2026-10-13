import type { FoodItem, ItemKind } from './types';
export interface AlphaMask {width:number;height:number;data:Uint8Array;}
// # Hit testing uses the same rotation, size and alpha as drawing, allowing exposed lower-layer pixels.
export function pickRenderedPixel(board:readonly FoodItem[],x:number,y:number,width:number,height:number,masks:ReadonlyMap<ItemKind,AlphaMask>):FoodItem|undefined {
  const ordered=[...board].sort((a,b)=>b.z-a.z);
  for(const item of ordered){
    const mask=masks.get(item.kind);if(!mask)continue;
    const dx=(x-item.x)*width,dy=(y-item.y)*height,c=Math.cos(item.angle),s=Math.sin(item.angle),size=item.size*width;
    const u=(dx*c+dy*s)/size+.5,v=(-dx*s+dy*c)/size+.5;
    if(u<0||u>=1||v<0||v>=1)continue;
    // # Drawing has one opaque pass. Only a transparent source pixel permits reaching the food below.
    if(mask.data[Math.floor(v*mask.height)*mask.width+Math.floor(u*mask.width)]>=16)return item;
  }
}
