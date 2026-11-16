'use strict';
const $ = selector => document.querySelector(selector);
const embedded = window.parent !== window && new URLSearchParams(location.search).has('embedded');
let active = !embedded;
if(embedded){
 document.body.classList.add('embedded');
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.data?.type!=='reactor-visibility')return;
  active=event.data.active===true;
  if(!active){
   clearDrag();suppressClick=false;
   window.benchAudio.track(false,0,false,false);
  }
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')window.parent.postMessage({type:'reactor-close'},'*');
 });
}
const items = {
 mist:{name:'雾盐',detail:'基底 · 先入罐',image:'assets/vial-a.svg'},
 amber:{name:'琥珀片',detail:'激发快，容易积热',image:'assets/vial-b.svg',speed:.14,strain:.17},
 reed:{name:'苔晶片',detail:'激发慢，余量更大',speed:.10,strain:.105},
 settle:{name:'澄纹粒',detail:'细泡成串时加入，帮助悬浮物沉降'}
};
const initial = () => ({
 base:false, activator:null, stabilizer:false, selectedResult:null, direction:null,
 sequenceError:false, mistimed:false, seed:Math.floor(Math.random()*90000)+10000,
 variation:.88+Math.random()*.24, disturbanceAt:2.5+Math.random()*2.5,
 time:0, progress:0, load:.16, damage:0, debris:.48, deposit:0, low:false, doseAt:-100,
 overload:0, failedAt:null, ventAt:-1000, sampleAt:-1000, hadAlarm:false
});
let batch=initial(),selected=null,drag=null,suppressClick=false;
const clamp = x => Math.max(0,Math.min(1,x));
const reaction = () => Boolean(batch.base&&batch.activator&&!batch.selectedResult);
const fineBubbles = () => batch.progress>=.26&&batch.progress<=.72;
function element(tag,text,cls){
 const node=document.createElement(tag);
 if(text)node.textContent=text;
 if(cls)node.className=cls;
 return node;
}
function button(text,fn,cls){
 const node=element('button',text,cls);node.type='button';node.onclick=fn;return node;
}
function announce(text){$('#status').textContent=text;}
function available(){
 if(batch.selectedResult)return [];
 const ids=[];
 if(!batch.base)ids.push('mist');
 if(!batch.activator)ids.push('amber','reed');
 if(batch.activator&&!batch.stabilizer)ids.push('settle');
 return ids;
}
function pick(id){
 selected=selected===id?null:id;
 $('#tank-drop').classList.toggle('ready',Boolean(selected));
 document.querySelectorAll('.item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.item===selected)));
 if(selected)announce('已选中'+items[selected].name+'，点击罐体投料。');
}
function place(id,target){
 if(target!=='tank'||!available().includes(id))return;
 if(id==='mist'){
  batch.base=true;
  announce(batch.sequenceError?'基底已补入。预先投入的激发片留下了副产物。':'基底已建立，可以加入一种激发片。');
 }else if(id==='settle'){
  batch.stabilizer=true;batch.mistimed=!fineBubbles();
  if(batch.mistimed)batch.damage=clamp(batch.damage+.12);
  announce(batch.mistimed?'澄纹粒结成团块，使用时机偏离了反应窗口。':'细小悬浮物开始聚集，接下来可以降载静置。');
 }else{
  batch.activator=id;
  if(!batch.base){batch.sequenceError=true;batch.damage=.26;}
  announce(batch.base?'反应启动。观察气泡从散开到成串。':'激发片先碰到空罐，容器出现挂壁。补入基底可以继续。');
 }
 batch.doseAt=performance.now();window.benchAudio.cue('dose');selected=null;render();
}
function finish(){
 if(!reaction())return;
 const purity=Number(Math.min(99.8,100*clamp(.995-.51*(1-batch.progress)-.66*batch.damage-.32*batch.debris-(batch.stabilizer?0:.045))).toFixed(1));
 const issues=[];
 if(batch.sequenceError)issues.push('激发片早于基底，留下副产物');
 if(batch.mistimed)issues.push('澄纹粒错过投放窗口');
 if(!batch.stabilizer)issues.push('未加入澄纹粒');
 if(batch.progress<.985)issues.push('取样时反应仍未充分');
 if(batch.debris>.035)issues.push('仍有悬浮物');
 if(batch.damage>.06&&!batch.sequenceError&&!batch.mistimed)issues.push('高负载或常载过久');
 batch.selectedResult={purity,issues};batch.sampleAt=performance.now();
 window.benchAudio.cue('sample');selected=null;
 announce('本批已留样，批次状态已锁定。');render();
}
function disposition(action){
 if(batch.failedAt!==null)return;
 const purity=batch.selectedResult.purity;
 batch.direction=action;
 if(embedded){
  submitBatch(action==='隔离'?'isolate':'deliver');
  return;
 }
 announce(action==='隔离'
  ?'剧情预演：批次留在实验室。古斯追问延误，沃尔特要求查看操作记录。'
  :purity>=98
   ?'剧情预演：古斯接受交付。沃尔特留意到你能复现高纯度批次。'
   :purity>=94
    ?'剧情预演：古斯暂缓签收并要求复检。沃尔特追问哪一步偏离标准。'
    :'剧情预演：古斯拒收，要求返工。沃尔特会追问投料与负载记录。');
 render();
}
function submitBatch(action){
 window.parent.postMessage({
  type:'reactor-result',
  result:{action,purity:batch.selectedResult.purity,alarm:batch.hadAlarm}
 },'*');
}
function render(){
 $('#tank-drop').classList.toggle('ready',Boolean(selected));
 $('#tank-drop').classList.toggle('guide-target',!batch.base&&!batch.selectedResult);
 const inv=$('#inventory');inv.replaceChildren();
 $('#materials').hidden=available().length===0;
 for(const id of available()){
  const item=button('',()=>{if(!suppressClick)pick(id);},'item');
  item.dataset.item=id;item.setAttribute('aria-pressed',String(selected===id));
  const art=items[id].image?element('img'):element('span',null,'token');
  if(items[id].image){art.src=items[id].image;art.alt='';art.draggable=false;}
  const copy=element('span',null,'item-copy');
  copy.append(element('span',items[id].name),element('small',items[id].detail));
  item.append(art,copy);inv.append(item);
 }
 if(!inv.children.length)inv.append(element('p','本批投料已结束。','sub'));
 const stage=batch.selectedResult?2:reaction()?1:0;
 $('#tank-drop').hidden=Boolean(batch.selectedResult);
 $('#batch-id').textContent='批次 '+batch.seed;
 $('#station').textContent=batch.failedAt!==null?'整批报废':['投料','反应控制','留样结果'][stage];
 $('#instruction').textContent=[
  batch.base?'把一种激发片拖入罐体，反应就会开始。':batch.activator?'补投雾盐，让反应开始。':'把雾盐拖进发亮的罐口，也可先选雾盐再点罐口。',
  batch.stabilizer?'观察沉降。清亮后取样。':'细泡成串时投入澄纹粒。',
  batch.failedAt!==null?'设备已保护停机。':'交付门槛为 98.0%（游戏纯度）。'
 ][stage];
 const surface=$('#surface');surface.replaceChildren();
 if(stage===0){
  surface.append(element('p',batch.base?'基底已入罐，等待激发片。':'罐内缺少基底。','sub'));
 }else if(stage===1){
  const readings=element('div',null,'readings');
  const meter=element('progress');meter.max=1;meter.id='load';meter.setAttribute('aria-label','设备负载');
  const phase=element('p');phase.id='phase';
  const load=element('p');load.id='load-text';readings.append(phase,load,meter);
  const actions=element('div',null,'actions');
  const loadControl=button(batch.low?'恢复常载':'降载静置',()=>{
   batch.low=!batch.low;
   if(batch.low)batch.ventAt=performance.now();
   window.benchAudio.cue(batch.low?'vent':'resume');
   render();
  });
  loadControl.id='load-control';
  actions.append(loadControl,button('取样并测纯度',finish,'primary'));
  surface.append(readings,actions);
 }else{
  const row=element('div',null,'readout');
  const value=element('strong',batch.failedAt!==null?'失效':batch.selectedResult.purity.toFixed(1)+'%','purity');
  const details=element('p',batch.selectedResult.issues.join('；')||'本批操作未记录明显偏差。');
  row.append(value,details);surface.append(row);
  if(batch.failedAt!==null){
   if(embedded)surface.append(button('记录报废，返回实验室',()=>submitBatch('scrap'),'primary'));
   return;
  }
  if(batch.direction){surface.append(element('p','本批已'+batch.direction));return;}
  const actions=element('div',null,'actions');
  actions.append(button('交付',()=>disposition('交付'),'primary'),button('隔离',()=>disposition('隔离')));
  surface.append(actions);
 }
}
function simulate(dt){
 const recipe=items[batch.activator];
 batch.time+=dt;
 const surge=batch.time>=batch.disturbanceAt&&batch.time<batch.disturbanceAt+1.65;
 batch.load=clamp(batch.load+dt*((batch.low?-.32:recipe.strain*batch.variation)+(surge?(batch.low?.07:.38):0)));
 batch.progress=clamp(batch.progress+dt*recipe.speed*batch.variation*(batch.low?.59:1));
 if(batch.load>=.78)batch.hadAlarm=true;
 const settleRate=batch.stabilizer&&!batch.mistimed?(batch.low?.21:.09):(batch.low?.055:.02);
 const before=batch.debris;
 batch.debris=clamp(before-dt*settleRate+dt*Math.max(0,batch.load-.66)*.14);
 batch.deposit=clamp(batch.deposit+Math.max(0,before-batch.debris));
 batch.damage=clamp(batch.damage+dt*(Math.max(0,batch.load-.78)*.55+Number(batch.progress>=1&&!batch.low)*.09));
 batch.overload=Math.max(0,batch.overload+dt*(batch.load>=.92?1:-1.5));
 if(batch.overload>=1.6){
  batch.failedAt=performance.now();
  window.benchAudio.cue('failure');
  batch.selectedResult={purity:0,issues:['持续过载，样品起泡失稳，整批无法交付。']};
  batch.damage=1;
  selected=null;
  announce(embedded?'交付取消。确认报废后，本批结果将写入工作记录。':'剧情预演：交付取消。古斯要求说明停机原因，沃尔特要求保留本批记录。');
  render();
 }
 return surge;
}
let previous=performance.now(),lastFrame=0,lastBatch=null,lastResult=null;
function updateClock(now){
 const dt=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;
 if(!active){requestAnimationFrame(updateClock);return;}
 const surge=reaction()&&!document.hidden&&simulate(dt);
 const running=reaction();
 const alert=running&&batch.load>=.78;
 const failureAge=batch.failedAt===null?Infinity:now-batch.failedAt;
 const failureBurst=clamp(1-failureAge/1350);
 window.benchAudio.track(running,batch.load,batch.low,alert);
 $('#tank-alert').hidden=!alert&&batch.failedAt===null;
 $('#tank-alert').textContent=batch.failedAt===null?'过载 · 立即降载':'保护停机';
 $('.viewer').classList.toggle('danger',alert);
 $('.viewer').classList.toggle('failed',batch.failedAt!==null);
 if(running){
  $('#load-control').classList.toggle('guide-action',alert&&!batch.low);
  $('#phase').textContent=batch.damage>.22?'颜色开始变暗':fineBubbles()&&!batch.stabilizer?'细泡成串 · 澄纹粒投放窗口':batch.progress>=.91&&batch.debris<.055?'液体清亮，悬浮物已基本沉降':'液体仍有悬浮物';
  $('#load').value=batch.load;
  $('#load-text').textContent='设备负载 '+Math.round(batch.load*100)+'%'+(alert?' · 波动警示':'');
  $('#load-text').classList.toggle('warning',alert);
 }
 const dosing=clamp(1-(now-batch.doseAt)/700);
 const ventAge=now-batch.ventAt,sampleAge=now-batch.sampleAt;
 if(now-lastFrame>=32&&(running||lastBatch!==batch||lastResult!==batch.selectedResult||now-batch.doseAt<760||failureAge<1450||ventAge<840||sampleAge<980)){
  lastFrame=now;lastBatch=batch;lastResult=batch.selectedResult;
  window.drawBatchReactor?.({
   filled:batch.base||Boolean(batch.activator),clarity:clamp(batch.progress-.55*batch.debris),
   damage:batch.damage,debris:batch.deposit,activity:running?clamp((batch.low?.14:.41)+batch.load*.38+Number(surge)*.26):0,
   alert,dosing,agitation:running?clamp((batch.load-.68)*3.2):0,failureBurst,
   vent:clamp(1-ventAge/760), sampling:clamp(sampleAge/900),
   sampled:batch.selectedResult!==null&&batch.failedAt===null
  },batch.time);
 }
 requestAnimationFrame(updateClock);
}
$('#tank-drop').onclick=()=>{if(selected)place(selected,'tank');else announce('可以直接把物料拖进罐体，也可以先点选物料。');};
function clearDrag(){
 drag?.ghost.remove();drag=null;
 document.querySelectorAll('.over').forEach(node=>node.classList.remove('over'));
}
$('#reset').onclick=()=>{clearDrag();batch=initial();selected=null;announce('把雾盐拖进罐体，建立基底。');render();};
if(typeof interact==='function'){
 interact('.item').draggable({listeners:{
  start(event){
   if(!available().includes(event.target.dataset.item))return;
   const ghost=event.target.cloneNode(true);ghost.classList.add('drag-ghost');ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;document.body.append(ghost);
   drag={id:event.target.dataset.item,ghost};suppressClick=true;
   moveGhost(event);
  },
  move:moveGhost,
  end(){
   if(drag)announce('物品已放回。拖到上方罐体即可投料。');
   clearDrag();setTimeout(()=>{suppressClick=false;},0);
  }
 }});
 interact('.slot').dropzone({
  accept:'.item',
  ondragenter:event=>event.target.classList.add('over'),
  ondragleave:event=>event.target.classList.remove('over'),
  ondrop(event){
   if(!drag)return;
   const id=drag.id,target=event.target.dataset.slot;
   clearDrag();place(id,target);
  }
 });
}
function moveGhost(event){
 if(!drag)return;
 drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
}
render();
requestAnimationFrame(updateClock);
