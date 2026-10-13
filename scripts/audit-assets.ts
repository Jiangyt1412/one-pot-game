import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {cleanSpritePixels} from '../src/game/SpriteSanitizer';
import {itemOrder,items} from '../src/config/items';
import {spawn} from '../src/game/SpawnManager';
import {getLevel} from '../src/config/levels';
import {FloatingScene} from '../src/game/FloatingScene';
import {pickRenderedPixel,type AlphaMask} from '../src/game/FoodHitTest';
import type {ItemKind} from '../src/game/types';
// # Inspect the actual food pixels; this is an asset preview, not a browser or application screenshot.
const sharp=createRequire(process.env.SHARP_MODULE_ROOT||import.meta.url)('sharp');
const masks=new Map<ItemKind,AlphaMask>(),report:object[]=[],thumbs:object[]=[];
for(const [index,kind] of itemOrder.entries()){
  const {data,info}=await sharp(`public${items[kind].src}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const input=new Uint8ClampedArray(data),clean=cleanSpritePixels(input,info.width,info.height),b=clean.bounds;
  let before=0,after=0;for(let p=0;p<info.width*info.height;p++){if(input[p*4+3]>=16)before++;if(clean.pixels[p*4+3]>=16)after++;}
  const cropped=sharp(Buffer.from(clean.pixels),{raw:{width:info.width,height:info.height,channels:4}}).extract({left:b.x,top:b.y,width:b.width,height:b.height});
  const thumb=await cropped.resize(112,112,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  thumbs.push({input:thumb,left:8+(index%7)*128,top:8+Math.floor(index/7)*128});
  // # Preserve the same 87.5 percent normalization as the Canvas loader; do not stretch the subject.
  const padded=await sharp(thumb).extend({top:8,bottom:8,left:8,right:8,background:{r:0,g:0,b:0,alpha:0}}).raw().toBuffer();
  const alpha=new Uint8Array(128*128);for(let at=0;at<alpha.length;at++)alpha[at]=padded[at*4+3]>=16?padded[at*4+3]:0;
  masks.set(kind,{width:128,height:128,data:alpha});
  if(!before||!after||after>before)throw new Error(`Invalid cleaned sprite ${kind}`);
  report.push({kind,source:[info.width,info.height],removedOpaquePixels:before-after,bounds:b});
}
const board=spawn(getLevel(1),1729),floating=new FloatingScene();let scene=floating.update(board,0,0,getLevel(1));
for(let frame=1;frame<=300;frame++)scene=floating.update(board,frame/60,1/60,getLevel(1));
let samples=0,covered=0,centreSamples=0,centreCovered=0;for(let y=0;y<65;y++)for(let x=0;x<65;x++){const u=(x+.5)/65,v=(y+.5)/65,r=Math.hypot(u-.5,v-.5);if(r<.49/1.18){samples++;const hit=pickRenderedPixel(scene,u,v,350,350,masks);if(hit)covered++;if(r<.12){centreSamples++;if(hit)centreCovered++;}}}
// # Use real cleaned alpha masks to check the centre during idle drift, without any click or refill.
let centreChecks=0,emptyCentres=0;
for(const level of [1,2,25,50])for(let seed=1;seed<=20;seed++){
  const config=getLevel(level),testBoard=spawn(config,seed),testScene=new FloatingScene();
  for(let frame=0;frame<=2400;frame++){
    const current=testScene.update(testBoard,frame/60,frame?1/60:0,config);
    if(frame%120===0){centreChecks++;if(!pickRenderedPixel(current,.5,.5,350,350,masks))emptyCentres++;}
  }
}
if(emptyCentres)throw new Error(`Empty centre in ${emptyCentres}/${centreChecks} sampled scenes`);
const result={assets:report,coverage:{level:1,seed:1729,time:5,bowlRadiusInCanvas:.49/1.18,samples,covered,percent:Number((covered/samples*100).toFixed(1)),centreSamples,centreCovered,centrePercent:Number((centreCovered/centreSamples*100).toFixed(1))},centreAudit:{levels:[1,2,25,50],seedsPerLevel:20,sampledTimes:'0 to 40 seconds at 2-second intervals',checks:centreChecks,empty:emptyCentres},note:'Coverage is a sampled model calculation. The sheet shows food assets only; neither result is browser UI validation.'};
await writeFile('docs/art/asset-audit-v18.json',JSON.stringify(result,null,2));
await sharp({create:{width:896,height:512,channels:4,background:'#fff4df'}}).composite(thumbs).jpeg({quality:90}).toFile('docs/art/food-contact-sheet-v15.jpg');
console.log(JSON.stringify({assetCount:report.length,coverage:result.coverage,centreAudit:result.centreAudit},null,2));
