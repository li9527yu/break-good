import assert from 'node:assert/strict';
import {stations,links,findPath} from './layout.js';
for(const id of Object.keys(stations)){const path=findPath('center',id);assert.equal(path[0],'center');assert.equal(path.at(-1),id);assert.ok(stations[id].p.every(Number.isFinite));}
for(const [a,b]of links)if(stations[a].p[1]!==stations[b].p[1])assert.deepEqual([a,b],['stairFoot','stairTop']);
const up=findPath('center','door');assert.ok(up.indexOf('stairFoot')<up.indexOf('stairTop'));assert.equal(stations.door.p[1],3.2);assert.ok(findPath('report','gus').includes('eastBack'));
console.log('PASS: all 3D stations reachable, elevation changes restricted to staircase, records desk bypass route.');
