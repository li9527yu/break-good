'use strict';
window.benchAudio = (() => {
 const toggle = document.querySelector('#sound');
 const Audio = window.AudioContext || window.webkitAudioContext;
 let enabled = Boolean(Audio), context, master, noise, pump, alarmAt = 0;
 function updateToggle() {
  toggle.textContent = enabled ? '音效：开' : '音效：关';
  toggle.setAttribute('aria-pressed', String(enabled));
 }
 function unlock() {
  if (!enabled || !Audio) return;
  try {
   if (!context) {
    context = new Audio();
    master = context.createGain();
    master.gain.value = .52;
    master.connect(context.destination);
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const motor = context.createOscillator();
    motor.type = 'triangle';
    motor.frequency.value = 52;
    pump = context.createGain();
    pump.gain.value = 0;
    motor.connect(pump).connect(master);
    motor.start();
   }
   if (context.state === 'suspended') context.resume().catch(() => {});
  } catch {
   enabled = false;
   updateToggle();
  }
 }
 function envelope(source, output, at, length, peak) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + .009);
  gain.gain.exponentialRampToValueAtTime(.0001, at + length);
  output.connect(gain).connect(master);
  source.onended = () => { source.disconnect(); if (output !== source) output.disconnect(); gain.disconnect(); };
  source.start(at);
  source.stop(at + length + .01);
 }
 function tone(from, to, duration, level, offset = 0, type = 'sine') {
  const at = context.currentTime + offset;
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
  envelope(oscillator, oscillator, at, duration, level);
 }
 function hiss(frequency, duration, level) {
  const source = context.createBufferSource();
  source.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  source.connect(filter);
  envelope(source, filter, context.currentTime, duration, level);
 }
 function cue(id) {
  if (!enabled || document.hidden || context?.state !== 'running') return;
  switch (id) {
   case 'dose': hiss(1900,.16,.1); tone(230,95,.14,.15); break;
   case 'vent': hiss(1200,.54,.16); tone(180,87,.15,.07); break;
   case 'resume': tone(82,175,.23,.12,0,'triangle'); break;
   case 'sample': tone(450,630,.13,.13); tone(660,880,.2,.11,.11); break;
   case 'failure': hiss(590,.67,.25); tone(145,34,.62,.3,0,'triangle'); break;
   case 'alarm': tone(740,690,.15,.13,0,'triangle'); tone(960,910,.15,.12,.19,'triangle'); break;
  }
 }
 function track(running, load, low, alert) {
  if (context?.state !== 'running') return;
  const active = enabled && !document.hidden;
  pump.gain.setTargetAtTime(active && running ? (low ? .018 : .025 + load * .042) : 0, context.currentTime, .08);
  if (active && alert && context.currentTime >= alarmAt) {
   cue('alarm');
   alarmAt = context.currentTime + 1;
  }
  if (!alert) alarmAt = 0;
 }
 document.addEventListener('pointerdown', unlock, {passive:true});
 document.addEventListener('keydown', unlock);
 toggle.onclick = () => {
  enabled = !enabled;
  if (enabled) unlock();
  if (master) master.gain.setValueAtTime(enabled && !document.hidden ? .52 : 0, context.currentTime);
  updateToggle();
 };
 document.addEventListener('visibilitychange', () => {
  if (master) master.gain.setValueAtTime(enabled && !document.hidden ? .52 : 0, context.currentTime);
 });
 toggle.disabled = !Audio;
 updateToggle();
 return {cue,track};
})();
