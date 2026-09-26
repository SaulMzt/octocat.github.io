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

function limb(ctx, x, y, length, angle, color, width, handColor) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  path(ctx,[[0,0],[3,length*.52],[0,length]],null,color,width);
  if (handColor) ellipse(ctx,0,length,width*.63,width*.48,handColor);
  ctx.restore();
}

function runningArm(ctx, x, y, length, swing, color, width, handColor) {
  ctx.save();ctx.translate(x,y);ctx.rotate(swing);
  // The elbow bends forward, toward the direction of travel (+x).
  path(ctx,[[0,0],[-length*.12,length*.58],[length*.58,length*.27]],null,color,width);
  ellipse(ctx,length*.58,length*.27,width*.62,width*.5,handColor);
  ctx.restore();
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
  if (running) runningArm(ctx,-10,-43,25,stride*.65,skin,7,skin);
  else if (celebrating) limb(ctx,-16,-42,22,2.25+Math.sin(t*7)*.12,skin,7,skin);
  else runningArm(ctx,-12,-43,24,.1,skin,7,skin);
  box(ctx,-16,-48,32,32,8,color);
  if(variant===2) {
    path(ctx,[[0,-43],[0,-20]],null,"#f3eada",3);
    for(let i=0;i<3;i++) path(ctx,[[-9,-39+i*6],[0,-36+i*6],[9,-39+i*6]],null,"#f3eada",2);
  }
  if(variant===4) for(let i=0;i<3;i++) path(ctx,[[-13,-44+i*9],[13,-38+i*9]],null,"#eee4cf",4);
  if (running) runningArm(ctx,10,-43,25,-stride*.65,skin,7,skin);
  else if (celebrating) limb(ctx,16,-42,22,-2.25-Math.sin(t*7)*.12,skin,7,skin);
  else runningArm(ctx,12,-43,24,-.1,skin,7,skin);
  ctx.save();
  if (running) { ctx.translate(5,0);ctx.scale(.9,1); }
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
  const blink = Math.sin(t*.7+variant)> .994 && !running;
  const eyeHeight = blink ? .65 : fear ? 5 : 3.5;
  ellipse(ctx,-6,-62,3,eyeHeight,"#272538");ellipse(ctx,8,-62,3,eyeHeight,"#272538");
  if(fear) ellipse(ctx,2,-51,4,5,"#493543"); else path(ctx,[[-2,-51],[2,-49],[6,-51]],null,"#604053",2);
  if (running) ellipse(ctx,19,-58,4,3,variant===1?"#ddddec":variant===5?"#e98b3f":skin);
  ctx.restore();
  if(celebrating) {
    ctx.save();ctx.translate(34,-88);ctx.rotate(Math.sin(t*3)*.15);
    path(ctx,[[0,-8],[3,-3],[9,0],[3,3],[0,8],[-3,3],[-9,0],[-3,-3]],"#e8ca70");ctx.restore();
  }
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
  limb(ctx,-28,-26,29,stride,"#b8753f",17,"#e1ac68");
  limb(ctx,28,-26,29,-stride,"#b8753f",17,"#e1ac68");
  const moving = running || state==="walking";
  if (moving) runningArm(ctx,-49,-70,48,stride*.65,"#ad703e",13,"#e1ac68");
  else runningArm(ctx,-49,-70,48,.1,"#ad703e",13,"#e1ac68");
  const crust=ctx.createRadialGradient(-22,-111,8,0,-80,74);
  crust.addColorStop(0,"#f5d18c");crust.addColorStop(.5,"#dba15b");crust.addColorStop(.86,"#b77538");crust.addColorStop(1,"#7d482c");
  ellipse(ctx,0,-75,69,59,"#392739");
  ellipse(ctx,0,-77,66,55,crust);
  // Traditional dough bones and the central ball distinguish the loaf from a pumpkin.
  for (const side of [-1,1]) {
    ctx.beginPath();ctx.moveTo(side*5,-126);ctx.bezierCurveTo(side*24,-122,side*47,-103,side*56,-76);
    ctx.strokeStyle="#eecd96";ctx.lineWidth=11;ctx.lineCap="round";ctx.stroke();
    ellipse(ctx,side*28,-112,8,6,"#f6daad");ellipse(ctx,side*49,-88,7,9,"#f0cf96");
    ctx.beginPath();ctx.moveTo(side*4,-125);ctx.bezierCurveTo(side*16,-104,side*18,-59,side*34,-35);
    ctx.strokeStyle="#f0cf96";ctx.lineWidth=9;ctx.stroke();
    ellipse(ctx,side*31,-40,8,6,"#f6daad");
  }
  for (let i=0;i<68;i++) {
    const sx=Math.sin(i*7.13)*58, sy=-77+Math.cos(i*4.67)*46;
    if ((sx*sx)/(61*61)+((sy+77)*(sy+77))/(49*49)<1) ellipse(ctx,sx,sy,.7+(i%3)*.25,.7,"#fff0d6bb");
  }
  ellipse(ctx,0,-129,20,15,"#945e33");
  ellipse(ctx,-1,-132,18,13,"#efc180");ellipse(ctx,-5,-137,8,3,"#fce4b4");
  ctx.save();
  if (moving) { ctx.translate(7,0);ctx.scale(.9,1); }
  const blink = Math.sin(t*.8)>.99 && !running;
  ellipse(ctx,-23,-89,14,blink?2:15,"#412839");ellipse(ctx,23,-89,14,blink?2:15,"#412839");
  if (!blink) {
    ellipse(ctx,-23,-90,10,12,"#fff2d2");ellipse(ctx,23,-90,10,12,"#fff2d2");
    ellipse(ctx,-20,-88,5,8,"#473246");ellipse(ctx,26,-88,5,8,"#473246");
    ellipse(ctx,-18,-91,1.8,2,"#fff");ellipse(ctx,28,-91,1.8,2,"#fff");
  }
  path(ctx,[[-38,-106],[-24,-110],[-12,-105]],null,"#805134",4);
  path(ctx,[[12,-105],[25,-110],[37,-106]],null,"#805134",4);
  ellipse(ctx,-44,-68,8,4,"#db927477");ellipse(ctx,44,-68,8,4,"#db927477");
  ctx.save();ctx.translate(0,-57);ctx.scale(1,bite?1.45:chew?.82+Math.sin(t*24)*.16:1);
  ellipse(ctx,0,0,32,17,"#412839");ellipse(ctx,5,9,14,5,"#ce7981");
  for(const tx of [-23,-10,3,16]) path(ctx,[[tx,-12],[tx+9,-13],[tx+5,-2]],"#fff0d2");
  path(ctx,[[-22,8],[-16,0],[-12,13]],"#fff0d2");path(ctx,[[11,13],[16,0],[22,8]],"#fff0d2");ctx.restore();
  ctx.restore();
  if (!bite && state!=="celebrating") runningArm(ctx,49,-65,48,moving?-stride*.65:-.1,"#c38a50",13,"#efc88a");
  else limb(ctx,57,-73,43,bite?-1.35:state==="celebrating"?-2.25+Math.sin(t*7)*.15:stride*.6-.5,"#c38a50",13,"#efc88a");
  ctx.restore();
}

export function drawName(ctx,name,x,y,maxWidth,color,selected=false) {
  ctx.save();
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
  ctx.restore();
}

export function drawPoof(ctx,x,y,progress,color) {
  ctx.save();ctx.globalAlpha=1-progress;
  for(let i=0;i<9;i++) {const a=i*TAU/9;ellipse(ctx,x+Math.cos(a)*progress*55,y+Math.sin(a)*progress*38,12*(1-progress)+2,12*(1-progress)+2,i%2?color:"#d7dcc2");}
  ctx.restore();
}
