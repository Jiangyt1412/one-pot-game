import { gameConfig } from '../config/gameConfig';
// # Reward eligibility is tracked by monotonic visible playback time, never by UI countdown alone.
export interface AdSession {duration:number;remaining:number;done:boolean;}
export interface RewardedAdAdapter {showRewardedAd():Promise<boolean>;cancel():void;}
export class AdService implements RewardedAdAdapter {
  session:AdSession|null=null;
  private listener:((session:AdSession|null)=>void)|null=null;
  private resolve:((watched:boolean)=>void)|null=null;
  private interval:ReturnType<typeof setInterval>|null=null;
  private last=0;private elapsed=0;
  constructor(private duration=10,private isVisible=()=>typeof document==='undefined'||document.visibilityState==='visible',private now=()=>performance.now()){}
  subscribe(listener:(session:AdSession|null)=>void){this.listener=listener;listener(this.session);return ()=>{this.listener=null;};}
  showRewardedAd():Promise<boolean> {
    this.cancel();this.elapsed=0;this.last=this.now();this.session={duration:this.duration,remaining:this.duration,done:false};this.listener?.({...this.session});
    this.interval=setInterval(()=>this.tick(),100);
    return new Promise(resolve=>{this.resolve=resolve;});
  }
  private tick() {
    const current=this.now(),delta=Math.min(250,Math.max(0,current-this.last));this.last=current;
    if(!this.session||!this.isVisible())return;
    this.elapsed+=delta;
    const remaining=Math.max(0,Math.ceil(this.duration-this.elapsed/1000));
    if(remaining!==this.session.remaining){this.session.remaining=remaining;this.session.done=remaining===0;this.listener?.({...this.session});}
    if(this.session.done&&this.interval){clearInterval(this.interval);this.interval=null;}
  }
  close(){if(!this.session?.done)return false;this.finish(true);return true;}
  cancel(){this.finish(false);}
  private finish(watched:boolean){if(this.interval)clearInterval(this.interval);this.interval=null;const resolve=this.resolve;this.resolve=null;this.session=null;this.listener?.(null);resolve?.(watched);}
}
export const adService=new AdService(gameConfig.adDurationSeconds);
