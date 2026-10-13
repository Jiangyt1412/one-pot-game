import { RotateCcw, WandSparkles, Waves } from 'lucide-react';
import type { Inventory, ToolKind } from '../game/types';
// # Original palette plus licensed Lucide line icons for controls.
export const toolNames:Record<ToolKind,string>={shuffle:'摇一摇',match:'自动匹配',return:'撤回暂存'};
export function ToolBar({tools,onUse,disabled}:{tools:Inventory;onUse:(tool:ToolKind)=>void;disabled:boolean}) {
  return <footer className="tool-bar">{(['shuffle','match','return'] as const).map(tool=><button disabled={disabled} key={tool} data-tool={tool} className={`tool-button tool-${tool}`} onClick={()=>onUse(tool)}><div className="tool-art">{tool==='shuffle'?<Waves size={30}/>:tool==='match'?<WandSparkles size={29}/>:<RotateCcw size={27}/>}<span className="tool-stock">×{tools[tool]}</span></div><strong>{toolNames[tool]}</strong></button>)}</footer>;
}
