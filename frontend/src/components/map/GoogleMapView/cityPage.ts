import { LINE_PATH } from '@/lib/lineGeo';

/**
 * The 3D "city" page (design: live 1-5 / model 1-2). In 3D mode the live map does NOT use Google Maps:
 * this canvas page draws the city blocks, the elevated line, station roofs and the trains itself, and
 * the trains glide along the real track between updates. It takes the same payload as the Google page
 * (`window.__set(payload)`, or postMessage on the web) and reports taps as {type:'station'|'train', id}.
 * (The script avoids backticks, `${` and backslashes: it lives in a TS template.)
 */
export function cityPage(dark: boolean): string {
  const path = JSON.stringify(LINE_PATH.map(([lat, lng]) => [+lat.toFixed(5), +lng.toFixed(5)]));
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;overflow:hidden;background:${dark ? '#101917' : '#EFEBE1'};-webkit-tap-highlight-color:transparent}canvas{display:block;width:100%;height:100%;touch-action:none}</style>
</head><body><canvas id="c"></canvas>
<script>
var LL=${path},DARK=${dark ? 'true' : 'false'};
var lat0=LL[0][0],lng0=LL[0][1],KX=Math.cos(lat0*Math.PI/180),MD=111320;
function mx(lng){return (lng-lng0)*MD*KX;}
function my(lat){return (lat-lat0)*MD;}
function send(m){var s=JSON.stringify(m);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else parent.postMessage(s,'*');}

// ---- the track, resampled every ~25 m (metres, x east, y north)
var L=[],cum=[0];
(function(){
  var raw=LL.map(function(p){return {x:mx(p[1]),y:my(p[0])};});
  L.push(raw[0]);var carry=0;
  for(var i=1;i<raw.length;i++){
    var a=raw[i-1],b=raw[i],d=Math.hypot(b.x-a.x,b.y-a.y),t=25-carry;
    while(t<=d){L.push({x:a.x+(b.x-a.x)*t/d,y:a.y+(b.y-a.y)*t/d});t+=25;}
    carry=d-(t-25);
  }
  L.push(raw[raw.length-1]);
  for(var j=1;j<L.length;j++)cum[j]=cum[j-1]+Math.hypot(L[j].x-L[j-1].x,L[j].y-L[j-1].y);
})();
var TOTAL=cum[cum.length-1];
function pos(s){
  s=Math.max(0,Math.min(TOTAL,s));var lo=0,hi=cum.length-1;
  while(hi-lo>1){var m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m;}
  var f=(s-cum[lo])/((cum[hi]-cum[lo])||1),a=L[lo],b=L[hi];
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,a:Math.atan2(b.x-a.x,b.y-a.y)};
}
function snap(x,y){
  var best=1e18,bs=0;
  for(var i=1;i<L.length;i++){
    var a=L[i-1],b=L[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l2)):0;
    var d=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
    if(d<best){best=d;bs=cum[i-1]+t*(cum[i]-cum[i-1]);}
  }
  return bs;
}
// coarse buckets of track points: which city cells must stay clear
var BK={};
L.forEach(function(p){var k=Math.floor(p.x/200)+','+Math.floor(p.y/200);(BK[k]=BK[k]||[]).push(p);});
function nearTrack(x,y,r){
  var bx=Math.floor(x/200),by=Math.floor(y/200);
  for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j++){
    var a=BK[(bx+i)+','+(by+j)];if(!a)continue;
    for(var k=0;k<a.length;k++)if(Math.hypot(a[k].x-x,a[k].y-y)<r)return true;
  }
  return false;
}

// ---- canvas + camera
var cv=document.getElementById('c'),g=cv.getContext('2d'),W=0,H=0,dpr=1;
function size(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;cv.width=W*dpr;cv.height=H*dpr;}
window.addEventListener('resize',size);size();
var cam={x:0,y:0,h:0,init:false},ppm=0.9,fx=0,fy=0,SIN=0,COS=1;
var GP=0.53,HP=0.85; // ground squash and height scale at a ~58 degree tilt
function pr(x,y,h){
  var dx=x-cam.x,dy=y-cam.y,fw=dx*SIN+dy*COS,rg=dx*COS-dy*SIN;
  if(fw>2600)fw=2600;
  var k=Math.max(.55,Math.min(1.6,1-fw*0.00028));
  return [fx+rg*ppm*k,fy-fw*ppm*GP*k-h*ppm*HP*k,fw];
}
function hex(h){var n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255];}
function shade(h,d){var c=hex(h);return 'rgb('+Math.max(0,Math.min(255,c[0]+d))+','+Math.max(0,Math.min(255,c[1]+d))+','+Math.max(0,Math.min(255,c[2]+d))+')';}
function poly(a,fill,stroke,lw){g.beginPath();for(var i=0;i<a.length;i++){if(i)g.lineTo(a[i][0],a[i][1]);else g.moveTo(a[i][0],a[i][1]);}g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1;g.stroke();}}
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.arcTo(x+w,y,x+w,y+r,r);g.lineTo(x+w,y+h-r);g.arcTo(x+w,y+h,x+w-r,y+h,r);g.lineTo(x+r,y+h);g.arcTo(x,y+h,x,y+h-r,r);g.lineTo(x,y+r);g.arcTo(x,y,x+r,y,r);g.closePath();}
// a box on a ground quad cs (4 corners, counter-clockwise), from height h0 to h1
function box(cs,h0,h1,top,side,o){
  var b=cs.map(function(c){return pr(c[0],c[1],h0);}),t=cs.map(function(c){return pr(c[0],c[1],h1);}),f=[],i,j;
  for(i=0;i<4;i++){
    j=(i+1)%4;
    var nx=cs[j][1]-cs[i][1],ny=-(cs[j][0]-cs[i][0]),nl=Math.hypot(nx,ny)||1;
    f.push({i:i,j:j,y:(b[i][1]+b[j][1])/2,l:(-nx*.5+ny*.6)/nl,len:Math.hypot(cs[j][0]-cs[i][0],cs[j][1]-cs[i][1])});
  }
  f.sort(function(p,q){return p.y-q.y;});
  f.forEach(function(e){
    poly([b[e.i],b[e.j],t[e.j],t[e.i]],shade(side,Math.round(-8+e.l*16)));
    if(o&&o.win&&e.len>10){
      var lo=(o.h0w-h0)/(h1-h0),hi=(o.h1w-h0)/(h1-h0);
      var w0=[b[e.i][0]+(t[e.i][0]-b[e.i][0])*lo,b[e.i][1]+(t[e.i][1]-b[e.i][1])*lo],w1=[b[e.j][0]+(t[e.j][0]-b[e.j][0])*lo,b[e.j][1]+(t[e.j][1]-b[e.j][1])*lo];
      var w2=[b[e.j][0]+(t[e.j][0]-b[e.j][0])*hi,b[e.j][1]+(t[e.j][1]-b[e.j][1])*hi],w3=[b[e.i][0]+(t[e.i][0]-b[e.i][0])*hi,b[e.i][1]+(t[e.i][1]-b[e.i][1])*hi];
      poly([w0,w1,w2,w3],o.win);
      if(o.band){var m=.18,v0=b[e.i],v1=b[e.j],v2=[v1[0]+(t[e.j][0]-v1[0])*m,v1[1]+(t[e.j][1]-v1[1])*m],v3=[v0[0]+(t[e.i][0]-v0[0])*m,v0[1]+(t[e.i][1]-v0[1])*m];poly([v0,v1,v2,v3],o.band);}
    }
  });
  poly(t,top);
}
function hash(a,b){var h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;h=h^(h>>>16);return (h>>>0)/4294967296;}

// ---- state from the app
var S=null,TR={},STN=[];
window.__set=function(p){
  var sig=(p.view&&p.view.key)+"|"+p.selectedTrain+"|"+p.selectedStation;
  var vk=String(p.view&&p.view.key);
  if(sig!==lastSel){if(lastSel&&vk!==lastKey)zmul=1;lastKey=vk;pan.x=0;pan.y=0;lastSel=sig;}
  S=p;
  STN=p.stations.map(function(s){var x=mx(s.lng),y=my(s.lat);return {id:s.id,label:s.label,x:x,y:y,s:snap(x,y),term:s.terminal};});
  var seen={};
  p.trains.forEach(function(t){
    seen[t.id]=1;var x=mx(t.lng),y=my(t.lat),ts=snap(x,y),o=TR[t.id];
    if(!o)o=TR[t.id]={s:ts,hd:t.heading};
    o.ts=ts;o.th=t.heading;o.d=t;
  });
  Object.keys(TR).forEach(function(k){if(!seen[k])delete TR[k];});
};
window.addEventListener('message',function(e){if(e.source!==parent)return;try{window.__set(JSON.parse(e.data));}catch(_){}});
var hits=[],NT={};
function tap(x,y){
  for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){send({type:h.type,id:h.id});return;}}
}
// drag = pan, two fingers / wheel = zoom (both reset when another train or station is picked)
var pan={x:0,y:0},zmul=1,ptr={},moved=0,pinch=0,lastSel='',lastKey='';
function ptrs(){return Object.keys(ptr).map(function(k){return ptr[k];});}
function panBy(dx,dy){
  var rg=-dx/ppm,fw=dy/(ppm*GP);
  pan.x+=fw*SIN+rg*COS;pan.y+=fw*COS-rg*SIN;
  var m=Math.hypot(pan.x,pan.y);if(m>3000){pan.x*=3000/m;pan.y*=3000/m;}
}
function zoomBy(r){zmul=Math.max(.6,Math.min(4,zmul*r));}
cv.addEventListener('pointerdown',function(e){
  ptr[e.pointerId]={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY};
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  var p=ptrs();moved=p.length>1?99:0;if(p.length===2)pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
});
cv.addEventListener('pointermove',function(e){
  var o=ptr[e.pointerId];if(!o)return;
  var p=ptrs();
  if(p.length>=2){
    o.x=e.clientX;o.y=e.clientY;
    var d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    if(pinch>0&&d>0)zoomBy(d/pinch);
    pinch=d;moved=99;
  }else{
    var dx=e.clientX-o.x,dy=e.clientY-o.y;
    o.x=e.clientX;o.y=e.clientY;
    moved=Math.max(moved,Math.hypot(e.clientX-o.x0,e.clientY-o.y0));
    if(moved>=8)panBy(dx,dy);
  }
});
function release(e){
  var o=ptr[e.pointerId];if(!o)return;
  var wasTap=moved<8&&Object.keys(ptr).length===1;
  delete ptr[e.pointerId];pinch=0;
  if(wasTap)tap(e.clientX,e.clientY);
}
cv.addEventListener('pointerup',release);
cv.addEventListener('pointercancel',function(e){delete ptr[e.pointerId];pinch=0;});
cv.addEventListener('wheel',function(e){e.preventDefault();zoomBy(e.deltaY<0?1.12:1/1.12);},{passive:false});

// ---- one frame
var last=performance.now();
function angLerp(a,b,k){var d=((b-a+540)%360)-180;return a+d*k;}
function frame(now){
  var dt=Math.min(.1,(now-last)/1000);last=now;
  requestAnimationFrame(frame);
  if(W!==cv.clientWidth||H!==cv.clientHeight)size();
  g.setTransform(dpr,0,0,dpr,0,0);
  var th=S&&S.theme,ground=DARK?(th?th.mapGround:'#101917'):'#EFEBE1';
  g.fillStyle=ground;g.fillRect(0,0,W,H);
  if(!S)return;
  var v=S.view,k;
  // trains glide: smooth the chainage and heading towards the latest report
  Object.keys(TR).forEach(function(id){var o=TR[id];k=Math.min(1,dt*5);o.s=Math.abs(o.ts-o.s)>400?o.ts:o.s+(o.ts-o.s)*k;o.hd=angLerp(o.hd,o.th,Math.min(1,dt*3));});
  var sel=S.selectedTrain&&TR[S.selectedTrain];
  var tx,ty,thd;
  if(sel){var sp=pos(sel.s);tx=sp.x;ty=sp.y;thd=sel.hd;}else{tx=mx(v.lng);ty=my(v.lat);thd=v.heading;}
  tx+=pan.x;ty+=pan.y;
  if(!cam.init||Math.hypot(tx-cam.x,ty-cam.y)>1500||Object.keys(ptr).length){cam.x=tx;cam.y=ty;cam.h=thd;cam.init=true;}
  k=Math.min(1,dt*4);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;cam.h=angLerp(cam.h,thd,Math.min(1,dt*2.5));
  var hr=cam.h*Math.PI/180;SIN=Math.sin(hr);COS=Math.cos(hr);
  ppm=Math.max(.4,Math.min(6,1.35*zmul*Math.pow(2,(v.zoom||16)-16)));
  fx=W/2;fy=v.top+(H-v.bottom-v.top)*.66;if(fy<H*.4)fy=H*.4;
  hits=[];
  var R=Math.min(1900,1100/Math.min(1,zmul)),C=64,ci=Math.floor(cam.x/C),cj=Math.floor(cam.y/C),n=Math.ceil(R/C),i,j;
  // roads (every 192 m, world-aligned)
  g.lineCap='round';g.lineJoin='round';
  g.strokeStyle=DARK?(th?th.mapRoad:'#1C2925'):'#FFFFFF';g.lineWidth=Math.max(2,9*ppm);
  var gx0=Math.floor((cam.x-R)/192),gx1=Math.ceil((cam.x+R)/192),gy0=Math.floor((cam.y-R)/192),gy1=Math.ceil((cam.y+R)/192);
  for(i=gx0;i<=gx1;i++){g.beginPath();for(j=0;j<=16;j++){var q=pr(i*192,cam.y-R+j*R/8,0);if(j)g.lineTo(q[0],q[1]);else g.moveTo(q[0],q[1]);}g.stroke();}
  for(j=gy0;j<=gy1;j++){g.beginPath();for(i=0;i<=16;i++){var q2=pr(cam.x-R+i*R/8,j*192,0);if(i)g.lineTo(q2[0],q2[1]);else g.moveTo(q2[0],q2[1]);}g.stroke();}
  // blocks: parks flat, buildings as boxes, far first
  var items=[];
  for(i=ci-n;i<=ci+n;i++)for(j=cj-n;j<=cj+n;j++){
    var cx=i*C+C/2,cy=j*C+C/2;
    if(Math.hypot(cx-cam.x,cy-cam.y)>R)continue;
    var hh=hash(i,j);
    if(i%3===0||j%3===0)continue; // street cells
    var nk=i+","+j,nt=NT[nk];if(nt===undefined)nt=NT[nk]=nearTrack(cx,cy,70);if(nt)continue;
    var pc=pr(cx,cy,0);
    if(pc[0]<-140||pc[0]>W+140||pc[1]<-220||pc[1]>H+260)continue;
    if(hh<.09){items.push({p:1,cx:cx,cy:cy,f:pc[2]});continue;}
    if(hh<.22)continue;
    var w=24+hash(i+7,j)*30,d=24+hash(i,j+9)*30,ht=9+Math.pow(hash(i+3,j+5),2.2)*78;
    items.push({cx:cx+(hash(i,j+1)-.5)*10,cy:cy+(hash(i+2,j)-.5)*10,w:w,d:d,h:ht,f:pc[2]});
  }
  items.sort(function(a,b){return b.f-a.f;});
  var top=DARK?'#25332E':'#F8F4EB',side=DARK?'#1B2824':'#E5DECF';
  items.forEach(function(b){
    if(b.p){var s=C-6;poly([pr(b.cx-s/2,b.cy-s/2,0),pr(b.cx+s/2,b.cy-s/2,0),pr(b.cx+s/2,b.cy+s/2,0),pr(b.cx-s/2,b.cy+s/2,0)],DARK?'#1D3A2E':'#D9E6CF');return;}
    box([[b.cx-b.w/2,b.cy-b.d/2],[b.cx+b.w/2,b.cy-b.d/2],[b.cx+b.w/2,b.cy+b.d/2],[b.cx-b.w/2,b.cy+b.d/2]],0,b.h,top,side);
  });
  var hz=g.createLinearGradient(0,0,0,H*.32);hz.addColorStop(0,ground);hz.addColorStop(1,DARK?'rgba(16,25,23,0)':'rgba(239,235,225,0)');g.fillStyle=hz;g.fillRect(0,0,W,H*.32);
  // the elevated line
  var s0=Math.max(0,snap(cam.x,cam.y)),idx0=Math.max(0,Math.floor((s0-R)/25)),idx1=Math.min(L.length-1,Math.ceil((s0+R)/25)),DK=12;
  function lineAt(h,w,col){g.beginPath();var st=false;for(i=idx0;i<=idx1;i++){var q=pr(L[i].x,L[i].y,h);if(st)g.lineTo(q[0],q[1]);else{g.moveTo(q[0],q[1]);st=true;}}g.strokeStyle=col;g.lineWidth=w;g.stroke();}
  g.lineCap='butt';
  lineAt(0,Math.max(4,16*ppm),'rgba(0,0,0,.12)');
  g.lineCap='round';
  g.strokeStyle=DARK?'#33423C':'#C9C3B4';g.lineWidth=Math.max(2,2.4*ppm);
  for(i=idx0;i<=idx1;i+=2){var a=pr(L[i].x,L[i].y,0),b2=pr(L[i].x,L[i].y,DK-1);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b2[0],b2[1]);g.stroke();}
  lineAt(DK-1,Math.max(8,17*ppm),DARK?'#3A4A44':'#B9C3BD');
  lineAt(DK,Math.max(6,13*ppm),DARK?'#E8F0EC':'#FFFFFF');
  lineAt(DK,Math.max(4,7*ppm),th?th.brand:'#0A8A5F');
  // stations: platforms and a mint roof
  var labels=[];
  STN.forEach(function(st){
    var c0=pos(st.s);if(Math.hypot(c0.x-cam.x,c0.y-cam.y)>R+200)return;
    var A=pos(st.s-80),B=pos(st.s+80),tx2=Math.sin(c0.a),ty2=Math.cos(c0.a),nx=ty2,ny=-tx2;
    function q4(hw,len){return [[c0.x-tx2*len-nx*hw,c0.y-ty2*len-ny*hw],[c0.x+tx2*len-nx*hw,c0.y+ty2*len-ny*hw],[c0.x+tx2*len+nx*hw,c0.y+ty2*len+ny*hw],[c0.x-tx2*len+nx*hw,c0.y-ty2*len+ny*hw]];}
    box(q4(13,80),DK-1,DK+.8,DARK?'#33423C':'#ECE8DD',DARK?'#26332E':'#CFC9B9');
    var rf=q4(15,82).map(function(c){return pr(c[0],c[1],DK+13);});
    var posts=q4(13,76);
    g.strokeStyle='rgba(120,130,125,.6)';g.lineWidth=Math.max(1,1.6*ppm);
    posts.forEach(function(c){var p0=pr(c[0],c[1],DK),p1=pr(c[0],c[1],DK+13);g.beginPath();g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1]);g.stroke();});
    poly(rf,'rgba(43,211,154,.34)',th?th.brand:'#066B4A',1.5);
    var lp=pr(c0.x,c0.y,DK+30);labels.push({st:st,x:lp[0],y:lp[1],f:lp[2]});
  });
  // trains, far first
  var tl=Object.keys(TR).map(function(id){var o=TR[id],p=pos(o.s);return {id:id,o:o,p:p,f:pr(p.x,p.y,DK)[2]};}).sort(function(a,b){return b.f-a.f;});
  var tags=[];
  tl.forEach(function(e){
    var o=e.o,d=o.d,est=d.state!=='LIVE',isSel=S.selectedTrain===e.id;
    var band=d.dir==='SB'?(th?th.trainSB:'#0A8A5F'):(th?th.trainNB:'#2F6FB5');
    var gp=pr(e.p.x,e.p.y,DK);
    if(isSel||d.timer!=null){g.beginPath();g.ellipse(gp[0],gp[1],Math.max(14,34*ppm),Math.max(8,18*ppm),0,0,7);g.fillStyle='rgba(245,158,11,.22)';g.fill();g.lineWidth=2;g.strokeStyle=est?'#6B7C75':'#F59E0B';if(est)g.setLineDash([5,4]);g.stroke();g.setLineDash([]);}
    var cars=4,len=30,gap=2.5,half=cars/2;
    for(var c=0;c<cars;c++){
      var sc=o.s+(c-half+.5)*(len+gap),cp=pos(sc),ct=Math.sin(cp.a),cn=Math.cos(cp.a),nx=cn,ny=-ct,l2=len/2,w2=5.2;
      var cs=[[cp.x-ct*l2-nx*w2,cp.y-cn*l2-ny*w2],[cp.x+ct*l2-nx*w2,cp.y+cn*l2-ny*w2],[cp.x+ct*l2+nx*w2,cp.y+cn*l2+ny*w2],[cp.x-ct*l2+nx*w2,cp.y-cn*l2+ny*w2]];
      box(cs,DK+.8,DK+10,est?'#F2F5F3':'#FFFFFF',est?'#E4EAE7':'#F4F7F5',{win:'#2C4A45',h0w:DK+4.4,h1w:DK+7.4,band:band});
    }
    var hp=pr(e.p.x,e.p.y,DK+13);
    tags.push({e:e,x:hp[0],y:hp[1],d:d,est:est,sel:isSel});
    hits.push({x:gp[0]-34,y:gp[1]-50,w:68,h:64,type:'train',id:e.id});
  });
  // labels on top: station pills, train tags, callout cards
  g.textBaseline='alphabetic';
  labels.forEach(function(l){
    if(l.x<-120||l.x>W+120||l.y<-40||l.y>H+40)return;
    var sel=S.selectedStation===l.st.id;
    g.font='700 13px system-ui,-apple-system,"Segoe UI",sans-serif';
    var w=g.measureText(l.st.label).width+36,x=l.x-w/2,y=l.y-26;
    rr(x,y,w,26,13);g.fillStyle=sel?(th?th.brandDeep:'#066B4A'):(DARK?'#1B2824':'rgba(255,255,255,.96)');g.shadowColor='rgba(14,26,22,.25)';g.shadowBlur=8;g.shadowOffsetY=2;g.fill();g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
    rr(x+4,y+4,18,18,6);g.fillStyle=sel?'#2BD39A':(th?th.brand:'#066B4A');g.fill();
    g.fillStyle=sel?'#04140E':'#fff';g.fillRect(x+9,y+8,8,6);g.fillRect(x+10,y+16,2,3);g.fillRect(x+14,y+16,2,3);
    g.fillStyle=sel?'#fff':(DARK?'#E8F0EC':'#0E1A16');g.fillText(l.st.label,x+28,y+18);
    hits.push({x:x,y:y,w:w,h:26,type:'station',id:l.st.id});
  });
  tags.forEach(function(t){
    var d=t.d,co=d.callout,x=t.x,y=t.y;
    if(x<-200||x>W+200||y<-60||y>H+60)return;
    if(co){
      g.font='800 12.5px system-ui,-apple-system,"Segoe UI",sans-serif';
      var tw=g.measureText(co.title).width+26;
      g.font='500 11.5px system-ui,-apple-system,"Segoe UI",sans-serif';
      co.rows.forEach(function(r){tw=Math.max(tw,g.measureText(r[0]+'  '+r[1]).width+30);});
      var bh=14+22+co.rows.length*17,bx=x+26,by=y-bh-18;
      if(bx+tw>W-8)bx=Math.max(8,x-26-tw);
      g.strokeStyle='#F59E0B';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y+10);g.lineTo(bx+(bx>x?0:tw),by+bh-8);g.stroke();
      rr(bx,by,tw,bh,14);g.fillStyle='#0B0F0E';g.fill();g.lineWidth=2;g.strokeStyle='#F2C230';g.stroke();
      g.beginPath();g.arc(bx+14,by+19,3.6,0,7);g.fillStyle='#F59E0B';g.fill();
      g.font='800 12.5px system-ui,-apple-system,"Segoe UI",sans-serif';g.fillStyle='#fff';g.fillText(co.title,bx+23,by+23);
      g.font='500 11.5px system-ui,-apple-system,"Segoe UI",sans-serif';
      co.rows.forEach(function(r,ri){var ry=by+43+ri*17;g.fillStyle='#D6DEDB';g.fillText(r[0],bx+13,ry);if(r[1]){g.font='800 11.5px system-ui,-apple-system,"Segoe UI",sans-serif';g.fillStyle='#fff';g.textAlign='right';g.fillText(r[1],bx+tw-13,ry);g.textAlign='left';g.font='500 11.5px system-ui,-apple-system,"Segoe UI",sans-serif';}});
    }else if(d.label){
      g.font='700 11.5px system-ui,-apple-system,"Segoe UI",sans-serif';
      var w=g.measureText(d.label).width+(t.est?24:34),px=x-w/2,py=y-30;
      rr(px,py,w,22,11);g.fillStyle=t.est?'rgba(255,255,255,.96)':'#0B0F0E';g.fill();g.lineWidth=1.5;if(t.est)g.setLineDash([4,3]);g.strokeStyle=t.est?'#6B7C75':'#F2C230';g.stroke();g.setLineDash([]);
      if(!t.est){g.beginPath();g.arc(px+13,py+11,3.5,0,7);g.fillStyle='#F59E0B';g.fill();}
      g.fillStyle=t.est?'#3E4C46':'#fff';g.fillText(d.label,px+(t.est?12:22),py+15);
    }
  });
}
requestAnimationFrame(frame);
</script></body></html>`;
}
