import * as T from 'three';
import {stations,findPath} from './layout.js';
export function createLife(characters){
 const plans={walter:[['walter','work',7],['bench','work',8],['report','write',7],['tank','inspect',5]],jesse:[['jesse','inspect',4],['shelf','work',6],['sink','work',5],['cart','work',5]],guard:[['stairTop','inspect',5],['door','inspect',5],['stairFoot','inspect',4],['right','inspect',4],['left','inspect',4]]};
 const initial={walter:'walter',jesse:'jesse',guard:'stairTop'},agents={};let locked=null,clock=0;
 for(const id of Object.keys(plans)){const location=initial[id];characters[id].group.position.set(...stations[location].p);agents[id]={location,from:location,to:null,path:[],wait:2+Math.random()*3,step:0,mode:'idle'};}
 function nearest(id){const p=characters[id].group.position;const a=agents[id];if(!a.to)return a.location;return p.distanceTo(new T.Vector3(...stations[a.from].p))<p.distanceTo(new T.Vector3(...stations[a.to].p))?a.from:a.to;}
 function update(dt,paused,playerMoving){clock+=dt;if(paused)return false;let changed=false;
  for(const[id,a]of Object.entries(agents)){const char=characters[id];if(!char.group.visible||locked===id)continue;
   if(a.to){const target=new T.Vector3(...stations[a.to].p),delta=target.clone().sub(char.group.position),distance=delta.length();const speed=id==='guard'?.8:id==='walter'?.65:.9;
    if(distance<dt*speed+.001){char.group.position.copy(target);a.location=a.to;a.from=a.to;a.to=a.path.shift()||null;if(!a.to){const job=plans[id][a.step];a.mode=job[1];a.wait=job[2];const facing={walter:[-2.6,1.8],bench:[-2.6,1.8],report:[5.5,.6],tank:[.7,-3],shelf:[-8,-.7],sink:[-8,2.5],cart:[1.7,5],jesse:[4.8,-2.9]}[a.location];if(facing)char.group.lookAt(facing[0],char.group.position.y,facing[1]);}}
    else{char.group.rotation.y=Math.atan2(delta.x,delta.z);char.group.position.addScaledVector(delta.normalize(),dt*speed);a.mode='walk';}
   }else{a.wait-=dt;if(a.wait<=0){a.step=id==='guard'?Math.floor(Math.random()*plans.guard.length):(a.step+1)%plans[id].length;const goal=plans[id][a.step][0];a.path=findPath(a.location,goal).slice(1);a.from=a.location;a.to=a.path.shift()||null;if(!a.to)a.wait=3;}}
   char.pose(a.mode,clock);changed=true;
  }
  return changed;
 }
 function hold(id){locked=agents[id]?id:null;if(locked)characters[id].pose('idle',clock);}
 function release(){locked=null;}
 function reset(){release();for(const[id,a]of Object.entries(agents)){Object.assign(a,{location:initial[id],from:initial[id],to:null,path:[],wait:3,step:0,mode:'idle'});characters[id].group.position.set(...stations[initial[id]].p);characters[id].pose('idle');}}
 return {update,hold,release,reset,nearest,has:id=>Boolean(agents[id]),snapshot:()=>Object.fromEntries(Object.entries(agents).map(([id,a])=>[id,{mode:a.mode,position:characters[id].group.position.toArray(),location:a.location,to:a.to,held:id===locked}]))};
}
