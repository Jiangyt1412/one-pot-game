// # Lightweight original synthesized sounds; replace cue synthesis or music with licensed audio later.
export type AudioCue='click'|'pick'|'fly'|'match'|'tray'|'tool'|'shuffle'|'unlock'|'voice'|'fail'|'revive'|'complete'|'finale';
export class AudioManager {
  private context:AudioContext|null=null;private musicTimer:ReturnType<typeof setInterval>|null=null;private note=0;
  settings={sound:true,music:false,effects:true};
  async activate(){if(!this.context)this.context=new AudioContext();if(this.context.state==='suspended')await this.context.resume();this.syncMusic();}
  configure(settings:{sound:boolean;music:boolean;effects:boolean}){this.settings={...settings};this.syncMusic();}
  private tone(frequency:number,at:number,length:number,gain=0.05) {
    const c=this.context;if(!c||c.state!=='running')return;
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency;
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(gain,at+0.012);g.gain.exponentialRampToValueAtTime(0.001,at+length);
    o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+length+0.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  play(cue:AudioCue){
    if(!this.settings.sound||!this.settings.effects||!this.context)return;
    const melodies:Record<AudioCue,number[]>={click:[600],pick:[740,980],fly:[850],match:[659,830,988],tray:[880,1100],tool:[523,784],shuffle:[220,294,392],unlock:[523,659,784,1047],voice:[784,988,1175],fail:[392,330,262],revive:[440,659,880],complete:[523,659,784,1047],finale:[523,659,784,1047,1319,1568]};
    const now=this.context.currentTime;melodies[cue].forEach((f,i)=>this.tone(f,now+i*0.065,cue==='fail'?0.3:0.16));
  }
  private syncMusic(){
    if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}
    if(!this.settings.sound||!this.settings.music||!this.context||this.context.state!=='running')return;
    const notes=[262,330,392,330,294,349,440,349];
    this.musicTimer=setInterval(()=>{if(this.context)this.tone(notes[this.note++%notes.length],this.context.currentTime,0.55,0.012);},650);
  }
  suspend(){if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}void this.context?.suspend();}
  dispose(){this.suspend();void this.context?.close();this.context=null;}
}
export const audioManager=new AudioManager();
