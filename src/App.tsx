import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, CookingPot, Gift, House, LockKeyhole, Play, Settings2, Sparkles, Star, Trophy, Volume2, Waves, Wrench, X } from 'lucide-react';
import { gameConfig } from './config/gameConfig';
import { releaseInfo } from './config/release';
import { getLevel, levels } from './config/levels';
import { GameEngine } from './game/GameEngine';
import type { FoodItem, GameEffect, GameSnapshot, ToolKind } from './game/types';
import { loadAssets } from './services/AssetService';
import { saveService } from './services/SaveService';
import { speechService } from './services/SpeechService';
import { audioManager } from './services/AudioManager';
import { adService } from './services/AdService';
import type { AdSession } from './services/AdService';
import { LevelHeader } from './components/LevelHeader';
import { TargetTray, plateMotion, type PlateCompletion } from './components/TargetTray';
import { HoldingTray } from './components/HoldingTray';
import { ToolBar, toolNames } from './components/ToolBar';
import { PotCanvas } from './components/PotCanvas';
import { VoiceChallenge } from './components/VoiceChallenge';
import { AdModal } from './components/AdModal';
import { Modal } from './components/Modal';
import { FoodIcon } from './components/FoodIcon';
import { EffectsLayer } from './components/EffectsLayer';
// # Page navigation is independent of the finite gameplay state machine.
type Page='home'|'game'|'levels';
type Challenge={mode:'unlock';index:number}|{mode:'tool';tool:ToolKind}|{mode:'holding'};
declare global {interface Window {__ONE_POT__?:{engine:()=>GameEngine|null;start:(level:number,seed?:number)=>void;commit:()=>void;};}}
export function App() {
  const [loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(''),[page,setPage]=useState<Page>('home');
  const [,setRevision]=useState(0),[showSettings,setShowSettings]=useState(false),[showDev,setShowDev]=useState(false);
  const [challenge,setChallenge]=useState<Challenge|null>(null),[ad,setAd]=useState<AdSession|null>(null);
  const [effects,setEffects]=useState<GameEffect[]>([]),[pulses,setPulses]=useState([0,0,0,0]),[shake,setShake]=useState(0);
  const [completedPlates,setCompletedPlates]=useState<(PlateCompletion|null)[]>([null,null,null,null]),[trayAnimating,setTrayAnimating]=useState(false);
  const trayTimer=useRef<ReturnType<typeof setTimeout>|null>(null),plateId=useRef(0);
  const [toast,setToast]=useState(''),[testReport,setTestReport]=useState(''),[testRunning,setTestRunning]=useState(false);
  const visibleScene=useRef<readonly FoodItem[]>([]);
  const engineRef=useRef<GameEngine|null>(null),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),reviveTimer=useRef<ReturnType<typeof setTimeout>|null>(null),busyUntil=useRef(0);
  const homeSnapshot=useMemo(()=>{const e=new GameEngine(7,13579);e.start();return e.snapshot;},[]);
  const snapshot:GameSnapshot|null=engineRef.current?.snapshot??null;
  const settings=saveService.data.settings;
  const notify=useCallback((message:string)=>{setToast(message);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3200);},[]);
  const commit=useCallback(()=>{
    const engine=engineRef.current;if(!engine)return;
    const next=engine.drainEffects();setEffects(next);
    const matches=next.filter(effect=>effect.type==='match'&&effect.tray!==undefined&&effect.kind);
    if(matches.length){
      setCompletedPlates(previous=>{const updated=[...previous];matches.forEach(effect=>{updated[effect.tray!]={id:++plateId.current,kind:effect.kind!};});return updated;});
      if(!saveService.data.settings.reducedMotion){
        busyUntil.current=Math.max(busyUntil.current,performance.now()+plateMotion.total);
        setTrayAnimating(true);if(trayTimer.current)clearTimeout(trayTimer.current);
        trayTimer.current=setTimeout(()=>setTrayAnimating(false),plateMotion.total);
      }
    }
    next.forEach(effect=>{
      audioManager.play(effect.type==='reward'?'voice':effect.type==='return'?'tool':effect.type==='complete'?(engine.snapshot.level===50?'finale':'complete'):effect.type);
      if(effect.tray!==undefined&&['pick','match','unlock'].includes(effect.type))setPulses(p=>p.map((n,i)=>i===effect.tray?n+1:n));
      if(effect.type==='shuffle')setShake(n=>n+1);
    });
    saveService.data.tools={...engine.snapshot.tools};
    if(['LEVEL_COMPLETE','GAME_COMPLETE'].includes(engine.snapshot.status))saveService.complete(engine.snapshot.level);
    saveService.persist();setRevision(n=>n+1);
  },[]);
  function activateAudio(){audioManager.configure(settings);void audioManager.activate().catch(()=>{/* # Browser autoplay restrictions never block a move. */});}
  const startLevel=useCallback((level:number,seed?:number)=>{
    speechService.cancel();adService.cancel();if(reviveTimer.current)clearTimeout(reviveTimer.current);
    const config=getLevel(level),save=saveService.data;
    if(!save.grantedLevels.includes(config.level)){
      (['shuffle','match','return'] as const).forEach(tool=>save.tools[tool]+=config.initialToolCount[tool]);save.grantedLevels.push(config.level);
    }
    const engine=new GameEngine(config.level,seed??Date.now(),save.tools);engine.start();engineRef.current=engine;
    if(trayTimer.current)clearTimeout(trayTimer.current);setTrayAnimating(false);setCompletedPlates([null,null,null,null]);
    setChallenge(null);setEffects([]);setPulses([0,0,0,0]);setPage('game');setShowDev(false);setShowSettings(false);busyUntil.current=0;commit();
  },[commit]);
  useEffect(()=>{
    let alive=true;void loadAssets().then(()=>{if(alive)setLoaded(true);}).catch(e=>{if(alive)setLoadError(String(e));});
    const unsub=adService.subscribe(setAd);
    const visibility=()=>{
      if(document.visibilityState==='hidden'){
        audioManager.suspend();speechService.cancel();
        if(engineRef.current?.snapshot.status==='PLAYING'){engineRef.current.transition('PLAYING','PAUSED');commit();}
      }
    };
    const pagehide=()=>{adService.cancel();speechService.cancel();saveService.persist();};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pagehide);
    return()=>{alive=false;unsub();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pagehide);if(toastTimer.current)clearTimeout(toastTimer.current);if(trayTimer.current)clearTimeout(trayTimer.current);if(reviveTimer.current)clearTimeout(reviveTimer.current);speechService.cancel();adService.cancel();audioManager.dispose();};
  },[commit]);
  useEffect(()=>{
    if(!import.meta.env.DEV)return;
    window.__ONE_POT__={engine:()=>engineRef.current,start:startLevel,commit};
    return()=>{delete window.__ONE_POT__;};
  },[startLevel,commit]);
  function pick(id:number,visibleBoard?:readonly FoodItem[]){
    if(performance.now()<busyUntil.current)return;
    const engine=engineRef.current;if(engine?.pick(id,!!visibleBoard,visibleBoard)){
      busyUntil.current=performance.now()+(settings.reducedMotion?80:230);commit();
    }
  }
  function openVoice(context:Challenge){
    const engine=engineRef.current;if(!engine||engine.snapshot.status!=='PLAYING')return;
    if(context.mode==='unlock'&&!engine.snapshot.targets[context.index]?.locked){notify('美味小盘已经全部解锁啦');return;}
    if(context.mode==='holding'&&engine.snapshot.holdingCapacity>=4)return;
    if(context.mode==='tool'&&!saveService.canReward()){notify('今天的语音道具已经领完啦，明天再来～');return;}
    engine.transition('PLAYING','VOICE_CHALLENGE');setChallenge(context);commit();
  }
  function closeVoice(){speechService.cancel();setChallenge(null);engineRef.current?.transition('VOICE_CHALLENGE','PLAYING');commit();}
  function voiceSuccess(){
    const engine=engineRef.current;if(!engine||!challenge)return;
    if(challenge.mode==='unlock'){if(engine.unlock(challenge.index))notify('解锁成功！');else engine.transition('VOICE_CHALLENGE','PLAYING');}
    else if(challenge.mode==='holding'){if(engine.unlockHolding())notify('暂存 +1');else engine.transition('VOICE_CHALLENGE','PLAYING');}
    else if(saveService.canReward()&&engine.grant(challenge.tool)){saveService.recordReward();notify(`口令正确！${toolNames[challenge.tool]} +1`);}
    else engine.transition('VOICE_CHALLENGE','PLAYING');
    setChallenge(null);commit();
  }
  function useTool(tool:ToolKind){
    if(performance.now()<busyUntil.current)return;
    const engine=engineRef.current;if(!engine||engine.snapshot.status!=='PLAYING')return;
    activateAudio();
    if(engine.snapshot.tools[tool]===0){openVoice({mode:'tool',tool});return;}
    const result=engine.useTool(tool,visibleScene.current);
    if(result.message)notify(result.message);
    if(result.used){audioManager.play('tool');busyUntil.current=Math.max(busyUntil.current,performance.now()+500);commit();}
  }
  async function revive(){
    const engine=engineRef.current;if(!engine?.beginAd())return;commit();
    const watched=await adService.showRewardedAd();
    if(engineRef.current!==engine)return;
    if(engine.completeAd(watched)){
      commit();reviveTimer.current=setTimeout(()=>{if(engineRef.current===engine){engine.finishRevive();commit();notify('美味归位，继续加油！');}},settings.reducedMotion?100:650);
    }else commit();
  }
  function toggleSetting(key:keyof typeof settings){saveService.data.settings[key]=!settings[key];saveService.persist();audioManager.configure(saveService.data.settings);setRevision(n=>n+1);}
  function pause(){engineRef.current?.transition('PLAYING','PAUSED');audioManager.suspend();commit();}
  function resume(){activateAudio();engineRef.current?.transition('PAUSED','PLAYING');commit();}
  function goHome(){speechService.cancel();adService.cancel();setPage('home');setChallenge(null);setShowDev(false);setShowSettings(false);}
  async function testLevels(){
    setTestRunning(true);setTestReport('正在验证 50 关…');
    try{
      const {checkLevel}=await import('./game/SolvabilityChecker');let count=0,clicks=0;
      for(let level=1;level<=50;level++){
        await new Promise<void>(resolve=>setTimeout(resolve,0));
        for(let seed=1;seed<=5;seed++){const r=checkLevel(level,seed*1729);count++;clicks+=r.clicks;}
        setTestReport(`已验证 ${level} / 50 关`);
      }
      setTestReport(`库存检查通过：${count} 局，${clicks} 次库存选择。未验证堆叠可解性。`);
    }catch(e){setTestReport(`测试失败：${String(e)}`);}finally{setTestRunning(false);}
  }
  const modalOpen=showSettings||showDev||!!challenge||!!ad||(page==='game'&&snapshot!==null&&!['PLAYING','READY'].includes(snapshot.status));
  const totalRemaining=snapshot?snapshot.total-snapshot.eliminated:0;
  if(!loaded)return <main className="app-shell loading-screen"><CookingPot size={52}/><h1>{gameConfig.name}</h1><p>{loadError||'正在准备一锅好心情…'}</p>{loadError&&<button className="primary-button" onClick={()=>location.reload()}>重新加载</button>}</main>;
  return <main className={`app-shell ${settings.reducedMotion?'reduced-motion':''}`}>
    <div className="landscape-tip"><CookingPot size={26}/><span>竖屏玩体验更好哦～</span></div>
    <div className="page-content" inert={modalOpen||trayAnimating}>
      {page==='home'&&<section className="home-page">
        <div className="home-title"><h1>{gameConfig.name}<i className="title-spark">✦</i></h1></div>
        <div className="home-hero"><PotCanvas snapshot={homeSnapshot} onPick={()=>{}} reduced={settings.reducedMotion} decorative/></div>
        <div className="home-actions"><button className="primary-button start-button" onClick={()=>{activateAudio();startLevel(saveService.data.highestLevel);}}><Play size={20} fill="currentColor"/>开始游戏<small>第 {saveService.data.highestLevel} 关</small><ChevronRight size={19}/></button><button className="secondary-button" onClick={()=>setPage('levels')}><span className="little-grid">▦</span>关卡<span className="action-meta">{saveService.data.completed.length} / 50</span></button><button className="text-button" onClick={()=>setShowSettings(true)}><Settings2 size={16}/>设置</button></div>

        <small className="release-version">v{releaseInfo.version} · {releaseInfo.status}</small>
      </section>}
      {page==='levels'&&<section className="levels-page"><header className="subpage-header"><button className="icon-button" aria-label="返回首页" onClick={()=>setPage('home')}><ArrowLeft size={21}/></button><h1>关卡</h1><span>{saveService.data.completed.length}/50</span></header><div className="level-grid">{levels.map(l=>{
        const locked=l.level>saveService.data.highestLevel,done=saveService.data.completed.includes(l.level);
        return <button className={`level-tile ${locked?'tile-locked':''} ${done?'tile-complete':''} ${l.level===saveService.data.highestLevel?'tile-current':''}`} key={l.level} disabled={locked} aria-label={`第 ${l.level} 关，${locked?'未解锁':done?'已完成':'可游玩'}`} onClick={()=>{activateAudio();startLevel(l.level);}}><span>{locked?<LockKeyhole size={17}/>:l.level}</span><small>{done?<Star size={12} fill="currentColor"/>:''}</small></button>;
      })}</div></section>}
      {page==='game'&&snapshot&&<section className={`game-page ${snapshot.status==='FAILED'?'failed-shake':''}`} style={{'--tray-ms':`${getLevel(snapshot.level).refreshMs}ms`} as React.CSSProperties}>
        <LevelHeader level={snapshot.level} remaining={totalRemaining} total={snapshot.total} sound={settings.sound} onPause={pause} onSound={()=>toggleSetting('sound')}/>
        <div className="game-progress" role="progressbar" aria-label="关卡消除进度" aria-valuenow={snapshot.eliminated} aria-valuemin={0} aria-valuemax={snapshot.total}><i style={{width:`${snapshot.eliminated/snapshot.total*100}%`}}/></div>
        {/* # Active plates receive more width; compact locks expand into full plates after unlocking. */}
        <section className="targets-section"><div className="target-row" style={{gridTemplateColumns:snapshot.targets.map(target=>target.locked?'minmax(44px, .48fr)':'minmax(0, 1fr)').join(' ')}}>{snapshot.targets.map((target,index)=><TargetTray key={index} target={target} index={index} pulse={pulses[index]} completion={completedPlates[index]} reduced={settings.reducedMotion} onUnlock={()=>openVoice({mode:'unlock',index})}/>)}</div></section>
        <HoldingTray holding={snapshot.holding} capacity={snapshot.holdingCapacity} onUnlock={()=>openVoice({mode:'holding'})}/>
        {settings.reducedMotion&&<button className="restore-floating" onClick={()=>toggleSetting('reducedMotion')}>开启漂浮</button>}
        <PotCanvas snapshot={snapshot} onScene={scene=>{visibleScene.current=scene;}} onPick={pick} reduced={settings.reducedMotion} shake={shake}/>
        <ToolBar tools={snapshot.tools} onUse={useTool} disabled={snapshot.status!=='PLAYING'||trayAnimating}/>

      </section>}
    </div>
    {page==='game'&&snapshot?.status==='PAUSED'&&!showSettings&&!showDev&&<Modal label="游戏暂停" className="pause-modal"><div className="modal-illustration"><CookingPot size={42}/></div><h2>暂停</h2><button className="primary-button" onClick={resume}><Play size={18}/>继续</button><button className="secondary-button" onClick={()=>setShowSettings(true)}><Settings2 size={17}/>设置</button><button className="text-button" onClick={()=>startLevel(snapshot.level)}>重来</button><button className="text-button" onClick={goHome}><House size={15}/>首页</button></Modal>}
    {page==='game'&&snapshot?.status==='FAILED'&&!showDev&&<Modal label="本局失败" className="fail-modal"><div className="modal-illustration fail-art"><FoodIcon kind="dumpling"/><span>…</span></div><h2>暂存已满</h2>{snapshot.revives<gameConfig.maxRevivesPerLevel?<button className="primary-button" onClick={()=>void revive()}><Play size={18}/>看广告复活<small>10 秒</small></button>:<p className="revive-limit">这一关的复活机会已经用过啦</p>}<button className="secondary-button" onClick={()=>startLevel(snapshot.level)}>重新开始</button><button className="text-button" onClick={goHome}>回到首页</button></Modal>}
    {page==='game'&&snapshot&&['LEVEL_COMPLETE','GAME_COMPLETE'].includes(snapshot.status)&&!showDev&&!trayAnimating&&<Modal label={snapshot.status==='GAME_COMPLETE'?'50关全部通关':'关卡完成'} className={`complete-modal ${snapshot.status==='GAME_COMPLETE'?'finale':''}`}><div className="confetti">{Array.from({length:snapshot.level===50?36:18},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${i*.08}s`,'--confetti-color':['#ffcf20','#e75d2c','#86b947'][i%3]} as React.CSSProperties}/>)}</div><div className="modal-illustration"><Trophy size={42}/></div>{snapshot.level===50&&<div className="finale-fireworks" aria-hidden="true"><i/><i/><i/></div>}<div className="completion-stars"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/></div><h2>{snapshot.level===50?'50关全部通关！':`第 ${snapshot.level} 关完成！`}</h2>{snapshot.level===50&&<p>蒋雨童天下第一！</p>}{snapshot.level===50?<div className="finale-foods"><FoodIcon kind="shrimp"/><FoodIcon kind="dumpling"/><FoodIcon kind="broccoli"/></div>:<button className="primary-button" onClick={()=>startLevel(snapshot.level+1)}>下一关<ArrowRight size={19}/></button>}<button className="secondary-button" onClick={goHome}>首页</button></Modal>}
    {page==='game'&&snapshot?.status==='REVIVING'&&<div className="reviving-banner"><Sparkles size={33}/><strong>继续</strong></div>}
    {challenge&&<VoiceChallenge mode={challenge.mode} onSuccess={voiceSuccess} onClose={closeVoice}/>}
    {ad&&<AdModal session={ad}/>}
    {showSettings&&!showDev&&<Modal label="设置" onClose={()=>setShowSettings(false)} className="settings-modal"><div className="modal-illustration"><Settings2 size={36}/></div><h2>设置</h2><div className="settings-list">{([{key:'sound',label:'总声音',detail:'让美味也有声音',icon:<Volume2 size={19}/>},{key:'music',label:'背景音乐',detail:'轻柔的原创合成旋律',icon:<Waves size={19}/>},{key:'effects',label:'游戏音效',detail:'点击、消除和小惊喜',icon:<Sparkles size={19}/>},{key:'reducedMotion',label:'减少动画',detail:'保留反馈，减少漂浮',icon:<Sparkles size={19}/>} ] as const).map(option=><button key={option.key} className="setting-row" role="switch" aria-checked={settings[option.key]} onClick={()=>{toggleSetting(option.key);activateAudio();}}><span className="setting-icon">{option.icon}</span><span><strong>{option.label}</strong></span><i className={`toggle ${settings[option.key]?'on':''}`}/></button>)}</div>{!saveService.storageAvailable&&<p className="settings-note">无法保存进度</p>}{import.meta.env.DEV&&<button className="developer-fallback" onClick={()=>{setShowSettings(false);setShowDev(true);}}>打开开发菜单</button>}</Modal>}
    {import.meta.env.DEV&&<button className="dev-toggle" onClick={()=>setShowDev(true)} aria-label="打开开发菜单"><Wrench size={13}/></button>}
    {import.meta.env.DEV&&showDev&&<Modal label="开发菜单" onClose={()=>setShowDev(false)} className="dev-modal"><h2>开发测试</h2><label>跳转关卡<select aria-label="开发选择关卡" value={snapshot?.level??1} onChange={e=>startLevel(Number(e.target.value))}>{levels.map(l=><option key={l.level} value={l.level}>Level {l.level} · {l.totalItems} 个 / {l.categoryCount} 种</option>)}</select></label><div className="dev-grid"><button onClick={()=>{if(snapshot){(['shuffle','match','return'] as const).forEach(t=>snapshot.tools[t]++);commit();}}}><Gift size={14}/>三个道具 +1</button><button onClick={()=>{if(snapshot){snapshot.tools={shuffle:0,match:0,return:0};commit();}}}>清空道具</button><button onClick={()=>{engineRef.current?.debugWin();commit();setShowDev(false);}}>直接胜利</button><button onClick={()=>{engineRef.current?.debugFail();commit();setShowDev(false);}}>直接失败</button><button onClick={()=>{if(snapshot){snapshot.status='PLAYING';setShowDev(false);openVoice({mode:'unlock',index:snapshot.targets.findIndex(t=>t.locked)});}}}>模拟「发大财」</button><button onClick={()=>{if(snapshot){snapshot.status='PLAYING';snapshot.tools.shuffle=0;setShowDev(false);openVoice({mode:'tool',tool:'shuffle'});}}}>模拟「是天才」</button><button onClick={()=>{setShowDev(false);void adService.showRewardedAd().then(watched=>notify(watched?'广告完整播放通过':'广告提前退出，无奖励'));}}>测试 10 秒广告</button><button onClick={()=>{saveService.clear();goHome();notify('存档已重置');}}>清除存档</button></div><button className="primary-button" onClick={()=>void testLevels()} disabled={testRunning}>自动测试 Level 1–50</button><p className="test-report" role="status">{testReport}</p><small>语音测试会打开挑战窗口，再点击模拟识别成功。</small></Modal>}
    <EffectsLayer effects={effects} reduced={settings.reducedMotion}/>
    {toast&&<div className="toast" role="status"><Sparkles size={15}/>{toast}<button aria-label="关闭提示" onClick={()=>setToast('')}><X size={13}/></button></div>}
  </main>;
}
