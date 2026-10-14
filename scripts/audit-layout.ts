import {readFile,writeFile} from 'node:fs/promises';
import {GameEngine} from '../src/game/GameEngine';
import {foodSizes} from '../src/config/items';
import {createBody,contactBetween,type CollisionBody} from '../src/game/CollisionGeometry';
// # Quantify layout bias across seeded games; convex coverage is not an alpha-pixel or phone-playability proof.
const {version}=JSON.parse(await readFile('package.json','utf8')),start=performance.now();
let scenes=0,largeFoods=0,largeCentral=0,largeRadius=0,centreCovered=0,maxHullRadius=0;
const kinds=new Map<string,{count:number;sectors:number[];central:number}>(),contact={x:0,y:0,distance:0};
function coversCentre(body:CollisionBody){
  for(let i=0;i<body.axes.length;i+=2){const x=body.axes[i],y=body.axes[i+1],v=.5*x+.5*y;let lo=Infinity,hi=-Infinity;
    for(let j=0;j<body.points.length;j+=2){const p=body.points[j]*x+body.points[j+1]*y;lo=Math.min(lo,p);hi=Math.max(hi,p);}if(v<lo||v>hi)return false;
  }return true;
}
for(let level=1;level<=50;level++)for(let seed=1;seed<=20;seed++){
  const engine=new GameEngine(level,seed),board=engine.snapshot.board,bodies=board.map(createBody);scenes++;
  if(board.length!==99||new Set(board.map(food=>food.id)).size!==99)throw new Error('Invalid initial stock');
  if(bodies.some(coversCentre))centreCovered++;
  for(let i=0;i<bodies.length;i++){
    const body=bodies[i],food=body.food,radius=Math.hypot(food.x-.5,food.y-.5);
    if(food.size!==foodSizes[food.kind])throw new Error('Changed same-kind size');
    let row=kinds.get(food.kind);if(!row){row={count:0,sectors:[0,0,0,0],central:0};kinds.set(food.kind,row);}row.count++;row.sectors[(food.x>=.5?1:0)+(food.y>=.5?2:0)]++;if(radius<.025)row.central++;
    if(food.size>=.37){largeFoods++;largeRadius+=radius;if(radius<.025)largeCentral++;}
    for(let p=0;p<body.points.length;p+=2)maxHullRadius=Math.max(maxHullRadius,Math.hypot(body.points[p]-.5,body.points[p+1]-.5));
    for(let j=i+1;j<bodies.length;j++)if(food.depth===bodies[j].food.depth&&contactBetween(body,bodies[j],contact))throw new Error('Initial same-layer overlap');
  }
}
const report={version,levels:50,seedsPerLevel:20,scenes,milliseconds:Math.round(performance.now()-start),foods:scenes*99,largeFoods,centreDefinitionRadius:.025,largeFoodsCentred:largeCentral,largeCentreRatio:largeCentral/largeFoods,largeAverageCentreDistance:largeRadius/largeFoods,convexHullCentreCoverage:centreCovered/scenes,maxHullRadius,initialSameLayerOverlap:0,kinds:Object.fromEntries(kinds),note:'All sizes and stock are preserved. Legal positions are weighted by rotated hull bounds and lightly by preplanned orders, not a mathematically uniform distribution of every opaque pixel. Convex hull coverage can include sprite holes. No phone performance or full geometric solvability test.'};
if(report.largeCentreRatio>=.04||report.largeAverageCentreDistance<=.12||report.convexHullCentreCoverage<.97||maxHullRadius>.478001||[...kinds.values()].some(row=>row.sectors.some(count=>count===0)))throw new Error(`Layout audit failed: ${JSON.stringify(report)}`);
await writeFile(`docs/art/layout-audit-v${version.replaceAll('.','-')}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,kinds:undefined},null,2));
