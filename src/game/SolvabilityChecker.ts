import { GameEngine } from './GameEngine';
// # Stock-only witness: validates random orders and inventory conservation, not geometric reachability.
// # The old timed-surfacing proof cannot establish solvability after click-driven refill replaces automatic surfacing.
export function checkLevel(level:number,seed:number) {
  const engine=new GameEngine(level,seed),s=engine.snapshot;
  const counts=new Map<string,number>();s.board.forEach(i=>counts.set(i.kind,(counts.get(i.kind)??0)+1));
  if(s.board.length!==s.total||[...counts.values()].some(n=>n%3!==0))throw new Error(`Invalid inventory: ${level}/${seed}`);
  engine.start();let clicks=0;
  while(s.status==='PLAYING'&&clicks<s.total+1) {
    const targets=s.targets.filter(t=>!t.locked).map(t=>t.kind),candidate=s.board.find(item=>targets.includes(item.kind));
    if(!candidate)throw new Error(`No target inventory: ${level}/${seed}`);
    // # Coverage is explicitly bypassed only in this stock check; the UI still uses the actual drawn pixel.
    if(!engine.pick(candidate.id,true))throw new Error('Rejected inventory move');
    clicks++;engine.drainEffects();
    const conserved=s.board.length+s.holding.length+s.targets.reduce((n,t)=>n+t.count,0)+s.eliminated;
    if(conserved!==s.total)throw new Error('Inventory conservation violated');
    for(const tray of s.targets)if(tray.kind&&s.board.filter(i=>i.kind===tray.kind).length+s.holding.filter(i=>i.kind===tray.kind).length<3-tray.count)throw new Error('Impossible target');
  }
  if(!['LEVEL_COMPLETE','GAME_COMPLETE'].includes(s.status))throw new Error(`Not solved: ${level}/${seed}`);
  return {level,seed,total:s.total,clicks,scope:'inventory-only' as const};
}
export function checkAllLevels(seeds=10) {
  const results=[];
  for(let level=1;level<=50;level++)for(let seed=1;seed<=seeds;seed++)results.push(checkLevel(level,seed*1729));
  return {runs:results.length,clicks:results.reduce((n,r)=>n+r.clicks,0),scope:'inventory-only' as const,results};
}
