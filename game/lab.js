(function (root) {
 'use strict';
 const profiles = [
  {name:'基准批', strain:0, bias:0, window:[46,64], goal:38},
  {name:'受扰批', strain:4, bias:13, window:[46,62], goal:40},
  {name:'赶交付', strain:8, bias:0, window:[48,64], goal:48},
  {name:'窄窗复核', strain:5, bias:-9, window:[49,59], goal:40},
  {name:'增量批', strain:10, bias:0, window:[46,65], goal:51},
  {name:'设备复测', strain:12, bias:10, window:[46,62], goal:42},
  {name:'交接批', strain:6, bias:0, window:[48,63], goal:45}
 ];
 const profilesFor = day => profiles[day - 1];
 const clamp = (x, max = 100) => Math.max(0, Math.min(max, x));
 const round = Math.round;
 function initial() {
  return {signal:39, load:16, reserve:100, output:0, defects:0, ticks:0, time:0,
   zeroed:false, sample:null, log:[], pulse:55, loop:45, bypass:0, trips:0};
 }
 function indicated(lab, day) {
  return clamp(lab.signal + (lab.zeroed ? 0 : profilesFor(day).bias));
 }
 function advance(lab, day, action, fields = {}) {
  const p = profilesFor(day);
  if (lab.result) throw Error('这批样品已经封存');
  if (action === 'zero') {
   if (lab.zeroed || lab.reserve < 8) throw Error('无法执行零点检查');
   return {...lab, zeroed:true, time:lab.time + 1, reserve:lab.reserve - 8};
  }
  if (action === 'sample') {
   if (!lab.ticks || lab.sample?.tick === lab.ticks || lab.reserve < 6) throw Error('目前无法取样');
   return {...lab, reserve:lab.reserve - 6, time:lab.time + 1,
    sample:{tick:lab.ticks, signal:lab.signal, defects:lab.defects}};
  }
  if (action === 'seal' || action === 'isolate') {
   if (action === 'seal' && lab.output < p.goal) throw Error('还未收集到交付量');
   if (action === 'isolate' && lab.ticks < 2) throw Error('尚未完成两个脉冲');
   const quality = clamp(round(100 - lab.defects * 2.4 - lab.trips * 9));
   return {...lab, result:{quality, output:lab.output, time:lab.time, trips:lab.trips,
    status:action === 'isolate' ? '隔离' : quality >= 84 ? '合格' : quality >= 60 ? '降级' : '拒收'}};
  }
  if (action !== 'pulse') throw Error('未知工作台操作');
  for (const k of ['pulse','loop','bypass']) {
   if (!Number.isInteger(fields[k]) || fields[k] < 0 || fields[k] > 100) throw Error('仪表刻度无效');
  }
  if (lab.reserve < 5 || lab.ticks >= 12) throw Error('工作台余量已用尽，请封存或隔离');
  const {pulse, loop, bypass} = fields;
  const signal = clamp(round(lab.signal * .45 + (19 + pulse * .76 - loop * .12 - bypass * .14) * .55));
  const load = clamp(round(lab.load * .5 + (pulse * .61 + loop * .25 + p.strain - bypass * .72) * .5));
  const excursion = Math.max(0, p.window[0] - signal, signal - p.window[1]);
  const tripped = load >= 63;
  const yieldAmount = tripped ? 0 : Math.max(0, round(4 + pulse * .14 - bypass * .08 - excursion * .45));
  const defects = lab.defects + (tripped ? 7 : Math.max(0, round(excursion * .65 + Math.max(0, load - 47) * .3 + Math.max(0, 38 - loop) * .18)));
  const next = {...lab, pulse, loop, bypass, signal, load, defects,
   reserve:clamp(lab.reserve - 5 - round(loop / 25) - round(bypass / 28)), output:lab.output + yieldAmount,
   ticks:lab.ticks + 1, time:lab.time + 1, trips:lab.trips + Number(tripped)};
  next.log = [...lab.log, {signal:indicated(next, day), load, yieldAmount, tripped}];
  return next;
 }
 const api = {initial, profilesFor, indicated, advance};
 if (typeof module !== 'undefined') module.exports = api;
 else root.LabModel = api;
})(globalThis);
