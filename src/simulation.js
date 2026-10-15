export const W=1200,H=620,GROUND=590,DT=1/60;
export function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export class Terrain {
 constructor(seed=42){this.cells=new Uint8Array(W*H);const rng=random(seed);this.phase=rng()*6;for(let x=0;x<W;x++){let y=this.surface(x);for(let j=y;j<GROUND;j++)this.cells[j*W+x]=1;}this.version=0;}
 surface(x){return Math.floor(370+48*Math.sin(x/150+this.phase)+24*Math.sin(x/61));}
 solid(x,y){x=Math.floor(x);y=Math.floor(y);return x>=0&&x<W&&y>=0&&y<H&&this.cells[y*W+x]===1;}
 circle(x,y,r,fill=0){for(let j=Math.max(0,Math.floor(y-r));j<Math.min(GROUND,Math.ceil(y+r));j++)for(let i=Math.max(0,Math.floor(x-r));i<Math.min(W,Math.ceil(x+r));i++)if((i-x)**2+(j-y)**2<=r*r)this.cells[j*W+i]=fill;this.version++;}
 top(x){for(let y=0;y<GROUND;y++)if(this.solid(x,y))return y;return GROUND;}
}
export function blastDamage(base,distance,radius){return Math.round(base*Math.max(0,1-distance/radius));}
export class Battle {
 constructor(seed=42){this.terrain=new Terrain(seed);this.players=[190,1010].map((x,i)=>({x,y:this.terrain.top(x)-15,vx:0,vy:0,hp:150,name:i?'RIVER':'EMBER',wet:0,burn:0,curse:0,grounded:true}));this.active=0;this.phase='aim';this.budget=90;this.turn=1;this.events=[];this.projectile=null;this.clock=0;this.wait=0;this.winner=null;this.currentMove=null;this.summon=null;}
 emit(type,data={}){this.events.push({type,...data});}
 move(dir){if(this.phase!=='aim'||this.budget<=0)return;let p=this.players[this.active],dx=dir*(p.curse?1.1:2);if(p.x+dx<12||p.x+dx>W-12)return;let ny=p.y;for(let up=0;up<=7;up++){if(!this.terrain.solid(p.x+dx-7,ny+12)&&!this.terrain.solid(p.x+dx+7,ny+12)){p.x+=dx;p.y=ny;this.budget=Math.max(0,this.budget-Math.abs(dx));return;}ny--;}}
 jump(){let p=this.players[this.active];if(this.phase==='aim'&&p.grounded&&this.budget>=15){p.vy=-210;p.grounded=false;this.budget-=15;}}
 commit(species,move,angle,power){if(this.phase!=='aim')return false;this.currentMove=move;this.phase='summon';this.wait=1.1;let p=this.players[this.active];this.summon={species,x:p.x+(Math.cos(angle*Math.PI/180)>=0?36:-36),y:p.y,angle,power};this.emit('summon');return true;}
 hit(x,y,move,direct=false){if(move.kind!=='ghost')this.terrain.circle(x,y,move.radius);for(let i=0;i<2;i++){let p=this.players[i],d=Math.hypot(p.x-x,p.y-y),reach=move.radius+24;if(d<reach){let damage=direct?move.damage:blastDamage(move.damage,d,reach);if(move.effect==='electric'&&p.wet)damage=Math.round(damage*1.5);p.hp=Math.max(0,p.hp-damage);let dx=p.x-x;p.vx+=(dx>=0?1:-1)*move.force*(1-d/reach);p.vy-=move.force*.65*(1-d/reach);if(move.effect==='wet')p.wet=3;if(move.effect==='burn')p.burn=2;if(move.effect==='curse')p.curse=2;this.emit('damage',{x:p.x,y:p.y,damage});}}this.emit('impact',{x,y,color:move.color,radius:move.radius});}
 launch(){let s=this.summon,m=this.currentMove,p=this.players[this.active],a=s.angle*Math.PI/180,dx=Math.cos(a),dy=-Math.sin(a);if(m.kind==='lob'){let speed=180+s.power*4;this.projectile={x:p.x+dx*19,y:p.y-15+dy*19,vx:dx*speed,vy:dy*speed,age:0};this.phase='flight';return;}
 if(m.kind==='wall'){let x=p.x+(dx>=0?75:-75),y=this.terrain.top(x);for(let j=0;j<65;j+=8)this.terrain.circle(x,y-j,24,1);for(let q of this.players)while((this.terrain.solid(q.x,q.y)||this.terrain.solid(q.x,q.y+13))&&q.y>0)q.y-=2;this.emit('impact',{x,y:y-30,color:m.color,radius:40});}
 else {let ox=p.x+dx*20,oy=p.y-12;if(m.kind==='dig'){oy=p.y+22;dx=dx>=0?1:-1;dy=0;}let hit=new Set;let ex=ox,ey=oy;for(let t=0;t<m.range;t+=5){ex=ox+dx*t;ey=oy+dy*t;for(let i=0;i<2;i++){if(i===this.active||hit.has(i))continue;let q=this.players[i];if(Math.hypot(q.x-ex,q.y-ey)<m.radius+14){this.hit(q.x,q.y,m,true);hit.add(i);}}if(m.kind!=='ghost')this.terrain.circle(ex,ey,m.radius);}this.emit('beam',{x:ox,y:oy,ex,ey,color:m.color});}
 this.phase='settle';this.wait=1.3;}
 step(){this.clock+=DT;if(this.phase==='over')return;for(let p of this.players){p.vy+=420*DT;let steps=Math.max(1,Math.ceil(Math.max(Math.abs(p.vx),Math.abs(p.vy))*DT/3));p.grounded=false;for(let i=0;i<steps;i++){let nx=p.x+p.vx*DT/steps;if(!this.terrain.solid(nx+Math.sign(p.vx)*8,p.y)&&nx>8&&nx<W-8)p.x=nx;else p.vx=0;let ny=p.y+p.vy*DT/steps;if(p.vy>=0&&this.terrain.solid(p.x,ny+14)){p.vy=0;p.grounded=true;}else if(p.vy<0&&this.terrain.solid(p.x,ny-14))p.vy=0;else p.y=ny;}p.vx*=p.grounded?.88:.995;if(p.y>GROUND+12)p.hp=0;}
 if(this.phase==='summon'){this.wait-=DT;if(this.wait<=0)this.launch();}
 else if(this.phase==='flight'){let b=this.projectile;b.age+=DT;b.vy+=420*DT;let steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*DT/3));for(let i=0;i<steps;i++){b.x+=b.vx*DT/steps;b.y+=b.vy*DT/steps;if(this.terrain.solid(b.x,b.y)||this.players.some((p,j)=>j!==this.active&&Math.hypot(p.x-b.x,p.y-b.y)<17)||b.y>GROUND||b.x<0||b.x>W||b.age>8){this.hit(b.x,b.y,this.currentMove);this.projectile=null;this.phase='settle';this.wait=1.1;break;}}}
 else if(this.phase==='settle'){this.wait-=DT;if(this.wait<0&&this.players.every(p=>p.hp<=0||(p.grounded&&Math.abs(p.vx)<3))||this.wait< -5){this.phase='recall';this.wait=.4;}}
 else if(this.phase==='recall'){this.wait-=DT;if(this.wait<=0)this.nextTurn();}
 if(this.phase==='aim'&&this.players.some(p=>p.hp<=0))this.checkVictory();}
 checkVictory(){let alive=this.players.map((p,i)=>p.hp>0?i:-1).filter(i=>i>=0);if(alive.length<2){this.phase='over';this.winner=alive.length?alive[0]:-1;this.emit('victory');return true;}return false;}
 nextTurn(){if(this.checkVictory())return;this.active=1-this.active;this.turn++;let p=this.players[this.active];if(p.burn>0){p.hp=Math.max(0,p.hp-5);p.burn--;this.emit('damage',{x:p.x,y:p.y,damage:5});}if(p.wet)p.wet--;if(p.curse)p.curse--;if(this.checkVictory())return;this.budget=90;this.phase='aim';this.summon=null;this.emit('turn');}
}
