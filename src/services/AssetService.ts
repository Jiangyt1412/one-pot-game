import { items } from '../config/items';
import type { ItemKind } from '../game/types';
import type { AlphaMask } from '../game/FoodHitTest';
import { cleanSpritePixels } from '../game/SpriteSanitizer';
// # Every food view uses the same cleaned silhouette and transparent padding, including flights and trays.
export const foodImages=new Map<ItemKind,HTMLCanvasElement>();
export const foodMasks=new Map<ItemKind,AlphaMask>();
export const foodImageUrls=new Map<ItemKind,string>();
export async function loadAssets(){await Promise.all(Object.values(items).map(item=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{try{
    const raw=document.createElement('canvas');raw.width=image.naturalWidth;raw.height=image.naturalHeight;
    const rawCtx=raw.getContext('2d');if(!rawCtx)throw new Error('Canvas unavailable');rawCtx.drawImage(image,0,0);
    const original=rawCtx.getImageData(0,0,raw.width,raw.height),cleaned=cleanSpritePixels(original.data,raw.width,raw.height);original.data.set(cleaned.pixels);rawCtx.putImageData(original,0,0);
    const canvas=document.createElement('canvas');const size=Math.min(512,Math.max(image.naturalWidth,image.naturalHeight));canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.imageSmoothingQuality='high';
    const b=cleaned.bounds,scale=size*.875/Math.max(b.width,b.height),w=b.width*scale,h=b.height*scale;
    ctx.drawImage(raw,b.x,b.y,b.width,b.height,(size-w)/2,(size-h)/2,w,h);
    const pixels=ctx.getImageData(0,0,size,size),alpha=new Uint8Array(size*size);
    for(let i=0;i<alpha.length;i++){if(pixels.data[i*4+3]<16)pixels.data.fill(0,i*4,i*4+4);alpha[i]=pixels.data[i*4+3];}ctx.putImageData(pixels,0,0);
    foodImages.set(item.id,canvas);foodMasks.set(item.id,{width:size,height:size,data:alpha});foodImageUrls.set(item.id,canvas.toDataURL('image/png'));resolve();
  }catch(error){reject(error);}};image.onerror=()=>reject(new Error(`素材无法加载：${item.name}`));image.src=item.src;
})));}
