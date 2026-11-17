import { LINE_PATH } from '@/lib/lineGeo';

/**
 * The HTML page that hosts Google Maps (Maps JavaScript API). It is shown in a
 * WebView on phones and an iframe on the web, and is driven through one
 * function, `window.__set(payload)` (see payload.ts). Taps go back out as
 * `{type:'station'|'train', id}` messages. Colours all arrive in the payload, so
 * the page itself holds none. (The script avoids backticks: it lives in a TS template.)
 */
export function mapPage(apiKey: string, lang: 'bn' | 'en', mapId: string, dark: boolean): string {
  const path = JSON.stringify(LINE_PATH.map(([lat, lng]) => ({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })));
  const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__init&loading=async&v=weekly&language=${lang}&region=BD`;
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body,#m{margin:0;height:100%;width:100%;overflow:hidden;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#err{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-size:14px;line-height:1.4}
#err[hidden]{display:none}
.pin{position:absolute;transform:translate(-50%,-50%);cursor:pointer;transition:left .45s linear,top .45s linear}
.nz .pin{transition:none}
.st{display:flex;align-items:center;gap:6px;padding:3px 9px 3px 5px;border-radius:999px;background:var(--surface);color:var(--ink);font-size:12.5px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(14,26,22,.22)}
.st i{display:flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:6px;background:var(--brand);color:#fff}
.st i svg{width:11px;height:11px;fill:#fff}
.st.sel{background:var(--brandDeep);color:#fff}
.st.sel i{background:#2BD39A}.st.sel i svg{fill:#04140E}
.dots .st:not(.sel):not(.term){width:12px;height:12px;padding:0;border-radius:50%;background:var(--surface);border:2.5px solid var(--brand);box-sizing:border-box;box-shadow:0 1px 4px rgba(14,26,22,.3)}
.dots .st:not(.sel):not(.term) i,.dots .st:not(.sel):not(.term) b{display:none}
.gt{display:flex;flex-direction:column;align-items:center;gap:3px}
.gt .gl{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--brand);color:#fff;border:2.5px solid #fff;box-sizing:border-box;font-size:14px;font-weight:800;box-shadow:0 3px 10px rgba(14,26,22,.35)}
.gt .gn{max-width:150px;padding:2px 8px;border-radius:999px;background:var(--surface);color:var(--ink);font-size:11px;font-weight:700;line-height:1.3;text-align:center;box-shadow:0 2px 6px rgba(14,26,22,.25)}
.gt.sel .gl{width:38px;height:38px;font-size:17px;background:var(--brandDeep)}
.gt.sel .gn{background:var(--brandDeep);color:#fff}
.me{width:18px;height:18px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-sizing:border-box;box-shadow:0 0 0 1px rgba(14,26,22,.18),0 2px 8px rgba(14,26,22,.4)}
.tr{display:flex;flex-direction:column;align-items:center}
.tr .tag{position:absolute;bottom:28px;display:flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:var(--ink);border:1.5px solid var(--live);color:var(--surface);font-size:11.5px;font-weight:700;white-space:nowrap}
.tr .tag u{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--live);text-decoration:none}
.tr.est .tag{background:var(--surface);border:1.5px dashed var(--estimated);color:var(--inkMuted)}
.tr .car{width:24px;height:24px;border-radius:50%;box-sizing:border-box;border:2px solid var(--live);background:rgba(245,158,11,.16)}
.tr.est .car{border:2px dashed var(--estimated);background:rgba(255,255,255,.4)}
.tr.sel .car{width:36px;height:36px}
.coach{display:none;position:absolute;left:50%;top:50%;width:15px;margin:-34px 0 0 -7.5px;flex-direction:column;gap:1px;pointer-events:none;will-change:transform}
.coach i{display:block;height:17px;border-radius:3px;background:var(--dir);border:1.5px solid #fff;box-shadow:0 3px 5px rgba(14,26,22,.4)}
.coach i:first-child{border-radius:8px 8px 3px 3px}
.coach i:last-child{border-radius:3px 3px 6px 6px}
.co{display:none;position:absolute;left:30px;bottom:6px;min-width:128px;padding:6px 11px 7px;border-radius:14px;background:#0B0F0E;border:2px solid #F2C230;color:#fff;box-shadow:0 4px 14px rgba(14,26,22,.4);font-size:11.5px;line-height:1.35;white-space:nowrap;pointer-events:none}
.co b{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800}
.co b u{width:7px;height:7px;border-radius:50%;background:#F59E0B;text-decoration:none}
.co div{display:flex;justify-content:space-between;gap:14px;color:#d6dedb}
.co div span:last-child{color:#fff;font-weight:800;font-variant-numeric:tabular-nums}
.t3d .co{display:block}.t3d .tr.hasco .tag{display:none}
.t3d .coach{display:flex}.t3d .tr .car{display:none}
.t3d .tr.dw .coach i{box-shadow:0 0 0 2.5px var(--ring),0 3px 5px rgba(14,26,22,.4)}
.t3d .tr.est .coach i{border-style:dashed}
</style></head>
<body><div id="m"></div><div id="err" hidden></div>
<script>
var LINE=${path},MAPID=${JSON.stringify(mapId)},DARK=${dark ? 'true' : 'false'};
var routeCasing=null,routeLine=null,me=null,meRing=null,tiltOn=false,map=null,ready=false,pending=null,S=null,Pin=null,stations={},trains={},placed=false,viewKey='',proj=false;
function send(m){var s=JSON.stringify(m);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else parent.postMessage(s,'*');}
function fail(kind){send({type:'error',kind:kind});var e=document.getElementById('err'),t=pending||S;e.hidden=false;e.textContent=(t&&t.errorText)||'Google Maps unavailable';if(t){e.style.background=t.theme.bg;e.style.color=t.theme.inkMuted;}}
window.gm_authFailure=function(){fail('auth');};
window.__set=function(p){if(!ready){pending=p;return;}apply(p);};
window.addEventListener('message',function(e){if(e.source!==parent)return;try{window.__set(JSON.parse(e.data));}catch(_){}});
window.addEventListener('error',function(){});

function styles(t,dark){
  var s=[{featureType:'poi.business',stylers:[{visibility:'off'}]},{featureType:'transit.station.bus',stylers:[{visibility:'off'}]}];
  if(!dark)return s;
  return s.concat([
    {elementType:'geometry',stylers:[{color:t.mapGround}]},
    {elementType:'labels.text.fill',stylers:[{color:t.inkMuted}]},
    {elementType:'labels.text.stroke',stylers:[{color:t.mapGround}]},
    {featureType:'road',elementType:'geometry',stylers:[{color:t.mapRoad}]},
    {featureType:'road',elementType:'geometry.stroke',stylers:[{color:t.mapGround}]},
    {featureType:'water',elementType:'geometry',stylers:[{color:t.bg}]},
    {featureType:'poi.park',elementType:'geometry',stylers:[{color:t.surface}]}
  ]);
}

function makePin(){
  function P(el,pos,z){this.el=el;this.pos=pos;this.el.style.zIndex=z;this.setMap(map);}
  P.prototype=new google.maps.OverlayView();
  P.prototype.onAdd=function(){this.getPanes().overlayMouseTarget.appendChild(this.el);};
  P.prototype.draw=function(){var pr=this.getProjection();if(!pr)return;var p=pr.fromLatLngToDivPixel(new google.maps.LatLng(this.pos.lat,this.pos.lng));if(p){this.el.style.left=p.x+'px';this.el.style.top=p.y+'px';}};
  P.prototype.onRemove=function(){if(this.el.parentNode)this.el.parentNode.removeChild(this.el);};
  P.prototype.move=function(pos){this.pos=pos;this.draw();};
  return P;
}

window.__init=function(){
  map=new google.maps.Map(document.getElementById('m'),{center:{lat:23.83,lng:90.365},zoom:12,disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy',keyboardShortcuts:false,isFractionalZoomEnabled:true,mapId:MAPID,colorScheme:DARK?google.maps.ColorScheme.DARK:google.maps.ColorScheme.LIGHT,renderingType:google.maps.RenderingType.VECTOR,headingInteractionEnabled:true,tiltInteractionEnabled:true});
  Pin=makePin();
  var casing=new google.maps.Polyline({map:map,path:LINE,strokeWeight:10,strokeOpacity:1,zIndex:1});
  var line=new google.maps.Polyline({map:map,path:LINE,strokeWeight:5,strokeOpacity:1,zIndex:2});
  window.__line=[casing,line];
  map.addListener('heading_changed',function(){Object.keys(trains).forEach(function(k){rot(trains[k]);});});
  map.addListener('zoom_changed',function(){
    var d=document.body;d.classList.add('nz');setTimeout(function(){d.classList.remove('nz');},450);
    d.classList.toggle('dots',map.getZoom()<13.2);
  });
  // the projection arrives a moment after the first placement: redo the framing so the sheet/top offsets apply
  google.maps.event.addListenerOnce(map,'idle',function(){proj=true;if(S){placed=false;setView(S.view);placed=true;}});
  ready=true;
  if(pending){var p=pending;pending=null;apply(p);}
};

function css(el,t){
  var k;for(k in t)el.style.setProperty('--'+k,t[k]);
}

function syncStations(p){
  var seen={};
  p.stations.forEach(function(s){
    seen[s.id]=1;
    var o=stations[s.id];
    if(!o){
      var el=document.createElement('div');el.className='pin';el.innerHTML='<div class="st"><i><svg viewBox="0 0 24 24"><path d="M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 3v5h10V6H7Zm1 9a1.5 1.5 0 1 0 0 .1Zm8 0a1.5 1.5 0 1 0 0 .1ZM8 19l-2 3h2.4l1.2-2Zm8 0-1.6 1 1.2 2H18Z"/></svg></i><b></b></div>';
      el.addEventListener('click',function(ev){ev.stopPropagation();send({type:'station',id:s.id});});
      o=stations[s.id]={el:el,pin:new Pin(el,s,1)};
    }
    o.el.querySelector('b').textContent=s.label;
    var box=o.el.firstChild;
    box.className='st'+(s.terminal?' term':'')+(p.selectedStation===s.id?' sel':'');
    o.el.style.zIndex=p.selectedStation===s.id?4:1;
    css(o.el,p.theme);
  });
  Object.keys(stations).forEach(function(id){if(!seen[id]){stations[id].pin.setMap(null);delete stations[id];}});
}

function trainHtml(t){
  var est=t.state!=='LIVE';
  var tag='';
  if(t.label){
    tag='<div class="tag">'+(est?'':'<u></u>')+esc(t.label)+'</div>';
  }
  var co='';
  if(t.callout){
    co='<div class="co"><b><u></u>'+esc(t.callout.title)+'</b>'+t.callout.rows.map(function(r){return '<div><span>'+esc(r[0])+'</span><span>'+esc(r[1])+'</span></div>';}).join('')+'</div>';
  }
  return tag+co+'<div class="car"></div><div class="coach"><i></i><i></i><i></i></div>';
}
function rot(o){var c=o.el.querySelector('.coach');if(c)c.style.transform='rotate('+(o.hdg-(map.getHeading()||0))+'deg)';}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function syncTrains(p){
  var seen={};
  p.trains.forEach(function(t){
    seen[t.id]=1;
    var o=trains[t.id];
    if(!o){
      var el=document.createElement('div');el.className='pin';
      el.addEventListener('click',function(ev){ev.stopPropagation();send({type:'train',id:t.id});});
      o=trains[t.id]={el:el,pin:new Pin(el,t,3),html:''};
    }
    var dw=t.timer!=null,est=t.state!=='LIVE';
    var cls='pin tr'+(est?' est':'')+(dw?' dw':'')+(t.callout?' hasco':'')+(p.selectedTrain===t.id?' sel':'');
    if(o.el.className!==cls)o.el.className=cls;
    var h=trainHtml(t);
    if(o.html!==h){o.html=h;o.el.innerHTML=h;}
    o.el.style.zIndex=p.selectedTrain===t.id?6:3;
    o.el.style.setProperty('--dir',t.dir==='SB'?p.theme.trainSB:p.theme.trainNB);
    o.el.style.setProperty('--ring',dw?p.theme.brand:p.theme.live);
    css(o.el,p.theme);
    o.hdg=t.heading||0;rot(o);
    o.pin.move(t);
  });
  Object.keys(trains).forEach(function(id){if(!seen[id]){trains[id].pin.setMap(null);delete trains[id];}});
}

var gatePins={};
function syncGates(p){
  var seen={};
  (p.gates||[]).forEach(function(g){
    seen[g.id]=1;
    var o=gatePins[g.id];
    if(!o){
      var el=document.createElement('div');el.className='pin';
      el.addEventListener('click',function(ev){ev.stopPropagation();send({type:'gate',id:g.id});});
      o=gatePins[g.id]={el:el,pin:new Pin(el,g,7),html:''};
    }
    var h='<div class="gt'+(p.selectedGate===g.id?' sel':'')+'"><div class="gl">'+esc(g.letter)+'</div><div class="gn">'+esc(g.label)+'</div></div>';
    if(o.html!==h){o.html=h;o.el.innerHTML=h;}
    o.el.style.zIndex=p.selectedGate===g.id?9:7;
    css(o.el,p.theme);
    o.pin.move(g);
  });
  Object.keys(gatePins).forEach(function(id){if(!seen[id]){gatePins[id].pin.setMap(null);delete gatePins[id];}});
}

function syncUser(p){
  if(!p.user){if(me){me.pin.setMap(null);me=null;}if(meRing){meRing.setMap(null);meRing=null;}return;}
  var pos={lat:p.user.lat,lng:p.user.lng};
  if(!me){var el=document.createElement('div');el.className='pin';el.innerHTML='<div class="me"></div>';me={el:el,pin:new Pin(el,pos,5)};}
  else me.pin.move(pos);
  if(p.user.accuracy>0){
    if(!meRing)meRing=new google.maps.Circle({map:map,strokeOpacity:0,fillColor:'#1A73E8',fillOpacity:0.14,clickable:false,zIndex:0});
    meRing.setOptions({center:pos,radius:Math.min(p.user.accuracy,400)});
  }else if(meRing){meRing.setMap(null);meRing=null;}
}

function syncRoute(p){
  if(!p.route){if(routeLine){routeCasing.setMap(null);routeLine.setMap(null);routeCasing=routeLine=null;}return;}
  if(!routeLine){
    routeCasing=new google.maps.Polyline({map:map,strokeOpacity:1,strokeWeight:14,zIndex:3,clickable:false});
    routeLine=new google.maps.Polyline({map:map,strokeOpacity:1,strokeWeight:8,zIndex:4,clickable:false,icons:[{icon:{path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW,scale:2.6,strokeColor:'#ffffff',fillColor:'#ffffff',fillOpacity:1,strokeWeight:1},offset:'12px',repeat:'64px'}]});
  }
  routeCasing.setOptions({path:p.route,strokeColor:p.theme.surface});
  routeLine.setOptions({path:p.route,strokeColor:p.theme.brandDeep});
}

function setTilt(v){
  if(v.tilt===tiltOn&&placed)return;
  tiltOn=v.tilt;
  document.body.classList.toggle('t3d',!!v.tilt);
  map.setTilt(v.tilt?60:0);
  map.setHeading(v.tilt?v.heading:0);
}

function setView(v){
  if(v.mode==='fit'){
    var b=new google.maps.LatLngBounds();(v.fit||LINE).forEach(function(q){b.extend(q);});
    map.fitBounds(b,{top:v.top+24,bottom:v.bottom+24,left:28,right:28});
    return;
  }
  var ll={lat:v.lat,lng:v.lng};
  var d=(v.bottom-v.top)/2;
  if(!placed||!proj){
    map.setOptions({zoom:v.zoom,center:ll});
  }else{
    if(Math.abs(map.getZoom()-v.zoom)>0.3)map.setZoom(v.zoom);
  }
  var pr=map.getProjection();
  if(pr){
    var pt=pr.fromLatLngToPoint(new google.maps.LatLng(v.lat,v.lng));
    pt.y+=d/Math.pow(2,v.zoom);
    pt.x-=(v.shiftX||0)/Math.pow(2,v.zoom);
    var c=pr.fromPointToLatLng(pt);
    if(placed&&proj)map.panTo(c);else map.setCenter(c);
  }else map.setCenter(ll);
}

function apply(p){
  S=p;
  document.documentElement.style.background=p.theme.bg;
  document.body.style.background=p.theme.bg;
  if(!MAPID)map.setOptions({styles:styles(p.theme,p.dark)});
  window.__line[0].setOptions({strokeColor:p.theme.surface});
  window.__line[1].setOptions({strokeColor:p.theme.brand});
  document.body.classList.toggle('dots',map.getZoom()<13.2);
  syncRoute(p);
  syncStations(p);
  syncTrains(p);
  syncGates(p);
  syncUser(p);
  var v=p.view,k=v.mode+'|'+(v.mode==='focus'?v.lat.toFixed(6)+','+v.lng.toFixed(6)+','+v.zoom:'')+'|'+v.top+'|'+v.bottom+'|'+(v.shiftX||0)+'|'+v.key;
  if(k!==viewKey){viewKey=k;setView(v);setTilt(v);placed=true;}else setTilt(v);
}
</script>
<script async defer src="${src}" onerror="fail('load')"></script>
</body></html>`;
}
