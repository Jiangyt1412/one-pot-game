// # Replace this adapter with WeChat/iOS/Android speech without touching challenge UI or rewards.
export interface SpeechAdapter {recognize():Promise<string>;cancel():void;available():boolean;}
export class SpeechError extends Error {constructor(public code:string,message:string){super(message);}}
interface Recognition {lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start():void;abort():void;}
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition;};
export function normalizePhrase(text:string){return text.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'').replace(/蔣/g,'蒋').replace(/發/g,'发').replace(/財/g,'财');}
export function matchesPhrase(text:string,expected:string){return normalizePhrase(text)===normalizePhrase(expected);}
class BrowserSpeechAdapter implements SpeechAdapter {
  private active:Recognition|null=null;private cancelPending:(()=>void)|null=null;
  private ctor(){const w=window as SpeechWindow;return w.SpeechRecognition??w.webkitSpeechRecognition;}
  available(){return !!this.ctor();}
  recognize():Promise<string> {
    this.cancel();const Ctor=this.ctor();
    if(!Ctor)return Promise.reject(new SpeechError('unavailable','这个浏览器暂不支持语音识别。可以换用支持 Web Speech 的浏览器，或继续使用两个免费盘子。'));
    return new Promise((resolve,reject)=> {
      const r=new Ctor();this.active=r;r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
      let settled=false;
      const finish=(text?:string,error?:SpeechError)=> {
        if(settled)return;settled=true;clearTimeout(timeout);r.onresult=null;r.onerror=null;r.onend=null;
        this.active=null;this.cancelPending=null;try{r.abort();}catch{/* # Some browser implementations have already ended. */}
        if(error)reject(error);else resolve(text??'');
      };
      const timeout=setTimeout(()=>finish(undefined,new SpeechError('timeout','没听清，再试一次吧～')),15000);
      this.cancelPending=()=>finish(undefined,new SpeechError('cancelled','识别已取消'));
      r.onresult=e=>finish(e.results[0]?.[0]?.transcript??'');
      r.onerror=e=>finish(undefined,new SpeechError(e.error,e.error==='not-allowed'||e.error==='service-not-allowed'?'需要麦克风权限才能使用语音彩蛋。在浏览器地址栏的网站设置里允许麦克风，再点击重试。':'没听清，再试一次吧～'));
      r.onend=()=>finish(undefined,new SpeechError('no-speech','没听清，再试一次吧～'));
      // # This method is invoked only by the microphone button's click handler.
      try{r.start();}catch{finish(undefined,new SpeechError('start','无法开启语音。请使用 HTTPS 或 localhost，并检查麦克风权限。'));}
    });
  }
  cancel(){const reject=this.cancelPending;this.cancelPending=null;if(reject)reject();else if(this.active){this.active.abort();this.active=null;}}
}
export class SpeechService {
  constructor(private adapter:SpeechAdapter=new BrowserSpeechAdapter()){}
  setAdapter(adapter:SpeechAdapter){this.cancel();this.adapter=adapter;}
  recognize(){return this.adapter.recognize();}
  cancel(){this.adapter.cancel();}
  available(){return this.adapter.available();}
}
export const speechService=new SpeechService();
