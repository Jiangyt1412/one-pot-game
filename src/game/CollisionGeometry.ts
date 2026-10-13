import {foodHulls} from '../config/foodHulls';
import type {FoodItem} from './types';
export interface Contact {x:number;y:number;distance:number;}
export interface CollisionBody {food:FoodItem;points:Float64Array;axes:Float64Array;radius:number;}
// # Convex artwork envelopes are conservative two-dimensional bodies, not square sprite bounds.
const geometry=new Map(Object.entries(foodHulls).map(([kind,points])=>{
  const axes:number[]=[];let radius=0;
  for(let i=0;i<points.length;i+=2){const j=(i+2)%points.length,dx=points[j]-points[i],dy=points[j+1]-points[i+1],d=Math.hypot(dx,dy);axes.push(-dy/d,dx/d);radius=Math.max(radius,Math.hypot(points[i],points[i+1]));}
  return [kind,{points,axes,radius}] as const;
}));
export function createBody(food:FoodItem):CollisionBody {
  const shape=geometry.get(food.kind)!;
  const body={food,points:new Float64Array(shape.points.length),axes:new Float64Array(shape.axes.length),radius:shape.radius*food.size};
  updateBody(body);return body;
}
export function updateBody(body:CollisionBody){
  const food=body.food,shape=geometry.get(food.kind)!,c=Math.cos(food.angle),s=Math.sin(food.angle);
  for(let i=0;i<shape.points.length;i+=2){const x=shape.points[i],y=shape.points[i+1];body.points[i]=food.x+(x*c-y*s)*food.size;body.points[i+1]=food.y+(x*s+y*c)*food.size;body.axes[i]=shape.axes[i]*c-shape.axes[i+1]*s;body.axes[i+1]=shape.axes[i]*s+shape.axes[i+1]*c;}
  body.radius=shape.radius*food.size;
}
export function moveBody(body:CollisionBody,dx:number,dy:number){
  body.food.x+=dx;body.food.y+=dy;
  for(let i=0;i<body.points.length;i+=2){body.points[i]+=dx;body.points[i+1]+=dy;}
}
export function contactBetween(a:CollisionBody,b:CollisionBody,out:Contact,gap=0):boolean {
  const dx=b.food.x-a.food.x,dy=b.food.y-a.food.y,r=a.radius+b.radius+gap;
  if(dx*dx+dy*dy>r*r)return false;
  let best=Infinity,nx=0,ny=0;
  for(const axes of [a.axes,b.axes])for(let i=0;i<axes.length;i+=2){
    const x=axes[i],y=axes[i+1];let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity;
    for(let p=0;p<a.points.length;p+=2){const v=a.points[p]*x+a.points[p+1]*y;minA=Math.min(minA,v);maxA=Math.max(maxA,v);}
    for(let p=0;p<b.points.length;p+=2){const v=b.points[p]*x+b.points[p+1]*y;minB=Math.min(minB,v);maxB=Math.max(maxB,v);}
    const forward=maxA-minB+gap,backward=maxB-minA+gap;
    if(forward<=0||backward<=0)return false;
    const distance=Math.min(forward,backward),sign=forward<backward?1:-1;
    if(distance<best){best=distance;nx=x*sign;ny=y*sign;}
  }
  out.x=nx;out.y=ny;out.distance=best;return true;
}
// # Constrain the rotated opaque hull itself, allowing long foods to sit naturally near the circular rim.
export function containBody(body:CollisionBody):boolean {
  const dx=body.food.x-.5,dy=body.food.y-.5,d=Math.hypot(dx,dy);if(!d)return false;
  const nx=dx/d,ny=dy/d;let limit=.478;
  for(let i=0;i<body.points.length;i+=2){const x=body.points[i]-body.food.x,y=body.points[i+1]-body.food.y,projection=nx*x+ny*y;limit=Math.min(limit,-projection+Math.sqrt(Math.max(0,projection*projection+.478**2-x*x-y*y)));}
  if(d<=limit)return false;
  moveBody(body,nx*(limit-d),ny*(limit-d));return true;
}
