// # Keep the main connected food silhouette; atlas neighbours must never become clickable scraps.
export function cleanSpritePixels(input:Uint8ClampedArray,width:number,height:number){
  const count=width*height,labels=new Int32Array(count).fill(-1),queue=new Int32Array(count);
  let best=-1,bestCount=0,component=0;
  for(let start=0;start<count;start++){
    if(labels[start]!==-1||input[start*4+3]<24)continue;
    let head=0,tail=1;queue[0]=start;labels[start]=component;
    while(head<tail){const at=queue[head++],x=at%width,y=Math.floor(at/width);
      for(const next of [x>0?at-1:-1,x<width-1?at+1:-1,y>0?at-width:-1,y<height-1?at+width:-1])if(next>=0&&labels[next]===-1&&input[next*4+3]>=24){labels[next]=component;queue[tail++]=next;}
    }
    if(tail>bestCount){best=component;bestCount=tail;}component++;
  }
  const keep=new Uint8Array(count),pixels=new Uint8ClampedArray(input);
  let minX=width,minY=height,maxX=-1,maxY=-1;
  // # A two-pixel fringe retains antialiased edges around the connected body without retaining distant scraps.
  for(let at=0;at<count;at++)if(labels[at]===best&&best>=0){const x=at%width,y=Math.floor(at/width);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)keep[yy*width+xx]=1;}}
  for(let at=0;at<count;at++){
    if(!keep[at]||pixels[at*4+3]<16)pixels.fill(0,at*4,at*4+4);
    else {const x=at%width,y=Math.floor(at/width);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(maxX<0)throw new Error('Food sprite has no opaque silhouette');
  return {pixels,bounds:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}};
}
