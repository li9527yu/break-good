import * as T from 'three';
// Articulated, code-native character meshes. +Z is the face direction.
export function createCharacter(id){
 const palettes={walter:{skin:0xcba883,cloth:0xc5af48,hair:0x51433a},jesse:{skin:0xc9a17b,cloth:0x8d4938,hair:0x49382c},gus:{skin:0x92704e,cloth:0xc9be91,hair:0x242820},player:{skin:0xc4a17d,cloth:0x518b8a,hair:0x33352d},guard:{skin:0xb18b67,cloth:0x303637,hair:0x383b35}};
 const p=palettes[id],group=new T.Group();group.userData.station=id;
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:.72});
 const skin=material(p.skin),cloth=material(p.cloth),hair=material(p.hair),dark=material(0x252d2b),eye=material(0x20251f),white=material(0xcbd0bc),metal=new T.MeshStandardMaterial({color:0x5a625c,metalness:.65,roughness:.35});
 function mesh(geo,mat,pos,parent=group,scale){const m=new T.Mesh(geo,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const ell=(r,mat,pos,scale,parent)=>mesh(new T.SphereGeometry(r,24,16),mat,pos,parent,scale);
 const box=(size,mat,pos,parent)=>mesh(new T.BoxGeometry(...size),mat,pos,parent);
 const tube=(a,b,r,mat,parent)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(new T.CylinderGeometry(r,r,d.length(),8),mat,av.add(bv).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
 const body=new T.Group();group.add(body);const broad=id==='guard'?1.16:id==='jesse'?1.02:1;
 ell(.28,cloth,[0,1.12,0],[broad,1.28,.64],body);ell(.24,id==='walter'?cloth:dark,[0,.83,0],[1.04,.7,.65],body);
 const zipper=box([.018,.52,.012],id==='walter'?metal:dark,[0,1.13,.183],body);
 // Neck, elongated cranial silhouette, cheek and jaw planes.
 mesh(new T.CylinderGeometry(.078,.09,.16,14),skin,[0,1.48,0],body);
 const head=new T.Group();head.position.set(0,1.68,0);body.add(head);
 ell(.185,skin,[0,.02,0],[.83,1.2,.88],head);ell(.13,skin,[0,-.105,.035],[.95,.67,.82],head);
 ell(.055,skin,[-.153,-.025,0],[.42,1,.62],head);ell(.055,skin,[.153,-.025,0],[.42,1,.62],head);
 ell(.055,skin,[0,-.035,.153],[.43,.85,.9],head);ell(.042,skin,[0,-.067,.185],[.65,.4,.55],head);
 for(const x of [-.068,.068]){ell(.033,white,[x,.015,.143],[1,.44,.2],head);ell(.016,id==='jesse'?material(0x536c71):eye,[x,.015,.151],[.75,.82,.3],head);tube([x-.032,.057,.145],[x+.03,.052,.15],.009,hair,head);}
 tube([-.044,-.113,.143],[.042,-.113,.143],.006,material(0x79604c),head);
 if(id==='walter'){
  // Walter: bald scalp, characteristic wire glasses, separate moustache and goatee.
  ell(.074,hair,[0,-.15,.112],[.72,.55,.32],head);tube([-.061,-.088,.157],[-.012,-.084,.174],.012,hair,head);tube([.012,-.084,.174],[.061,-.088,.157],.012,hair,head);
  for(const x of [-.054,.054])tube([x,-.09,.15],[x*.78,-.16,.135],.011,hair,head);
  // Hood folded behind shoulders, protective suit seams and pockets.
  ell(.18,cloth,[0,1.37,-.13],[1.15,.58,.65],body);for(const x of [-.13,.13])box([.13,.12,.017],material(0xb09b39),[x,1.14,.177],body);
 }else if(id==='jesse'){
  mesh(new T.SphereGeometry(.19,24,16,0,Math.PI*2,0,Math.PI*.49),hair,[0,.025,0],head,[.85,1.19,.9]);
  ell(.12,material(0x8e745c),[0,-.128,.093],[.86,.44,.42],head);
  ell(.22,cloth,[0,1.35,-.12],[1.17,.65,.78],body);for(const x of [-.065,.065])tube([x,1.39,.177],[x,1.15,.2],.008,material(0xc7b593),body);
  box([.25,.11,.025],material(0x723d31),[0,.97,.19],body);
 }else{
  mesh(new T.SphereGeometry(.19,20,12,0,Math.PI*2,0,Math.PI*.48),hair,[0,.025,0],head,[.85,1.19,.9]);
  if(id==='gus'){box([.045,.4,.014],dark,[0,1.18,.19],body);}
  if(id==='guard'){box([.12,.18,.07],dark,[.18,1.2,.18],body);tube([.18,1.2,.18],[.18,1.4,.18],.008,metal,body);ell(.018,dark,[.156,0,0],[1,1,1],head);}
 }
 if(id==='walter'||id==='gus'){
  for(const x of [-.071,.071]){const points=[[-.051,-.025],[.051,-.025],[.051,.03],[-.051,.03],[-.051,-.025]];for(let i=1;i<points.length;i++)tube([x+points[i-1][0],points[i-1][1]+.013,.169],[x+points[i][0],points[i][1]+.013,.169],.0045,metal,head);}
  tube([-.02,.02,.17],[.02,.02,.17],.004,metal,head);for(const x of [-.125,.125])tube([x,.038,.17],[x*1.18,.028,-.02],.004,metal,head);
 }
 const legs=[],arms=[],forearms=[];
 for(const side of [-1,1]){
  const hip=new T.Group();hip.position.set(side*.115,.82,0);body.add(hip);legs.push(hip);
  const legMat=id==='walter'?cloth:dark;mesh(new T.CapsuleGeometry(.085,.25,5,12),legMat,[0,-.22,0],hip);mesh(new T.CapsuleGeometry(.072,.25,5,12),legMat,[0,-.56,0],hip);ell(.1,dark,[0,-.75,.055],[.9,.53,1.5],hip);
  const shoulder=new T.Group();shoulder.position.set(side*.25,1.35,0);body.add(shoulder);arms.push(shoulder);mesh(new T.CapsuleGeometry(.075,.2,5,12),cloth,[side*.018,-.14,0],shoulder);
  const elbow=new T.Group();elbow.position.set(side*.018,-.3,0);shoulder.add(elbow);forearms.push(elbow);mesh(new T.CapsuleGeometry(.06,.17,5,12),cloth,[0,-.12,0],elbow);ell(.067,id==='walter'?material(0x8da8b2):skin,[0,-.27,.008],[.75,1,.6],elbow);
 }
 const clipboard=box([.24,.025,.32],material(0xc4b386),[0,-.22,.04],forearms[0]);clipboard.visible=false;
 const pen=mesh(new T.CylinderGeometry(.008,.008,.16,6),dark,[0,-.24,.05],forearms[1]);pen.rotation.x=.7;pen.visible=false;
 group.scale.setScalar(id==='guard'?1.04:1);
 function pose(mode,time=0){legs.forEach(l=>l.rotation.set(0,0,0));arms.forEach((a,i)=>a.rotation.set(0,0,i?-.06:.06));forearms.forEach(a=>a.rotation.set(-.1,0,0));head.rotation.set(0,0,0);body.rotation.x=0;body.position.y=0;clipboard.visible=pen.visible=false;
  if(mode==='walk'){legs.forEach((l,i)=>l.rotation.x=Math.sin(time*7+i*Math.PI)*.34);arms.forEach((a,i)=>a.rotation.x=-Math.sin(time*7+i*Math.PI)*.25);body.position.y=Math.abs(Math.sin(time*7))*.013;}
  else if(mode==='write'){body.rotation.x=.06;arms[0].rotation.x=-.8;forearms[0].rotation.x=-.6;arms[1].rotation.x=-.7;forearms[1].rotation.x=-.8+Math.sin(time*5)*.08;forearms[1].rotation.z=Math.sin(time*4)*.08;head.rotation.x=.2;clipboard.visible=pen.visible=true;}
  else if(mode==='work'){body.rotation.x=.08;arms.forEach((a,i)=>a.rotation.x=-.65+Math.sin(time*2+i)*.1);forearms.forEach((a,i)=>a.rotation.x=-.6+Math.sin(time*3+i)*.12);head.rotation.x=.14;}
  else if(mode==='inspect'){head.rotation.y=Math.sin(time*.8)*.4;arms[1].rotation.x=-.55;forearms[1].rotation.x=-1.2;}
  else head.rotation.y=Math.sin(time*.5)*.07;
 }
 return {group,body,head,legs,arms,pose};
}
