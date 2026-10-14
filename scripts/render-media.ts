import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn as startProcess, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { GameEngine } from '../src/game/GameEngine';
import { FloatingScene } from '../src/game/FloatingScene';
import { cleanSpritePixels } from '../src/game/SpriteSanitizer';
import { pickRenderedPixel, type AlphaMask } from '../src/game/FoodHitTest';
import { getLevel } from '../src/config/levels';
import { items, itemOrder } from '../src/config/items';
import type { FoodItem, ItemKind } from '../src/game/types';
// # Render actual simulation and cleaned assets without navigating to a blocked local browser.
const require = createRequire(process.env.MEDIA_MODULE_ROOT ?? import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const ffmpeg = process.env.ONE_POT_FFMPEG;
if (!ffmpeg) throw new Error('ONE_POT_FFMPEG must name an installed FFmpeg binary');
await access(ffmpeg);
// # Fail clearly if the rendering font is unavailable, rather than publish missing Chinese glyphs.
const fontPath = process.env.ONE_POT_MEDIA_FONT ?? '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
await access(fontPath);
if (!GlobalFonts.registerFromPath(fontPath, 'GameUI')) throw new Error('Unable to load the media font');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const version = pkg.version, out = 'public/about/media';
await mkdir(out, { recursive: true });
const sprites = new Map<ItemKind, any>(), masks = new Map<ItemKind, AlphaMask>();
for (const kind of itemOrder) {
  const image = await loadImage(await readFile(`public/assets/items/${kind}.webp`));
  const raw = createCanvas(image.width, image.height), ctx = raw.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, raw.width, raw.height);
  const cleaned = cleanSpritePixels(pixels.data, raw.width, raw.height);
  pixels.data.set(cleaned.pixels); ctx.putImageData(pixels, 0, 0);
  // # Match AssetService's 87.5% normalization and actual alpha threshold.
  const size = Math.min(512, Math.max(raw.width, raw.height)), canvas = createCanvas(size, size), target = canvas.getContext('2d');
  const b = cleaned.bounds, scale = size * .875 / Math.max(b.width, b.height), w = b.width * scale, h = b.height * scale;
  target.drawImage(raw, b.x, b.y, b.width, b.height, (size-w)/2, (size-h)/2, w, h);
  const normalized = target.getImageData(0, 0, size, size), alpha = new Uint8Array(size*size);
  for (let i=0;i<alpha.length;i++) { if(normalized.data[i*4+3]<16) normalized.data.fill(0,i*4,i*4+4); alpha[i]=normalized.data[i*4+3]; }
  target.putImageData(normalized,0,0); sprites.set(kind,canvas); masks.set(kind,{width:size,height:size,data:alpha});
}
const broth = await loadImage(await readFile('public/assets/broth-v15.svg'));
const W=540,H=960,S=520,CX=270,CY=606,FPS=30,SECONDS=16;
// # Advance the simulation at native 30fps; keep the mobile stream small with one-second keyframes.
const VIDEO_W=450,VIDEO_H=800,MAX_RATE=800_000;
const frame=createCanvas(W,H),ctx=frame.getContext('2d');
function box(c:any,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=2;c.strokeStyle=stroke;c.stroke();}}
function text(c:any,value:string,x:number,y:number,size:number,color='#563b3b',weight=600){c.font=`${weight} ${size}px GameUI, sans-serif`;c.fillStyle=color;c.fillText(value,x,y);}
function food(c:any,kind:ItemKind,x:number,y:number,size:number,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(sprites.get(kind),-size/2,-size/2,size,size);c.restore();}
function pointFor(scene:readonly FoodItem[],item:FoodItem){
  for(const dx of [0,-.16,.16,-.30,.30])for(const dy of [0,-.16,.16,-.30,.30]){
    const c=Math.cos(item.angle),s=Math.sin(item.angle),x=item.x+(dx*c-dy*s)*item.size,y=item.y+(dx*s+dy*c)*item.size;
    if(pickRenderedPixel(scene,x,y,S,S,masks)?.id===item.id)return {x,y};
  }
  return null;
}
// # Select a reproducible demonstration seed with exposed matching food, without altering stock or targets.
let seed=1412;
for(let candidate=1412;candidate<1492;candidate++){
  const test=new GameEngine(2,candidate);test.start();const f=new FloatingScene(),scene=f.update(test.snapshot.board,0,0,getLevel(2));
  const target=test.snapshot.targets[0].kind;
  if(scene.filter(item=>item.kind===target&&pointFor(scene,item)).length>=3){seed=candidate;break;}
}
const engine=new GameEngine(2,seed);engine.start();const floating=new FloatingScene();
let scene:FoodItem[]=[],preferred=engine.snapshot.targets[0].kind;
const clicks=[4,7.2,10.4,13.6],events:any[]=[],flights:any[]=[],completions=new Map<number,any>();
let clickIndex=0,cursor:any=null,detailSaved=false;
function slots(index:number){const x=22+index*178;return [{x:x+83,y:181},{x:x+46,y:238},{x:x+120,y:238}];}
function draw(time:number){
  const state=engine.snapshot,bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#fff5df');bg.addColorStop(1,'#ffe9d5');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#efd7bb';ctx.lineWidth=.5;for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  box(ctx,20,20,500,62,19,'#fffaf0','#c88d6e');text(ctx,'第 02 关',37,59,23);text(ctx,'剩余',217,43,11,'#a67760');text(ctx,String(state.total-state.eliminated),216,67,25,'#ef703e');
  box(ctx,391,30,43,42,12,'#ffad73','#bf714e');text(ctx,'♪',404,59,27,'#fffaf0');box(ctx,457,30,43,42,12,'#ffad73','#bf714e');text(ctx,'Ⅱ',469,58,23,'#fffaf0');
  box(ctx,26,91,488,5,3,'#edccad');if(state.eliminated)box(ctx,26,91,488*state.eliminated/state.total,5,3,'#f36c45');
  for(let i=0;i<4;i++){
    const tray=state.targets[i];
    if(tray.locked){const x=385+(i-2)*73;box(ctx,x,209,63,68,13,'#cbded2','#90a596');ctx.beginPath();ctx.arc(x+32,226,7,Math.PI,0);ctx.strokeStyle='#658879';ctx.lineWidth=3;ctx.stroke();box(ctx,x+21,227,22,17,4,'#658879');text(ctx,'解锁',x+15,260,13,'#658879');continue;}
    const match=completions.get(i),age=match?time-match.time:99,old=age<.56,kind=old?match.kind:tray.kind,count=old?3:tray.count;
    const x=22+i*178;box(ctx,x+29,108,110,34,11,'#fffdf3','#c68e6b');if(kind)food(ctx,kind,x+55,126,42);text(ctx,'×3',x+82,132,20,'#724e3c');
    ctx.save();if(age>=.2&&age<.56){const p=(age-.2)/.36;ctx.translate(p*240,-p*60);}else if(age>=.56&&age<.94){const p=1-(age-.56)/.38;ctx.translate(-p*230,-p*25);}
    box(ctx,x,150,166,133,24,'#d9bea1','#b7836b');box(ctx,x,146,166,130,22,'#fff6e3','#b7836b');box(ctx,x+13,158,140,104,13,'#fff9ed','#e5cbaa');
    for(const [slot,p] of slots(i).entries()){ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.setLineDash([3,3]);ctx.strokeStyle='#c4a085';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);if(slot<count&&kind)food(ctx,kind,p.x,p.y,64);}
    ctx.restore();
  }
  text(ctx,'暂存',112,307,12,'#ad795f');for(let i=0;i<3;i++){const x=112+i*74;box(ctx,x,319,64,41,12,'#fff9ec','#c6a58b');if(state.holding[i])food(ctx,state.holding[i].kind,x+32,338,53);}box(ctx,334,319,55,42,12,'#fcebcf','#d1af8a');text(ctx,'+',353,348,24,'#b9946b');
  // # Use the same projected food positions, rotation, full opacity and circular clipping as PotCanvas.
  ctx.save();ctx.shadowColor='#6f5b4250';ctx.shadowBlur=14;ctx.shadowOffsetY=8;box(ctx,9,CY-44,59,90,15,'#efa97a','#737a69');box(ctx,472,CY-44,59,90,15,'#efa97a','#737a69');ctx.restore();
  ctx.beginPath();ctx.arc(CX,CY,256,0,Math.PI*2);const rim=ctx.createLinearGradient(40,360,500,820);rim.addColorStop(0,'#fffdf0');rim.addColorStop(.45,'#bbc6b9');rim.addColorStop(.8,'#f4f6e8');rim.addColorStop(1,'#8a9a85');ctx.fillStyle=rim;ctx.fill();ctx.strokeStyle='#627660';ctx.lineWidth=4;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(CX,CY,224,0,Math.PI*2);ctx.clip();ctx.drawImage(broth,CX-224,CY-224,448,448);ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(CX,CY,S*.49,0,Math.PI*2);ctx.clip();
  for(const item of floating.drawOrder)food(ctx,item.kind,CX+(item.x-.5)*S,CY+(item.y-.5)*S,item.size*S,item.angle);
  ctx.restore();ctx.strokeStyle='#fffdf0a8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(CX,CY+2,250,.27*Math.PI,.73*Math.PI);ctx.stroke();
  for(const [i,label]of ['摇一摇','自动匹配','撤回暂存'].entries()){const x=104+i*166;box(ctx,x-30,886,60,54,17,['#ff9964','#4db3b7','#ffc369'][i],['#c56b48','#31828e','#c29443'][i]);text(ctx,['≋','✦','↶'][i],x-13,923,33,'#fffaf0');text(ctx,label,x-(label.length*6),956,12,'#9b674b');}
  for(const flight of flights){const p=Math.min(1,(time-flight.time)/.35);if(p<0||p>=1)continue;const ease=1-(1-p)**3;food(ctx,flight.kind,flight.from.x+(flight.to.x-flight.from.x)*ease,flight.from.y+(flight.to.y-flight.from.y)*ease,flight.size+(58-flight.size)*ease);}
  if(cursor&&time-cursor.time<.55){const p=(time-cursor.time)/.55;ctx.beginPath();ctx.arc(cursor.x,cursor.y,13+p*19,0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${1-p})`;ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.arc(cursor.x,cursor.y,7,0,Math.PI*2);ctx.fillStyle='#ff7045';ctx.fill();}
}
const video=`${out}/demo-v${version}.mp4`;
// # Lossless RGB frames are converted to limited-range BT.709 for standard H.264 playback.
const encoder=startProcess(ffmpeg,['-y','-f','image2pipe','-vcodec','png','-framerate',String(FPS),'-i','-','-an','-vf',`scale=${VIDEO_W}:${VIDEO_H}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,colorspace=iall=bt709:itrc=srgb:irange=tv:all=bt709:range=tv,setsar=1,sidedata=delete:type=ICC_PROFILE`,'-c:v','libx264','-preset','medium','-crf','27','-maxrate',String(MAX_RATE),'-bufsize',String(MAX_RATE*2),'-g',String(FPS),'-keyint_min',String(FPS),'-sc_threshold','0','-refs','1','-pix_fmt','yuv420p','-profile:v','baseline','-level','3.1','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-map_metadata','-1','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});
let log='';encoder.stderr.on('data',chunk=>{log+=chunk.toString();});
const closed=new Promise<void>((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(new Error(log)));});
for(let n=0;n<FPS*SECONDS;n++){
  const time=n/FPS;scene=floating.update(engine.snapshot.board,time,n?1/FPS:0,getLevel(2),false,false,engine.nextTargets);
  if(clickIndex<clicks.length&&time>=clicks[clickIndex]){
    const targetKinds=engine.snapshot.targets.filter(t=>!t.locked&&t.kind).map(t=>t.kind!);
    const options=scene.filter(item=>targetKinds.includes(item.kind)).sort((a,b)=>Number(b.kind===preferred)-Number(a.kind===preferred)||b.z-a.z);
    for(const item of options){const p=pointFor(scene,item);if(!p)continue;
      if(engine.pick(item.id,true,scene)){
        const effects=engine.drainEffects();events.push({time,kind:item.kind,itemId:item.id,pixelVerified:true,point:p,effects:effects.map(e=>e.type)});
        cursor={x:CX+(p.x-.5)*S,y:CY+(p.y-.5)*S,time};
        for(const effect of effects){if(effect.type==='match'&&effect.tray!==undefined){completions.set(effect.tray,{time,kind:effect.kind});preferred=engine.snapshot.targets[effect.tray].kind;}if(effect.type==='pick'&&effect.item&&effect.tray!==undefined){flights.push({time,kind:effect.item.kind,from:{x:CX+(effect.item.x-.5)*S,y:CY+(effect.item.y-.5)*S},to:slots(effect.tray)[effect.slot??0],size:effect.item.size*S});}}
        clickIndex++;break;
      }
    }
  }
  draw(time);
  if(n===FPS*2)await writeFile(`${out}/gameplay-v${version}.jpg`,await frame.encode('jpeg',94));
  if(n===Math.round(FPS*12.5)){await writeFile(`${out}/gameplay-detail-v${version}.jpg`,await frame.encode('jpeg',94));detailSaved=true;}
  if(!encoder.stdin.write(await frame.encode('png')))await once(encoder.stdin,'drain');
}
encoder.stdin.end();await closed;
if(events.length<3||!detailSaved)throw new Error('Demonstration did not complete enough legal selections');
// # The gallery uses current normalized food sprites rather than invented food or fake browser screenshots.
const guide=createCanvas(900,1120),g=guide.getContext('2d');g.fillStyle='#fff7e6';g.fillRect(0,0,900,1120);text(g,'28 种美味，轮流上锅。',38,60,32);text(g,`一锅端 · v${version}`,39,91,16,'#309fa1');
itemOrder.forEach((kind,index)=>{const x=24+(index%4)*219,y=123+Math.floor(index/4)*137;box(g,x,y,198,120,16,'#fffdf4','#edd5bd');food(g,kind,x+99,y+48,105);text(g,items[kind].name,x+99-g.measureText(items[kind].name).width/2,y+108,16,'#8c654b');});
await writeFile(`${out}/food-guide-v${version}.jpg`,await guide.encode('jpeg',94));
const poster=await loadImage(await readFile(`${out}/gameplay-v${version}.jpg`));
const hero=createCanvas(1920,1080),h=hero.getContext('2d'),bg=h.createLinearGradient(0,0,1920,1080);bg.addColorStop(0,'#fff6e3');bg.addColorStop(1,'#ffe2c7');h.fillStyle=bg;h.fillRect(0,0,1920,1080);
box(h,85,78,330,62,31,'#d4eae0');text(h,`VERSION ${version} · 修订中`,110,119,23,'#397e7c');
text(h,'好东西，',86,369,125,'#563b3b',900);text(h,'一锅端。',78,525,177,'#fb7847',900);text(h,'满满一锅美味，等你眼疾手快。',88,625,35,'#9b6f54',500);
box(h,85,699,304,84,42,'#309fa1');text(h,'打开就玩  ↗',131,752,33,'#fffaf0',800);
text(h,'99 件 / 每关 15 种 / 50 关',88,842,26,'#966a50',600);text(h,'游戏引擎画面 · 离线渲染',88,995,20,'#b08b72',400);
h.save();h.translate(1260,64);h.rotate(.055);box(h,-17,-17,533,947,43,'#e5b895');box(h,-10,-10,520,933,37,'#fff9ed');h.save();h.beginPath();h.roundRect(0,0,500,889,30);h.clip();h.drawImage(poster,0,0,500,889);h.restore();h.restore();
food(h,'corn',1070,150,175,-.2);food(h,'shrimp',1838,846,155,.25);food(h,'dumpling',1081,933,150,-.1);
await writeFile(`${out}/hero-v${version}.jpg`,await hero.encode('jpeg',94));
await promisify(execFile)(ffmpeg,['-y','-ss','3','-t','6','-i',video,'-vf','fps=8,scale=270:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4','-loop','0',`${out}/preview-v${version}.gif`],{maxBuffer:2_000_000});
const names=[`hero-v${version}.jpg`,`gameplay-v${version}.jpg`,`gameplay-detail-v${version}.jpg`,`food-guide-v${version}.jpg`,`demo-v${version}.mp4`,`preview-v${version}.gif`];
const files=[];for(const name of names){const bytes=await readFile(`${out}/${name}`);files.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(`${out}/media-manifest.json`,JSON.stringify({engineVersion:version,date:pkg.gameRelease.date,provenance:'offline-engine-render',note:'GameEngine and FloatingScene run at normal game time. UI is a Canvas illustration, not a browser screenshot. Automated selections are checked against actual cleaned alpha masks. No audio or microphone test.',level:2,seed,fps:FPS,duration:SECONDS,frames:FPS*SECONDS,video:{width:VIDEO_W,height:VIDEO_H,codec:'H.264 Constrained Baseline',pixelFormat:'yuv420p',colorRange:'limited',colorSpace:'BT.709',keyframeIntervalSeconds:1,maxBitrate:MAX_RATE,fastStart:true},events,files},null,2));
console.log(JSON.stringify({version,seed,legalSelections:events.length,matches:events.filter(e=>e.effects.includes('match')).length,seconds:SECONDS,files}));
