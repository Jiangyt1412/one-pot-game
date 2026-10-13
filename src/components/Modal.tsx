import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
// # Modal focus is trapped and restored; gameplay beneath is separately made inert.
export function Modal({children,onClose,label,className=''}:{children:ReactNode;onClose?:()=>void;label:string;className?:string}) {
  const ref=useRef<HTMLDivElement>(null),closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const old=document.activeElement as HTMLElement|null;
    const el=ref.current;el?.querySelector<HTMLElement>('button,input,select')?.focus();
    const handler=(e:KeyboardEvent)=>{
      if(e.key==='Escape'&&closeRef.current){e.preventDefault();closeRef.current();}
      if(e.key==='Tab'&&el){const nodes=Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href],[tabindex="0"]'));const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
    };
    document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);old?.focus();};
  },[]);
  return <div className="modal-backdrop"><div className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-label={label} ref={ref}>{onClose&&<button className="modal-close icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={19}/></button>}{children}</div></div>;
}
