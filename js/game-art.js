const TAU = Math.PI * 2;
export const COLORS = ["#bd93ff", "#79dbad", "#ffad67", "#e789bb", "#82c7ec", "#f1d875"];

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function path(ctx, points, color, stroke, width = 3) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (color) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function box(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function bat(ctx, x, y, size, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const flap = Math.sin(t * 8) * 5;
  path(ctx, [[-20,-8+flap],[-9,-5],[-3,0],[0,-4],[3,0],[9,-5],[20,-8+flap],[14,3],[8,1],[3,7],[0,5],[-3,7],[-8,1],[-14,3]], "#191628");
  ctx.restore();
}
function tree(ctx, x, y, scale, color) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  path(ctx, [[-16,0],[-8,-66],[-22,-112],[-25,-154],[-8,-124],[2,-70],[14,-146],[29,-176],[22,-126],[12,-69],[30,-90],[57,-97],[39,-78],[14,-46],[15,0]], color);
  path(ctx, [[-16,-95],[-57,-117],[-64,-147],[-49,-129],[-19,-118]],color);
  path(ctx, [[22,-135],[45,-149],[56,-175],[53,-143],[28,-117]],color);
  ctx.restore();
}
function pumpkin(ctx, x, y, scale, lit = true) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ellipse(ctx,0,10,29,8,"#080e1680");
  for (let i=-1;i<=1;i++) ellipse(ctx,i*12,-5,i ? 15:17,22,i ? "#a95429":"#e88236");
  path(ctx,[[-4,-24],[-5,-35],[2,-40],[8,-34],[3,-23]],"#798551");
  if (lit) {
    path(ctx,[[-18,-7],[-9,-16],[-5,-6]],"#f9dd78"); path(ctx,[[5,-6],[10,-16],[18,-7]],"#f9dd78");
    path(ctx,[[-15,2],[-4,6],[2,3],[6,8],[16,1],[10,12],[-8,12]],"#f9dd78");
  }
  ctx.restore();
}

export function drawScene(ctx, w, h, t, distance) {
  const sky = ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,"#18172f"); sky.addColorStop(.5,"#4b4168"); sky.addColorStop(1,"#202636");
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
  for(let i=0;i<44;i++) {
    const x=(i*139.7)%w, y=30+(i*73.1)%(h*.36);
    ellipse(ctx,x,y, i%7===0?1.6: .8, i%7===0?1.6:.8,`rgba(230,226,209,${.25+.22*Math.sin(t*.6+i)})`);
  }
  const mx=w*.79, my=h*.18, mr=Math.min(w*.095,h*.14);
  ellipse(ctx,mx,my,mr+10,mr+10,"#e9d9b10c"); ellipse(ctx,mx,my,mr,mr,"#e0d9b7");
  for(const [x,y,r] of [[-.35,-.2,.22],[.24,.36,.25],[.3,-.42,.12],[-.44,.43,.09]]) ellipse(ctx,mx+mr*x,my+mr*y,mr*r,mr*r,"#b9bda77a");
  const drift=distance*.13;
  for(let i=-1;i<5;i++) {
    const x=i*330-(drift%330);
    path(ctx,[[x,h*.49],[x+95,h*.30],[x+175,h*.39],[x+268,h*.24],[x+360,h*.51]],"#2c304b");
  }
  const hx=w*.62-(drift*.3)%120;
  path(ctx,[[hx,h*.45],[hx,h*.27],[hx+22,h*.27],[hx+25,h*.18],[hx+51,h*.25],[hx+53,h*.45]],"#20243c");
  path(ctx,[[hx-6,h*.28],[hx+20,h*.20],[hx+29,h*.29]],"#181e31");
  box(ctx,hx+34,h*.29,7,12,3,"#d7a560"); box(ctx,hx+9,h*.34,7,10,3,"#d7a560");
  for(let i=-1;i<7;i++) tree(ctx,i*240-(distance*.3%240),h*.48,.8+(i%3)*.13,"#1c2338");
  for(let i=-1;i<12;i++) {
    const x=i*112-(distance*.48%112), y=h*.49+(i%3)*6;
    box(ctx,x,y-37,30,44,[13,13,1,1],i%2?"#535967":"#424b5d");
    box(ctx,x+13,y-28,3,17,1,"#222d3e"); box(ctx,x+8,y-23,13,3,1,"#222d3e");
  }
  const ground=ctx.createLinearGradient(0,h*.46,0,h); ground.addColorStop(0,"#323e47"); ground.addColorStop(.6,"#28313a"); ground.addColorStop(1,"#171f29");
  ctx.fillStyle=ground; ctx.fillRect(0,h*.5,w,h*.5);
  path(ctx,[[0,h*.51],[w,h*.51]],null,"#788380",2);
  for(let i=-1;i<36;i++) {
    const x=i*37-(distance*.66%37);
    path(ctx,[[x,h*.50],[x,h*.43]],null,"#131c2c",3);
    path(ctx,[[x-4,h*.445],[x,h*.43-5],[x+4,h*.445]],"#131c2c");
  }
  path(ctx,[[0,h*.46],[w,h*.46]],null,"#182334",3);
  for(let i=0;i<65;i++) {
    const x=((i*173-distance*(.7+(i%3)*.15))%(w+40)+(w+40))%(w+40)-20;
    const y=h*.53+(i*67)%(h*.43);
    ellipse(ctx,x,y,3+(i%3)*2,1.3,"#81908b24");
  }
  for(let i=-1;i<5;i++) pumpkin(ctx,i*300-(distance*.82%300)+60,h*.50,.55+i%2*.1);
  ctx.save(); ctx.globalAlpha=.13;
  for(let i=0;i<3;i++) {
    const mist=ctx.createLinearGradient(0,h*(.41+i*.2),0,h*(.50+i*.2));
    mist.addColorStop(0,"#bbcfc200"); mist.addColorStop(.5,"#bbcfc2"); mist.addColorStop(1,"#bbcfc200");
    ctx.fillStyle=mist; ctx.fillRect(Math.sin(t*.22+i)*35-40,h*(.41+i*.2),w+80,h*.09);
  }
  ctx.restore();
  for(let i=0;i<3;i++) bat(ctx,w*.35+i*33+Math.sin(t*.35+i)*34,h*.12+i*12,.4+i*.12,t+i);
  const vignette=ctx.createLinearGradient(0,0,w,0); vignette.addColorStop(0,"#09101c55"); vignette.addColorStop(.3,"#09101c00"); vignette.addColorStop(1,"#09101c33");
  ctx.fillStyle=vignette; ctx.fillRect(0,0,w,h);
}

function limb(ctx, x, y, length, angle, color, width) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  path(ctx,[[0,0],[3,length*.52],[0,length]],null,color,width); ctx.restore();
}

export function drawRunner(ctx,x,y,scale,t,variant,color,state) {
  const running=state==="running" || state==="scared", celebrating=state==="winner";
  const phase=t*17+variant, stride=running?Math.sin(phase)*.85:celebrating?Math.sin(t*7)*.2:0;
  const bob=running?Math.abs(Math.cos(phase))*3:celebrating?Math.abs(Math.sin(t*7))*9:Math.sin(t*2)*1.2;
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ellipse(ctx,0,3,23-bob*.5,5,"#080e1880");
  ctx.translate(0,-bob);ctx.rotate(running?.10:0);
  const skin=variant%3===0?"#b2d2ba":"#f2c6a4";
  if (variant===3) path(ctx,[[-14,-45],[-25,-1],[0,-12],[23,0],[13,-46]],"#8d5388");
  limb(ctx,-8,-20,21,stride,"#191e31",9);limb(ctx,8,-20,21,-stride,"#191e31",9);
  limb(ctx,-16,-42,22,-stride-(celebrating?2:0),skin,7);
  limb(ctx,16,-42,22,stride-(celebrating?2:0),skin,7);
  box(ctx,-16,-48,32,32,8,color);
  if(variant===2) {
    path(ctx,[[0,-43],[0,-20]],null,"#f3eada",3);
    for(let i=0;i<3;i++) path(ctx,[[-9,-39+i*6],[0,-36+i*6],[9,-39+i*6]],null,"#f3eada",2);
  }
  if(variant===4) for(let i=0;i<3;i++) path(ctx,[[-13,-44+i*9],[13,-38+i*9]],null,"#eee4cf",4);
  ellipse(ctx,0,-62,20,20,variant===1?"#ddddec":variant===5?"#e98b3f":skin);
  if(variant===0) {
    ellipse(ctx,0,-76,28,5,"#292039");path(ctx,[[-16,-76],[0,-112],[6,-100],[17,-76]],"#4e365b");
    path(ctx,[[-13,-80],[12,-80]],null,"#e4a758",4);
  }
  if(variant===1) path(ctx,[[-20,-52],[-22,-37],[-11,-42],[0,-36],[11,-42],[22,-37],[20,-52]],"#ddddec");
  if(variant===3) path(ctx,[[-19,-65],[-15,-82],[0,-75],[15,-82],[20,-65],[9,-70],[0,-64],[-8,-70]],"#272233");
  if(variant===5) path(ctx,[[-3,-81],[0,-91],[7,-94]],null,"#82a368",6);
  if(variant===4) for(let i=0;i<2;i++) path(ctx,[[-16,-76+i*9],[16,-70+i*9]],null,"#ece0bd",4);
  const fear=state==="scared";
  ellipse(ctx,-6,-62,3,fear?5:3.5,"#272538");ellipse(ctx,8,-62,3,fear?5:3.5,"#272538");
  if (Math.sin(t*.7+variant)> .994 && !running) path(ctx,[[-10,-63],[12,-63]],null,skin,6);
  if(fear) ellipse(ctx,2,-51,4,5,"#493543"); else path(ctx,[[-2,-51],[2,-49],[6,-51]],null,"#604053",2);
  if(celebrating) {ctx.fillStyle="#e8ca70";ctx.font="bold 26px Manrope,Arial";ctx.fillText("★",-13,-96);}
  ctx.restore();
}

export function drawMonster(ctx,x,y,scale,t,state) {
  const running=["running","attacking","eating"].includes(state);
  const phase=t*(running?15:state==="walking"?7:2);
  const stride=running?Math.sin(phase)*.72:Math.sin(phase)*.12;
  const bite=state==="attacking", chew=state==="eating";
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ellipse(ctx,0,5,58,10,"#050e198c");
  ctx.translate(0,-(running?Math.abs(Math.cos(phase))*7:Math.sin(phase)*3));
  ctx.rotate(bite?.17:running?.07:0);
  limb(ctx,-28,-27,31,stride,"#769552",18);limb(ctx,28,-27,31,-stride,"#769552",18);
  limb(ctx,-51,-79,52,-.5-stride*.6,"#779957",14);
  limb(ctx,51,-79,52,bite?-1.45:state==="celebrating"?2.4+Math.sin(t*7)*.2:stride*.6-.5,"#8cb65b",14);
  const flesh=ctx.createLinearGradient(-55,-124,50,-18);flesh.addColorStop(0,"#ffd07d");flesh.addColorStop(.38,"#ea8d3c");flesh.addColorStop(1,"#a84b31");
  ellipse(ctx,0,-76,63,61,"#252134");
  ellipse(ctx,-31,-77,29,52,flesh);ellipse(ctx,31,-77,29,52,flesh);ellipse(ctx,0,-77,36,57,flesh);
  path(ctx,[[-14,-130],[-14,-151],[-1,-163],[13,-157],[3,-140],[8,-130]],"#789554","#334b39",3);
  path(ctx,[[9,-141],[34,-159],[47,-151],[39,-135]],"#91af68");
  path(ctx,[[-46,-102],[-17,-112],[-13,-85],[-35,-84]],"#27252a");
  path(ctx,[[13,-85],[17,-112],[46,-102],[35,-84]],"#27252a");
  if (Math.sin(t*.8)<.98 || running) {
    ellipse(ctx,-25,-97,6,10,"#d8f999"); ellipse(ctx,25,-97,6,10,"#d8f999");
    ellipse(ctx,-23,-98,2.5,7,"#24382a"); ellipse(ctx,27,-98,2.5,7,"#24382a");
  }
  path(ctx,[[-5,-79],[4,-88],[10,-77]],"#61362c");
  ctx.save();ctx.translate(0,-59);ctx.scale(1,bite?1.8:chew? .8+Math.sin(t*32)*.25:1);
  ellipse(ctx,0,0,36,19,"#382332");
  for(let i=0;i<5;i++) {const tx=-28+i*13;path(ctx,[[tx,-12],[tx+10,-15],[tx+5,-1]],"#ffe5aa");}
  path(ctx,[[-24,8],[-17,-1],[-12,14]],"#ffe5aa");path(ctx,[[11,14],[17,1],[24,8]],"#ffe5aa");ctx.restore();
  path(ctx,[[-49,-67],[-43,-63]],null,"#ffbb6960",3);
  if(state==="celebrating") path(ctx,[[55,-98],[65,-120]],null,"#c5dd6a",4);
  ctx.restore();
}

export function drawName(ctx,name,x,y,maxWidth,color,selected=false) {
  let size=17;
  const linesFor = () => {
    ctx.font=`700 ${size}px Manrope,Arial`;
    const words=String(name).split(/\s+/), lines=[];let current="";
    for(const word of words) {
      const text=current?`${current} ${word}`:word;
      if(ctx.measureText(text).width>maxWidth-18 && current) {lines.push(current);current=word;} else current=text;
    }
    if(current)lines.push(current);return lines;
  };
  let lines=linesFor();
  while(size>10 && (lines.length>3 || lines.some(line=>ctx.measureText(line).width>maxWidth-18))) {size--;lines=linesFor();}
  const width=Math.min(maxWidth,Math.max(...lines.map(line=>ctx.measureText(line).width))+20), height=lines.length*(size+3)+14;
  box(ctx,x-width/2,y-height,width,height,6,selected?"#dac685":"#141e2feb");
  box(ctx,x-width/2,y-height,3,height,2,color);
  ctx.fillStyle=selected?"#171c29":"#f7f3ec";ctx.textAlign="center";ctx.textBaseline="middle";
  lines.forEach((line,i)=>ctx.fillText(line,x,y-height+9+size/2+i*(size+3),maxWidth-14));
}

export function drawPoof(ctx,x,y,progress,color) {
  ctx.save();ctx.globalAlpha=1-progress;
  for(let i=0;i<9;i++) {const a=i*TAU/9;ellipse(ctx,x+Math.cos(a)*progress*55,y+Math.sin(a)*progress*38,12*(1-progress)+2,12*(1-progress)+2,i%2?color:"#d7dcc2");}
  ctx.restore();
}
