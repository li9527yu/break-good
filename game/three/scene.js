import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createLife} from './life.js';
import {buildLab} from './model.js';
import {stations,descriptions,findPath} from './layout.js';
function start(){
const room=document.querySelector('.room'),canvas=document.querySelector('#lab-canvas'),overlay=document.querySelector('#event-layer'),fade=document.querySelector('#time-skip');
const sceneHint=document.createElement('p');
sceneHint.className='scene-guide';
sceneHint.hidden=true;
sceneHint.setAttribute('role','status');
room.append(sceneHint);
let hintTimer;
const pauses=[overlay,fade,document.querySelector('#menu'),document.querySelector('#notes')];
function scheduleHint(){
 clearTimeout(hintTimer);
 sceneHint.hidden=true;
 if(moving||state.ending||pauses.some(dialog=>dialog.open))return;
 const first=state.node==='d1-entry';
 const target=required(state);
 if(location===target&&!first)return;
 hintTimer=setTimeout(()=>{
  if(moving||pauses.some(dialog=>dialog.open))return;
  sceneHint.textContent=first
   ?'点场景中亮起的入口，或点下方按钮走过去。'
   :'下一步去'+stations[target].label+'。点亮起的标记即可前往。';
  sceneHint.hidden=false;
 },first?800:9000);
}
const hintObserver=new MutationObserver(scheduleHint);
for(const dialog of pauses)hintObserver.observe(dialog,{attributeFilter:['open']});
room.addEventListener('pointerdown',scheduleHint);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const world=new T.Scene();world.background=new T.Color('#101b1b');
const camera=new T.OrthographicCamera(-14,14,10,-10,.1,100);camera.position.set(21,20,26);camera.lookAt(0,1,0);
world.add(new T.HemisphereLight('#d6e6dd','#684e42',1.65));const key=new T.DirectionalLight('#ffedc8',3.4);key.position.set(2,14,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-15,right:15,top:14,bottom:-14,near:.5,far:45});key.shadow.normalBias=.035;key.shadow.bias=-.0002;world.add(key);const fill=new T.DirectionalLight('#93c7d0',1.2);fill.position.set(-6,7,-5);world.add(fill);
const model=buildLab(world,renderer),player=model.characters.player;
let dirty=true;
const life=createLife(model.characters);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1,0);controls.enableDamping=true;controls.dampingFactor=.1;controls.minZoom=.65;controls.maxZoom=5;controls.minPolarAngle=.25;controls.maxPolarAngle=1.35;controls.minAzimuthAngle=-.15;controls.maxAzimuthAngle=1.55;controls.screenSpacePanning=false;controls.maxTargetRadius=10;controls.cursor.set(0,1,0);controls.update();controls.saveState();controls.addEventListener('change',()=>{dirty=true;});
let pointerStart=null,dragged=false;canvas.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];dragged=false;});canvas.addEventListener('pointermove',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)dragged=true;});canvas.addEventListener('pointercancel',()=>{dragged=true;pointerStart=null;});
let location='center',moving=false,cancel=0,inspectMode=false,lastFocus=null,view='overview';
const labels=document.querySelector('#world-labels'),labelMap={},markerMap={};
for(const [id,station]of Object.entries(stations)){
 if(!station.label)continue;
 const b=document.createElement('button');b.type='button';b.className='world-label';b.textContent=station.label;b.dataset.object=id;b.setAttribute('aria-label','走近'+station.label);b.onclick=()=>walk(id,true);labels.append(b);labelMap[id]=b;
 const marker=new T.Mesh(new T.RingGeometry(.23,.3,32),new T.MeshBasicMaterial({color:'#b5c4a3',side:T.DoubleSide,transparent:true,opacity:.65}));marker.rotation.x=-Math.PI/2;marker.position.set(station.p[0],station.p[1]+.03,station.p[2]);marker.userData.station=id;world.add(marker);markerMap[id]=marker;
}
function required(s){const n=GameEngine.current(s);if(s.ending)return'door';if(n.kind==='work')return'bench';if(n.kind==='report')return'report';if(n.id.endsWith('-end'))return'door';if(n.speaker==='walter')return n.id==='d3-notify'?'phone':'walter';if(n.speaker==='jesse')return'jesse';if(n.speaker==='gus')return['d1-gus','d4-audit','d5-entry','d6-entry'].includes(n.id)?'gus':'phone';if(n.speaker==='self')return'report';return'door';}
function close(){life.release();if(overlay.open)overlay.close();inspectMode=false;lastFocus?.focus();}
function activate(id){if(moving||(!life.has(id)&&location!==id))return;inspectMode=id!==required(state);document.querySelector('#panel').hidden=inspectMode;document.querySelector('#object-info').hidden=!inspectMode;
 if(inspectMode){document.querySelector('#object-title').textContent=stations[id].label;document.querySelector('#object-description').textContent=descriptions[id]||'实验室通道。';}else render();lastFocus=document.activeElement;overlay.showModal();document.querySelector('#event-close').focus();}
async function walk(to,interact){
 if(moving||overlay.open||fade.open||document.querySelector('#menu').open||document.querySelector('#notes').open||!stations[to])return;
 const npc=life.has(to);if(npc)life.hold(to);const destination=npc?life.nearest(to):to;const path=findPath(location,destination),run=++cancel;moving=true;scheduleHint();const travel=document.querySelector('#travel');travel.disabled=true;travel.textContent='正在走向'+(stations[to].label||'目的地')+'…';
 for(let i=1;i<path.length;i++){
  const a=player.group.position.clone(),b=new T.Vector3(...stations[path[i]].p),duration=reduce?1:a.distanceTo(b)*260;
  const delta=b.clone().sub(a);player.group.rotation.y=Math.atan2(delta.x,delta.z);
  await new Promise(resolve=>{const start=performance.now();function step(now){if(run!==cancel){resolve();return;}const t=Math.min(1,(now-start)/duration);player.group.position.lerpVectors(a,b,t);player.pose(reduce?'idle':'walk',now/1000);if(t<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});
  if(run!==cancel)return;location=path[i];
 }
 if(npc){const goal=model.characters[to].group.position.clone(),origin=player.group.position.clone(),direction=origin.clone().sub(goal);if(direction.length()<.01)direction.set(0,0,1);goal.addScaledVector(direction.normalize(),.8);const duration=reduce?1:origin.distanceTo(goal)*260;await new Promise(resolve=>{const start=performance.now();function step(now){if(run!==cancel){resolve();return;}const t=Math.min(1,(now-start)/duration);player.group.position.lerpVectors(origin,goal,t);player.pose(reduce?'idle':'walk',now/1000);if(t<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});if(run!==cancel)return;model.characters[to].group.lookAt(player.group.position.x,model.characters[to].group.position.y,player.group.position.z);}
 moving=false;refresh(state);player.pose('idle');dirty=true;if(interact)activate(to);else {life.release();refresh(state);}
}
function refresh(s){
 dirty=true;
 scheduleHint();
 const target=required(s),gusPresent=['d1-gus','d4-audit','d5-entry','d6-entry'].includes(s.node);
 const walterPresent=s.day!==3||s.node==='d3-entry';
 model.characters.walter.group.visible=walterPresent;model.characters.gus.group.visible=gusPresent;
 for(const [id,b]of Object.entries(labelMap)){const hidden=id==='walter'&&!walterPresent||id==='gus'&&!gusPresent;b.hidden=hidden;b.classList.toggle('active',id===target);markerMap[id].visible=!hidden;markerMap[id].material.color.set(id===target?'#ffe09b':'#9bbaa9');}
 document.querySelector('#day').textContent=GameStory.days[s.day-1];
 const travel=document.querySelector('#travel');
 travel.disabled=moving;
 if(!moving)travel.textContent=s.ending?'查看结局':location===target?'交互 · '+stations[target].label:'前往'+stations[target].label;overlay.classList.toggle('work-mode',GameEngine.current(s)?.kind==='work');
}
function changed(previous,next){if(previous.node===next.node)return;
 if(previous.day!==next.day){close();life.reset();location='center';player.group.position.set(...stations.center.p);document.querySelector('#skip-title').textContent=next.day===2?'几天之后':'又过了一段时间';document.querySelector('#skip-subtitle').textContent=GameStory.days[next.day-1]+' · 有些事情已经改变';fade.showModal();}
 else if(required(previous)!==required(next)||GameEngine.current(previous)?.kind!==GameEngine.current(next)?.kind||next.ending)close();refresh(next);}
function reset(){life.reset();cancel++;moving=false;location='center';player.group.position.set(...stations.center.p);player.pose('idle');close();if(fade.open)fade.close();refresh(state);}
document.querySelector('#event-close').onclick=close;overlay.addEventListener('cancel',e=>{e.preventDefault();close();});document.querySelector('#travel').onclick=()=>walk(required(state),true);document.querySelector('#skip-continue').onclick=()=>{fade.close();refresh(state);document.querySelector('#travel').focus();};
const ray=new T.Raycaster(),pointer=new T.Vector2();
canvas.addEventListener('click',e=>{pointerStart=null;if(dragged||moving)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);for(const hit of ray.intersectObjects(world.children,true)){
  let p=hit.object,id=null;while(p){if(p.userData.station){id=p.userData.station;break;}p=p.parent;}
  if(id&&stations[id]&&id!=='player'&&!labelMap[id]?.hidden){walk(id,true);return;}
  if(hit.object.userData.ground){const same=Object.keys(stations).filter(k=>Math.abs(stations[k].p[1]-hit.point.y)<.4);same.sort((a,b)=>new T.Vector3(...stations[a].p).distanceTo(hit.point)-new T.Vector3(...stations[b].p).distanceTo(hit.point));if(same[0])walk(same[0],false);return;}
 }});
function resize(){dirty=true;const r=room.getBoundingClientRect(),aspect=r.width/r.height,h=Math.max(9.6,13.6/aspect);camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}
new ResizeObserver(resize).observe(room);resize();
document.querySelector('#view-toggle').onclick=()=>{dirty=true;view=view==='overview'?'mezzanine':'overview';camera.position.set(...(view==='overview'?[21,20,26]:[18,12,19]));controls.target.set(0,view==='overview'?1:2,-1);camera.zoom=1;camera.updateProjectionMatrix();controls.update();document.querySelector('#view-toggle').textContent=view==='overview'?'查看夹层':'全景视角';};
const cameraTools=document.querySelector('#camera-menu .camera-tools');
function tool(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;cameraTools.append(b);}
tool('复位视角',()=>{controls.reset();dirty=true;});
tool('人物近景',()=>{const id=model.characters.walter.group.visible?'walter':'jesse',p=model.characters[id].group.position;controls.target.copy(p).add(new T.Vector3(0,1,0));camera.position.copy(p).add(new T.Vector3(3,2.5,5));camera.zoom=4;camera.updateProjectionMatrix();controls.update();dirty=true;});
let ambient=!reduce;tool('日常动作：'+(ambient?'开':'关'),function(){ambient=!ambient;cameraTools.lastChild.textContent='日常动作：'+(ambient?'开':'关');dirty=true;});
let previousTime=performance.now(),lastDraw=0;
function draw(now=performance.now()){
 const dt=Math.min(.06,(now-previousTime)/1000);previousTime=now;
 controls.enabled=!overlay.open&&!fade.open&&!document.querySelector('#menu').open&&!document.querySelector('#notes').open;
 controls.update();
 const living=life.update(dt,!ambient||!controls.enabled||document.hidden,moving);
 if(!document.hidden&&(dirty||moving||living)&&now-lastDraw>32){dirty=false;lastDraw=now;camera.updateMatrixWorld();const r=room.getBoundingClientRect();for(const[id,b]of Object.entries(labelMap)){const p=life.has(id)?model.characters[id].group.position.clone():new T.Vector3(...stations[id].p);const nearby=p.distanceTo(player.group.position)<2.7;b.classList.toggle('nearby',nearby);markerMap[id].visible=!b.hidden&&b.classList.contains('active');markerMap[id].position.set(p.x,p.y+.03,p.z);p.y+=.18;p.project(camera);b.style.left=((p.x+1)/2*r.width)+'px';b.style.top=((-p.y+1)/2*r.height)+'px';b.style.visibility=p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1?'hidden':'visible';}renderer.render(world,camera);}requestAnimationFrame(draw);
}
window.Scene={refresh,changed,reset,required,walk,get location(){return location;},get moving(){return moving;},get active(){return overlay.open&&!inspectMode;},diagnostics(){return {three:T.REVISION,meshes:renderer.info.render.calls,triangles:renderer.info.render.triangles,player:player.group.position.toArray(),location,view,camera:camera.position.toArray(),zoom:camera.zoom,ambient,npcs:life.snapshot()};}};
refresh(state);draw();document.querySelector('#scene-loading').hidden=true;
}
try{start();}catch(err){console.error(err);const box=document.querySelector('#scene-loading');box.hidden=false;box.textContent='三维场景初始化失败。请使用启用硬件加速且支持 WebGL 2 的浏览器。'+err.message;document.querySelector('#travel').disabled=true;}
