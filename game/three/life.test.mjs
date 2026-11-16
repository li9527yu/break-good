import assert from 'node:assert/strict';
import {createCharacter} from './characters.js';
import {createLife} from './life.js';
const chars=Object.fromEntries(['walter','jesse','guard'].map(id=>[id,createCharacter(id)]));
const life=createLife(chars),start=life.snapshot();const modes=new Set();
for(let i=0;i<4000;i++){life.update(.05,false,false);for(const a of Object.values(life.snapshot())){modes.add(a.mode);assert.ok(a.position.every(Number.isFinite));assert.ok(a.position[1]>=0&&a.position[1]<=3.2);}}
assert.ok(modes.has('walk'));assert.ok(modes.has('work'));assert.ok(modes.has('write'));assert.ok(modes.has('inspect'));
life.hold('walter');const hold=chars.walter.group.position.toArray();for(let i=0;i<100;i++)life.update(.05,false,false);assert.deepEqual(chars.walter.group.position.toArray(),hold);
const before=life.snapshot();life.update(.05,true,false);assert.deepEqual(life.snapshot(),before);
life.release();life.reset();assert.equal(life.snapshot().walter.location,'walter');assert.equal(life.snapshot().guard.location,'stairTop');
chars.walter.pose('write',1);assert.ok(chars.walter.arms[0].rotation.x<0);chars.walter.pose('idle');assert.equal(chars.walter.arms[0].rotation.x,0);
console.log('PASS: NPC walking/work/writing/inspection, finite positions, floor bounds, conversation hold, modal pause, reset, articulated poses.');
