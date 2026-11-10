import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#scene');
const stage = document.querySelector('#stage');
const cursorTool = document.querySelector('#cursorTool');
const toast = document.querySelector('#toast');
const cutFlash = document.querySelector('#cutFlash');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 80);
camera.position.set(0, .04, 9.2);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;

scene.add(new THREE.HemisphereLight(0xffe6cc, 0x25212a, 2.1));
const keyLight = new THREE.DirectionalLight(0xffdfbd, 3.2); keyLight.position.set(-3.5, 5, 5); scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9b9fb8, 1.5); fillLight.position.set(4, 1, 4); scene.add(fillLight);
const rimLight = new THREE.PointLight(0xd19a62, 45, 9, 2); rimLight.position.set(-2.2, 2.2, -2.2); scene.add(rimLight);
const group = new THREE.Group(); scene.add(group);
const skin = new THREE.MeshStandardMaterial({color:0xc79578, roughness:.74, metalness:0});
const skinLight = new THREE.MeshStandardMaterial({color:0xd9ab8e, roughness:.67});
const skinShadow = new THREE.MeshStandardMaterial({color:0x9e685b, roughness:.8});
const eyeWhite = new THREE.MeshStandardMaterial({color:0xf1dfd0, roughness:.36});
const irisMat = new THREE.MeshStandardMaterial({color:0x4d665e, roughness:.3});
const dark = new THREE.MeshStandardMaterial({color:0x382824, roughness:.55});
const gold = new THREE.MeshStandardMaterial({color:0xd4b181, metalness:.7, roughness:.28});

function ellipsoid(parent, material, pos, scale, seg=28){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,seg,Math.max(14,Math.floor(seg*.65))),material);mesh.position.set(...pos);mesh.scale.set(...scale);parent.add(mesh);return mesh;}
function addFace(){
  const profile=[[0,-1.18],[.39,-1.16],[.58,-1.04],[.72,-.83],[.84,-.53],[.89,-.12],[.88,.34],[.79,.76],[.62,1.08],[.38,1.28],[0,1.34]].map(([r,y])=>new THREE.Vector2(r,y));
  const head=new THREE.Mesh(new THREE.LatheGeometry(profile,64),skin); head.scale.z=.82; head.position.y=.12; group.add(head);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.37,.47,.86,32),skin); neck.position.set(0,-1.28,-.02);group.add(neck);
  const top=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),new THREE.MeshStandardMaterial({color:0x262125,roughness:.48}));top.scale.set(.98,1.28,.78);top.position.set(0,.27,-.015);group.add(top);
  for(const s of [-1,1]){
    ellipsoid(group,skin,[s*.87,.07,.015],[.2,.31,.16]);
    ellipsoid(group,skinShadow,[s*.94,.07,.135],[.09,.19,.035],20);
    ellipsoid(group,skinLight,[s*.39,-.08,.54],[.28,.18,.12],24);
    ellipsoid(group,eyeWhite,[s*.315,.37,.657],[.19,.095,.07],24);
    ellipsoid(group,irisMat,[s*.315,.37,.718],[.064,.068,.025],20);
    ellipsoid(group,dark,[s*.315,.37,.738],[.027,.034,.012],16);
    const brow=ellipsoid(group,dark,[s*.31,.53,.638],[.22,.035,.045],18);brow.rotation.z=s*.07;
    ellipsoid(group,skinShadow,[s*.91,.06,.17],[.035,.13,.025],16);
  }
  ellipsoid(group,skinLight,[0,.09,.664],[.125,.29,.16],24);
  ellipsoid(group,skin,[0,-.055,.758],[.15,.095,.105],22);
  for(const s of [-1,1])ellipsoid(group,skinShadow,[s*.092,-.095,.796],[.036,.022,.018],16);
  ellipsoid(group,new THREE.MeshStandardMaterial({color:0x9a5d59,roughness:.58}),[0,-.37,.653],[.19,.045,.045],24);
  ellipsoid(group,skinLight,[0,-.43,.636],[.15,.023,.03],20);
  const cape=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),new THREE.MeshStandardMaterial({color:0x201e22,roughness:.86}));cape.scale.set(1.25,.48,.62);cape.position.set(0,-1.77,-.03);group.add(cape);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.39,.045,10,40),gold);collar.rotation.x=Math.PI/2;collar.position.set(0,-1.44,.02);group.add(collar);
}
addFace();

const N_STRANDS=760, SEGMENTS=9;
const strands=[];
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function makeHair(){
  const capGeo=new THREE.SphereGeometry(1,64,42,0,Math.PI*2,0,1.93);
  const cap=new THREE.Mesh(capGeo,new THREE.MeshStandardMaterial({color:0x241815,roughness:.43,metalness:.04,side:THREE.DoubleSide}));
  cap.scale.set(.93,1.23,.73);cap.position.set(0,.24,-.02);group.add(cap);
  const allPositions=new Float32Array(N_STRANDS*(SEGMENTS-1)*2*3);
  const allColors=new Float32Array(allPositions.length);
  const palette=[new THREE.Color('#160f0d'),new THREE.Color('#291914'),new THREE.Color('#3a2419'),new THREE.Color('#4b3020'),new THREE.Color('#2a1c17'),new THREE.Color('#61402a')];
  for(let i=0;i<N_STRANDS;i++){
    const theta=Math.acos(1-Math.random()*(1-Math.cos(1.9)));
    const phi=Math.random()*Math.PI*2;
    const root=new THREE.Vector3(.82*Math.sin(theta)*Math.cos(phi),.24+1.22*Math.cos(theta),.68*Math.sin(theta)*Math.sin(phi));
    // Keep the center of the face clear while retaining soft framing pieces at the temples.
    if(root.z>.15&&root.y<.82&&Math.abs(root.x)<.72){i--;continue;}
    const sign=root.x<0?-1:1, maxY=-1.53+Math.random()*.18;
    const length=Math.max(.65,root.y-maxY),nodes=[];
    const wave=(Math.random()-.5)*.11,wave2=(Math.random()-.5)*.07;
    for(let j=0;j<SEGMENTS;j++){
      const t=j/(SEGMENTS-1);
      const p=new THREE.Vector3(root.x+sign*(.09+.18*Math.sin(theta))*t+wave*Math.sin(t*7+phi)*t,root.y-length*t,root.z+(.1*Math.sin(phi)*t)+wave2*Math.sin(t*8+phi)*t);
      if(j>0){p.y+=.16*Math.sin(t*Math.PI);p.x+=sign*.07*Math.sin(t*Math.PI);}
      nodes.push({p:p.clone(),old:p.clone()});
    }
    const color=palette[Math.floor(Math.random()*palette.length)].clone().multiplyScalar(.82+Math.random()*.3);
    const rest=length/(SEGMENTS-1);
    strands.push({nodes,root:root.clone(),initialPath:nodes.map(n=>n.p.clone()),initialY:nodes[SEGMENTS-1].p.y,cutEndY:nodes[SEGMENTS-1].p.y,alive:true,thinned:false,color,phase:Math.random()*Math.PI*2,rest,thin:Math.random()});
    const cStart=i*(SEGMENTS-1)*6;
    for(let j=0;j<(SEGMENTS-1)*2;j++){const k=cStart+j*3;allColors[k]=color.r;allColors[k+1]=color.g;allColors[k+2]=color.b;}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(allPositions,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(allColors,3));
  const hairLines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.91,depthWrite:false,linewidth:1}));hairLines.frustumCulled=false;group.add(hairLines);
  return {geo,allPositions};
}
const hairData=makeHair();
const floor=new THREE.Mesh(new THREE.CircleGeometry(3.2,64),new THREE.MeshBasicMaterial({color:0x29272b,transparent:true,opacity:.45}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-2.14,-.2);scene.add(floor);
const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.72,.86,.12,48),new THREE.MeshStandardMaterial({color:0x242226,metalness:.45,roughness:.42}));plinth.position.set(0,-2.14,-.18);scene.add(plinth);
const plinthTrim=new THREE.Mesh(new THREE.TorusGeometry(.8,.018,8,64),gold);plinthTrim.rotation.x=Math.PI/2;plinthTrim.position.set(0,-2.075,-.18);scene.add(plinthTrim);

let selectedTool='scissors', breeze=true, soundOn=true, dragging=false, orbiting=false, lastAction=0, totalCuts=0, cleanCuts=0, shapingPoints=0, cutSoundContext=null;
let activeAngle='front', targetAngle=0, angle=0, pointer={x:0,y:0};
function resize(){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);resize();
function setTool(tool){selectedTool=tool;document.querySelectorAll('.tool-card').forEach(b=>{const on=b.dataset.tool===tool;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});cursorTool.classList.toggle('comb-cursor',tool==='comb');const tips={scissors:'Tap or drag across the hair to snip a section.',thinning:'Brush across a section to create a softer, lighter finish.',clippers:'Sweep upward for a quicker, more dramatic shape.',comb:'Drag through the hair to guide and smooth the strands.'};document.querySelector('#toolHint').textContent=tips[tool];document.querySelector('#tipText').textContent=tool==='comb'?'Comb through the shape to see how it falls.':'Select a tool, then shape the silhouette.';}
document.querySelectorAll('.tool-card').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
window.addEventListener('keydown',e=>{if(['1','2','3','4'].includes(e.key))setTool(['scissors','thinning','clippers','comb'][Number(e.key)-1]);if(e.key.toLowerCase()==='b')toggleBreeze();if(e.key.toLowerCase()==='r')resetGame();});
function toggleBreeze(){breeze=!breeze;document.querySelector('#windToggle').textContent=breeze?'ON':'OFF';document.querySelector('#windStatus').style.opacity=breeze?'1':'.35';document.querySelector('#windBtn').classList.toggle('off',!breeze);}
document.querySelector('#windBtn').addEventListener('click',toggleBreeze);
document.querySelector('#soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.classList.toggle('on',soundOn);});
function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),1250);}
function flash(){cutFlash.classList.remove('show');void cutFlash.offsetWidth;cutFlash.classList.add('show');clearTimeout(flash.timer);flash.timer=setTimeout(()=>cutFlash.classList.remove('show'),760);}
function playSound(kind='snip'){
  if(!soundOn)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!cutSoundContext)cutSoundContext=new AC();if(cutSoundContext.state==='suspended')cutSoundContext.resume();const ctx=cutSoundContext,now=ctx.currentTime;
    if(kind==='comb'){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(460+Math.random()*160,now);osc.frequency.exponentialRampToValueAtTime(220,now+.12);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.14);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.15);return;}
    for(let i=0;i<2;i++){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='square';osc.frequency.setValueAtTime((i?930:1380)+Math.random()*170,now+i*.045);osc.frequency.exponentialRampToValueAtTime(240,now+i*.045+.035);gain.gain.setValueAtTime(.026,now+i*.045);gain.gain.exponentialRampToValueAtTime(.001,now+i*.045+.045);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+i*.045);osc.stop(now+i*.045+.05);}
  }catch(_){/* Audio is a delightful extra, never a blocker. */}
}
function project(p){const v=p.clone();group.localToWorld(v);v.project(camera);const r=stage.getBoundingClientRect();return{x:(v.x+1)*r.width*.5,y:(1-v.y)*r.height*.5,z:v.z};}
function useTool(clientX,clientY){
  const rect=stage.getBoundingClientRect(),at={x:clientX-rect.left,y:clientY-rect.top};
  if(selectedTool==='comb'){
    let moved=0;for(const s of strands){if(!s.alive||s.nodes.length<3)continue;let best=1e6,idx=1;for(let j=1;j<s.nodes.length;j++){const p=project(s.nodes[j].p),d=Math.hypot(p.x-at.x,p.y-at.y);if(d<best){best=d;idx=j;}}
      if(best<33){for(let j=idx;j<s.nodes.length;j++){const n=s.nodes[j];n.old.x+=.035;n.old.y-=.01;}moved++;}}
    if(moved)playSound('comb');return;
  }
  const hits=[],radius=selectedTool==='clippers'?30:selectedTool==='thinning'?27:24;
  for(const s of strands){if(!s.alive||s.nodes.length<3)continue;if(selectedTool==='thinning'&&s.thin>.42)continue;let best=radius+1,idx=-1;
    for(let j=1;j<s.nodes.length;j++){const v=s.nodes[j].p.clone();group.localToWorld(v);v.project(camera);const x=(v.x+1)*rect.width*.5,y=(1-v.y)*rect.height*.5,d=Math.hypot(x-at.x,y-at.y);if(d<best){best=d;idx=j;}}
    if(idx>0)hits.push({s,idx,d:best});
  }
  hits.sort((a,b)=>a.d-b.d);if(!hits.length)return;
  const max=selectedTool==='clippers'?8:selectedTool==='thinning'?5:4;let altered=0;
  for(const h of hits){if(altered>=max)break;const s=h.s;
    if(selectedTool==='thinning'){if(s.nodes.length<4||s.thinned)continue;s.alive=false;s.thinned=true;s.nodes.length=0;altered++;}
    else{const oldLength=s.nodes.length;let newLength=h.idx;if(selectedTool==='clippers')newLength=Math.max(2,h.idx-1);if(newLength>=oldLength)continue;s.nodes.length=newLength;s.cutEndY=s.nodes.at(-1).p.y;s.split={at:s.nodes.at(-1).p.clone(),life:1};altered++;}
  }
  if(altered){totalCuts+=altered;cleanCuts+=selectedTool==='scissors'?altered:Math.max(0,altered-1);shapingPoints+=altered*(selectedTool==='thinning'?2:selectedTool==='clippers'?3:4);playSound();flash();updateScore();}
}
function updateScore(){
  let sum=0,precision=0,count=0;
  for(const s of strands){if(s.thinned){count++;continue;}if(s.nodes.length<2)continue;const end=s.cutEndY,target=-.52+Math.abs(s.root.x)*.1;sum+=clamp((end-s.initialY)/(target-s.initialY),0,1);if(end>target-.25)precision+=clamp(1-Math.abs(end-target)/.55,0,1);count++;}
  const progress=Math.min(100,Math.round(shapingPoints/72*100));document.querySelector('#goalMeter').style.width=progress+'%';document.querySelector('#progressText').textContent=progress+'% shaped';
  const quality=totalCuts?clamp(Math.round(42+precision/Math.max(1,count)*35+Math.min(cleanCuts,18)*1.25),0,100):0;
  document.querySelector('#qualityValue').textContent=totalCuts?(quality>85?'EXCELLENT':quality>67?'LOVELY':'IN PROGRESS'):'—';
  document.querySelectorAll('.quality-bars i').forEach((b,i)=>b.classList.toggle('lit',i<Math.round(quality/10)));
  document.querySelector('#qualityCaption').textContent=!totalCuts?'Your first snip sets the tone.':quality>85?'Soft, considered and beautifully balanced.':quality>65?'A lovely shape is taking form.':'Keep shaping for a softer finish.';return progress;
}
function resetGame(){for(const s of strands){s.alive=true;s.thinned=false;s.nodes=s.initialPath.map(p=>({p:p.clone(),old:p.clone()}));s.initialY=s.nodes.at(-1).p.y;s.cutEndY=s.initialY;delete s.split;}totalCuts=0;cleanCuts=0;shapingPoints=0;activeAngle='front';targetAngle=0;document.querySelectorAll('.angle-btn').forEach(b=>b.classList.toggle('active',b.dataset.angle==='front'));document.querySelector('#angleLabel').textContent='FRONT';setTool('scissors');updateScore();notify('Fresh canvas. Let’s create a shape.');}
document.querySelector('#resetBtn').addEventListener('click',resetGame);
document.querySelector('#finishBtn').addEventListener('click',()=>{const p=updateScore();if(p>=55){notify('Beautiful work, Mara loves her new look!');playSound('comb');}else notify('A little more shaping will bring it to the jawline.');});

document.querySelectorAll('.angle-btn').forEach(button=>button.addEventListener('click',()=>{
  activeAngle=button.dataset.angle;targetAngle={front:0,side:Math.PI/2,back:Math.PI}[activeAngle];
  document.querySelectorAll('.angle-btn').forEach(b=>b.classList.toggle('active',b===button));
  document.querySelector('#angleLabel').textContent=activeAngle.toUpperCase();
}));
stage.addEventListener('pointerleave',()=>{if(!dragging)cursorTool.style.display='none';});
stage.addEventListener('contextmenu',e=>e.preventDefault());
stage.addEventListener('pointerdown',e=>{
  if(e.button===2||e.shiftKey){orbiting=true;pointer={x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);return;}
  if(e.button!==0)return;dragging=true;stage.setPointerCapture(e.pointerId);lastAction=performance.now();useTool(e.clientX,e.clientY);
});
stage.addEventListener('pointermove',e=>{
  const r=stage.getBoundingClientRect();cursorTool.style.display='block';cursorTool.style.left=(e.clientX-r.left)+'px';cursorTool.style.top=(e.clientY-r.top)+'px';
  if(orbiting){targetAngle+=(e.clientX-pointer.x)*.008;pointer={x:e.clientX,y:e.clientY};return;}
  if(dragging&&performance.now()-lastAction>85){lastAction=performance.now();useTool(e.clientX,e.clientY);}
});
function endPointer(){dragging=false;orbiting=false;}
stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);

const clock=new THREE.Clock();let breezeTime=0;
function collideHead(p){
  const dx=p.x/.91,dy=(p.y-.12)/1.31,dz=p.z/.745,q=dx*dx+dy*dy+dz*dz;
  if(q<1.035){const m=Math.sqrt(q)||.001,scale=Math.sqrt(1.04)/m;p.set(dx*scale*.91,.12+dy*scale*1.31,dz*scale*.745);}
}
function simulate(dt){
  const frame=clamp(dt*60,0,1.6);breezeTime+=dt;
  group.rotation.y+=(Math.sin(breezeTime*.65)*.025-group.rotation.y)*Math.min(1,dt*1.4);
  group.rotation.x+=(Math.sin(breezeTime*.38)*.008-group.rotation.x)*Math.min(1,dt);
  const positions=hairData.allPositions, perStrand=(SEGMENTS-1)*6;
  for(let i=0;i<strands.length;i++){
    const s=strands[i],nodes=s.nodes,offset=i*perStrand;
    if(nodes.length>1&&s.alive){
      nodes[0].p.copy(s.root);nodes[0].old.copy(s.root);
      for(let j=1;j<nodes.length;j++){
        const n=nodes[j],vx=(n.p.x-n.old.x)*.978,vy=(n.p.y-n.old.y)*.978,vz=(n.p.z-n.old.z)*.978;n.old.copy(n.p);
        const gust=breeze?(Math.sin(breezeTime*2.15+s.phase+j*.4)*.0015+Math.sin(breezeTime*.7+s.phase)*.001):0;
        n.p.x+=vx+gust*frame*frame;n.p.y+=vy-.0015*frame*frame;n.p.z+=vz+(breeze?Math.cos(breezeTime*1.8+s.phase)*.0007*frame*frame:0);
      }
      for(let pass=0;pass<2;pass++){
        nodes[0].p.copy(s.root);
        for(let j=1;j<nodes.length;j++){
          const a=nodes[j-1].p,b=nodes[j].p,delta=b.clone().sub(a),len=delta.length()||.001,desired=s.rest;
          const correction=delta.multiplyScalar((len-desired)/len);
          if(j===1)b.sub(correction);else{a.addScaledVector(correction,.5);b.addScaledVector(correction,-.5);}
          collideHead(b);
        }
      }
    }
    for(let j=0;j<SEGMENTS-1;j++){
      const a=nodes[Math.min(j,nodes.length-1)]?.p||s.root,b=nodes[Math.min(j+1,nodes.length-1)]?.p||s.root,k=offset+j*6;
      positions[k]=a.x;positions[k+1]=a.y;positions[k+2]=a.z;positions[k+3]=b.x;positions[k+4]=b.y;positions[k+5]=b.z;
    }
  }
  hairData.geo.attributes.position.needsUpdate=true;
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.035);simulate(dt);
  angle+=(targetAngle-angle)*.055;const distance=8.05;camera.position.set(Math.sin(angle)*distance,.04,Math.cos(angle)*distance);camera.lookAt(0,-.12,0);renderer.render(scene,camera);
}
animate();
