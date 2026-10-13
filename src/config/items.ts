import type { ItemKind } from '../game/types';
// # Every food uses a replaceable original food render, never an emoji.
const definitions: [ItemKind, string, string][] = [
  ['shrimp','鲜虾','#ef896c'], ['dumpling','饺子','#ead5a3'], ['broccoli','西兰花','#77a965'],
  ['chicken','鸡腿','#c38650'], ['mushroom','香菇','#aa7960'], ['cabbage','白菜','#b5c98c'],
  ['corn','玉米','#edc660'], ['tofu','豆腐','#ece0b8'], ['crab','蟹棒','#e69381'],
  ['fishball','鱼丸','#ded7b5'], ['beef','牛肉卷','#c4867e'], ['lotus','藕片','#e5c69e'],
  ['carrot','胡萝卜','#e6a062'], ['egg','鸡蛋','#f1cd6c'], ['wonton','馄饨','#e4d5b0'],
  ['lettuce','生菜','#91b47e'], ['siu-mai','烧卖','#d4bc89'], ['bun','包子','#ece0c0'],
  ['strawberry','草莓','#d9827f'], ['orange','橙子','#e8b362'], ['watermelon','西瓜','#dd8c83'],
  ['cake','蛋糕','#eab5a6'], ['donut','甜甜圈','#c99976'],
  ['sushi','寿司','#ff9652'],['sausage','烤肠','#ef713e'],['grapes','葡萄','#9852bd'],['peach','蜜桃','#ff9d9a'],['ice-pop','雪糕','#f789a5'],
];
export const items = Object.fromEntries(definitions.map(([id,name,color]) => [id,{id,name,color,src:`/assets/items/${id}.webp`}])) as Record<ItemKind,{id:ItemKind;name:string;color:string;src:string}>;
export const itemOrder = definitions.map(d => d[0]);
export const levelItemOrder: ItemKind[] = ['shrimp','dumpling','broccoli','chicken','mushroom','sushi','sausage','grapes','peach','ice-pop','cabbage','wonton','tofu','fishball','lettuce','crab','beef','lotus','corn','carrot','egg','siu-mai','bun','strawberry','orange','watermelon','cake','donut'];

// # Fixed serving sizes follow the pictured whole food or cut portion; assumed values and primary sources are documented in SIZE_REFERENCE.md.
export const foodSizes:Record<ItemKind,number>={shrimp:.16,dumpling:.19,broccoli:.27,chicken:.38,mushroom:.19,cabbage:.42,corn:.24,tofu:.125,crab:.25,fishball:.10,beef:.21,lotus:.20,carrot:.43,egg:.25,wonton:.16,lettuce:.40,'siu-mai':.16,bun:.22,strawberry:.125,orange:.24,watermelon:.41,cake:.30,donut:.27,sushi:.19,sausage:.37,grapes:.215,peach:.235,'ice-pop':.35};
