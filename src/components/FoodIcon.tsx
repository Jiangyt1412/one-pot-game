import type { ItemKind } from '../game/types';
import { items } from '../config/items';
import { foodImageUrls } from '../services/AssetService';
// # Alternative text names the original food artwork for nonvisual users.
export function FoodIcon({kind,className=''}:{kind:ItemKind;className?:string}) {return <img className={`food-icon ${className}`} src={foodImageUrls.get(kind)??items[kind].src} alt={items[kind].name} draggable={false}/>;}
