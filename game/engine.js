(function(root){
'use strict';
const story=typeof module!=='undefined'?require('./story.js'):root.GameStory;
const labModel=typeof module!=='undefined'?require('./lab.js'):root.LabModel;
const VERSION=1, MAX_EVENTS=500;
function initial(){return {version:VERSION,node:'d1-entry',day:1,facts:{reportContradictions:0},knowledge:{walter:[],gus:[],jesse:[]},relations:{walter:0,gus:0,jesse:0},promises:{},tasks:{},reports:{},notes:[],history:[],ending:null};}
function current(s){return story.nodes[s.node];}
function task(s){return s.tasks[s.day]||(s.tasks[s.day]={materials:[],dial:50,attempts:0,done:false,alarm:s.day===2,helper:s.day===2?'jesse':s.day===3&&s.facts.d3Plan==='help'?'jesse':null});}
function required(s){return s.day%2?['mist','amber']:['amber','mist'];}
function target(s){return 35+s.day*5;}
function note(s,text){if(text&&!s.notes.some(n=>n.text===text))s.notes.push({day:s.day,text});}
function know(s,who,key){if(!s.knowledge[who].includes(key))s.knowledge[who].push(key);}
function effects(s,e){
 Object.assign(s.facts,e.facts||{});Object.assign(s.promises,e.promises||{});
 for(const [who,v] of Object.entries(e.relations||{}))s.relations[who]=Math.max(-10,Math.min(10,s.relations[who]+v));
 for(const [who,items] of Object.entries(e.knowledge||{}))for(const item of items)know(s,who,item);
 note(s,e.note);
 if(e.resolveExplanation){
  know(s,'walter','d3-'+s.facts.d3Plan);
  if(s.facts.d4Answer==='truth'){know(s,'walter','gus-called');if(s.promises.ownDecision==='open')s.promises.ownDecision='kept';}
  else if(s.promises.ownDecision==='open'){s.promises.ownDecision='broken';s.relations.jesse-=2;}
  if(s.facts.d4Answer==='deny'&&s.facts.d3Plan!=='stop'){s.facts.caughtDenying=true;note(s,'沃尔特用设备记录指出了我的否认与事实矛盾。');}
 }
 if(e.ending){
  s.ending=e.ending;
  if(s.promises.standWithJesse==='open')s.promises.standWithJesse=e.ending==='solidarity'?'kept':'broken';
  if(s.promises.informWalter==='open')s.promises.informWalter='broken';
 }
}
function move(s,id){if(id==='ending'){s.node=id;return;}if(!story.nodes[id])throw Error('未知剧情节点');s.node=id;s.day=story.nodes[id].day;}
function available(s){return (current(s)?.choices||[]).filter(c=>!c.when||c.when(s));}
function resolveFollowup(s, roll) {
 const batch=s.tasks[3].reactor;
 const contradicted=s.tasks[3].alarm&&s.reports[3].cause!==s.tasks[3].cause;
 const risky=batch.alarm||contradicted||s.tasks[3].quality!=='签收';
 const audit=s.tasks[3].quality==='报废' ? .62 : risky ? .48 : .12;
 const warning=s.relations.jesse>=2?.33:.17;
 const route=roll<audit?'audit':roll<audit+warning?'warning':'routine';
 s.facts.followup=route;
 return route;
}
function apply(before,event){
 if(!event||typeof event!=='object'||Array.isArray(event))throw Error('行动格式错误');
 if(before.ending)throw Error('故事已经结束');
 const s=JSON.parse(JSON.stringify(before)),n=current(s);
 if(event.node!==s.node)throw Error('行动不属于当前剧情');
 switch(event.type){
 case 'choose':{
  const option=available(s).find(c=>c.id===event.choice);if(!option)throw Error('选项尚未解锁');
  effects(s,option.effects);s.history.push({day:s.day,node:n.id,label:option.label});
  const followup=n.id==='d3-end'?{audit:'d4-audit',warning:'d4-warning'}[s.facts.followup]:null;
  move(s,followup||option.next);break;
 }
 case 'material':{
  if(n.kind!=='work'||!['mist','amber'].includes(event.material)||s.day===3&&s.facts.d3Plan==='stop')throw Error('不能添加材料');
  const t=task(s);if(t.materials.length>=2)throw Error('材料已完成');
  if(event.material!==required(s)[t.materials.length]){t.attempts++;t.alarm=true;}else t.materials.push(event.material);
  break;
 }
 case 'tune':{
  if(n.kind!=='work'||!Number.isInteger(event.value)||event.value<0||event.value>100)throw Error('刻度无效');
  const t=task(s);if(t.materials.length!==2||t.lab)throw Error('先放置材料或使用工作台仪表');t.dial=event.value;t.inspected=false;break;
 }
 case 'lab':{
  if(n.kind!=='work'||(s.day===3&&s.facts.d3Plan==='stop'))throw Error('工作台未启用');
  const t=task(s);
  if(t.materials.length!==2)throw Error('先放置材料');
  t.lab=labModel.advance(t.lab||labModel.initial(),s.day,event.action,event);
  if(t.lab.trips)t.alarm=true;
  break;
 }
 case 'inspect':{
  if(n.kind!=='work'||event.result!=='steady')throw Error('无效观察');
  const t=task(s);if(t.materials.length!==2||Math.abs(t.dial-target(s))>5)throw Error('请先完成校准');t.inspected=true;break;
 }
 case 'finish':{
  if(n.kind!=='work')throw Error('此时没有工作任务');
  const t=task(s),stop=s.day===3&&s.facts.d3Plan==='stop';
  const reactor=event.reactor;
  if(reactor!==undefined){
   if(stop||!reactor||!['deliver','isolate','scrap'].includes(reactor.action)||
    !Number.isFinite(reactor.purity)||reactor.purity<0||reactor.purity>100||typeof reactor.alarm!=='boolean'||
    (reactor.action==='scrap'&&(reactor.purity!==0||!reactor.alarm)))throw Error('反应罐结果无效');
   t.reactor={action:reactor.action,purity:reactor.purity,alarm:reactor.alarm};
   t.alarm=t.alarm||reactor.alarm;
  }else if(event.checklist===true){
   if(n.reactor||stop)throw Error('本阶段需要完成对应的工作台操作');
  }else if(!stop&&(t.lab?!t.lab.result:t.materials.length!==2||Math.abs(t.dial-target(s))>5))throw Error('批次尚未处理完毕');
  const result=t.lab?.result;
  t.done=!stop;t.stopped=stop;t.operator=stop?null:'player';t.quality=result?.status||(stop?'未完成':t.attempts?'复核后通过':'稳定');
  if(reactor)t.quality=reactor.action==='scrap'?'报废':reactor.action==='isolate'?'隔离':reactor.purity>=98?'签收':reactor.purity>=94?'待复检':'拒收';
  if(event.checklist===true)t.quality='已复核';
  t.cause=t.alarm?'operator':'none';t.duration=s.day===2?'延后完成':'正常班次';
  s.facts['d'+s.day+'Completed']=t.done;
  if(s.day===3&&s.promises.deliver==='open'){s.promises.deliver=stop?'broken':'kept';s.facts.unfulfilledDelivery=stop;}
  if(s.day===3&&((result&&['隔离','拒收'].includes(result.status))||(reactor&&t.quality!=='签收'))){
   s.facts.unfulfilledDelivery=true;
   if(s.promises.deliver==='kept')s.promises.deliver='broken';
  }
  if(s.day===3&&s.promises.deliver==='broken')s.facts.unfulfilledDelivery=true;
  note(s,`第${s.day}天：${stop?'按要求停工':t.helper?'与杰西共同完成操作':'完成了操作'}${t.alarm?'，曾出现告警':''}。`);
  if(result)note(s,`批次结果：${result.status}，品控 ${result.quality}，产出 ${result.output}，操作步数 ${result.time}，跳闸 ${result.trips}。`);
  if(reactor)note(s,`第${s.day}天批次：${t.quality}${reactor.action==='scrap'?'':'，留样纯度 '+reactor.purity.toFixed(1)+'%'}。`);
  if(s.day===4)know(s,'walter','d4-work-result');
  s.history.push({day:s.day,node:n.id,label:stop?'保留现场并停工':'完成校准'});move(s,n.next);break;
 }
 case 'report':{
  if(n.kind!=='report'||!['operator','equipment','unknown','none'].includes(event.cause)||!['truth','omit'].includes(event.helper))throw Error('报告字段错误');
  const t=s.tasks[s.day];if(!t||(!t.done&&!t.stopped))throw Error('没有实际工作结果');
  if(t.alarm&&event.cause==='none')throw Error('告警不能填写为无异常');
  if(!t.alarm&&event.cause!=='none')throw Error('当天未发生异常');
  s.reports[s.day]={completed:t.done,alarm:t.alarm,cause:event.cause,helper:event.helper==='truth'?t.helper:'omit'};
  if(t.lab?.result)s.reports[s.day].batch={...t.lab.result};
  if(t.reactor)s.reports[s.day].batch={...t.reactor,status:t.quality};
  know(s,'gus','report-day-'+s.day);
  if(t.helper&&event.helper==='truth')know(s,'gus','helper-day-'+s.day+'-'+t.helper);
  if(t.alarm&&event.cause!==t.cause){s.facts.reportContradictions++;note(s,`第${s.day}天的异常原因报告与我看到的操作经过不一致。`);}
  if(s.day===2&&s.promises.protectJesse==='open'){
   const kept=event.helper==='omit';s.promises.protectJesse=kept?'kept':'broken';if(!kept)s.relations.jesse-=2;
  }
  if(event.followupRoll!==undefined){
   if(s.day!==3||!t.reactor||!Number.isFinite(event.followupRoll)||event.followupRoll<0||event.followupRoll>=1)throw Error('剧情抽签无效');
   resolveFollowup(s,event.followupRoll);
  }
  s.history.push({day:s.day,node:n.id,label:'提交报告：'+event.cause+' / '+event.helper});move(s,n.next);break;
 }
 default:throw Error('未知行动');
 }
 return s;
}
function replay(events){if(!Array.isArray(events)||events.length>MAX_EVENTS)throw Error('行动记录损坏或过长');return events.reduce(apply,initial());}
function pack(events){replay(events);return JSON.stringify({version:VERSION,events});}
function unpack(text){if(typeof text!=='string'||text.length>300000)throw Error('存档大小无效');const data=JSON.parse(text);if(data.version!==VERSION)throw Error('不兼容的存档版本');const state=replay(data.events);return {events:data.events,state};}
function dayStart(events){let s=initial(),offset=0;events.forEach((e,i)=>{const next=apply(s,e);if(next.day!==s.day)offset=i+1;s=next;});return events.slice(0,offset);}
function text(s){const n=current(s);return typeof n.text==='function'?n.text(s):n.text;}
const api={VERSION,initial,current,apply,replay,pack,unpack,dayStart,available,required,target,text};
if(typeof module!=='undefined')module.exports=api;else root.GameEngine=api;
})(globalThis);
