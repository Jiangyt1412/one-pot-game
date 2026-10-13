import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
// # Sprite packing only: preserve generated alpha, crop the fixed 5×5 atlas, encode lossless WebP.
const require=createRequire(process.env.SHARP_MODULE_ROOT||import.meta.url);
const sharp=require('sharp');
const source='docs/art/food-atlas-v2.png';
const order=['shrimp','dumpling','broccoli','chicken','mushroom','cabbage','corn','tofu','crab','fishball','beef','lotus','carrot','egg','wonton','lettuce','siu-mai','bun','strawberry','orange','watermelon','cake','donut'];
const {width,height}=await sharp(source).metadata();
await mkdir('public/assets/items',{recursive:true});
for(const [index,kind] of order.entries()){
  const col=index%5,row=Math.floor(index/5);
  const left=Math.floor(col*width/5),top=Math.floor(row*height/5);
  const w=Math.floor((col+1)*width/5)-left,h=Math.floor((row+1)*height/5)-top;
  await sharp(source).extract({left,top,width:w,height:h}).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({lossless:true}).toFile(`public/assets/items/${kind}.webp`);
}
console.log(`Packed ${order.length} transparent sprites from ${width}×${height} atlas.`);
