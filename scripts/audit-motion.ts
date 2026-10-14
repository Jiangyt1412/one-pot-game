import {readFile,writeFile} from 'node:fs/promises';
import {GameEngine} from '../src/game/GameEngine';
import {getLevel} from '../src/config/levels';
import {FloatingScene} from '../src/game/FloatingScene';
import {createBody,contactBetween} from '../src/game/CollisionGeometry';
// # Model trajectories measure continuity and geometry; their CPU time is not browser FPS or real touch performance.
let maxIdleStep=0,maxPickStep=0,maxOverlap=0,maxRadius=0,totalFrames=0,maxTravel=0,changedTopNeighbours=0,topNeighbours=0;
const contact={x:0,y:0,distance:0},start=performance.now(),levels=[1,2,25,50],seedsPerLevel=20,results:object[]=[];
const {version}=JSON.parse(await readFile('package.json','utf8'));
for(const level of levels)for(let seed=1;seed<=seedsPerLevel;seed++){
  const config=getLevel(level),engine=new GameEngine(level,seed);engine.start();const board=engine.snapshot.board,controlBoard=board.map(food=>({...food})),floating=new FloatingScene(),control=new FloatingScene(),controlHints=[...engine.nextTargets];
  floating.update(board,0,0,config);control.update(controlBoard,0,0,config);
  const initial=new Map(floating.drawOrder.map(food=>[food.id,{x:food.x,y:food.y}]));let clickedDepth=-1,localChanged=0,localTotal=0;
  for(let frame=1;frame<=1200;frame++){
    const old=new Map(floating.drawOrder.map(food=>[food.id,{x:food.x,y:food.y}]));
    const scene=floating.update(board,frame/60,1/60,config,false,false,engine.nextTargets);control.update(controlBoard,frame/60,1/60,config,false,false,controlHints);totalFrames+=2;
    if(frame===600){const top=scene.reduce((a,b)=>a.z>b.z?a:b);clickedDepth=top.depth;if(!engine.pick(top.id,true,scene))throw new Error('Motion audit pick rejected');}
    for(const food of scene){
      const previous=old.get(food.id)!,travel=Math.hypot(food.x-previous.x,food.y-previous.y)*430;
      if(frame<=600)maxIdleStep=Math.max(maxIdleStep,travel);else maxPickStep=Math.max(maxPickStep,travel);
      const original=initial.get(food.id)!;maxTravel=Math.max(maxTravel,Math.hypot(food.x-original.x,food.y-original.y)*430);
    }
    if(frame===828){const controls=new Map(control.drawOrder.map(food=>[food.id,food]));for(const food of scene)if(food.depth===clickedDepth){localTotal++;const idle=controls.get(food.id)!;if(Math.hypot(food.x-idle.x,food.y-idle.y)*430>3)localChanged++;}}
    if(frame%30===0){
      const bodies=scene.map(createBody);
      for(let i=0;i<bodies.length;i++){
        for(let p=0;p<bodies[i].points.length;p+=2)maxRadius=Math.max(maxRadius,Math.hypot(bodies[i].points[p]-.5,bodies[i].points[p+1]-.5));
        for(let j=i+1;j<bodies.length;j++)if(bodies[i].food.depth===bodies[j].food.depth&&contactBetween(bodies[i],bodies[j],contact))maxOverlap=Math.max(maxOverlap,contact.distance*430);
      }
    }
  }
  changedTopNeighbours+=localChanged;topNeighbours+=localTotal;
  results.push({level,seed,physicalLayers:new Set(board.map(food=>food.depth)).size,topNeighbours:localTotal,topNeighboursChangedOver3Px:localChanged});
}
const report={version,levels,seedsPerLevel,secondsPerScene:20,pickAtSeconds:10,totalFrames,milliseconds:Math.round(performance.now()-start),canvasReferenceCssPx:430,maxIdleStepCssPx:maxIdleStep,maxAfterPickStepCssPx:maxPickStep,maxTravelCssPx:maxTravel,maxSampledSameLayerHullPenetrationCssPx:maxOverlap,maxSampledHullRadius:maxRadius,localLayout:{comparedAtSecondsAfterPick:3.8,topNeighbours,changedOver3Px:changedTopNeighbours},cases:results,note:'Same-layer geometry sampled every .5 second. Counterfactual control retains the clicked food. Cross-layer overlap is intended occlusion. Future orders affect only local selection after a pick. This is numerical validation, not a browser screenshot, phone performance test or geometric solvability proof.'};
if(maxRadius>.478001||maxOverlap>.6||maxIdleStep>.7||maxPickStep>.7)throw new Error(`Motion audit failed: ${JSON.stringify(report)}`);
await writeFile(`docs/art/motion-audit-v${version.replaceAll('.','-')}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,cases:undefined},null,2));
