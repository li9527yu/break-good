'use strict';
const E=GameEngine,S=GameStory,$=q=>document.querySelector(q);
const KEY='underground-shift-v1',BACKUP=KEY+'-backup';
let events=[],state=E.initial(),persistent=true,restoreMessage='';
try{
 const saved=localStorage.getItem(KEY);
 if(saved){try{({events,state}=E.unpack(saved));restoreMessage='已恢复上次进度。';}catch(err){const backup=localStorage.getItem(BACKUP);if(backup){({events,state}=E.unpack(backup));restoreMessage='主存档损坏，已恢复上一份有效备份。';}else restoreMessage='存档无法读取，当前开启新进度；原记录尚未覆盖。';}}
}catch(err){persistent=false;restoreMessage='无法读取本地存档。请使用导出存档保留进度。';}
function el(tag,text,cls){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;}
function save(){try{const previous=localStorage.getItem(KEY);if(previous){try{E.unpack(previous);localStorage.setItem(BACKUP,previous);}catch{ /* Keep a valid backup when the main slot was corrupt. */ }}localStorage.setItem(KEY,E.pack(events));persistent=true;$('#save-status').textContent='已自动保存 · 本地浏览器';}catch{persistent=false;$('#save-status').textContent='本地保存不可用，请在菜单中导出存档。';}}
function dispatch(action){try{const event={...action,node:state.node};if(window.Scene&&!Scene.active)throw Error('请先走到对应地点打开界面');const previous=state;const next=E.apply(state,event);events.push(event);state=next;save();render();window.Scene?.changed(previous,next);}catch(err){$('#feedback').textContent=err.message;}}
function showDialog(id){$('#'+id).showModal();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$('#menu-open').onclick=()=>showDialog('menu');
$('#notes-open').onclick=()=>{const list=$('#note-list');list.replaceChildren();if(!state.notes.length)list.append(el('p','尚未记录新的事实。'));for(const n of state.notes)list.append(el('p',`阶段 ${n.day} · ${stageText(n.text)}`));showDialog('notes');};
$('#font').onchange=e=>document.body.classList.toggle('large',e.target.value==='large');
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([E.pack(events)],{type:'application/json'}));const a=el('a');a.href=url;a.download=`地下班次-第${state.day}天.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#menu-feedback').textContent='已生成存档下载。可通过导入恢复。';};
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>300000)throw Error('文件过大');const loaded=E.unpack(await file.text());if(!confirm('导入将替换当前进度。继续吗？'))return;events=loaded.events;state=loaded.state;setReactorStage(null);save();render();window.Scene?.reset();$('#menu').close();}catch(err){$('#menu-feedback').textContent='导入失败：'+err.message;}finally{e.target.value='';}};
$('#restart-day').onclick=()=>{if(!confirm('回到本章开始时？本章的选择将被重置。'))return;events=E.dayStart(events);state=E.replay(events);setReactorStage(null);save();render();window.Scene?.reset();$('#menu').close();};
$('#new-game').onclick=()=>{if(!confirm('重新开始故事？建议先导出当前存档。'))return;events=[];state=E.initial();setReactorStage(null);save();render();window.Scene?.reset();$('#menu').close();};
function button(text,fn,cls='choice'){const b=el('button',text,cls);b.onclick=fn;return b;}
function renderReport(box){
 const t=state.tasks[state.day],card=el('div',undefined,'task-card');
 card.append(el('p','任务：'+(t.reactor?t.quality:t.done?'已完成':'已停工')),el('p','设备：'+(t.alarm?'曾出现告警':'未出现告警')),el('p','实际协助者：'+(t.helper?'杰西':'无')),el('p','耗时：'+t.duration));box.append(card);
 if(t.lab?.result){const r=t.lab.result;card.append(el('p',`留样：${r.status} · 品控 ${r.quality}/100 · 产出 ${r.output} · ${r.time} 步 · 跳闸 ${r.trips} 次`));}
 if(t.reactor){const r=t.reactor;card.append(el('p',r.action==='scrap'?'反应罐保护停机，整批报废。':`留样纯度 ${r.purity.toFixed(1)}% · ${t.quality}`));}
 const fields=el('div',undefined,'report-fields');
 function select(label,choices,id){const l=el('label',label),s=el('select');s.id=id;for(const [value,text]of choices){const o=el('option',text);o.value=value;s.append(o);}l.append(s);fields.append(l);return s;}
 const cause=select('报告中的异常原因',t.alarm?[['operator','操作失误'],['equipment','设备故障'],['unknown','原因未明']]:[['none','无异常']],'report-cause');
 const helper=select('是否记录协助者',[['truth','如实记录'],['omit','不写入记录']],'report-helper');
 box.append(fields,button('确认提交报告',()=>{
  const event={type:'report',cause:cause.value,helper:helper.value};
  if(state.day===3&&t.reactor)event.followupRoll=Math.random();
  dispatch(event);
 }));
}
function stageText(text){return text.replace(/结束第[一二三四五六七]天。/g,'结束这段工作。').replace(/进入第七天。/g,'进入最后一段故事。').replace(/第七天/g,'最后一次到场').replace(/第[一二三四五六]天/g,'那次工作').replace(/第[一二三四五六七]晚/g,'那一晚').replace(/昨天|昨日/g,'上次').replace(/明天/g,'下一次到场').replace(/这一周|本周/g,'这段时间').replace(/你还剩两天/g,'你还剩一点时间').replace(/第(\d)天/g,'阶段 $1');}
function render(){

 $('#feedback').textContent='';$('#day').textContent=`第 ${state.day} 天 / ${S.days[state.day-1]}`;
 const box=$('#interaction');box.replaceChildren();
 const n=E.current(state),speaker=n?.speaker||'self';
 const stop=state.day===3&&state.facts.d3Plan==='stop';
 const useReactor=n?.reactor&&!stop;
 setReactorStage(useReactor?n.id:null);
 const portrait=$('#portrait');portrait.src=['gus','walter','jesse'].includes(speaker)?`assets/portraits-v2/${speaker}-painted.png`:'assets/report.svg';portrait.alt=['gus','walter','jesse'].includes(speaker)?S.names[speaker]+'头像':'个人工作记录板';
 $('#portrait-name').textContent=S.names[speaker];$('#channel').textContent=speaker==='gus'?'联络 / 安排':speaker==='self'?'自己的决定':speaker==='scene'?'场景观察':'当面交谈';
 if(state.ending){
  const end=S.endings[state.ending];$('#type').textContent='本轮故事结束';$('#title').textContent=end.title;$('#text').textContent=stageText(end.body);
  if(state.facts.followup)box.append(el('p',S.epilogue(state),'task-card'));
  const summary=el('div',undefined,'end-summary');summary.append(el('p',end.cost),el('h3','你留下的几项决定'));
  const list=el('ul');state.history.filter(h=>['d2-jesse','d3-phone','d4-question','d5-entry','d6-action','d7-decision'].includes(h.node)).forEach(h=>list.append(el('li',`阶段 ${h.day}：${stageText(h.label)}`)));summary.append(list);box.append(summary,button('查看笔记与已知事实',()=>$('#notes-open').click()),button('导出本轮存档',()=>$('#export').click()));
 }else{
  $('#type').textContent=n.kind==='work'?'工作台 / 可操作':n.kind==='report'?'记录板 / 实际经过与书面报告分别保存':n.kind==='decision'?'最终决定':'剧情对话';$('#title').textContent=n.title;$('#text').textContent=stageText(E.text(state));
  if(n.kind==='work'){
   if(stop){
    box.append(el('p','本次已决定停工。盖好容器并保留现场。'),
     button('确认设备停用，返回场景',()=>dispatch({type:'finish'})));
   }
   else if(!useReactor)box.append(button(S.checklistLabels[state.day],()=>dispatch({type:'finish',checklist:true})));
  }else if(n.kind==='report')renderReport(box);else n.choices.forEach(c=>{const b=button(stageText(c.label),()=>dispatch({type:'choose',choice:c.id}));if(c.when&&!c.when(state)){b.disabled=true;b.append(el('small',S.endingReasons[c.id]||'尚未满足条件'));}box.append(b);});
 }
 if(!persistent)$('#save-status').textContent='本地保存不可用，请导出存档。';
 window.Scene?.refresh(state);if(document.querySelector('#event-layer').open)$('#title').focus({preventScroll:true});
}
render();$('#save-status').textContent=restoreMessage||'新进度 · 行动后自动保存';
