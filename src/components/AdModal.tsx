import { Play, Soup } from 'lucide-react';
import type { AdSession } from '../services/AdService';
import { adService } from '../services/AdService';
import { Modal } from './Modal';
// # The close button cannot reward early; cancellation settles the promise with false.
export function AdModal({session}:{session:AdSession}) {
  return <Modal label="模拟奖励广告" className="ad-modal"><div className="ad-header"><span>广告 · 本地演示</span><span className="ad-countdown">{session.done?'已完成':`${session.remaining}s`}</span></div><div className="ad-placeholder"><Soup size={58}/><span className="eyebrow">A LITTLE BREAK</span><h2>美味，稍等就好</h2><span>AD PLACEHOLDER</span><p>这里将播放你的广告图片或视频</p></div><div className="ad-progress"><i style={{width:`${(1-session.remaining/session.duration)*100}%`}}/></div><p className="ad-note">{session.done?'已完整播放，可以继续这锅美味了':'完整观看 10 秒，可复活一次'}</p>{session.done?<button className="primary-button" onClick={()=>adService.close()}><Play size={17}/>关闭广告</button>:<button className="text-button" onClick={()=>adService.cancel()}>退出广告（不会获得复活）</button>}</Modal>;
}
