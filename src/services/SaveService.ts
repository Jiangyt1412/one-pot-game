import type { Inventory } from '../game/types';
import { gameConfig } from '../config/gameConfig';
// # Versioned and validated storage; blocked/corrupt storage falls back to a playable in-memory session.
export interface SaveData {version:1; motionRevision:1; highestLevel:number; completed:number[]; grantedLevels:number[]; tools:Inventory; tutorialDone:boolean; settings:{sound:boolean;music:boolean;effects:boolean;reducedMotion:boolean}; dailyRewards:{date:string;count:number};}
export class SaveService {
  data:SaveData; storageAvailable=true;
  constructor() {
    this.data=this.defaults();
    try { const raw=localStorage.getItem(gameConfig.saveKey);if(raw){this.data=this.validate(JSON.parse(raw));} }
    catch {this.storageAvailable=false;}
  }
  // # This requested floating edition enables motion once on upgrade; later explicit reductions remain saved.
  private defaults():SaveData {return {version:1,motionRevision:1,highestLevel:1,completed:[],grantedLevels:[1],tools:{shuffle:2,match:2,return:2},tutorialDone:false,settings:{sound:true,music:false,effects:true,reducedMotion:false},dailyRewards:{date:'',count:0}};}
  private validate(raw:unknown):SaveData {
    const d=this.defaults();if(!raw||typeof raw!=='object')return d;
    const x=raw as Partial<SaveData>;if(x.version!==1)return d;
    if(Number.isInteger(x.highestLevel))d.highestLevel=Math.max(1,Math.min(50,x.highestLevel!));
    if(Array.isArray(x.completed))d.completed=[...new Set(x.completed.filter(n=>Number.isInteger(n)&&n>0&&n<=50))];
    for(const key of ['shuffle','match','return'] as const)if(typeof x.tools?.[key]==='number'&&Number.isFinite(x.tools[key]))d.tools[key]=Math.max(0,Math.min(9999,Math.floor(x.tools[key])));
    for(const key of ['sound','music','effects','reducedMotion'] as const)if(typeof x.settings?.[key]==='boolean'&&(key!=='reducedMotion'||x.motionRevision===1))d.settings[key]=x.settings[key];
    if(Array.isArray(x.grantedLevels))d.grantedLevels=[...new Set(x.grantedLevels.filter(n=>Number.isInteger(n)&&n>0&&n<=50))];
    d.tutorialDone=x.tutorialDone===true;
    if(x.dailyRewards&&typeof x.dailyRewards.date==='string'&&Number.isInteger(x.dailyRewards.count)&&x.dailyRewards.count>=0)d.dailyRewards=x.dailyRewards;
    return d;
  }
  persist(){try{localStorage.setItem(gameConfig.saveKey,JSON.stringify(this.data));this.storageAvailable=true;}catch{this.storageAvailable=false;}}
  complete(level:number){if(!this.data.completed.includes(level))this.data.completed.push(level);this.data.highestLevel=Math.max(this.data.highestLevel,Math.min(50,level+1));this.data.tutorialDone=true;this.persist();}
  clear(){this.data=this.defaults();this.persist();}
  canReward(){const date=new Date().toLocaleDateString('en-CA');if(this.data.dailyRewards.date!==date)this.data.dailyRewards={date,count:0};return gameConfig.dailyLimit===null||this.data.dailyRewards.count<gameConfig.dailyLimit;}
  recordReward(){this.canReward();this.data.dailyRewards.count++;this.persist();}
}
export const saveService=new SaveService();
