import { Pause, Volume2, VolumeX, Soup } from 'lucide-react';
// # Compact header keeps all primary touch controls at least 44px.
export function LevelHeader({level,remaining,total,sound,onPause,onSound}:{level:number;remaining:number;total:number;sound:boolean;onPause:()=>void;onSound:()=>void}) {
  return <header className="level-header"><div className="level-mark"><Soup size={21}/><div><h1>第 <b>{String(level).padStart(2,'0')}</b> 关</h1></div></div><div className="remaining"><span>剩余</span><strong aria-label={`剩余 ${remaining}，共 ${total}`}>{remaining}</strong></div><button className="icon-button" onClick={onSound} aria-label={sound?'关闭声音':'打开声音'}>{sound?<Volume2 size={20}/>:<VolumeX size={20}/>}</button><button className="icon-button" onClick={onPause} aria-label="暂停游戏"><Pause size={20}/></button></header>;
}
