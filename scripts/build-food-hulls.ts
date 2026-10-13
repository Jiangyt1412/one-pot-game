import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {cleanSpritePixels} from '../src/game/SpriteSanitizer';
import {itemOrder,items} from '../src/config/items';
// # Circumscribed polygons follow the cleaned artwork, including the same .875 normalization as Canvas.
const sharp=createRequire(process.env.SHARP_MODULE_ROOT||import.meta.url)('sharp');
const shapes:Record<string,number[]>=Object.create(null),sides=12;
for(const kind of itemOrder){
  const {data,info}=await sharp(`public${items[kind].src}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const clean=cleanSpritePixels(new Uint8ClampedArray(data),info.width,info.height),b=clean.bounds;
  const scale=.875/Math.max(b.width,b.height),supports=new Float64Array(sides);
  for(let n=0;n<sides;n++){
    const angle=n*Math.PI*2/sides,c=Math.cos(angle),s=Math.sin(angle);let extent=-1;
    for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++)if(clean.pixels[(y*info.width+x)*4+3]>=16){
      const u=(x+.5-b.x-b.width/2)*scale,v=(y+.5-b.y-b.height/2)*scale;
      extent=Math.max(extent,u*c+v*s);
    }
    supports[n]=extent+.005;
  }
  const points:number[]=[];
  for(let n=0;n<sides;n++){
    const a=n*Math.PI*2/sides,d=(n+1)*Math.PI*2/sides,ca=Math.cos(a),sa=Math.sin(a),cd=Math.cos(d),sd=Math.sin(d),det=ca*sd-sa*cd;
    points.push(Number(((supports[n]*sd-sa*supports[(n+1)%sides])/det).toFixed(6)),Number(((ca*supports[(n+1)%sides]-supports[n]*cd)/det).toFixed(6)));
  }
  shapes[kind]=points;
}
await writeFile('src/config/foodHulls.ts',`import type {ItemKind} from '../game/types';\n// # Generated from all 28 cleaned alpha silhouettes by scripts/build-food-hulls.ts; coordinates are sprite fractions.\nexport const foodHulls:Record<ItemKind,readonly number[]>=${JSON.stringify(shapes,null,2)};\n`);
console.log(`Built ${Object.keys(shapes).length} conservative twelve-sided food silhouettes`);
