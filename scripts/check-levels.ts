import { checkAllLevels } from '../src/game/SolvabilityChecker';
// # Scope is explicit: random target stock and conservation, with geometry left unverified.
const start=performance.now();const report=checkAllLevels(20);
console.log(JSON.stringify({runs:report.runs,inventoryMoves:report.clicks,milliseconds:Math.round(performance.now()-start),scope:report.scope,stockRoutesCompleted:true,geometricSolvabilityVerified:false},null,2));
