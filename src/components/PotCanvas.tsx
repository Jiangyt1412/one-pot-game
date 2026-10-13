import { useEffect, useRef } from 'react';
import { foodImages, foodMasks } from '../services/AssetService';
import type { FoodItem, GameSnapshot, ItemKind } from '../game/types';
import { getLevel } from '../config/levels';
import { FloatingScene } from '../game/FloatingScene';
import { pickRenderedPixel } from '../game/FoodHitTest';
// # Canvas owns motion and the exact drawn projection; no parallel text-selection control exists.
export function PotCanvas({snapshot,onPick,onScene,reduced,decorative=false,shake=0}:{snapshot:GameSnapshot;onPick:(id:number,visibleBoard?:readonly FoodItem[])=>void;onScene?:(scene:readonly FoodItem[])=>void;reduced:boolean;decorative?:boolean;shake?:number}) {
  const floating=useRef(new FloatingScene());
  const canvas=useRef<HTMLCanvasElement>(null),current=useRef(snapshot),animTime=useRef(0),scene=useRef<FoodItem[]>([]),publish=useRef(onScene);
  const shuffleUntil=useRef(0);
  const trackedBoard=useRef<FoodItem[]|null>(null);
  current.current=snapshot;publish.current=onScene;
  // # A shuffle interpolates for its short effect without recreating the animation loop or resetting the clock.
  useEffect(()=>{if(shake)shuffleUntil.current=performance.now()+650;},[shake]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
    let frame=0,width=1,height=1,dpr=1,last=performance.now(),dirty=true,lastRevision=-1;
    const sprites=new Map<ItemKind,HTMLCanvasElement>();
    // # Rasterize each type at its displayed Retina size once, rather than resampling full assets 99 times per frame.
    const resize=()=>{const rect=el.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(2,window.devicePixelRatio||1);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);sprites.clear();dirty=true;};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const draw=(now:number)=>{
      const state=current.current,config=getLevel(state.level),dt=Math.min(.05,(now-last)/1000);last=now;
      const active=state.status==='PLAYING'||decorative;if(active)animTime.current+=dt;
      // # Changing animation preferences preserves completed local displacements; only a new board resets them.
      if(trackedBoard.current!==state.board){trackedBoard.current=state.board;animTime.current=0;floating.current.reset();sprites.clear();dirty=true;}
      // # Paused and reduced-motion scenes redraw only when their content or viewport changes.
      if((!active||reduced)&&!dirty&&lastRevision===state.revision){frame=requestAnimationFrame(draw);return;}
      scene.current=floating.current.update(state.board,animTime.current,active?dt:0,config,reduced,now<shuffleUntil.current);publish.current?.(scene.current);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;
      ctx.clearRect(0,0,width,height);
      ctx.save();ctx.beginPath();ctx.ellipse(width/2,height/2,width*.49,height*.49,0,0,Math.PI*2);ctx.clip();
      // # Every surviving food is drawn once at full opacity; only a picked food leaves the pot.
      for(const item of floating.current.drawOrder){
        const source=foodImages.get(item.kind);if(!source)continue;const size=item.size*width;
        let image=sprites.get(item.kind);
        if(!image){image=document.createElement('canvas');image.width=image.height=Math.ceil(size*dpr);const raster=image.getContext('2d');if(!raster)continue;raster.imageSmoothingEnabled=true;raster.imageSmoothingQuality='high';raster.drawImage(source,0,0,image.width,image.height);sprites.set(item.kind,image);}
        const c=Math.cos(item.angle),s=Math.sin(item.angle);
        ctx.setTransform(dpr*c,dpr*s,-dpr*s,dpr*c,dpr*item.x*width,dpr*item.y*height);
        ctx.drawImage(image,-size/2,-size/2,size,size);
      }
      ctx.restore();dirty=false;lastRevision=state.revision;frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[reduced,decorative]);
  function tap(e:React.PointerEvent<HTMLCanvasElement>){
    if(decorative||current.current.status!=='PLAYING')return;const rect=e.currentTarget.getBoundingClientRect();
    const nx=(e.clientX-rect.left)/rect.width,ny=(e.clientY-rect.top)/rect.height;if(Math.hypot(nx-.5,ny-.5)>.49)return;
    const item=pickRenderedPixel(scene.current,(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height,rect.width,rect.height,foodMasks);
    if(item)onPick(item.id,scene.current);
  }
  return <div className={`pot-zone ${decorative?'decorative-pot':''}`}><div className="steam steam-one"/><div className="steam steam-two"/><div className="steam steam-three"/><div className="table-chopsticks"><i/><i/></div><div className="table-napkin"/><div className="pot-shell" data-pot><div className="pot-handle left"/><div className="pot-handle right"/><div className={`pot-pan ${shake?'shaking':''}`}><div className="broth"><canvas ref={canvas} onPointerDown={tap} aria-label="点击任何露出的食物" role="img"/></div><div className="pot-front-shine"/></div></div></div>;
}
