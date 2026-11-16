import * as T from 'three';

function createViewer(canvas) {
 const renderer = new T.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.toneMapping = T.ACESFilmicToneMapping;
 const scene = new T.Scene();
 scene.background = new T.Color('#172420');
 const camera = new T.OrthographicCamera(-4,4,2,-2,.1,50);
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 camera.position.set(5,4,8);camera.lookAt(0,1.4,0);
 scene.add(new T.HemisphereLight('#e2f7e8','#6b5443',2.1));
 const key = new T.DirectionalLight('#ffdbad',3);
 key.position.set(-3,5,2);scene.add(key);
 const rim = new T.DirectionalLight('#8accc6',1.6);
 rim.position.set(4,2,-4);scene.add(rim);
 const makeMat = (color,extra={}) => new T.MeshStandardMaterial({color,roughness:.45,...extra});
 const steel=makeMat('#788f8b',{metalness:.68}), dark=makeMat('#243931'), brass=makeMat('#ab864e',{metalness:.55});
 const glass=makeMat('#b9e7d9',{transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide});
 const liquid=makeMat('#c0ae64',{transparent:true,opacity:.74,depthWrite:false});
 function mesh(g,m,x,y,z){
  const o=new T.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;
 }
 const box=(w,h,d,m,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const tube=(r,h,m,x,y,z)=>mesh(new T.CylinderGeometry(r,r,h,48),m,x,y,z);
 box(9,.18,4,dark,0,-.1,0);
 for(let x=-4;x<=4;x++)box(.013,.015,4,steel,x,.003,0);
 box(3.65,.28,2.2,steel,0,.15,0);
 tube(.79,.19,steel,0,.38,0);tube(.81,.15,steel,0,2.65,0);
 const wall=mesh(new T.CylinderGeometry(.72,.72,2.21,64,1,true),glass,0,1.53,0);
 wall.renderOrder=5;
 const fluid=tube(.675,1,liquid,0,1.2,0);fluid.renderOrder=2;
 const sludge=makeMat('#5a4730');
 const sediment=tube(.66,1,sludge,0,.55,0);
 tube(.25,.24,brass,0,2.82,0);
 for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7;
  tube(.055,.08,brass,.75*Math.cos(a),2.75,.75*Math.sin(a));
 }
 for(const side of [-1,1]){
  tube(.052,2.28,brass,side*.76,1.51,-.25);
  box(.22,.16,.22,steel,side*.76,2.63,-.25);
 }
 box(.82,.56,.67,dark,1.25,.65,.34);
 const lamp=makeMat('#42655a',{emissive:'#42655a',emissiveIntensity:.5});
 box(.48,.13,.038,lamp,1.25,.72,.69);
 const bubbles=[];
 const bubbleMat=makeMat('#d3fff1',{transparent:true,opacity:.49,depthWrite:false});
 const sphere=new T.SphereGeometry(1,10,8);
 for(let i=0;i<36;i++){
  const bubble=mesh(sphere,bubbleMat,0,0,0);
  bubble.renderOrder=3;
  const angle=i*2.39996,r=.59*Math.sqrt((i+.5)/36);
  bubbles.push({bubble,x:Math.cos(angle)*r,z:Math.sin(angle)*r,offset:i*.618});
 }
 const doseMaterial=makeMat('#efcf89',{emissive:'#91682b',emissiveIntensity:.65});
 const grains=Array.from({length:18},(_,i)=>{
  const grain=mesh(sphere,doseMaterial,0,0,0);
  grain.scale.setScalar(.029+(i%4)*.009);grain.renderOrder=4;grain.visible=false;
  return grain;
 });
 const foamMat=makeMat('#ffe3b1',{transparent:true,opacity:.65,depthWrite:false});
 const foam=Array.from({length:24},()=> {
  const particle=mesh(sphere,foamMat,0,0,0);
  particle.renderOrder=4;particle.visible=false;return particle;
 });
 const mistMaterial=makeMat('#d3e9df',{transparent:true,opacity:.24,depthWrite:false});
 const vapour=Array.from({length:12},()=>{
  const puff=mesh(sphere,mistMaterial,0,0,0);puff.visible=false;return puff;
 });
 const vial=mesh(new T.CylinderGeometry(.12,.12,.42,24,1,true),glass,1.05,.62,.66);
 const vialLiquid=tube(.1,.2,makeMat('#8ccab5'),1.05,.52,.66);
 const pulseLight=new T.PointLight('#ff8d51',0,3);
 pulseLight.position.set(0,1.9,1);scene.add(pulseLight);
 const colors={raw:new T.Color('#b4a362'),clear:new T.Color('#83d8c1'),dark:new T.Color('#874e35')};
 function resize(){
  const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
  const aspect=width/height,half=Math.max(1.76,2.8/aspect);
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
  camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  renderer.render(scene,camera);
 }
 new ResizeObserver(resize).observe(canvas);resize();
 return (sample,seconds)=>{
  const filled=sample.filled;
  fluid.visible=sediment.visible=filled;
  const agitation=sample.agitation||0,burst=sample.failureBurst||0;
  const shake=reduceMotion?0:Math.sin(seconds*18)*agitation*.09;
  const level=1.56+sample.activity*.1+shake;
  fluid.scale.y=level;fluid.position.y=.49+level/2;
  liquid.color.copy(colors.raw).lerp(colors.clear,sample.clarity).lerp(colors.dark,sample.damage);
  liquid.opacity=.82-sample.clarity*.35;
  const deposit=.025+sample.debris*.24;
  sediment.scale.y=deposit;sediment.position.y=.49+deposit/2;
  lamp.color.set(sample.alert||burst?'#ff744e':sample.activity>.05?'#87d9ae':'#42655a');lamp.emissive.copy(lamp.color);
  pulseLight.intensity=reduceMotion?0:burst*8;
  const sampleEase=reduceMotion?1:1-Math.pow(1-sample.sampling,3);
  vial.visible=vialLiquid.visible=sample.sampled;
  vial.position.set(1.05+sampleEase*1.02,.62,.66);
  vialLiquid.position.x=vial.position.x;
  vialLiquid.scale.y=Math.min(1,sampleEase*1.4);
  vialLiquid.material.color.copy(liquid.color);
  for(const [i,{bubble,x,z,offset}] of bubbles.entries()){
   bubble.visible=filled&&i<sample.activity*bubbles.length;
   if(!bubble.visible)continue;
   const rise=(seconds*(.4+sample.activity*.5)+offset)%1;
   bubble.position.set(x+Math.sin(rise*7+offset)*.035,.53+rise*(level-.1),z);
   bubble.scale.setScalar((.022+(i%5)*.006)*(.6+rise*.55));
  }
  for(const [i,grain] of grains.entries()){
   const fall=1-sample.dosing-i*.013;
   grain.visible=sample.dosing>0&&fall>=0&&fall<.75;
   if(!grain.visible)continue;
   const spread=.04+fall*.43,angle=i*2.4;
   grain.position.set(Math.cos(angle)*spread,2.55-fall*2.45,Math.sin(angle)*spread);
  }
  for(const [i,particle] of foam.entries()){
   particle.visible=filled&&i<(agitation+burst)*foam.length;
   if(!particle.visible)continue;
   const a=i*2.39996,r=.58*Math.sqrt((i+.5)/foam.length);
   const froth=Math.sin(seconds*15+i)*agitation*.12;
   particle.position.set(Math.cos(a)*r,.47+level+froth+burst*(i%5)*.07,Math.sin(a)*r);
   particle.scale.setScalar(.032+(i%4)*.012+agitation*.046+burst*.05);
  }
  for(const [i,puff] of vapour.entries()){
   const strength=Math.max(sample.vent,burst);
   const progress=1-strength-i*.025;
   puff.visible=!reduceMotion&&strength>0&&progress>=0&&progress<.9;
   if(!puff.visible)continue;
   puff.position.set(.35+progress*1.1,.77+progress*1.65,.55+Math.sin(i*2.4)*.16);
   puff.scale.setScalar(.07+progress*.14);
  }
  renderer.render(scene,camera);
 };
}
try{
 window.drawBatchReactor=createViewer(document.querySelector('#reactor'));
}catch(error){
 console.warn('Three.js viewer unavailable',error);
 document.querySelector('#reactor-note').hidden=false;
}
