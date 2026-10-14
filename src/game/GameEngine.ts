import type { FoodItem, GameEffect, GameSnapshot, GameStatus, Inventory, ItemKind, ToolKind } from './types';
import { getLevel } from '../config/levels';
import { gameConfig } from '../config/gameConfig';
import { packFoods, seededRandom, spawn } from './SpawnManager';
import { isClickable } from './PhysicsEngine';
import { chooseTarget, targetCandidates } from './MatchEngine';
// # The engine has no browser dependency. Every mutation enforces legal states and inventory conservation.
export class GameEngine {
  snapshot:GameSnapshot;
  effects:GameEffect[]=[];
  private rng:()=>number;
  private planned:(ItemKind|null)[]=Array(4).fill(null);
  get nextTargets():readonly (ItemKind|null)[]{return this.planned;}
  constructor(level=1,seed=Date.now(),inventory?:Inventory) {
    const config=getLevel(level);this.rng=seededRandom(seed+1);
    this.snapshot={status:'LOADING',level:config.level,board:[],targets:Array.from({length:4},(_,i)=>({kind:null,count:0,locked:i>=2})),
      holding:[],holdingCapacity:3,tools:{...(inventory??config.initialToolCount)},eliminated:0,total:config.totalItems,revives:0,revision:0};
    this.snapshot.board=spawn(config,seed,stock=>{this.snapshot.board=stock;this.refreshTargets();return this.planned;});this.snapshot.status='READY';
  }
  start(){if(this.snapshot.status==='READY'){this.snapshot.status='PLAYING';this.touch();}}
  touch(){this.snapshot.revision++;}
  setStatus(next:GameStatus) {this.snapshot.status=next;this.touch();}
  transition(from:GameStatus,to:GameStatus){if(this.snapshot.status!==from)return false;this.setStatus(to);return true;}
  drainEffects(){const effects=this.effects;this.effects=[];return effects;}
  private refreshTargets() {
    const s=this.snapshot;
    for(let index=0;index<s.targets.length;index++){
      const tray=s.targets[index];if(tray.locked||tray.kind)continue;
      const candidates=targetCandidates(s.board,s.holding,s.targets),next=this.planned[index];
      tray.kind=next&&candidates.includes(next)?next:chooseTarget(s.board,s.holding,s.targets,this.rng);tray.count=0;this.planned[index]=null;
    }
    // # Queue stocked orders independently of storage and visibility. Revalidate when another plate uses that stock.
    const eligible=new Set(targetCandidates(s.board,s.holding,s.targets)),reserved=new Set<ItemKind>();
    for(let index=0;index<s.targets.length;index++){
      const tray=s.targets[index];let kind=this.planned[index];
      if(tray.locked||!tray.kind){this.planned[index]=null;continue;}
      if(!kind||!eligible.has(kind)||reserved.has(kind)){
        const candidates=[...eligible].filter(candidate=>!reserved.has(candidate));
        kind=candidates.length?candidates[Math.min(candidates.length-1,Math.floor(this.rng()*candidates.length))]:null;
        this.planned[index]=kind;
      }
      if(kind)reserved.add(kind);
    }
  }
  private absorbHolding() {
    const s=this.snapshot;
    // # Stored food transfers only after the independently randomized target happens to match it.
    for(let pass=0;pass<s.total;pass++) {
      let moved=false;
      for(let t=0;t<s.targets.length;t++) {
        const tray=s.targets[t]; if(tray.locked||!tray.kind)continue;
        const idx=s.holding.findIndex(i=>i.kind===tray.kind);if(idx<0)continue;
        const [item]=s.holding.splice(idx,1);tray.count++;moved=true;
        this.effects.push({type:'pick',item,tray:t,slot:tray.count-1,holding:idx});this.resolveTray(t);
      }
      this.refreshTargets();if(!moved)break;
    }
  }
  private resolveTray(index:number) {
    const s=this.snapshot,tray=s.targets[index];
    if(tray.count===3){this.effects.push({type:'match',tray:index,kind:tray.kind!});s.eliminated+=3;tray.kind=null;tray.count=0;}
  }
  private finishMove() {
    const s=this.snapshot;
    this.refreshTargets();this.absorbHolding();
    if(!s.board.length&&!s.holding.length&&s.targets.every(t=>t.count===0)) {
      s.status=s.level===50?'GAME_COMPLETE':'LEVEL_COMPLETE';this.effects.push({type:'complete'});
    } else if(s.holding.length>=s.holdingCapacity) {s.status='FAILED';this.effects.push({type:'fail'});}
    this.touch();
  }
  pick(id:number,ignoreCoverage=false,visibleBoard?:readonly FoodItem[]):boolean {
    const s=this.snapshot;if(s.status!=='PLAYING')return false;
    const idx=s.board.findIndex(i=>i.id===id);if(idx<0)return false;
    const item=s.board[idx];
    // # Animated taps use the exact drawn scene, while keyboard and solver moves retain logical coverage.
    const rendered=visibleBoard?new Map(visibleBoard.map(i=>[i.id,i])):null;
    if(rendered&&(rendered.size!==s.board.length||s.board.some(i=>rendered.get(i.id)?.kind!==i.kind)))return false;
    if(!ignoreCoverage&&!isClickable(rendered?.get(id)??item,visibleBoard??s.board))return false;
    const flightItem=rendered?{...rendered.get(id)!}:item;
    // # Motion owns neighbour adjustment; repeated picks must not collapse every anchor toward the centre.
    s.board.splice(idx,1);
    const t=s.targets.findIndex(tray=>!tray.locked&&tray.kind===item.kind);
    if(t>=0){s.targets[t].count++;this.effects.push({type:'pick',item:flightItem,tray:t,slot:s.targets[t].count-1});this.resolveTray(t);}
    else {s.holding.push(item);this.effects.push({type:'pick',item:flightItem,holding:s.holding.length-1});}
    // # Holding dishes only store food. Even three identical foods never clear here.
    this.finishMove();return true;
  }
  unlock(index:number):boolean {
    const s=this.snapshot;if(s.status!=='VOICE_CHALLENGE'||!s.targets[index]?.locked)return false;
    s.targets[index].locked=false;this.effects.push({type:'unlock',tray:index});
    s.status='PLAYING';this.finishMove();return true;
  }
  // # One voice reward expands only holding capacity; identical stored foods still never clear here.
  unlockHolding():boolean {
    const s=this.snapshot;if(s.status!=='VOICE_CHALLENGE'||s.holdingCapacity>=gameConfig.maxHoldingCapacity)return false;
    s.holdingCapacity++;s.status='PLAYING';this.touch();return true;
  }
  grant(tool:ToolKind):boolean {
    const s=this.snapshot;if(s.status!=='VOICE_CHALLENGE')return false;
    s.tools[tool]++;this.effects.push({type:'reward',tool});s.status='PLAYING';this.touch();return true;
  }
  useTool(tool:ToolKind,visibleBoard?:readonly FoodItem[]):{used:boolean;message?:string} {
    const s=this.snapshot;if(s.status!=='PLAYING')return {used:false};
    if(s.tools[tool]<=0)return {used:false,message:'empty'};
    if(tool==='return'&&!s.holding.length)return {used:false,message:'暂存盘还是空的，不用撤回哦～'};
    if(tool==='match') {
      const board=visibleBoard??s.board;
      const inventory=new Map(board.map(i=>[i.id,i.kind]));if(inventory.size!==s.board.length||s.board.some(i=>inventory.get(i.id)!==i.kind))return {used:false};
      const target=s.targets.find(t=>!t.locked&&t.kind&&board.filter(i=>i.kind===t.kind&&isClickable(i,board)).length>=3-t.count);
      if(!target)return {used:false,message:'现在还没有可以自动完成的组合～'};
      const ids=board.filter(i=>i.kind===target.kind&&isClickable(i,board)).sort((a,b)=>b.z-a.z).slice(0,3-target.count).map(i=>i.id);
      // # Reserve already-visible items atomically so settling cannot invalidate a paid tool.
      s.tools.match--;for(const id of ids)this.pick(id,true);this.touch();return {used:true};
    }
    s.tools[tool]--;
    if(tool==='shuffle') {
      packFoods(s.board,this.rng,getLevel(s.level),this.planned);
      this.effects.push({type:'shuffle'});
    } else this.returnHolding();
    this.touch();return {used:true};
  }
  private returnHolding() {
    const s=this.snapshot,returning=[...s.holding];
    const depth=Math.max(-1,...s.board.map(i=>i.depth))+1,z=Math.max(-1,...s.board.map(i=>i.z))+1;
    packFoods(returning,this.rng,getLevel(s.level),this.planned);
    for(const item of returning){item.depth+=depth;item.z+=z;s.board.push(item);}
    s.holding=[];this.effects.push({type:'return',items:returning});
  }
  beginAd():boolean {
    const s=this.snapshot;if(s.status!=='FAILED'||s.revives>=gameConfig.maxRevivesPerLevel)return false;
    this.setStatus('AD');return true;
  }
  completeAd(watched:boolean):boolean {
    const s=this.snapshot;if(s.status!=='AD')return false;
    if(!watched){this.setStatus('FAILED');return false;}
    s.revives++;s.status='REVIVING';this.returnHolding();this.effects.push({type:'revive'});this.touch();return true;
  }
  finishRevive(){return this.transition('REVIVING','PLAYING');}
  debugWin(){this.snapshot.board=[];this.snapshot.holding=[];this.snapshot.targets.forEach(t=>{t.kind=null;t.count=0;});this.snapshot.eliminated=this.snapshot.total;this.snapshot.status=this.snapshot.level===50?'GAME_COMPLETE':'LEVEL_COMPLETE';this.effects.push({type:'complete'});this.touch();}
  debugFail(){this.setStatus('FAILED');}
}
