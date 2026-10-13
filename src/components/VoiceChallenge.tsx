import { useEffect, useRef, useState } from 'react';
import { Mic, Sparkles, LockKeyhole, Gift } from 'lucide-react';
import { speechService, matchesPhrase, SpeechError } from '../services/SpeechService';
import { gameConfig } from '../config/gameConfig';
import { Modal } from './Modal';
// # No recording starts on mount. Only a user microphone click reaches recognize().
export function VoiceChallenge({mode,onSuccess,onClose}:{mode:'unlock'|'tool'|'holding';onSuccess:()=>void;onClose:()=>void}) {
  const [listening,setListening]=useState(false),[message,setMessage]=useState(''),[success,setSuccess]=useState(false);
  const alive=useRef(true),claimed=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const phrase=mode==='holding'?gameConfig.holdingPhrase:mode==='unlock'?gameConfig.unlockPhrase:gameConfig.toolPhrase;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;speechService.cancel();if(timer.current)clearTimeout(timer.current);};},[]);
  function complete(){if(claimed.current||!alive.current)return;claimed.current=true;setListening(false);setSuccess(true);setMessage(mode==='holding'?'暂存 +1':mode==='unlock'?'解锁成功！':'道具 +1');timer.current=setTimeout(onSuccess,650);}
  async function listen(){
    if(listening||claimed.current)return;setMessage('');setListening(true);
    try{const text=await speechService.recognize();if(!alive.current)return;if(matchesPhrase(text,phrase))complete();else setMessage(`没听清，再试一次吧～${text?`\n听到的是：「${text}」`:''}`);}
    catch(error){if(alive.current&&!(error instanceof SpeechError&&error.code==='cancelled'))setMessage(error instanceof Error?error.message:'没听清，再试一次吧～');}
    finally{if(alive.current)setListening(false);}
  }
  return <Modal label={mode==='unlock'?'语音解锁':'语音获取道具'} onClose={success?undefined:onClose} className="voice-modal"><div className={`modal-illustration ${success?'success-burst':''}`}>{success?<Sparkles size={40}/>:mode==='unlock'?<LockKeyhole size={36}/>:<Gift size={39}/>}</div><h2>{mode==='holding'?'暂存 +1':mode==='unlock'?'解锁目标盘':'道具 +1'}</h2><div className="secret-phrase">“{phrase}”</div><button className={`microphone ${listening?'listening':''}`} onClick={()=>void listen()} disabled={success||listening} aria-label="点击麦克风开始识别"><Mic size={30}/></button><span className="mic-caption">{success?'好运已到账':listening?'正在听，请说出口令…':'点击麦克风，然后说出口令'}</span><p className="voice-status" role="status">{message}</p><small className="privacy-note">仅点击后申请麦克风权限<br/>语音由浏览器的识别服务处理</small>{(import.meta.env.DEV||gameConfig.allowSpeechFallback)&&<button className="developer-fallback" onClick={complete} disabled={success}>模拟识别成功{import.meta.env.DEV?' · 开发测试':''}</button>}</Modal>;
}
