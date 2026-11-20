import { LINE_PATH } from '@/lib/lineGeo';

import { THREE_SRC } from './threeSource';

/**
 * The live 3D page (three.js). It uses the same models as the Simulation tab
 * (assets/sim/station-to-station.html): the arched station with glass, platforms,
 * lifts and gate kiosks, the viaduct with piers, masts and overhead contact wires,
 * and the 6-car train with cab ends, roof kit and pantographs. They are placed on the
 * REAL curved track and driven by the live payload (`window.__set`, same as the Google
 * page). Trains glide along the track, the camera follows the selected train.
 * Drag = pan, pinch / wheel = zoom. Station pills, train tags and the platform callout
 * are drawn on a 2D canvas over the scene (crisp at the device pixel ratio).
 * three.js is bundled with the app (threeSource.ts, `npm run build:three`), so the scene needs no internet; map tiles are saved
 * on the device after the first fetch (tileCache.ts), so places already seen still draw offline. If the engine still cannot
 * start the page reports {type:'error',kind:'engine'} and the app falls back to cityPage.
 * (The script avoids backticks, `${` and backslashes: it lives in a TS template.)
 */
export function scenePage(dark: boolean): string {
  const path = JSON.stringify(LINE_PATH.map(([lat, lng]) => [+lat.toFixed(5), +lng.toFixed(5)]));
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;overflow:hidden;background:${dark ? '#10181A' : '#EAF1EC'};-webkit-tap-highlight-color:transparent}
#gl,#ov{position:absolute;left:0;top:0;width:100%;height:100%;display:block}#gl{touch-action:none}#ov{pointer-events:none}</style>
</head><body><canvas id="gl"></canvas><canvas id="ov"></canvas>
<script>${THREE_SRC.split('</script').join('<\\/script')}</script>
<script>
var LL=${path},DARK=${dark ? 'true' : 'false'};
function send(m){var s=JSON.stringify(m);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else parent.postMessage(s,'*');}
function fail(msg){send({type:'error',kind:'engine',msg:String(msg||'')});}
(function(){
if(!window.THREE){fail('three.js not loaded');return;}
try{main();}catch(e){fail(e&&e.message);}
})();
function main(){
var THREE=window.THREE;
/* ---------- the real track, resampled every 25 m (metres: x east, y north) ---------- */
var lat0=LL[0][0],lng0=LL[0][1],KX=Math.cos(lat0*Math.PI/180),MD=111320;
function mx(lng){return (lng-lng0)*MD*KX;}
function my(lat){return (lat-lat0)*MD;}
var L=[],cum=[0];
(function(){
  var raw=LL.map(function(p){return {x:mx(p[1]),y:my(p[0])};});
  L.push(raw[0]);var carry=0;
  for(var i=1;i<raw.length;i++){var a=raw[i-1],b=raw[i],d=Math.hypot(b.x-a.x,b.y-a.y),t=25-carry;
    while(t<=d){L.push({x:a.x+(b.x-a.x)*t/d,y:a.y+(b.y-a.y)*t/d});t+=25;}carry=d-(t-25);}
  L.push(raw[raw.length-1]);
  for(var j=1;j<L.length;j++)cum[j]=cum[j-1]+Math.hypot(L[j].x-L[j-1].x,L[j].y-L[j-1].y);
})();
var TOTAL=cum[cum.length-1];
function seg(s){s=Math.max(0,Math.min(TOTAL,s));var lo=0,hi=cum.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m;}return lo;}
/* a point on the track in three.js axes (x east, z south): position, yaw of the +x direction, right-hand normal */
function P3(s){
  var lo=seg(s),hi=lo+1,a=L[lo],b=L[hi],f=(Math.max(0,Math.min(TOTAL,s))-cum[lo])/((cum[hi]-cum[lo])||1);
  var br=Math.atan2(b.x-a.x,b.y-a.y);
  return {x:a.x+(b.x-a.x)*f,z:-(a.y+(b.y-a.y)*f),yaw:Math.PI/2-br,nx:Math.cos(br),nz:Math.sin(br),br:br};
}
function snap(x,y){var best=1e18,bs=0;
  for(var i=1;i<L.length;i++){var a=L[i-1],b=L[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l2)):0,d=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
    if(d<best){best=d;bs=cum[i-1]+t*(cum[i]-cum[i-1]);}}
  return bs;}

/* ---------- renderer ---------- */
var gl=document.getElementById('gl'),ovc=document.getElementById('ov'),g2=ovc.getContext('2d');
var renderer=new THREE.WebGLRenderer({canvas:gl,antialias:true,alpha:false,powerPreference:'high-performance'});
var dpr=Math.min(window.devicePixelRatio||1,2),W=0,H=0;
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(30,1,4,9000);
function size(){W=gl.clientWidth||innerWidth;H=gl.clientHeight||innerHeight;renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);ovc.width=Math.round(W*dpr);ovc.height=Math.round(H*dpr);camera.aspect=W/H;camera.updateProjectionMatrix();}

/* ---------- palettes (from the simulation) ---------- */
var PAL={
 day:{bg:0xEFEBE1,ground:0xE9E5DA,road:0xFFFFFF,park:0xD3E4C8,water:0xC9DDE8,trunk:0x8A6B4F,leaf:[0x8DBE78,0x7FB36B,0x9CC884,0x74A862],deck:0xC6CCC9,pier:0xC1C6C3,parapet:0xE2E6E3,roof:0x5FAE88,glass:0xBFE3EE,brick:0x9A402F,win:0x5A2418,plat:0xDADEDA,kiosk:0x1F5C40,kioskTop:0x2E8A5E,pole:0x8E979B,sign:0xE3A729,lift:0x9AA3A0,ballast:0x70777B,rail:0x3A4044,stair:0xC6CCC9,blockA:0xFBF9F4,blockB:0xF0ECE2,tall:0xE2E8F1,peach:0xF3E6DC,wire:0xB4BFC4,hemiSky:0xFFFFFF,hemiGround:0xE6DFCF,hemi:.72,sun:.3},
 night:{bg:0x10181A,ground:0x18221F,road:0x2A332F,park:0x1D3A2E,water:0x1B3340,trunk:0x4A3A2C,leaf:[0x2F6B45,0x2A5E3C,0x357A4F],deck:0x4A5154,pier:0x41484B,parapet:0x586064,roof:0x2D7A5B,glass:0x3A6E80,brick:0x6C2C21,win:0xF2C766,plat:0x2F3834,kiosk:0x14402D,kioskTop:0x1E6A4A,pole:0x5A6366,sign:0xE8B33B,lift:0x59635F,ballast:0x30363A,rail:0x1B1F21,stair:0x4B5551,blockA:0x27322E,blockB:0x202A27,tall:0x2E3563,peach:0x3C2F2B,wire:0xE6EDF0,hemiSky:0x8FA6B8,hemiGround:0x1A211F,hemi:.6,sun:.38}
};
var P=DARK?PAL.night:PAL.day;
function mat(c){return new THREE.MeshLambertMaterial({color:c});}
var M={};['ground','road','deck','pier','parapet','roof','glass','brick','win','plat','kiosk','kioskTop','pole','sign','lift','ballast','rail','stair'].forEach(function(k){M[k]=mat(P[k]);});
/* ground, streets and park / water patches are flat unlit colours so the design palette stays exact */
M.ground=new THREE.MeshBasicMaterial({color:P.ground});M.road=new THREE.MeshBasicMaterial({color:P.road});
M.roof.side=THREE.DoubleSide;M.glass.side=THREE.DoubleSide;
/* see-through mint roof (design: live 3), so trains, platforms and the wires inside stay visible from above */
M.roof.transparent=true;M.roof.opacity=.3;M.roof.depthWrite=false;M.glass.transparent=true;M.glass.opacity=.5;M.glass.depthWrite=false;
var WIRE=mat(P.wire);
scene.background=new THREE.Color(P.bg);scene.fog=new THREE.Fog(P.bg,650,2300);
scene.add(new THREE.HemisphereLight(P.hemiSky,P.hemiGround,P.hemi));
var sun=new THREE.DirectionalLight(0xffffff,P.sun);sun.position.set(-90,160,70);scene.add(sun);

/* ---------- helpers ---------- */
var DECK=10,T1=5.2,T2=-5.2;
var GC={};
function geo(w,h,d){var k=w+'/'+h+'/'+d;return GC[k]||(GC[k]=new THREE.BoxGeometry(w,h,d));}
function box(w,h,d,m,x,y,z,parent){var o=new THREE.Mesh(geo(w,h,d),m);o.position.set(x,y,z);(parent||scene).add(o);return o;}
var tmp=new THREE.Object3D();
function inst(g,m,pts,parent){
  var im=new THREE.InstancedMesh(g,m,pts.length);
  pts.forEach(function(p,i){tmp.position.set(p[0],p[1],p[2]);tmp.rotation.set(0,0,0);tmp.scale.set(1,1,1);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);});
  im.frustumCulled=false;(parent||scene).add(im);return im;
}
/* a batch of oriented, scaled boxes along the track as ONE instanced mesh */
var UNIT=new THREE.BoxGeometry(1,1,1);
function Batch(g,m){this.g=g;this.m=m;this.a=[];}
Batch.prototype.add=function(x,y,z,yaw,sx,sy,sz){this.a.push([x,y,z,yaw,sx,sy,sz,null]);};
Batch.prototype.done=function(){
  var im=new THREE.InstancedMesh(this.g,this.m,this.a.length);
  this.a.forEach(function(r,i){tmp.position.set(r[0],r[1],r[2]);tmp.rotation.set(0,r[3],0);tmp.scale.set(r[4],r[5],r[6]);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);if(r[7]!=null)im.setColorAt(i,r[7]);});
  im.frustumCulled=false;scene.add(im);return im;
};
var rngSeed=7;function rnd(){rngSeed|=0;rngSeed=rngSeed+0x6D2B79F5|0;var t=Math.imul(rngSeed^rngSeed>>>15,1|rngSeed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}

/* ---------- the viaduct, rails and overhead wires along the whole real track ---------- */
var STS=[]; /* chainage of each station, filled by __set */
var nearSt=function(s){for(var i=0;i<STS.length;i++)if(Math.abs(s-STS[i])<84)return true;return false;};
var built=false;
function buildTrack(){
  if(built)return;built=true;
  var bDeck=new Batch(UNIT,M.deck),bPar=new Batch(UNIT,M.parapet),bBal=new Batch(UNIT,M.ballast),bRail=new Batch(UNIT,M.rail),bWire=new Batch(UNIT,WIRE),bRoad=new Batch(UNIT,M.road),bGrid=new Batch(UNIT,M.road);
  var bPier=new Batch(geo(2.4,DECK-2,2.8),M.pier),bCap=new Batch(geo(9,1.1,3),M.pier),bPost=new Batch(geo(.35,8.6,.35),M.pole),bArm=new Batch(geo(.3,.3,14.8),M.pole),bHang=new Batch(geo(.14,1.2,.14),WIRE),bDrop=new Batch(geo(.09,1.2,.09),WIRE);
  var n=Math.floor(TOTAL/25),i,k;
  function at(p,lat,y){return [p.x+p.nx*lat,y,p.z+p.nz*lat];}
  for(i=0;i<n;i++){
    var s=(i+.5)*25,p=P3(s),len=26.5,y;
    y=at(p,0,DECK-.8);bDeck.add(y[0],y[1],y[2],p.yaw,len,1.6,16);
    y=at(p,0,.04);bRoad.add(y[0],y[1],y[2],p.yaw,len,.1,22);
    [-7.8,7.8].forEach(function(l){var q=at(p,l,DECK+.5);bPar.add(q[0],q[1],q[2],p.yaw,len,1,.5);});
    [-T1,T1].forEach(function(l){
      var q=at(p,l,DECK+.15);bBal.add(q[0],q[1],q[2],p.yaw,len,.3,3.6);
      [-.72,.72].forEach(function(o){var r=at(p,l+o,DECK+.43);bRail.add(r[0],r[1],r[2],p.yaw,len,.26,.16);});
      var c=at(p,l,DECK+6.3);bWire.add(c[0],c[1],c[2],p.yaw,len+.4,.24,.24);   /* contact wire */
      var m=at(p,l,DECK+7.5);bWire.add(m[0],m[1],m[2],p.yaw,len+.4,.18,.18);   /* messenger wire */
    });
    /* droppers joining the two wires every ~8 m (the sim's wire look) */
    for(k=-12;k<=12;k+=12){[-T1,T1].forEach(function(l){var pp=P3(s+k),d=at(pp,l,DECK+6.9);bDrop.add(d[0],d[1],d[2],pp.yaw,1,1,1);});}
    if(!nearSt(s)){
      if(i%1===0){var pi=at(p,0,(DECK-2)/2);bPier.add(pi[0],pi[1],pi[2],p.yaw,1,1,1);var cp=at(p,0,DECK-2.2);bCap.add(cp[0],cp[1],cp[2],p.yaw,1,1,1);}
      if(i%2===0){
        [-7.2,7.2].forEach(function(l){var q=at(p,l,DECK+4.3);bPost.add(q[0],q[1],q[2],p.yaw,1,1,1);});
        var ar=at(p,0,DECK+8.6);bArm.add(ar[0],ar[1],ar[2],p.yaw,1,1,1);
        [-T1,T1].forEach(function(l){var h=at(p,l,DECK+8.0);bHang.add(h[0],h[1],h[2],p.yaw,1,1,1);});
      }
    }
    /* cross streets every ~200 m */
    if(i%4===0){var cr=at(p,0,.05);bGrid.add(cr[0],cr[1],cr[2],p.yaw+Math.PI/2,420,.1,10);}
    [-100,100].forEach(function(l){var ls=at(p,l,.05);bGrid.add(ls[0],ls[1],ls[2],p.yaw,len,.1,10);});
  }
  /* trees: along the viaduct street, the side streets and in the parks */
  var bTrunk=new Batch(new THREE.CylinderGeometry(.35,.5,3,6).translate(0,1.5,0),mat(P.trunk)),bCrown=new Batch(new THREE.SphereGeometry(1,7,5),new THREE.MeshLambertMaterial({color:0xffffff})),tc=new THREE.Color();
  function tree(x,z,sc){
    var r0=rnd();tc.setHex(P.leaf[Math.floor(rnd()*P.leaf.length)]);
    bTrunk.add(x,0,z,0,sc,sc,sc);
    bCrown.a.push([x,4.8*sc,z,0,3.1*sc,3.3*sc,3.1*sc,tc.clone()]);
    if(r0>.5)bCrown.a.push([x+.6*sc,6.8*sc,z-.4*sc,0,2.1*sc,2.2*sc,2.1*sc,tc.clone()]);
  }
  for(var ts=10;ts<TOTAL;ts+=17){
    if(nearSt(ts))continue;
    var tp=P3(ts);
    [-12.6,12.6].forEach(function(l){tree(tp.x+tp.nx*l,tp.z+tp.nz*l,.8+rnd()*.5);});
    if(Math.floor(ts/17)%2===0)[-94,106].forEach(function(l){var q2=P3(ts+rnd()*8);tree(q2.x+q2.nx*l,q2.z+q2.nz*l,.7+rnd()*.5);});
  }
  [bDeck,bPar,bBal,bRail,bWire,bRoad,bPier,bCap,bPost,bArm,bHang,bDrop].forEach(function(b){b.done();});
  /* the city: blocks aligned to the track on both sides, like the simulation's cells */
  var cells=[],occ={},bl=new Batch(UNIT,new THREE.MeshLambertMaterial({color:0xffffff})),pt=new Batch(UNIT,new THREE.MeshBasicMaterial({color:0xffffff})),col=new THREE.Color();
  for(var s2=0;s2<=TOTAL;s2+=24){
    var p2=P3(s2),ph=s2%100;
    if(ph<14||ph>86)continue;
    for(var sd=-1;sd<=1;sd+=2){for(var d2=34;d2<=170;d2+=22){
      if(d2===100)continue;
      var x=p2.x+p2.nx*d2*sd+(rnd()-.5)*4,z=p2.z+p2.nz*d2*sd+(rnd()-.5)*4,key=Math.round(x/14)+','+Math.round(z/14);
      if(occ[key])continue;occ[key]=1;
      var near=false;for(var q=0;q<STS.length;q++)if(Math.abs(s2-STS[q])<110&&d2<50){near=true;break;}
      if(near)continue;
      var r=rnd(),cls=0,h=5+rnd()*11;
      if(r<.09){col.setHex(r<.065?P.park:P.water);pt.a.push([x,.08,z,p2.yaw,26,.12,26,col.clone()]);if(r<.065)for(var tk=0;tk<5;tk++)tree(x+(rnd()-.5)*20,z+(rnd()-.5)*20,.9+rnd()*.6);continue;}
      if(r>.94){cls=2;h=34+rnd()*36;}else if(r>.88){cls=3;h=10+rnd()*14;}else if(r>.5){cls=1;}
      col.setHex(cls===2?P.tall:cls===3?P.peach:cls===1?P.blockB:P.blockA);
      bl.a.push([x,0,z,p2.yaw,12+rnd()*6,h,12+rnd()*6,col.clone()]);
    }}
  }
  /* outer ring: coarser blocks 200-560 m from the track, so zooming out still shows a city around the line */
  var occ2={};
  for(var s3=0;s3<=TOTAL;s3+=44){
    var p3=P3(s3);
    for(var sd3=-1;sd3<=1;sd3+=2){for(var d3=200;d3<=560;d3+=38){
      var x3=p3.x+p3.nx*d3*sd3+(rnd()-.5)*8,z3=p3.z+p3.nz*d3*sd3+(rnd()-.5)*8,k3=Math.round(x3/30)+','+Math.round(z3/30);
      if(occ2[k3])continue;occ2[k3]=1;
      var r3=rnd();if(r3<.18)continue;
      var cls3=r3>.93?2:r3>.85?3:r3>.5?1:0,h3=cls3===2?30+rnd()*40:6+rnd()*12;
      col.setHex(cls3===2?P.tall:cls3===3?P.peach:cls3===1?P.blockB:P.blockA);
      bl.a.push([x3,0,z3,p3.yaw,22+rnd()*12,h3,22+rnd()*12,col.clone()]);
    }}
  }
  procMeshes.push(bl.done(),pt.done(),bTrunk.done(),bCrown.done(),bGrid.done());
}
var ground=new THREE.Mesh(new THREE.PlaneGeometry(24000,24000),M.ground);ground.rotation.x=-Math.PI/2;ground.position.y=-.02;scene.add(ground);

/* ---------- station (the simulation's model) ---------- */
var roofGeo=new THREE.CylinderGeometry(11.6,11.6,158,28,1,true,0,Math.PI);roofGeo.rotateZ(Math.PI/2);
var glassGeo=new THREE.CylinderGeometry(11.75,11.75,150,12,1,true,Math.PI/2-.2,.4);glassGeo.rotateZ(Math.PI/2);
var winGeo=new THREE.BoxGeometry(2.6,2.4,.1),yel=new THREE.MeshLambertMaterial({color:0xF2C23C}),LAMPM=new THREE.MeshBasicMaterial({color:0xD6DBD9});
function buildStation(){
  var g=new THREE.Group();scene.add(g);
  box(170,1.4,23,M.deck,0,DECK-.7,0,g);
  box(142,DECK-.7,16,M.brick,0,(DECK-.7)/2,0,g);
  var wp=[];for(var wx=-64;wx<=64;wx+=10){[-8.02,8.02].forEach(function(z){wp.push([wx,5.2,z]);});}
  inst(winGeo,M.win,wp,g);
  box(150,1.1,6,M.plat,0,DECK+.5,0,g);
  /* the two platforms, marked only when the page asks (station page): green = platform 1 (Motijheel-bound), blue = platform 2 (Uttara-bound) */
  g.userData.pmarks=[box(150,.07,2.4,mat(0x1F9D63),0,DECK+1.1,-1.8,g),box(150,.07,2.4,mat(0x2F6FB5),0,DECK+1.1,1.8,g)];
  g.userData.pmarks.forEach(function(m){m.visible=false;});
  [-3,3].forEach(function(z){box(150,.05,.4,yel,0,DECK+1.04,z>0?z-.2:z+.2,g);});
  var roof=new THREE.Mesh(roofGeo,M.roof);roof.scale.set(1,.55,1);roof.position.set(0,DECK+6.5,0);g.add(roof);
  var gl2=new THREE.Mesh(glassGeo,M.glass);gl2.scale.set(1,.55,1);gl2.position.set(0,DECK+6.5,0);g.add(gl2);
  for(var cx=-70;cx<=70;cx+=17.5){[-10.6,10.6].forEach(function(z){box(.5,6.6,.5,M.pole,cx,DECK+3.3,z,g);});}
  for(var sx=-60;sx<=60;sx+=30){box(.12,5.2,.12,M.pole,sx,DECK+8.6,0,g);box(3.4,.9,.25,M.sign,sx,DECK+6,0,g);}
  var dh=[];for(var hx=-76;hx<=76;hx+=12){dh.push([hx,DECK+9.0,5.2],[hx,DECK+9.0,-5.2]);}inst(geo(.1,5.4,.1),WIRE,dh,g);   /* wire hangers from the station roof */
  var lp=[];for(var lx=-70;lx<=70;lx+=10){[-4,4].forEach(function(z){lp.push([lx,DECK+11.9,z]);});}
  inst(geo(.7,.12,1.4),LAMPM,lp,g);
  box(3.4,3.8,3.2,M.lift,-12,DECK+2.9,0,g);box(.1,2.2,2,M.win,-12,DECK+3,1.62,g);
  box(5,1.3,3,M.stair,-36,DECK+1.65,0,g);box(5,1.3,3,M.stair,36,DECK+1.65,0,g);
  var kl=[];g.userData.kiosks=kl;
  [[-68,-17],[68,-17],[-68,17],[68,17]].forEach(function(p,ki){
    var m=[box(6,3.6,5,M.kiosk,p[0],1.8,p[1],g),box(7,.5,6,M.kioskTop,p[0],3.8,p[1],g),box(1.2,.2,1.2,LAMPM,p[0],4.3,p[1],g)];
    var zs=p[1]>0?1:-1;var st=box(5,.5,9.6,M.stair,p[0],3,p[1]-zs*7.2,g);st.rotation.x=zs*Math.atan2(4.6,9.6)*-1;m.push(st);
    kl[ki]=m;
  });
  return g;
}

/* ---------- train (the simulation's 6-car set) ---------- */
var TM={body:mat(0xE9EDEB),skirt:mat(0xD42A1F),stripe:mat(0x1F9D63),win:mat(0x26414A),door:mat(0xCDD3D1),roof:mat(0xBFC6C3),under:mat(0x2B3033),cabG:mat(0x1F7A4D),cabR:mat(0xD42A1F)};
var CL=19.2,CW=3.0,GAP=.9;
var WOM=mat(0xC2347F),WOMD=mat(0xE9B7D2),WOMB=mat(0xF3C9DD); /* women's coach: pink stripe and doors */
var PGM=mat(0x2B3033),PIN=mat(0xD8CFBC),PST=mat(0x15181A);
function parm(parent,x1,y1,x2,y2,z){var Ln=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));var o=box(Ln,.13,.13,PGM,(x1+x2)/2,(y1+y2)/2,z,parent);o.rotation.z=Math.atan2(y2-y1,x2-x1);return o;}
function pantograph(car,x){
  var g=new THREE.Group();g.position.x=x;car.add(g);
  [-1.2,1.2].forEach(function(px){[-.6,.6].forEach(function(pz){box(.36,.5,.36,PIN,px,4.0,pz,g);});});
  box(3.0,.16,1.9,PGM,0,4.33,0,g);
  [-.72,.72].forEach(function(z){parm(g,-1.3,4.41,0,5.76,z);parm(g,1.3,4.41,0,5.76,z);parm(g,-.62,4.99,.62,4.99,z);});
  box(.14,.14,1.7,PGM,-1.3,4.45,0,g);box(.14,.14,1.7,PGM,1.3,4.45,0,g);
  box(.5,.12,2.3,PGM,0,5.77,0,g);
  box(.2,.07,2.1,PST,0,5.86,0,g);
}
function mergeBoxes(list){
  var pos=[],nor=[],idx=[],off=0,m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),one=new THREE.Vector3(1,1,1);
  list.forEach(function(b){
    var g=new THREE.BoxGeometry(b[0],b[1],b[2]);
    e.set(b[6]||0,b[7]||0,b[8]||0);q.setFromEuler(e);m.compose(new THREE.Vector3(b[3],b[4],b[5]),q,one);g.applyMatrix4(m);
    var p=g.attributes.position.array,n=g.attributes.normal.array,ix=g.index.array,i;
    for(i=0;i<p.length;i++){pos.push(p[i]);nor.push(n[i]);}
    for(i=0;i<ix.length;i++)idx.push(ix[i]+off);
    off+=p.length/3;g.dispose();
  });
  var G=new THREE.BufferGeometry();
  G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));G.setIndex(idx);
  return G;
}
var RKM={acL:mat(0xD3D9D6),acD:mat(0x59646A),duct:mat(0x7B868B),eq:mat(0x929CA0),cab:mat(0x14181A),por:mat(0xD8CFBC)};
var RKC={};
function roofGeos(kind){
  if(RKC[kind])return RKC[kind];
  var Lh=[],D=[],T=[],E=[],C=[],Pp=[],R=[];
  R.push([CL-.4,.3,2.4,0,3.6,0],[CL-.4,.1,.55,0,3.56,1.28,.4,0,0],[CL-.4,.1,.55,0,3.56,-1.28,-.4,0,0]);
  [-4.3,4.3].forEach(function(ax){
    D.push([5.0,.14,1.9,ax,3.82,0]);
    Lh.push([4.5,.36,1.62,ax,4.07,0],[.7,.3,1.5,ax+2.3,4.0,0,0,0,-.6],[.7,.3,1.5,ax-2.3,4.0,0,0,0,.6]);
    [-.5,0,.5].forEach(function(k){D.push([.14,.07,1.4,ax+k,4.28,0]);});
    [-1.5,1.5].forEach(function(k){D.push([.95,.04,.95,ax+k,4.27,0]);Lh.push([.85,.05,.07,ax+k,4.3,0],[.07,.05,.85,ax+k,4.3,0]);});
    [-1,1].forEach(function(s){D.push([3.4,.22,.04,ax,4.06,s*.83]);[-1.2,-.4,.4,1.2].forEach(function(k){Lh.push([.05,.2,.05,ax+k,4.06,s*.86]);});});
  });
  [-1,1].forEach(function(s){
    T.push([CL-1.4,.14,.3,0,3.82,s*1.0]);
    for(var x=-8;x<=8.01;x+=1.6)T.push([.14,.2,.42,x,3.87,s*1.0]);
    C.push([CL-1.6,.07,.12,0,3.94,s*1.0]);
  });
  if(kind==='mid'||kind==='cab'){E.push([2.2,.5,1.2,0,4.0,0],[2.4,.08,1.4,0,4.27,0],[.12,.14,.3,-.8,4.38,.4],[.12,.14,.3,.8,4.38,-.4]);}
  if(kind==='motor-'||kind==='motor+'){
    var sg=kind==='motor+'?1:-1;
    E.push([2.5,.62,1.3,0,4.06,0],[2.7,.08,1.5,0,4.39,0]);
    Pp.push([.24,.5,.24,-.7,4.68,0],[.24,.5,.24,.7,4.68,0]);
    C.push([5.6,.1,.14,sg*3.9,3.98,-1.0],[.14,.1,1.0,sg*1.15,3.98,-.5],[.14,.1,1.0,sg*6.7,3.98,-.5]);
  }
  if(kind==='cab'){E.push([.5,.2,.5,-8.7,3.9,0],[.5,.2,.5,8.7,3.9,0],[.08,.5,.35,-8.7,4.25,0],[.08,.5,.35,8.7,4.25,0]);}
  var o={};
  o.R=mergeBoxes(R);o.L=mergeBoxes(Lh);o.D=mergeBoxes(D);o.T=mergeBoxes(T);o.E=mergeBoxes(E);o.C=mergeBoxes(C);
  if(Pp.length)o.P=mergeBoxes(Pp);
  return RKC[kind]=o;
}
var JUMPG=null;
function roofKit(car,i){
  var kind=(i===1)?'motor-':(i===4)?'motor+':(i===0||i===5)?'cab':'mid';
  var g=roofGeos(kind);
  [['R',TM.roof],['L',RKM.acL],['D',RKM.acD],['T',RKM.duct],['E',RKM.eq],['C',RKM.cab],['P',RKM.por]].forEach(function(p){if(g[p[0]])car.add(new THREE.Mesh(g[p[0]],p[1]));});
  if(i<5){
    if(!JUMPG)JUMPG=mergeBoxes([[2.4,.1,.14,0,3.93,1.0],[2.4,.1,.14,0,3.93,-1.0],[.3,.16,.3,-1.05,3.95,1.0],[.3,.16,.3,1.05,3.95,1.0],[.3,.16,.3,-1.05,3.95,-1.0],[.3,.16,.3,1.05,3.95,-1.0]]);
    var j=new THREE.Mesh(JUMPG,RKM.cab);j.position.x=CL/2+GAP/2;car.add(j);
  }
}
var CABX=null;
function mkDisplay(w,h,pw,ph){
  var c=document.createElement('canvas');c.width=pw;c.height=ph;
  var t=new THREE.CanvasTexture(c);t.anisotropy=4;
  return {c:c,t:t,w:w,h:h,pw:pw,ph:ph,bn:null,en:null};
}
function drawDisplay(d){
  var x=d.c.getContext('2d');x.fillStyle='#0A0C0D';x.fillRect(0,0,d.pw,d.ph);
  if(d.bn){x.fillStyle='#FFB400';x.textAlign='center';x.textBaseline='middle';
    x.font='700 '+Math.round(d.ph*.46)+'px "Hind Siliguri","Plus Jakarta Sans",sans-serif';x.fillText(d.bn,d.pw/2,d.ph*.36);
    x.font='600 '+Math.round(d.ph*.24)+'px "Plus Jakarta Sans",sans-serif';x.fillText(d.en,d.pw/2,d.ph*.78);}
  d.t.needsUpdate=true;
}
function cabEnd(car,s,front){
  var cab=new THREE.Group();cab.position.x=s*(CL/2);cab.rotation.y=s<0?Math.PI:0;car.add(cab);
  if(!CABX)CABX={lamp:new THREE.MeshBasicMaterial({color:0xFFF1C2}),tail:new THREE.MeshBasicMaterial({color:0x8A2A24}),ring:mat(0xB4BCBF),grey:mat(0x7C868A),red:mat(0xD42A1F),glass:new THREE.MeshLambertMaterial({color:0x1D3036,emissive:0x0A1417})};
  function slice(rb,rt,h,y,sx,m,t0,tl){var mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,28,1,false,t0===undefined?0:t0,tl===undefined?Math.PI:tl),m);mesh.scale.x=sx;mesh.position.y=y;cab.add(mesh);return mesh;}
  function bx(w,h,d,m,x,y,z){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);cab.add(o);return o;}
  slice(1.5,1.5,.77,.765,1.62,TM.skirt);
  slice(1.5,1.5,1.2,1.75,1.55,TM.body);
  slice(1.5,1.25,1.4,3.05,1.5,TM.cabG);
  bx(1.4,.85,3.04,TM.cabG,-.7,3.02,0);
  var PI_=Math.PI;
  slice(1.464*1.012,1.3125*1.012,.85,2.975,1.503,CABX.glass,.18*PI_,.13*PI_);
  slice(1.464*1.012,1.3125*1.012,.85,2.975,1.503,CABX.glass,.35*PI_,.47*PI_);
  bx(.5,.42,1.1,TM.under,2.5,.78,0);bx(.3,.3,.4,CABX.grey,2.78,.78,0);
  bx(.4,.12,1.5,TM.under,2.35,.42,0);
  [-1,1].forEach(function(k){
    var zl=k*.8,xl=2.325*Math.sqrt(1-(zl/1.5)*(zl/1.5))+.02;
    var l=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),front?CABX.lamp:CABX.tail);l.position.set(xl,1.5,zl);cab.add(l);
    var zf=k*1.1,xf=2.325*Math.sqrt(1-(zf/1.5)*(zf/1.5))+.01;
    var r=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),CABX.ring);r.position.set(xf,1.62,zf);cab.add(r);
  });
  bx(.05,.36,.52,TM.body,2.345,2.3,0);bx(.06,.14,.38,CABX.red,2.35,2.27,0);
  bx(.04,1.2,.04,TM.under,2.3,1.75,.58);
  var dg=new THREE.Group();dg.position.set(1.93-.03,3.5,0);dg.rotation.z=.262;cab.add(dg);
  dg.add(new THREE.Mesh(new THREE.BoxGeometry(.1,.38,1.12),TM.under));
  var d=mkDisplay(1.05,.3,280,80);
  var pl=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.3),new THREE.MeshBasicMaterial({map:d.t}));pl.position.x=.056;pl.rotation.y=PI_/2;dg.add(pl);
  drawDisplay(d);
  return d;
}
function makeTrain(women){
  var cars=[],disp=null;
  for(var i=0;i<6;i++){
    var car=new THREE.Group();
    box(CL,2.9,CW,women&&i===5?WOMB:TM.body,0,2.0,0,car);box(CL-.6,.5,2.6,TM.under,0,.3,0,car);box(CL,.55,CW+.04,TM.skirt,0,.83,0,car);box(CL,.2,CW+.05,TM.stripe,0,1.5,0,car);
    if(women&&i===5){box(CL,.5,CW+.07,WOM,0,1.62,0,car);box(CL,.16,CW+.07,WOM,0,3.15,0,car);}
    roofKit(car,i);if(i===1||i===4)pantograph(car,i===1?-7.9:7.9);
    [-1,1].forEach(function(s){var z=s*(CW/2+.02);
      [-4.8,0,4.8].forEach(function(x){box(2.6,.9,.08,TM.win,x,2.7,z,car);});
      [-7.2,-2.4,2.4,7.2].forEach(function(x){box(1.4,2.3,.08,women&&i===5?WOMD:TM.door,x,2.05,z,car);});});
    car.visible=false;scene.add(car);cars.push(car);
  }
  disp=cabEnd(cars[5],1,true);cabEnd(cars[0],-1,false);
  return {cars:cars,disp:disp,dest:''};
}
function setDest(T,dir){
  var k=dir==='SB'?'SB':'NB';if(T.dest===k)return;T.dest=k;
  T.disp.bn=k==='SB'?'মতিঝিল':'উত্তরা উত্তর';T.disp.en=k==='SB'?'Motijheel':'Uttara North';drawDisplay(T.disp);
}

/* ---------- state from the app ---------- */
var S=null,TR={},STN=[],GT=[],ASSIGN=null,stGroups={},pan={x:0,z:0},zmul=1,lastSig='',lastKey='';
function stationFor(st){
  var g=stGroups[st.id];if(g)return g;
  g=buildStation();stGroups[st.id]=g;
  var p=P3(st.s);g.position.set(p.x,0,p.z);g.rotation.y=p.yaw;return g;
}
/* gates sit on the station model's four gate kiosks: each gate takes the kiosk that lies in its real direction from the station */
function snapGates(){
  if(!GT.length||!STN.length||GT.length>4)return;
  var cx=0,cz=0;GT.forEach(function(g){cx+=g.x;cz+=g.z;});cx/=GT.length;cz/=GT.length;
  var bi=-1,bd=1e9;STN.forEach(function(st,i){var p=P3(st.s),d=Math.hypot(p.x-cx,p.z-cz);if(d<bd){bd=d;bi=i;}});
  if(bi<0||bd>400)return;
  var sp=P3(STN[bi].s),c=Math.cos(sp.yaw),s=Math.sin(sp.yaw);
  var K=[[-68,-17],[68,-17],[-68,17],[68,17]].map(function(k){return {x:sp.x+k[0]*c+k[1]*s,z:sp.z-k[0]*s+k[1]*c,lx:k[0]*c+k[1]*s,lz:-k[0]*s+k[1]*c};});
  var pairs=[];
  GT.forEach(function(g,gi){var dx=g.x-sp.x,dz=g.z-sp.z,dl=Math.hypot(dx,dz)||1;K.forEach(function(k,ki){pairs.push([(dx*k.lx+dz*k.lz)/(dl*Math.hypot(k.lx,k.lz)),gi,ki]);});});
  pairs.sort(function(a,b){return b[0]-a[0];});
  var gd={},kd={};
  pairs.forEach(function(q){if(gd[q[1]]||kd[q[2]])return;gd[q[1]]=1;kd[q[2]]=1;var g=GT[q[1]],k=K[q[2]];g.x=k.x;g.z=k.z;g.y=4.6;});
  ASSIGN={id:STN[bi].id,kd:kd};
}
window.__set=function(p){
  var sig=(p.view&&p.view.key)+'|'+p.selectedTrain+'|'+p.selectedStation,vk=String(p.view&&p.view.key);
  if(sig!==lastSig){if(lastSig&&vk!==lastKey){zmul=1;hOff=0;PITCH=.7;}lastKey=vk;pan.x=0;pan.z=0;lastSig=sig;}
  S=p;
  var fl=!!(p.view&&p.view.flat);if(fl!==flatMode){flatMode=fl;PITCH=fl?1.4:.7;}
  STN=p.stations.map(function(s){var x=mx(s.lng),y=my(s.lat);return {id:s.id,label:s.label,s:snap(x,y),term:s.terminal};});
  GT=(p.gates||[]).map(function(g){return {id:g.id,letter:g.letter,label:g.label,x:mx(g.lng),z:-my(g.lat)};});
  snapGates();
  STS=STN.map(function(s){return s.s;});
  buildTrack();
  STN.forEach(stationFor);
  Object.keys(stGroups).forEach(function(id){var pm=stGroups[id].userData.pmarks;if(pm)pm.forEach(function(m){m.visible=!!p.platformSigns&&p.selectedStation===id;});});
  if(ASSIGN&&stGroups[ASSIGN.id]){var ks=stGroups[ASSIGN.id].userData.kiosks;if(ks)ks.forEach(function(m,ki){m.forEach(function(o){o.visible=!!ASSIGN.kd[ki];});});}
  var seen={};
  p.trains.forEach(function(t){
    seen[t.id]=1;var ts=snap(mx(t.lng),my(t.lat)),o=TR[t.id];
    if(!o){o=TR[t.id]={s:ts,T:makeTrain(!!t.women)};}
    o.ts=ts;o.d=t;setDest(o.T,t.dir);
  });
  Object.keys(TR).forEach(function(k){if(!seen[k]){TR[k].T.cars.forEach(function(c){scene.remove(c);});delete TR[k];}});
};
window.addEventListener('message',function(e){if(e.source!==parent)return;try{var d=JSON.parse(e.data);if(d&&d.__tile)window.__tile(d.__tile[0],d.__tile[1]);else window.__set(d);}catch(_){}});

/* ---------- real map data (OpenStreetMap through Overpass): buildings, streets, parks, water and place names around the camera ---------- */
var OSM={tiles:{},busy:false,on:false,labels:[],last:0},TILE=600,procMeshes=[],procShown=true;
var HOSTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
var ROADW={motorway:18,trunk:16,primary:14,secondary:12,tertiary:10,unclassified:8,residential:7,living_street:6,service:4};
var ROADP={motorway:5,trunk:5,primary:4,secondary:3,tertiary:2,unclassified:1,residential:1,living_street:1,service:0};
var POIK={hospital:'#D64545',clinic:'#D64545',school:'#3B6FD6',college:'#3B6FD6',university:'#3B6FD6',place_of_worship:'#0A8A5F',mosque:'#0A8A5F',bank:'#B7791F',marketplace:'#D9822B',mall:'#D9822B',police:'#33466B',fire_station:'#D64545',bus_station:'#6B7C75'};
var bmat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),fmat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
/* the rider can switch the real map off: then only the simple generated city is drawn */
function realOn(){return !S||S.realMap!==false;}
function lngOf(x){return lng0+x/(MD*KX);}
function latOf(z){return lat0-z/MD;}
function hid(id){var h=(id|0)*2654435761>>>0;return (h^(h>>>13))>>>0;}
var TB={}; /* track points in three axes, bucketed: real buildings must not sit on the viaduct */
L.forEach(function(p){var k=Math.floor(p.x/100)+','+Math.floor(-p.y/100);(TB[k]=TB[k]||[]).push([p.x,-p.y]);});
function nearTrackXZ(x,z,r){var bx=Math.floor(x/100),bz=Math.floor(z/100);for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j++){var a=TB[(bx+i)+','+(bz+j)];if(!a)continue;for(var k=0;k<a.length;k++)if(Math.hypot(a[k][0]-x,a[k][1]-z)<r)return true;}return false;}
function inPoly(x,z,pts){var c=false,n=pts.length;for(var i=0,j=n-1;i<n;j=i++){if(((pts[i][1]>z)!==(pts[j][1]>z))&&(x<(pts[j][0]-pts[i][0])*(z-pts[i][1])/(pts[j][1]-pts[i][1])+pts[i][0]))c=!c;}return c;}
function tileQuery(t){
  var S1=latOf((t.tz+1)*TILE),N1=latOf(t.tz*TILE),W1=lngOf(t.tx*TILE),E1=lngOf((t.tx+1)*TILE),bb='('+S1.toFixed(6)+','+W1.toFixed(6)+','+N1.toFixed(6)+','+E1.toFixed(6)+')';
  return '[out:json][timeout:25];(way["building"]'+bb+';way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)$"]'+bb+';way["leisure"~"^(park|garden)$"]'+bb+';way["natural"="water"]'+bb+';node["name"]["amenity"~"^(hospital|clinic|school|college|university|bank|police|marketplace|place_of_worship|fire_station|bus_station)$"]'+bb+';node["name"]["shop"="mall"]'+bb+';way["name"]["amenity"~"^(hospital|school|college|university|marketplace)$"]'+bb+';);out geom tags;';
}
/* tiles are kept on the device by the app: the page asks for a tile by key and hands one over after fetching it */
var tileWait={},tileSeq=0;
function cacheGet(key){return new Promise(function(res){var n=++tileSeq;tileWait[n]=res;send({type:'tileGet',n:n,key:key});setTimeout(function(){if(tileWait[n]){delete tileWait[n];res(null);}},2500);});}
window.__tile=function(n,json){var r=tileWait[n];if(!r)return;delete tileWait[n];var v=null;try{v=json?JSON.parse(json):null;}catch(e){}r(v);};
function cachePut(key,obj){try{send({type:'tilePut',key:key,data:JSON.stringify(obj)});}catch(e){}}
var KEEP=['building','height','building:levels','highway','name','name:bn','name:en','leisure','natural','amenity','shop'];
function packEls(els){return els.map(function(e){var t={},tg=e.tags||{},i,o;for(i=0;i<KEEP.length;i++)if(tg[KEEP[i]]!==undefined)t[KEEP[i]]=tg[KEEP[i]];
  o={y:e.type==='node'?0:1,i:e.id,t:t};
  if(e.type==='node'){o.a=e.lat;o.o=e.lon;}else if(e.geometry){var g=[];for(i=0;i<e.geometry.length;i++)g.push(+e.geometry[i].lat.toFixed(6),+e.geometry[i].lon.toFixed(6));o.g=g;}
  return o;});}
function unpackEls(pk){return pk.map(function(o){var e={type:o.y?'way':'node',id:o.i,tags:o.t},g=o.g||[],j;if(!o.y){e.lat=o.a;e.lon=o.o;}else{e.geometry=[];for(j=0;j+1<g.length;j+=2)e.geometry.push({lat:g[j],lon:g[j+1]});}return e;});}
/* a tile: from the device when saved (fast, works offline), else from the network and then saved; an old saved tile still beats no tile */
function loadTile(t,now){
  var key=t.tx+','+t.tz;
  function done(els){t.state='done';try{buildTile(t,els);OSM.on=true;osmReport('ok');}catch(e){t.state='fail';t.at=now;}}
  return cacheGet(key).then(function(c){
    if(c&&c.e&&c.at&&(Date.now()-c.at)<21*864e5){done(unpackEls(c.e));return null;}
    return overpass(tileQuery(t)).then(function(j){var els=j.elements||[];done(els);cachePut(key,{at:Date.now(),e:packEls(els)});})
      .catch(function(){if(c&&c.e){done(unpackEls(c.e));}else{t.state='fail';t.at=now;if(!OSM.on)osmReport('fail');}});
  });
}
function overpass(q,k){
  k=k||0;
  return fetch(HOSTS[k],{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}})
    .then(function(r){if(!r.ok)throw new Error('overpass '+r.status);return r.json();})
    .catch(function(e){if(k+1<HOSTS.length)return overpass(q,k+1);throw e;});
}
function buildTile(t,els){
  var grp=new THREE.Group(),bp=[],bn=[],bc=[],fp=[],fc=[],col=new THREE.Color(),labels=[],trT=new Batch(new THREE.CylinderGeometry(.35,.5,3,6).translate(0,1.5,0),mat(P.trunk)),trC=new Batch(new THREE.SphereGeometry(1,7,5),new THREE.MeshLambertMaterial({color:0xffffff}));
  function tri(a,b,c,arr){arr.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);}
  /* a triangle wound so its front face looks along the given normal: the lit side is then the visible side */
  function triN(a,b,c,arr,nx,ny,nz){var ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];if((uy*vz-uz*vy)*nx+(uz*vx-ux*vz)*ny+(ux*vy-uy*vx)*nz<0)tri(a,c,b,arr);else tri(a,b,c,arr);}
  function flat(pts,y,hex){
    var n=pts.length;if(n>2&&pts[0][0]===pts[n-1][0]&&pts[0][1]===pts[n-1][1]){pts=pts.slice(0,n-1);n--;}
    if(n<3)return;
    var tr=THREE.ShapeUtils.triangulateShape(pts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),[]);
    col.setHex(hex);
    tr.forEach(function(f){tri([pts[f[0]][0],y,pts[f[0]][1]],[pts[f[1]][0],y,pts[f[1]][1]],[pts[f[2]][0],y,pts[f[2]][1]],fp);for(var i=0;i<3;i++)fc.push(col.r,col.g,col.b);});
  }
  function building(pts,h,hex){
    var n=pts.length;if(n>2&&pts[0][0]===pts[n-1][0]&&pts[0][1]===pts[n-1][1]){pts=pts.slice(0,n-1);n--;}
    if(n<3)return;
    var contour=pts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),area=THREE.ShapeUtils.area(contour);
    if(Math.abs(area)<8)return;
    col.setHex(hex);var i,f;
    var tr=THREE.ShapeUtils.triangulateShape(contour,[]);
    for(i=0;i<tr.length;i++){f=tr[i];triN([pts[f[0]][0],h,pts[f[0]][1]],[pts[f[1]][0],h,pts[f[1]][1]],[pts[f[2]][0],h,pts[f[2]][1]],bp,0,1,0);for(var q=0;q<3;q++){bn.push(0,1,0);bc.push(col.r,col.g,col.b);}}
    var sg=area>0?1:-1;
    for(i=0;i<n;i++){
      var a=pts[i],b=pts[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,nx=sg*dz/l,nz=-sg*dx/l;
      var A=[a[0],0,a[1]],B=[b[0],0,b[1]],C=[b[0],h,b[1]],D=[a[0],h,a[1]];
      triN(A,B,C,bp,nx,0,nz);triN(A,C,D,bp,nx,0,nz);
      for(var k=0;k<6;k++){bn.push(nx,0,nz);bc.push(col.r*.93,col.g*.93,col.b*.93);}
    }
  }
  els.forEach(function(e){
    var tg=e.tags||{},nm={bn:tg['name:bn']||tg.name||'',en:tg['name:en']||tg.name||''};
    if(e.type==='node'){
      if(nm.bn||nm.en)labels.push({x:mx(e.lon),z:-my(e.lat),bn:nm.bn,en:nm.en,p:6,poi:POIK[tg.amenity]||POIK[tg.shop]||'#6B7C75'});
      return;
    }
    if(e.type!=='way'||!e.geometry||e.geometry.length<2)return;
    var pts=e.geometry.map(function(g){return [mx(g.lon),-my(g.lat)];}),cx=0,cz=0;
    pts.forEach(function(p){cx+=p[0];cz+=p[1];});cx/=pts.length;cz/=pts.length;
    if(tg.building){
      if(nearTrackXZ(cx,cz,16))return;
      var mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;pts.forEach(function(p){mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mnz=Math.min(mnz,p[1]);mxz=Math.max(mxz,p[1]);});
      var ar=(mxx-mnx)*(mxz-mnz),h=parseFloat(tg.height),lv=parseFloat(tg['building:levels']);
      if(!(h>0))h=lv>0?lv*3.3:(ar>1800?16:ar>500?11:6)+(hid(e.id)%5);
      h=Math.max(3,Math.min(h,150));
      building(pts,h,h>=30?P.tall:h>=15?P.peach:(hid(e.id)&1)?P.blockB:P.blockA);
      if((nm.bn||nm.en)&&(tg.amenity||tg.shop))labels.push({x:cx,z:cz,bn:nm.bn,en:nm.en,p:6,poi:POIK[tg.amenity]||POIK[tg.shop]||'#6B7C75'});
    }else if(tg.highway&&ROADW[tg.highway]){
      var w=ROADW[tg.highway],i2;
      for(i2=0;i2+1<pts.length;i2++){
        var a=pts[i2],b=pts[i2+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<.5)continue;
        var ox=-dz/l*w/2,oz=dx/l*w/2;col.setHex(P.road);
        var A=[a[0]+ox,.06,a[1]+oz],B=[a[0]-ox,.06,a[1]-oz],C=[b[0]-ox,.06,b[1]-oz],D=[b[0]+ox,.06,b[1]+oz];
        tri(A,B,C,fp);tri(A,C,D,fp);for(var k=0;k<6;k++)fc.push(col.r,col.g,col.b);
      }
      if(nm.bn||nm.en){var mid=pts[Math.floor(pts.length/2)];labels.push({x:mid[0],z:mid[1],bn:nm.bn,en:nm.en,p:ROADP[tg.highway]||0,poi:null});}
    }else if(tg.leisure){
      flat(pts,.03,P.park);
      var pa=0;for(var m=0;m<pts.length;m++){var m2=(m+1)%pts.length;pa+=pts[m][0]*pts[m2][1]-pts[m2][0]*pts[m][1];}pa=Math.abs(pa)/2;
      var cnt=Math.min(24,Math.floor(pa/260)),tries=0,bx0=1e9,bx1=-1e9,bz0=1e9,bz1=-1e9;pts.forEach(function(p){bx0=Math.min(bx0,p[0]);bx1=Math.max(bx1,p[0]);bz0=Math.min(bz0,p[1]);bz1=Math.max(bz1,p[1]);});
      while(cnt>0&&tries++<80){var tx=bx0+Math.random()*(bx1-bx0),tz=bz0+Math.random()*(bz1-bz0);if(!inPoly(tx,tz,pts))continue;cnt--;var sc=.9+Math.random()*.6;col.setHex(P.leaf[Math.floor(Math.random()*P.leaf.length)]);trT.add(tx,0,tz,0,sc,sc,sc);trC.a.push([tx,4.8*sc,tz,0,3.1*sc,3.3*sc,3.1*sc,col.clone()]);}
      if(nm.bn||nm.en)labels.push({x:cx,z:cz,bn:nm.bn,en:nm.en,p:2,poi:'#5E9C5A'});
    }else if(tg.natural==='water'){flat(pts,.04,P.water);}
    else if(tg.amenity&&(nm.bn||nm.en)){labels.push({x:cx,z:cz,bn:nm.bn,en:nm.en,p:6,poi:POIK[tg.amenity]||'#6B7C75'});}
  });
  if(bp.length){var g1=new THREE.BufferGeometry();g1.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));g1.setAttribute('normal',new THREE.Float32BufferAttribute(bn,3));g1.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));g1.computeBoundingSphere();grp.add(new THREE.Mesh(g1,bmat));}
  if(fp.length){var g2f=new THREE.BufferGeometry();g2f.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));g2f.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));g2f.computeBoundingSphere();grp.add(new THREE.Mesh(g2f,fmat));}
  if(trT.a.length){grp.add(trT.done());grp.add(trC.done());}
  scene.add(grp);t.group=grp;t.labels=labels;
  var tk=t.tx+','+t.tz;labels.forEach(function(l){l.tk=tk;OSM.labels.push(l);});
}
function dropTile(k){
  var t=OSM.tiles[k];if(!t)return;
  if(t.group){scene.remove(t.group);t.group.traverse(function(o){if(o.geometry)o.geometry.dispose();});}
  OSM.labels=OSM.labels.filter(function(l){return l.tk!==k;});delete OSM.tiles[k];
}
/* tell the app how the map data is doing (it shows the button state and a message when it cannot load) */
var osmReported='';
function osmReport(s){if(s!==osmReported){osmReported=s;send({type:'osm',state:s});}}
function osmTick(now){
  if(D0>2200)return;
  var tx=Math.floor(cam.x/TILE),tz=Math.floor(cam.z/TILE),i,j,k;
  for(i=-1;i<=1;i++)for(j=-1;j<=1;j++){k=(tx+i)+','+(tz+j);if(!OSM.tiles[k])OSM.tiles[k]={tx:tx+i,tz:tz+j,state:'new',at:0};}
  if(!OSM.busy){
    var best=null,bd=1e18;
    Object.keys(OSM.tiles).forEach(function(key){var t=OSM.tiles[key];if(t.state==='done'||t.state==='loading')return;if(t.state==='fail'&&now-t.at<30000)return;
      var d=Math.hypot((t.tx+.5)*TILE-cam.x,(t.tz+.5)*TILE-cam.z);if(d<bd){bd=d;best=t;}});
    if(best){
      OSM.busy=true;best.state='loading';if(!OSM.on)osmReport('loading');
      loadTile(best,now).then(function(){OSM.busy=false;},function(){OSM.busy=false;});
    }
  }
  /* keep memory bounded: drop the tiles farthest from the camera beyond 30 */
  var keys=Object.keys(OSM.tiles);
  if(keys.length>30){keys.sort(function(a,b){var A=OSM.tiles[a],B=OSM.tiles[b];return Math.hypot((B.tx+.5)*TILE-cam.x,(B.tz+.5)*TILE-cam.z)-Math.hypot((A.tx+.5)*TILE-cam.x,(A.tz+.5)*TILE-cam.z);});
    for(i=0;i<keys.length-30;i++)if(OSM.tiles[keys[i]].state!=='loading')dropTile(keys[i]);}
}
function overlaps(a,b){return a.x<b.x+b.w+2&&a.x+a.w>b.x-2&&a.y<b.y+b.h+2&&a.y+a.h>b.y-2;}
/* street and landmark names, so a rider can tell where the line is: landmarks first, then streets by size */
function drawMapLabels(taken){
  if(!OSM.on||!realOn()||D0>1100||!S)return;
  var R=Math.max(420,D0*1.2),en=S.lang==='en',cand=[],i,n=0;
  for(i=0;i<OSM.labels.length;i++){
    var l=OSM.labels[i];if(Math.abs(l.x-cam.x)>R||Math.abs(l.z-cam.z)>R)continue;
    if(!l.poi&&l.p<=1&&D0>520)continue;
    var q=scr(l.x,0,l.z);if(q.z>1||q.x<-40||q.x>W+40||q.y<-20||q.y>H+20)continue;
    cand.push({l:l,q:q});
  }
  cand.sort(function(a,b){return b.l.p-a.l.p;});
  for(i=0;i<cand.length&&n<48;i++){
    var c=cand[i],lb=c.l,name=en?(lb.en||lb.bn):(lb.bn||lb.en);if(!name)continue;
    if(name.length>26)name=name.slice(0,25)+'…';
    g2.font=(lb.poi?'700 10.5px ':'600 10.5px ')+FONT;
    var w=g2.measureText(name).width+(lb.poi?24:6),h=lb.poi?20:14,r={x:c.q.x-w/2,y:c.q.y-h/2,w:w,h:h};
    if(taken.some(function(t){return overlaps(t,r);}))continue;
    taken.push(r);n++;
    if(lb.poi){
      rr(r.x,r.y,w,h,10);g2.fillStyle=DARK?'rgba(27,40,36,.94)':'rgba(255,255,255,.95)';g2.fill();
      g2.beginPath();g2.arc(r.x+10,r.y+10,4,0,7);g2.fillStyle=lb.poi;g2.fill();
      g2.fillStyle=DARK?'#E8F0EC':'#1E2A26';g2.fillText(name,r.x+19,r.y+14);
    }else{
      g2.lineWidth=3;g2.strokeStyle=DARK?'rgba(16,25,23,.9)':'rgba(255,255,255,.92)';g2.strokeText(name,r.x+3,r.y+11);
      g2.fillStyle=DARK?'#9DB0A8':'#6F6A5C';g2.fillText(name,r.x+3,r.y+11);
    }
  }
}
/* the map data licence (ODbL) asks for this credit whenever OpenStreetMap data is shown */
function drawCredit(){
  if(!OSM.on||!realOn()||!S||!S.view)return;
  g2.font='500 9.5px '+FONT;g2.textAlign='right';g2.lineWidth=3;g2.strokeStyle=DARK?'rgba(16,25,23,.9)':'rgba(255,255,255,.9)';
  var y=Math.max(40,H-(S.view.bottom||0)-8),tx='© OpenStreetMap contributors';g2.strokeText(tx,W-8,y);g2.fillStyle=DARK?'#9DB0A8':'#5B6B65';g2.fillText(tx,W-8,y);g2.textAlign='left';
}
/* "you are here": a blue dot with the GPS accuracy ring */
function drawUser(){
  var u=S&&S.user;if(!u)return;
  var x=mx(u.lng),z=-my(u.lat),q=scr(x,0,z);if(q.z>1||q.x<-40||q.x>W+40||q.y<-40||q.y>H+40)return;
  var ac=Math.max(8,u.accuracy||0),q2=scr(x+ac,0,z),rpx=Math.min(110,Math.hypot(q2.x-q.x,(q2.y-q.y)*1.6));
  g2.beginPath();g2.ellipse(q.x,q.y,rpx,rpx*.55,0,0,7);g2.fillStyle='rgba(26,115,232,.14)';g2.fill();
  g2.beginPath();g2.arc(q.x,q.y,8,0,7);g2.fillStyle='#1A73E8';g2.fill();g2.lineWidth=3;g2.strokeStyle='#fff';g2.stroke();
}

/* ---------- gestures: drag = pan, pinch / wheel = zoom, short touch = tap ---------- */
var hits=[],ptr={},moved=0,pinch=0,D0=340,PITCH=.7,hb=0,hOff=0,pinchA=0,pinchY=0,rot=false,flatMode=false;
function ptrs(){return Object.keys(ptr).map(function(k){return ptr[k];});}
function tap(x,y){for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){send({type:h.type,id:h.id});return;}}}
function panBy(dx,dy){
  var sc=2*D0*Math.tan(15*Math.PI/180)/H,b=hb*Math.PI/180,rx=Math.cos(b),rz=Math.sin(b),fx=Math.sin(b),fz=-Math.cos(b),f=dy*sc/Math.sin(PITCH),r=-dx*sc;
  pan.x+=rx*r+fx*f;pan.z+=rz*r+fz*f;
  var m=Math.hypot(pan.x,pan.z);if(m>3000){pan.x*=3000/m;pan.z*=3000/m;}
}
function zoomBy(r){zmul=Math.max(.12,Math.min(4,zmul*r));}
gl.addEventListener('pointerdown',function(e){
  ptr[e.pointerId]={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY};
  try{gl.setPointerCapture(e.pointerId);}catch(_){}
  var p=ptrs();moved=p.length>1?99:0;
  rot=e.button===2||e.shiftKey;
  if(p.length===2){pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);pinchA=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x);pinchY=(p[0].y+p[1].y)/2;}
});
gl.addEventListener('pointermove',function(e){
  var o=ptr[e.pointerId];if(!o)return;var p=ptrs();
  if(p.length>=2){o.x=e.clientX;o.y=e.clientY;var d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch>0&&d>0)zoomBy(d/pinch);pinch=d;moved=99;
    var an=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),da=((an-pinchA+3*Math.PI)%(2*Math.PI))-Math.PI;pinchA=an;hOff-=da*180/Math.PI;
    var my2=(p[0].y+p[1].y)/2;PITCH=Math.max(.3,Math.min(1.5,PITCH+(my2-pinchY)*.004));pinchY=my2;}
  else{var dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;moved=Math.max(moved,Math.hypot(e.clientX-o.x0,e.clientY-o.y0));if(moved>=8){if(rot){hOff-=dx*.4;PITCH=Math.max(.3,Math.min(1.5,PITCH+dy*.004));}else panBy(dx,dy);}}
});
gl.addEventListener('pointerup',function(e){var o=ptr[e.pointerId];if(!o)return;var wasTap=moved<8&&Object.keys(ptr).length===1;delete ptr[e.pointerId];pinch=0;if(wasTap)tap(e.clientX,e.clientY);});
gl.addEventListener('pointercancel',function(e){delete ptr[e.pointerId];pinch=0;});
gl.addEventListener('contextmenu',function(e){e.preventDefault();});
gl.addEventListener('wheel',function(e){e.preventDefault();zoomBy(e.deltaY<0?1.12:1/1.12);},{passive:false});

/* ---------- overlay drawing (2D canvas over the scene) ---------- */
function rr(x,y,w,h,r){g2.beginPath();g2.moveTo(x+r,y);g2.lineTo(x+w-r,y);g2.arcTo(x+w,y,x+w,y+r,r);g2.lineTo(x+w,y+h-r);g2.arcTo(x+w,y+h,x+w-r,y+h,r);g2.lineTo(x+r,y+h);g2.arcTo(x,y+h,x,y+h-r,r);g2.lineTo(x,y+r);g2.arcTo(x,y,x+r,y,r);g2.closePath();}
var FONT='system-ui,-apple-system,"Segoe UI","Hind Siliguri",sans-serif';
var v3=new THREE.Vector3();
function scr(x,y,z){v3.set(x,y,z).project(camera);return {x:(v3.x*.5+.5)*W,y:(-v3.y*.5+.5)*H,z:v3.z};}
function drawOverlay(th){
  g2.setTransform(dpr,0,0,dpr,0,0);g2.clearRect(0,0,W,H);g2.textBaseline='alphabetic';
  hits=[];
  var taken=[];drawMapLabels(taken);drawUser();drawCredit();
  STN.forEach(function(st){
    var p=P3(st.s),q=scr(p.x,DECK+19,p.z);
    if(q.z>1||q.x<-140||q.x>W+140||q.y<-40||q.y>H+40)return;
    if(Math.hypot(p.x-cam.x,p.z-cam.z)>Math.max(1500,D0*2.5))return;
    if(S.platformSigns&&S.selectedStation===st.id&&D0<800){
      var pc=Math.cos(p.yaw),ps=Math.sin(p.yaw);
      [['SB',-30,-3,'#1F9D63'],['NB',30,3,'#2F6FB5']].forEach(function(pl){
        var pq=scr(p.x+pl[1]*pc+pl[2]*ps,DECK+8,p.z-pl[1]*ps+pl[2]*pc);
        if(pq.z>1||pq.x<-200||pq.x>W+200)return;
        g2.font='800 11.5px '+FONT;var pw=g2.measureText(S.platformSigns[pl[0]]).width+22,px2=Math.max(6,Math.min(W-6-pw,pq.x-pw/2)),py=pq.y-24;
        taken.push({x:px2,y:py,w:pw,h:22});
        rr(px2,py,pw,22,11);g2.fillStyle=pl[3];g2.fill();g2.lineWidth=1.8;g2.strokeStyle='#fff';g2.stroke();
        g2.fillStyle='#fff';g2.fillText(S.platformSigns[pl[0]],px2+11,py+15);
      });
    }
    var sel=S.selectedStation===st.id;
    g2.font='700 13px '+FONT;
    var w=g2.measureText(st.label).width+36,x=q.x-w/2,y=q.y-26;
    rr(x,y,w,26,13);g2.fillStyle=sel?(th?th.brandDeep:'#066B4A'):(DARK?'#1B2824':'rgba(255,255,255,.96)');g2.shadowColor='rgba(14,26,22,.25)';g2.shadowBlur=8;g2.shadowOffsetY=2;g2.fill();g2.shadowColor='transparent';g2.shadowBlur=0;g2.shadowOffsetY=0;
    rr(x+4,y+4,18,18,6);g2.fillStyle=sel?'#2BD39A':(th?th.brand:'#066B4A');g2.fill();
    g2.fillStyle=sel?'#04140E':'#fff';g2.fillRect(x+9,y+8,8,6);g2.fillRect(x+10,y+16,2,3);g2.fillRect(x+14,y+16,2,3);
    g2.fillStyle=sel?'#fff':(DARK?'#E8F0EC':'#0E1A16');g2.fillText(st.label,x+28,y+18);
    hits.push({x:x,y:y,w:w,h:26,type:'station',id:st.id});
  });
  /* gate pins on the gate kiosks; landmark chips wrap, stay on screen and never overlap */
  var chips=[];
  GT.forEach(function(gt){
    var q=scr(gt.x,gt.y||0,gt.z);
    if(q.z>1||q.x<-60||q.x>W+60||q.y<-30||q.y>H+80||Math.hypot(gt.x-cam.x,gt.z-cam.z)>900)return;
    var sel=S.selectedGate===gt.id,rad=sel?18:14,cy=q.y-(sel?42:34),col=sel?(th?th.brandDeep:'#066B4A'):(th?th.brand:'#0A8A5F');
    g2.fillStyle='rgba(14,26,22,.28)';g2.beginPath();g2.ellipse(q.x,q.y,8,3.5,0,0,7);g2.fill();
    g2.beginPath();g2.moveTo(q.x,q.y);g2.lineTo(q.x-rad*.72,cy+rad*.7);g2.arc(q.x,cy,rad,Math.PI*.8,Math.PI*.2,false);g2.closePath();
    g2.fillStyle=col;g2.shadowColor='rgba(14,26,22,.35)';g2.shadowBlur=8;g2.shadowOffsetY=3;g2.fill();g2.shadowColor='transparent';g2.shadowBlur=0;g2.shadowOffsetY=0;
    g2.lineWidth=2.5;g2.strokeStyle='#fff';g2.stroke();
    g2.font='800 '+(sel?17:14)+'px '+FONT;g2.fillStyle='#fff';g2.textAlign='center';g2.fillText(gt.letter,q.x,cy+(sel?6:5));g2.textAlign='left';
    taken.push({x:q.x-rad,y:cy-rad,w:rad*2,h:rad*2+(q.y-cy)});
    hits.push({x:q.x-rad-6,y:cy-rad-6,w:rad*2+12,h:rad*2+q.y-cy+8,type:'gate',id:gt.id});
    if(gt.label)chips.push({gt:gt,q:q,sel:sel,col:col});
  });
  chips.forEach(function(c){
    g2.font='700 11px '+FONT;
    var words=c.gt.label.split(' '),lines=[''],i;
    for(i=0;i<words.length;i++){var tr=(lines[lines.length-1]?lines[lines.length-1]+' ':'')+words[i];if(g2.measureText(tr).width>128&&lines[lines.length-1]){if(lines.length===2){lines[1]+='…';break;}lines.push(words[i]);}else lines[lines.length-1]=tr;}
    var lw=0;lines.forEach(function(s){lw=Math.max(lw,g2.measureText(s).width);});
    var w=lw+16,h=6+lines.length*14,x=Math.max(6,Math.min(W-6-w,c.q.x-w/2)),y=c.q.y+6,tries=0;
    while(tries++<6){var hit=taken.filter(function(r){return x<r.x+r.w+3&&x+w>r.x-3&&y<r.y+r.h+3&&y+h>r.y-3;})[0];if(!hit)break;y=hit.y+hit.h+4;}
    taken.push({x:x,y:y,w:w,h:h});
    rr(x,y,w,h,h>24?11:10);g2.fillStyle=c.sel?c.col:(DARK?'#1B2824':'rgba(255,255,255,.97)');g2.fill();
    g2.fillStyle=c.sel?'#fff':(DARK?'#E8F0EC':'#0E1A16');
    lines.forEach(function(s,k){g2.fillText(s,x+8,y+14+k*14);});
  });
  /* train hints along the track around the station: entered, brake start, stopped, left, full speed (design: model 2) */
  var hs=S.hints;
  if(hs&&D0<900){
    var hst=null;STN.forEach(function(s){if(s.id===hs.stationId)hst=s;});
    if(hst){
      var hsg=hs.dir==='SB'?1:-1,hlat=hs.dir==='SB'?T2:T1,cards=[],rects=[];
      hs.items.forEach(function(it){
        var pp=P3(hst.s+hsg*it.off),q=scr(pp.x+pp.nx*hlat,DECK+3,pp.z+pp.nz*hlat);
        if(q.z>1||q.y<-60||q.y>H+60||q.x<-200||q.x>W+200)return;
        cards.push({it:it,q:q});
      });
      cards.sort(function(a,b){return a.q.y-b.q.y;});
      cards.forEach(function(c,i){
        var it=c.it,rows=it.rows||[],pill=!rows.length,w,h;
        if(pill){g2.font='700 12px '+FONT;w=g2.measureText(it.title+'   '+it.time).width+22;h=26;}
        else{g2.font='800 12.5px '+FONT;w=g2.measureText(it.title).width+30;g2.font='500 11.5px '+FONT;rows.forEach(function(r){w=Math.max(w,g2.measureText(r[0]+'   '+r[1]).width+28);});h=36+rows.length*17;}
        var x=i%2===0?c.q.x+26:c.q.x-26-w,y=c.q.y-h/2;
        if(x<6)x=c.q.x+26;if(x+w>W-6)x=c.q.x-26-w;x=Math.max(6,Math.min(W-6-w,x));
        for(var kk=0;kk<6;kk++){var ov=rects.filter(function(r){return x<r.x+r.w+4&&x+w>r.x-4&&y<r.y+r.h+4&&y+h>r.y-4;})[0];if(!ov)break;y=ov.y+ov.h+6;}
        rects.push({x:x,y:y,w:w,h:h});
        g2.globalAlpha=it.past?.72:1;
        g2.strokeStyle='#F59E0B';g2.lineWidth=1.5;g2.beginPath();g2.moveTo(c.q.x,c.q.y);g2.lineTo(x>c.q.x?x:x+w,Math.max(y+8,Math.min(y+h-8,c.q.y)));g2.stroke();
        g2.beginPath();g2.arc(c.q.x,c.q.y,5,0,7);g2.fillStyle='#F59E0B';g2.fill();g2.lineWidth=2;g2.strokeStyle='#fff';g2.stroke();
        if(pill){
          rr(x,y,w,h,13);g2.fillStyle='rgba(255,255,255,.97)';g2.fill();g2.lineWidth=1.5;g2.strokeStyle='#F2C230';g2.stroke();
          g2.font='700 12px '+FONT;g2.fillStyle='#0E1A16';g2.fillText(it.title,x+11,y+17);g2.textAlign='right';g2.fillText(it.time,x+w-11,y+17);g2.textAlign='left';
        }else{
          rr(x,y,w,h,14);g2.fillStyle='#0B0F0E';g2.fill();g2.lineWidth=2;g2.strokeStyle='#F2C230';g2.stroke();
          g2.beginPath();g2.arc(x+14,y+19,3.6,0,7);g2.fillStyle='#F59E0B';g2.fill();
          g2.font='800 12.5px '+FONT;g2.fillStyle='#fff';g2.fillText(it.title,x+23,y+23);
          rows.forEach(function(r,ri){var ry=y+43+ri*17;g2.font='500 11.5px '+FONT;g2.fillStyle='#D6DEDB';g2.fillText(r[0],x+13,ry);g2.font='800 11.5px '+FONT;g2.fillStyle='#fff';g2.textAlign='right';g2.fillText(r[1],x+w-13,ry);g2.textAlign='left';});
        }
        g2.globalAlpha=1;
      });
    }
  }
  Object.keys(TR).forEach(function(id){
    var o=TR[id],d=o.d;if(!d||!o.pos)return;
    var q=scr(o.pos.x,DECK+11,o.pos.z);
    if(q.z>1||q.x<-220||q.x>W+220||q.y<-80||q.y>H+60)return;
    var est=d.state!=='LIVE',co=d.callout,x=q.x,y=q.y;
    hits.push({x:x-40,y:y-24,w:80,h:84,type:'train',id:id});
    if(d.women&&o.T.cars[5].visible&&D0<600){
      var wq=scr(o.T.cars[5].position.x,DECK+8,o.T.cars[5].position.z);
      if(wq.z<1){g2.font='800 12px '+FONT;var ww=g2.measureText(d.women).width+34,wx=wq.x-ww/2,wy=wq.y-30;
        rr(wx,wy,ww,24,12);g2.fillStyle='#B5307A';g2.fill();g2.lineWidth=2;g2.strokeStyle='#fff';g2.stroke();
        g2.beginPath();g2.arc(wx+14,wy+9,3.2,0,7);g2.fillStyle='#fff';g2.fill();g2.beginPath();g2.arc(wx+14,wy+19,5.4,Math.PI*1.1,Math.PI*1.9);g2.lineWidth=2.2;g2.strokeStyle='#fff';g2.stroke();
        g2.fillStyle='#fff';g2.fillText(d.women,wx+25,wy+17);}
    }
    if(co&&!(S.hints&&S.hints.trainId===id)){
      g2.font='800 12.5px '+FONT;var tw=g2.measureText(co.title).width+26;
      g2.font='500 11.5px '+FONT;co.rows.forEach(function(r){tw=Math.max(tw,g2.measureText(r[0]+'  '+r[1]).width+30);});
      var bh=14+22+co.rows.length*17,bx=x+26,by=y-bh-18;
      if(bx+tw>W-8)bx=Math.max(8,x-26-tw);
      g2.strokeStyle='#F59E0B';g2.lineWidth=1.5;g2.beginPath();g2.moveTo(x,y+10);g2.lineTo(bx+(bx>x?0:tw),by+bh-8);g2.stroke();
      rr(bx,by,tw,bh,14);g2.fillStyle='#0B0F0E';g2.fill();g2.lineWidth=2;g2.strokeStyle='#F2C230';g2.stroke();
      g2.beginPath();g2.arc(bx+14,by+19,3.6,0,7);g2.fillStyle='#F59E0B';g2.fill();
      g2.font='800 12.5px '+FONT;g2.fillStyle='#fff';g2.fillText(co.title,bx+23,by+23);
      co.rows.forEach(function(r,ri){var ry=by+43+ri*17;g2.font='500 11.5px '+FONT;g2.fillStyle='#D6DEDB';g2.fillText(r[0],bx+13,ry);if(r[1]){g2.font='800 11.5px '+FONT;g2.fillStyle='#fff';g2.textAlign='right';g2.fillText(r[1],bx+tw-13,ry);g2.textAlign='left';}});
    }else if(d.label){
      g2.font='700 11.5px '+FONT;
      var w=g2.measureText(d.label).width+(est?24:34),px=x-w/2,py=y-30;
      rr(px,py,w,22,11);g2.fillStyle=est?'rgba(255,255,255,.96)':'#0B0F0E';g2.fill();g2.lineWidth=1.5;if(est)g2.setLineDash([4,3]);g2.strokeStyle=est?'#6B7C75':'#F2C230';g2.stroke();g2.setLineDash([]);
      if(!est){g2.beginPath();g2.arc(px+13,py+11,3.5,0,7);g2.fillStyle='#F59E0B';g2.fill();}
      g2.fillStyle=est?'#3E4C46':'#fff';g2.fillText(d.label,px+(est?12:22),py+15);
    }
  });
}

/* ---------- frame ---------- */
var cam={x:0,z:0,h:0,init:false},last=performance.now();
function angLerp(a,b,k){var d=((b-a+540)%360)-180;return a+d*k;}
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min(.1,(now-last)/1000);last=now;
  if(W!==gl.clientWidth||H!==gl.clientHeight)size();
  if(!S){renderer.render(scene,camera);return;}
  var th=S.theme,v=S.view,k=Math.min(1,dt*5);
  /* trains glide along the real track; each car follows the curve */
  Object.keys(TR).forEach(function(id){
    var o=TR[id],d=o.d,sg=d.dir==='SB'?1:-1,lat=d.dir==='SB'?T2:T1;
    o.s=Math.abs(o.ts-o.s)>400?o.ts:o.s+(o.ts-o.s)*k;
    for(var i=0;i<6;i++){
      var car=o.T.cars[i],pp=P3(o.s+sg*(i-2.5)*(CL+GAP));
      car.position.set(pp.x+pp.nx*lat,DECK+.4,pp.z+pp.nz*lat);car.rotation.y=pp.yaw+(sg<0?Math.PI:0);
    }
    var c=P3(o.s);o.pos={x:c.x+c.nx*lat,z:c.z+c.nz*lat};o.br=c.br;
    var vis=Math.hypot(o.pos.x-cam.x,o.pos.z-cam.z)<Math.max(1700,D0*3);o.T.cars.forEach(function(cr){cr.visible=vis;});
  });
  /* camera: follow the selected train (looking along its travel) or the framed station */
  var sel=S.selectedTrain&&TR[S.selectedTrain],tx,tz,thd;
  if(sel){tx=sel.pos.x;tz=sel.pos.z;thd=sel.br*180/Math.PI+(sel.d.dir==='NB'?180:0);}
  else{tx=mx(v.lng);tz=-my(v.lat);thd=v.heading;}
  if(flatMode)thd=0;
  tx+=pan.x;tz+=pan.z;
  if(!cam.init||Math.hypot(tx-cam.x,tz-cam.z)>1500||Object.keys(ptr).length){cam.x=tx;cam.z=tz;cam.h=thd;cam.init=true;}
  k=Math.min(1,dt*4);cam.x+=(tx-cam.x)*k;cam.z+=(tz-cam.z)*k;cam.h=angLerp(cam.h,thd,Math.min(1,dt*2.5));
  hb=cam.h+hOff;var b=hb*Math.PI/180,fx=Math.sin(b),fz=-Math.cos(b);
  D0=340*Math.pow(2,16-(v.zoom||16))/zmul;D0=Math.max(70,Math.min(3600,D0));
  scene.fog.near=D0*1.8;scene.fog.far=D0*7+600; /* the haze moves back as you zoom out, so the city stays in view */
  camera.position.set(cam.x-fx*Math.cos(PITCH)*D0,DECK+Math.sin(PITCH)*D0,cam.z-fz*Math.cos(PITCH)*D0);
  camera.lookAt(cam.x,DECK,cam.z);
  var fyy=v.top+(H-v.bottom-v.top)*.62;if(fyy<H*.42)fyy=H*.42;
  camera.setViewOffset(W,H,0,-(fyy-H/2),W,H);
  ground.position.x=cam.x;ground.position.z=cam.z;
  var real=realOn();
  if(real)osmTick(now);
  Object.keys(OSM.tiles).forEach(function(k){var tl=OSM.tiles[k];if(tl.group&&tl.group.visible!==real)tl.group.visible=real;});
  var wantProc=!(real&&OSM.on)||D0>1600;if(wantProc!==procShown){procShown=wantProc;procMeshes.forEach(function(m){m.visible=wantProc;});}
  renderer.render(scene,camera);
  drawOverlay(th);
}
size();requestAnimationFrame(frame);
}
</script></body></html>`;
}
