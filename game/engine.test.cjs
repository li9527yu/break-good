'use strict';
const assert=require('node:assert/strict'),E=require('./engine.js'),S=require('./story.js');
function run(plan={},until='ending'){
 let s=E.initial(),events=[];
 const send=e=>{e.node=s.node;s=E.apply(s,e);events.push(e);};
 for(let count=0;s.node!==until&&!s.ending&&count<200;count++){
  const n=E.current(s);
  if(n.kind==='work'){
   if(s.day===3&&s.facts.d3Plan==='stop')send({type:'finish'});
   else if(n.reactor)send({type:'finish',reactor:plan['batch'+s.day]||{action:'deliver',purity:99,alarm:false}});
   else send({type:'finish',checklist:true});
  }else if(n.kind==='report')send({type:'report',cause:s.tasks[s.day].alarm?(plan['report'+s.day]||'operator'):'none',helper:plan['helper'+s.day]||'truth',followupRoll:s.day===3&&s.tasks[3].reactor?plan.roll:undefined});
  else{const chosen=plan[n.id]||E.available(s)[0].id;send({type:'choose',choice:chosen});}
 }
 return {s,events};
}
const paths={successor:{'d5-entry':'accept','d7-decision':'gus'},alliance:{'d1-walter':'learn','d3-phone':'stop','d4-question':'truth','d5-walter':'tell','d7-decision':'walter'},solidarity:{'d2-jesse':'cover',helper2:'omit','d3-phone':'help','d3-help':'own','d4-question':'truth','d6-entry':'own','d6-action':'help','d7-decision':'jesse'},departure:{'d5-jesse':'exit','d7-decision':'exit'},limbo:{'d7-decision':'stay'}};
for(const [ending,plan]of Object.entries(paths)){
 const {s,events}=run(plan);assert.equal(s.ending,ending);assert.equal(s.day,7);assert.deepEqual(E.unpack(E.pack(events)).state,s);
 // Every valid intermediate checkpoint must reload to the same deterministic state.
 for(let i=0;i<=events.length;i++)assert.deepEqual(E.unpack(E.pack(events.slice(0,i))).state,E.replay(events.slice(0,i)));
 const restart=E.replay(E.dayStart(events));assert.equal(restart.node,'d7-entry');
}
const honest=run({'d2-jesse':'cover',helper2:'truth'},'d3-entry').s;assert.equal(honest.promises.protectJesse,'broken');assert.equal(honest.tasks[2].helper,'jesse');
const concealed=run({'d2-jesse':'cover',helper2:'omit',report2:'equipment'},'d3-entry').s;assert.equal(concealed.promises.protectJesse,'kept');assert.equal(concealed.tasks[2].cause,'operator');assert.equal(concealed.reports[2].cause,'equipment');assert.equal(concealed.facts.reportContradictions,1);assert.ok(concealed.knowledge.walter.includes('d2-residue'));
const stop=run({'d3-phone':'stop'},'d4-entry').s;assert.equal(stop.tasks[3].done,false);assert.equal(stop.reports[3].completed,false);
const broken=run({'d3-phone':'help','d3-help':'own','d4-question':'partial'},'d5-entry').s;assert.equal(broken.promises.ownDecision,'broken');
const locked=run({'d5-entry':'refuse','d5-jesse':'overtime','d6-action':'help'},'d7-decision').s;assert.throws(()=>E.apply(locked,{node:locked.node,type:'choose',choice:'exit'}));assert.throws(()=>E.apply(locked,{node:locked.node,type:'choose',choice:'gus'}));
assert.throws(()=>E.unpack('{bad'));assert.throws(()=>E.unpack('{"version":2,"events":[]}'));assert.throws(()=>E.replay([{node:'d3-phone',type:'choose',choice:'solo'}]));
let s=run({},'d1-work').s;assert.throws(()=>E.apply(s,{node:s.node,type:'finish'}));s=E.apply(s,{node:s.node,type:'material',material:'amber'});assert.equal(s.tasks[1].alarm,true);assert.deepEqual(s.tasks[1].materials,[]);
for(const n of Object.values(S.nodes)){for(const c of n.choices)assert.ok(c.next==='ending'||S.nodes[c.next]);if(n.next)assert.ok(S.nodes[n.next]);}
assert.equal(S.hiddenEndings.length,0);
const stable={action:'deliver',purity:99,alarm:false};
const savedAfterAlarm={...stable,alarm:true};
for(const [batch3,roll,followup,expectedNode] of [
 [stable,.1,'audit','d4-audit'],
 [stable,.24,'warning','d4-warning'],
 [stable,.43,'routine','d4-entry'],
 [savedAfterAlarm,.43,'audit','d4-audit'],
 [{action:'scrap',purity:0,alarm:true},.6,'audit','d4-audit']
]){
 const plan={batch3,roll,'d7-decision':'stay'};
 const checkpoint=run(plan,expectedNode);
 assert.equal(checkpoint.s.node,expectedNode);
 assert.equal(checkpoint.s.facts.followup,followup);
 const finished=run(plan);
 const restored=E.unpack(E.pack(finished.events)).state;
 assert.equal(restored.facts.followup,followup);
 assert.equal(restored.ending,'limbo');
 assert.match(S.epilogue(restored),/最后一批/);
 if(batch3.action==='scrap')assert.equal(restored.promises.deliver,'broken');
}
console.log('PASS: 5 endings; all route checkpoints; evidence/report separation; promises; ending gates; day restart; malformed saves; work guardrails; graph links.');
