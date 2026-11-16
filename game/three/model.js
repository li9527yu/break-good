import * as T from 'three';
import {createCharacter} from './characters.js';
export function buildLab(scene,renderer){
 const groups={},characters={};
 const mat=(color,metalness=0,roughness=.65)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const materials={steel:mat('#b9c8c9',.85,.26),dark:mat('#263936',.65,.4),rail:mat('#d0b468',.6,.45),red:mat('#853b36',.05,.52),wall:mat('#74736a',0,.92),rubber:mat('#182320',0,.9),paper:mat('#d9d0a6'),yellow:mat('#c6ac43'),blue:mat('#548d8b'),rust:mat('#94513d'),skin:mat('#c29e7b'),white:mat('#cbc9ae')};
 function mesh(geo,m,p,parent=scene){const x=new T.Mesh(geo,m);x.position.set(...p);x.castShadow=true;x.receiveShadow=true;parent.add(x);return x;}
 const box=(size,m,p,parent)=>mesh(new T.BoxGeometry(...size),m,p,parent);
 const cyl=(r,h,m,p,parent)=>mesh(new T.CylinderGeometry(r,r,h,32),m,p,parent);
 function pipe(a,b,r=.05,m=materials.steel,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const x=mesh(new T.CylinderGeometry(r,r,d.length(),12),m,av.clone().add(bv).multiplyScalar(.5).toArray(),parent);x.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return x;}
 function group(id,p){const g=new T.Group();g.position.set(...p);g.userData.station=id;scene.add(g);groups[id]=g;return g;}
 function ring(r,t,m,p,parent){const x=mesh(new T.TorusGeometry(r,t,8,48),m,p,parent);x.rotation.x=Math.PI/2;return x;}
 // Procedural concrete variation is deterministic and packed into a local canvas texture.
 const cv=document.createElement('canvas');cv.width=cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#8d8b80';ctx.fillRect(0,0,256,256);let seed=17;for(let i=0;i<7000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%256;seed=(seed*1664525+1013904223)>>>0;const y=seed%256;ctx.fillStyle=i%2?'#878578':'#969487';ctx.fillRect(x,y,2,2);}const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(4,2);tex.colorSpace=T.SRGBColorSpace;materials.wall.map=tex;materials.wall.bumpMap=tex;materials.wall.bumpScale=.025;
 box([18,.3,14],materials.dark,[0,-.22,0]);const floor=box([17.8,.12,13.8],materials.red,[0,-.04,0]);floor.userData.ground=true;
 for(let x=-8;x<=8;x+=2)box([.018,.004,13.8],materials.dark,[x,.025,0]);for(let z=-6;z<=6;z+=2)box([17.8,.004,.018],materials.dark,[0,.025,z]);
 // Cutaway room: back and left walls remain; front/right walls are omitted for readability.
 box([18,6.4,.25],materials.wall,[0,3.1,-7]);box([.25,6.4,14],materials.wall,[-9,3.1,0]);
 for(let x=-8;x<=8;x+=4){box([.22,6.3,.33],materials.dark,[x,3.1,-6.8]);if(x<8)for(let y=1;y<6;y+=1.6)box([3.8,.025,.04],materials.dark,[x+1.8,y,-6.83]);}
 // Upper mezzanine and structural supports.
 const deck=box([17.2,.18,2.7],materials.dark,[0,3.1,-5.25]);deck.userData.ground=true;
 for(let x=-8;x<=8;x+=4){box([.16,3.05,.16],materials.dark,[x,1.5,-4]);box([.17,.17,2.7],materials.steel,[x,2.93,-5.25]);}
 for(let x=-8.3;x<6.9;x+=.28)box([.035,.015,2.5],materials.steel,[x,3.2,-5.25]);
 function railing(a,b,parent=scene){pipe([a[0],a[1]+1,a[2]],[b[0],b[1]+1,b[2]],.035,materials.rail,parent);pipe([a[0],a[1]+.5,a[2]],[b[0],b[1]+.5,b[2]],.025,materials.rail,parent);const length=Math.hypot(...a.map((v,i)=>b[i]-v)),n=Math.ceil(length/1.1);for(let i=0;i<=n;i++){const p=a.map((v,k)=>v+(b[k]-v)*i/n);pipe(p,[p[0],p[1]+1,p[2]],.035,materials.rail,parent);}}
 railing([-8.4,3.2,-3.9],[6.7,3.2,-3.9]);
 // Stair treads are aligned to the navigation rise (0 -> 3.2 metres).
 for(let i=0;i<20;i++){const y=(i+1)*3.2/20,z=2.6-(i+.5)*7/20;box([1.5,.1,.36],materials.dark,[7.7,y-.05,z]);box([1.5,.018,.035],materials.rail,[7.7,y,z+.16]);}
 railing([6.95,0,2.6],[6.95,3.2,-4.4]);railing([8.45,0,2.6],[8.45,3.2,-4.4]);
 pipe([7,0,2.6],[7,3.1,-4.4],.09,materials.dark);pipe([8.4,0,2.6],[8.4,3.1,-4.4],.09,materials.dark);
 // Laundry access vignette, behind the mezzanine. No suggestion of a second production floor.
 const entry=group('door',[-5.7,3.2,-5.9]);box([1.5,2.25,.15],materials.dark,[0,1.12,-.8],entry);box([1.3,2.05,.12],mat('#526253'),[0,1.05,-.68],entry);box([.08,.25,.08],materials.steel,[.45,1,-.55],entry);
 for(const x of [-2,2]){box([1.35,1.5,1],materials.white,[x,.75,0],entry);const drum=cyl(.45,.1,materials.steel,[x,.75,.55],entry);drum.rotation.x=Math.PI/2;const glass=cyl(.32,.12,materials.dark,[x,.75,.62],entry);glass.rotation.x=Math.PI/2;box([.6,.12,.04],materials.dark,[x,1.3,.53],entry);}
 const linen=box([.7,.8,.7],materials.dark,[-8,3.6,-5]);for(let i=0;i<4;i++)box([.8,.1,.65],materials.white,[-8,4.05+i*.1,-5]);
 function tank(id,x,z,r,h){const g=group(id,[x,0,z]);for(const dx of [-.6,.6])for(const dz of [-.6,.6])cyl(.07,.48,materials.steel,[dx*r,.24,dz*r],g);cyl(r,h,materials.steel,[0,.4+h/2,0],g);mesh(new T.ConeGeometry(r,.38,48),materials.steel,[0,h+.59,0],g);ring(r+.012,.035,materials.dark,[0,.48,0],g);ring(r+.012,.025,materials.steel,[0,h+.35,0],g);ring(r+.012,.03,materials.dark,[0,h*.55,0],g);cyl(.18,.23,materials.steel,[0,h+.86,0],g);pipe([0,.9,r],[0,.9,r+.35],.08,materials.steel,g);const valve=mesh(new T.TorusGeometry(.16,.025,8,20),materials.rust,[0,.9,r+.4],g);pipe([-.14,.9,r+.4],[.14,.9,r+.4],.015,materials.rust,g);box([.3,.25,.04],materials.paper,[r*.4,h*.7,r*.93],g);return g;}
 tank('tank',-2,-2.2,1.05,2.4);tank('tankB',.7,-3,1.2,2.8).userData.station='tank';tank('tankC',3.2,-3.4,.85,1.8).userData.station='tank';
 // Utility pipes, overhead exhaust, wall conduits and illuminated fixtures.
 for(const y of [1.2,1.5]){pipe([-8.8,y,-6.65],[8.5,y,-6.65],.055);pipe([-8.8,y,-6.65],[-8.8,y,4.5],.055);}
 box([1.05,.6,12],materials.steel,[-7.5,5.6,-.5]);for(let z=-5;z<6;z+=2)box([1.1,.64,.06],materials.dark,[-7.5,5.6,z]);
 pipe([-1,3.6,-2.2],[-1,5.6,-2.2],.15);pipe([-1,5.6,-2.2],[-7.5,5.6,-2.2],.15);
 const glow=new T.MeshStandardMaterial({color:'#fff2cc',emissive:'#fff0bd',emissiveIntensity:3});
 for(const x of [-6,-1,4]){box([2.8,.18,.45],materials.dark,[x,5.6,-6.45]);box([2.5,.07,.25],glow,[x,5.48,-6.35]);const light=new T.PointLight('#ffe7b3',32,12,2);light.position.set(x,5,-4.7);scene.add(light);}
 const emergency=box([.35,.17,.1],new T.MeshStandardMaterial({color:'#e34422',emissive:'#dc3118',emissiveIntensity:2}),[-5.7,5.7,-6.7]);
 function table(id,p,size=[3,1.2]){const g=group(id,p);box([size[0],.12,size[1]],materials.steel,[0,1,0],g);for(const x of [-size[0]/2+.1,size[0]/2-.1])for(const z of [-size[1]/2+.1,size[1]/2-.1]){box([.07,.94,.07],materials.steel,[x,.47,z],g);}box([size[0]-.2,.06,size[1]-.2],materials.dark,[0,.3,0],g);return g;}
 const bench=table('bench',[-2.6,0,1.8],[3.3,1.3]);
 for(let i=0;i<4;i++){const g=new T.Group();g.position.set(-1+i*.4,1.07,0);bench.add(g);cyl(.12,.28,i%2?materials.yellow:materials.blue,[0,.14,0],g);cyl(.07,.08,materials.dark,[0,.32,0],g);}
 box([.65,.08,.45],materials.paper,[.85,1.1,.1],bench);const instrument=box([.6,.45,.45],materials.dark,[.3,1.3,-.2],bench);box([.45,.18,.02],mat('#78b6a0'),[.3,1.35,.035],bench);
 const report=table('report',[5.5,0,.6],[2.6,1.1]);box([.55,.035,.7],materials.paper,[.4,1.09,0],report);for(let i=0;i<4;i++)box([.35,.003,.012],materials.dark,[.4,1.111,-.2+i*.1],report);
 const phone=table('phone',[5.3,0,5],[1.5,.8]);box([.3,.045,.52],materials.rubber,[0,1.1,0],phone);box([.23,.01,.35],mat('#91b99b'),[0,1.13,-.04],phone);
 const shelf=group('shelf',[-8,0,-.7]);for(const y of [.15,.85,1.55,2.25])box([1.2,.07,2.4],materials.steel,[0,y,0],shelf);for(const x of [-.55,.55])for(const z of [-1.1,1.1])box([.07,2.3,.07],materials.dark,[x,1.15,z],shelf);for(let i=0;i<12;i++)cyl(.12,.3,i%2?materials.yellow:materials.white,[0,.85+Math.floor(i/4)*.7+.19,(i%4)*.5-.75],shelf);
 const sink=table('sink',[-8,0,2.5],[1.25,1.8]);box([1,.2,1.45],materials.dark,[0,1.05,0],sink);for(const x of [-.55,.55])box([.09,.3,1.65],materials.steel,[x,1.12,0],sink);pipe([-.4,1.1,-.7],[-.4,1.6,-.7],.04,materials.steel,sink);pipe([-.4,1.6,-.7],[0,1.6,-.7],.04,materials.steel,sink);
 const cart=table('cart',[1.7,0,5],[1.2,.7]);for(const x of [-.5,.5])for(const z of [-.25,.25]){const wheel=cyl(.13,.08,materials.rubber,[x,.13,z],cart);wheel.rotation.z=Math.PI/2;}box([.5,.2,.45],materials.dark,[0,1.16,0],cart);
 // Side control cabinet and packaging create differing silhouettes.
 const control=group('control',[4.8,0,-2.9]);control.userData.station='tank';box([.9,1.6,.6],materials.steel,[0,.8,0],control);box([.65,.45,.035],materials.dark,[0,1.15,.32],control);for(let i=0;i<4;i++)box([.09,.09,.05],i%2?materials.yellow:materials.rust,[-.25+i*.16,.65,.34],control);
 for(let i=0;i<3;i++)box([.8,.55,.7],mat('#8d7853'),[-5.4+i*.9,.28,-2.5]);
 for(const [id,p] of Object.entries({walter:[-4.5,0,1.8],jesse:[3.4,0,-1.7],gus:[5.3,0,-.65],player:[0,0,4.1],guard:[7.7,3.2,-4.4]})){const c=createCharacter(id);c.group.position.set(...p);scene.add(c.group);characters[id]=c;groups[id]=c.group;}
 // Soft studio-like environment reflections generated locally, not dependent on a remote HDRI.
 const env=new T.Scene();env.background=new T.Color('#777f79');const envMat=new T.MeshBasicMaterial({color:'#fff0d1'});for(const p of [[-4,5,0],[4,3,-2],[0,7,3]]){const m=new T.Mesh(new T.PlaneGeometry(5,3),envMat);m.position.set(...p);m.lookAt(0,0,0);env.add(m);}const pmrem=new T.PMREMGenerator(renderer);const envMap=pmrem.fromScene(env,.12);scene.environment=envMap.texture;scene.environmentIntensity=.55;pmrem.dispose();
 return {groups,characters,materials,floor,deck};
}
