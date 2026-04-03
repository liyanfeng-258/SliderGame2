import {newEmpty} from './state.js';

const Maze = (() => {

// 简洁矩形迷宫（保持你现有实现）
function randomMaze(w,h){
  w=Math.max(5,Math.min(35,parseInt(w)||15));
  h=Math.max(5,Math.min(35,parseInt(h)||15));
  const g=newEmpty(h,w,1);
  for(let y=1;y<h;y+=2) for(let x=1;x<w;x+=2) g[y][x]=0;

  const dirs=[[0,-2],[2,0],[0,2],[-2,0]];
  const stack=[[1,1]];
  const seen=new Set(['1,1']);
  const rand=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];}return a;};

  while(stack.length){
    const [cx,cy]=stack[stack.length-1];
    const opts=rand(dirs.slice()).filter(([dx,dy])=>{
      const nx=cx+dx, ny=cy+dy, mx=cx+dx/2, my=cy+dy/2;
      return nx>0&&ny>0&&nx<w&&ny<h && g[ny][nx]===0 && g[my][mx]===1 && !seen.has(nx+','+ny);
    });
    if(!opts.length){ stack.pop(); continue; }
    const [dx,dy]=opts[0];
    const nx=cx+dx, ny=cy+dy, mx=cx+dx/2, my=cy+dy/2;
    g[my][mx]=0; seen.add(nx+','+ny); stack.push([nx,ny]);
  }
  return g;
}

return { randomMaze };
})();

export const { randomMaze } = Maze;

