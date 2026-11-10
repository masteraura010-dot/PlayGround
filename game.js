import * as THREE from 'three';

const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e6df');
scene.fog = new THREE.Fog('#e9e6df', 6, 12);
const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
camera.position.set(0, 0.25, 7.7);
camera.lookAt(0, 0.05, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
viewport.prepend(renderer.domElement);
renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';

scene.add(new THREE.HemisphereLight('#fff8eb', '#8b887c', 2.0));
const keyLight = new THREE.DirectionalLight('#fff4e2', 3.2);
keyLight.position.set(-3.5, 5, 5); keyLight.castShadow = true; scene.add(keyLight);
const fillLight = new THREE.DirectionalLight('#d8e6e1', 1.5);
fillLight.position.set(4, 1.5, 3); scene.add(fillLight);
const rimLight = new THREE.PointLight('#e5b29c', 35, 8);
rimLight.position.set(1.7, 2.8, -1.5); scene.add(rimLight);

const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 64), new THREE.MeshStandardMaterial({ color: '#d9d7d0', roughness: .92 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.48; floor.position.z = -0.5; floor.receiveShadow = true; scene.add(floor);
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.76, .9, .18, 48), new THREE.MeshStandardMaterial({ color: '#c4b5a2', roughness: .55 }));
pedestal.position.set(0, -1.4, -.35); pedestal.castShadow = true; scene.add(pedestal);

const skin = new THREE.MeshStandardMaterial({ color: '#d9a987', roughness: .72 });
const skinLight = new THREE.MeshStandardMaterial({ color: '#e7b999', roughness: .67 });
const dark = new THREE.MeshStandardMaterial({ color: '#41302d', roughness: .42 });
const hairBaseMat = new THREE.MeshStandardMaterial({ color: '#573528', roughness: .34, metalness: .02 });
const head = new THREE.Group(); scene.add(head);
function ellipsoid(parent, material, pos, scale, seg=32) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(16, seg/2)), material);
  mesh.position.set(...pos); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
ellipsoid(head, skin, [0, -.05, 0], [.69, .91, .57], 48);
ellipsoid(head, skinLight, [0, -.59, .08], [.39, .33, .45], 32);
for (const side of [-1, 1]) {
  ellipsoid(head, skin, [side*.69, -.08, -.02], [.15, .24, .13], 24);
  ellipsoid(head, skinLight, [side*.285, .14, .493], [.105, .055, .045], 24);
  ellipsoid(head, dark, [side*.285, .135, .532], [.055, .027, .02], 20);
  const brow = ellipsoid(head, dark, [side*.28, .255, .51], [.13, .025, .023], 20); brow.rotation.z = side * -.08;
}
ellipsoid(head, skinLight, [0, -.045, .545], [.095, .16, .105], 24);
const mouth = new THREE.Mesh(new THREE.TorusGeometry(.105, .012, 8, 24, Math.PI), new THREE.MeshStandardMaterial({color:'#995e58', roughness:.8}));
mouth.position.set(0,-.37,.526); mouth.rotation.z=Math.PI; head.add(mouth);
const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI*2, 0, Math.PI*.58), hairBaseMat);
cap.position.set(0,.12,-.015); cap.scale.set(.76,.98,.69); cap.castShadow=true; head.add(cap);

const strandCount = 480, nodeCount = 13, segmentLength = .105;
const strands = [], linePositions = new Float32Array(strandCount*(nodeCount-1)*2*3), lineColors = new Float32Array(linePositions.length);
const strandGeometry = new THREE.BufferGeometry();
strandGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions,3).setUsage(THREE.DynamicDrawUsage));
strandGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors,3));
const strandMaterial = new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:.9 });
const hairLines = new THREE.LineSegments(strandGeometry,strandMaterial); hairLines.frustumCulled=false; head.add(hairLines);
const palette = ['#43291f','#533326','#62402d','#754a31','#8b5b39'];
const colorObjects = palette.map(c=>new THREE.Color(c));
function guidePoint(lat, theta, t, length, layer) {
  const x = Math.sin(lat)*Math.cos(theta)*.735;
  const z = Math.sin(lat)*Math.sin(theta)*.655;
  const y = .17 + Math.cos(lat)*.91;
  const side = x < 0 ? -1 : 1;
  const front = Math.max(0, Math.sin(theta));
  const drop = t*length;
  return new THREE.Vector3(x + side*(.08*t + .025*Math.sin(t*3+layer)), y-drop + .055*Math.sin(t*Math.PI), z + front*.035*t - .01*t);
}
for(let i=0;i<strandCount;i++){
  const lat = .12 + (i/(strandCount-1))**.78*1.36;
  const theta = i*2.399963229728653;
  const length = .52 + .31*(.5+.5*Math.sin(i*12.9898));
  const layer = (i%7)/7;
  const pts=[], prev=[];
  for(let n=0;n<nodeCount;n++){const p=guidePoint(lat,theta,n/(nodeCount-1),length,layer);pts.push(p.clone());prev.push(p.clone());}
  const ci = (i*37 + Math.floor(lat*19)) % colorObjects.length;
  strands.push({lat,theta,length,layer,pts,prev,active:nodeCount,cut:false,color:colorObjects[ci],sway:Math.random()*6.28,impulse:new THREE.Vector3()});
  const c=colorObjects[ci];
  for(let n=0;n<nodeCount-1;n++){const base=(i*(nodeCount-1)+n)*6;c.toArray(lineColors,base);c.toArray(lineColors,base+3);}
}
const sideHairMat = new THREE.MeshStandardMaterial({color:'#573528',roughness:.4,side:THREE.DoubleSide});
for(const side of [-1,1]){const lock=ellipsoid(head,sideHairMat,[side*.49,-.19,-.015],[.24,.79,.38],36);lock.rotation.z=side*-.12;}

let breeze=false, soundOn=true, removedCm=0, selectedTool='scissors', orbit=0, zoom=1;
const cutUnique=new Set();
const toolGroup=new THREE.Group(); scene.add(toolGroup);
function makeTool(tool){
  toolGroup.clear();
  const metal=new THREE.MeshStandardMaterial({color:'#c6cbc7',metalness:.78,roughness:.26});
  const rose=new THREE.MeshStandardMaterial({color:'#d27c69',metalness:.45,roughness:.3});
  const wood=new THREE.MeshStandardMaterial({color:'#9a7850',roughness:.45});
  const rod=(a,b,r,mat)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),mat);m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());toolGroup.add(m);};
  if(tool==='scissors'||tool==='thinning'){
    rod([-.07,0,0],[.25,.25,0],.022,metal);rod([-.07,0,0],[.25,-.25,0],.022,metal);rod([-.07,0,0],[-.25,.2,0],.025,rose);rod([-.07,0,0],[-.25,-.2,0],.025,rose);
    for(const y of [-.2,.2]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.022,8,24),rose);ring.position.set(-.3,y,0);toolGroup.add(ring);}
    const pivot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),metal);pivot.position.set(-.06,0,.01);toolGroup.add(pivot);
  } else if(tool==='clippers'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(.28,.43,.12),rose);body.position.y=-.03;toolGroup.add(body);const blade=new THREE.Mesh(new THREE.BoxGeometry(.35,.07,.15),metal);blade.position.y=.23;toolGroup.add(blade);
    for(let i=0;i<5;i++){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.025,.11,.14),metal);tooth.position.set(-.13+i*.065,.29,0);toolGroup.add(tooth);}
  } else {
    const spine=new THREE.Mesh(new THREE.BoxGeometry(.5,.09,.08),wood);spine.position.y=.18;toolGroup.add(spine);
    for(let i=0;i<9;i++){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.035,.27,.055),wood);tooth.position.set(-.22+i*.055,.02,0);toolGroup.add(tooth);}
  }
  toolGroup.scale.setScalar(.78);toolGroup.visible=false;
}
makeTool(selectedTool);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),workPlane=new THREE.Plane(new THREE.Vector3(0,0,1),-.64),workPoint=new THREE.Vector3();
function pointerToHead(clientX,clientY){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((clientX-rect.left)/rect.width)*2-1;pointer.y=-((clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);raycaster.ray.intersectPlane(workPlane,workPoint);return head.worldToLocal(workPoint.clone());}
let pointerDown=false,previousPointer=null,isOrbiting=false,orbitStart=null;
const strokeCuts=new Set();
function setTool(tool){selectedTool=tool;document.querySelectorAll('.tool-card').forEach(b=>b.classList.toggle('selected',b.dataset.tool===tool));makeTool(tool);const copy={scissors:['✂','Tap or drag to snip','Scissors close on every pass.'],thinning:['⌁','Add a little texture','Thinning shears remove less hair per pass.'],clippers:['▥','Swipe to take length off','Clippers make a bold, even pass.'],comb:['⌁','Comb through the layers','Guide the hair and watch it sway.']}[tool];const detail=document.getElementById('toolDetail');detail.querySelector('.detail-icon').textContent=copy[0];detail.querySelector('b').textContent=copy[1];detail.querySelector('small').textContent=copy[2];}
function refreshStats(){document.getElementById('hairRemoved').innerHTML=`${removedCm.toFixed(1)} <em>cm</em>`;document.getElementById('strandsCut').innerHTML=`${cutUnique.size} <em>/ 480</em>`;const progress=Math.min(18,Math.floor(cutUnique.size/10));document.getElementById('goalProgress').textContent=`${progress} / 18`;document.getElementById('progressFill').style.width=`${progress/18*100}%`;document.getElementById('goalStatus').textContent=progress>=18?'LOOKING LOVELY':'IN PROGRESS';}
function setBreeze(on){breeze=on;const button=document.getElementById('windBtn');button.classList.toggle('active',on);button.querySelector('i').textContent=on?'ON':'OFF';document.getElementById('windLabel').innerHTML=`BREEZE <b>${on?'ON':'OFF'}</b>`;const mini=document.getElementById('miniWind');mini.textContent=on?'✓':'↗';mini.style.color=on?'#d27c69':'';}

function doWork(point){
  const local=point;
  const radius=selectedTool==='clippers'?.27:selectedTool==='thinning'?.18:selectedTool==='comb'?.25:.22;
  let changed=0;
  for(let i=0;i<strands.length;i++){
    const st=strands[i]; if(st.active<4) continue;
    if(selectedTool!=='comb'&&strokeCuts.has(i)) continue;
    let best=-1,bestD=Infinity;
    for(let n=2;n<st.active;n++){
      const p=st.pts[n], dx=p.x-local.x,dy=p.y-local.y,dz=p.z-local.z;
      const d=dx*dx+dy*dy+dz*dz;
      if(d<bestD){bestD=d;best=n;}
    }
    if(best<0||bestD>radius*radius) continue;
    if(selectedTool==='comb'){
      st.impulse.x += (local.x-st.pts[best].x)*.045;
      st.impulse.y += .035 + Math.random()*.025;
      changed++;
    } else {
      const trim=selectedTool==='clippers'?Math.max(3,Math.floor(st.active*.34)):selectedTool==='thinning'?2:Math.max(2,Math.floor(st.active*.17));
      const newActive=Math.max(3,Math.min(st.active,best+1)-trim+1);
      if(newActive<st.active){st.active=newActive;st.cut=true;strokeCuts.add(i);cutUnique.add(i);removedCm += trim*segmentLength*2.6;changed++;}
    }
  }
  if(changed){refreshStats();document.getElementById('sceneHint').style.opacity='0';const toast=document.getElementById('cutToast');toast.textContent=selectedTool==='comb'?'SMOOTH!':selectedTool==='thinning'?'TEXTURE!':'SNIP!';toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');if(soundOn)playSnip(selectedTool==='comb');}
}
let audioContext;
function playSnip(soft=false){try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='triangle';osc.frequency.setValueAtTime(soft?520:880,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(soft?320:410,audioContext.currentTime+.055);gain.gain.setValueAtTime(.035,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.065);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.07);}catch(_){}}
function updatePointer(event){const local=pointerToHead(event.clientX,event.clientY);workPoint.copy(local);toolGroup.position.copy(local);toolGroup.visible=true;}
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===2){isOrbiting=true;orbitStart={x:e.clientX,angle:orbit};renderer.domElement.setPointerCapture(e.pointerId);return;}pointerDown=true;strokeCuts.clear();renderer.domElement.setPointerCapture(e.pointerId);updatePointer(e);previousPointer=workPoint.clone();doWork(workPoint);});
renderer.domElement.addEventListener('pointermove',e=>{if(isOrbiting&&orbitStart){orbit=orbitStart.angle+(e.clientX-orbitStart.x)*.008;camera.position.x=Math.sin(orbit)*7.7/zoom;camera.position.z=Math.cos(orbit)*7.7/zoom;camera.lookAt(0,.05,0);return;}updatePointer(e);if(pointerDown&&previousPointer){const dist=workPoint.distanceTo(previousPointer);const steps=Math.max(1,Math.ceil(dist/.09));for(let s=1;s<=steps;s++)doWork(previousPointer.clone().lerp(workPoint,s/steps));previousPointer.copy(workPoint);}});
renderer.domElement.addEventListener('pointerup',()=>{pointerDown=false;isOrbiting=false;orbitStart=null;previousPointer=null;strokeCuts.clear();});
renderer.domElement.addEventListener('pointercancel',()=>{pointerDown=false;isOrbiting=false;previousPointer=null;});
renderer.domElement.addEventListener('pointerleave',()=>{if(!pointerDown)toolGroup.visible=false;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(-e.deltaY*.001),.78,1.35);camera.position.x=Math.sin(orbit)*7.7/zoom;camera.position.z=Math.cos(orbit)*7.7/zoom;camera.position.y=.25/zoom;camera.lookAt(0,.05,0);},{passive:false});

const windBtn=document.getElementById('windBtn'),miniWind=document.getElementById('miniWind');
windBtn.addEventListener('click',()=>setBreeze(!breeze));miniWind.addEventListener('click',()=>setBreeze(!breeze));
document.querySelectorAll('.tool-card').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.tool)));
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp();const map={'1':'scissors','2':'thinning','3':'clippers','4':'comb'};if(map[e.key])setTool(map[e.key]);if(e.key.toLowerCase()==='b')setBreeze(!breeze);});
document.getElementById('soundToggle').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.classList.toggle('muted',!soundOn);e.currentTarget.textContent=soundOn?'♫':'♩';e.currentTarget.style.opacity=soundOn?'1':'.45';});
const modal=document.getElementById('helpModal');
function openHelp(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');}
function closeHelp(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
document.getElementById('helpBtn').addEventListener('click',openHelp);document.getElementById('closeHelp').addEventListener('click',closeHelp);document.getElementById('gotIt').addEventListener('click',closeHelp);modal.addEventListener('pointerdown',e=>{if(e.target===modal)closeHelp();});
function resetGame(){cutUnique.clear();removedCm=0;strands.forEach(st=>{st.active=nodeCount;st.cut=false;for(let n=0;n<nodeCount;n++){const p=guidePoint(st.lat,st.theta,n/(nodeCount-1),st.length,st.layer);st.pts[n].copy(p);st.prev[n].copy(p);}});setBreeze(false);refreshStats();document.getElementById('sceneHint').style.opacity='1';}
document.getElementById('resetBtn').addEventListener('click',resetGame);
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewport);resize();
function collideHead(p){const x=p.x/.72,y=(p.y+.05)/.93,z=p.z/.60;const d=x*x+y*y+z*z;if(d<1.035&&p.y<.92){const scale=Math.sqrt(1.035/d);p.x*=scale;p.y=-.05+(p.y+.05)*scale;p.z*=scale;}}
function simulate(dt){
  const t=performance.now()*.001,wind=breeze?1:0;
  for(const st of strands){
    for(let n=1;n<st.active;n++){const p=st.pts[n],old=st.prev[n];const vx=(p.x-old.x)*.965,vy=(p.y-old.y)*.965,vz=(p.z-old.z)*.965;st.prev[n].copy(p);const sway=Math.sin(t*1.7+st.sway+n*.48)*(.0009+wind*.006);p.x+=vx+sway+st.impulse.x*(n/st.active);p.y+=vy-.0015+wind*Math.sin(t*1.2+st.theta)*.0018+st.impulse.y*(n/st.active);p.z+=vz+Math.cos(t+st.sway)*(.0006+wind*.003);collideHead(p);}
    st.impulse.multiplyScalar(.82);
    for(let pass=0;pass<2;pass++)for(let n=1;n<st.active;n++){const a=st.pts[n-1],b=st.pts[n],delta=b.clone().sub(a),len=delta.length()||.0001,err=(len-segmentLength)/len*.5;if(n>1)a.addScaledVector(delta,err);b.addScaledVector(delta,-err);}
  }
  const buckets=new Map(),cell=.105;
  for(const st of strands){const n=st.active-1,p=st.pts[n];if(n<3)continue;const key=`${Math.floor(p.x/cell)},${Math.floor(p.y/cell)},${Math.floor(p.z/cell)}`;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket=[]);bucket.push(p);}
  for(const bucket of buckets.values())if(bucket.length>1)for(let a=0;a<bucket.length;a++)for(let b=a+1;b<bucket.length;b++){const d=bucket[b].clone().sub(bucket[a]),len=d.length();if(len>.0001&&len<.07){const push=d.multiplyScalar((.07-len)*.12/len);bucket[a].addScaledVector(push,-1);bucket[b].add(push);}}
  let offset=0;
  for(const st of strands)for(let n=0;n<nodeCount-1;n++){let a,b;if(n<st.active-1){a=st.pts[n];b=st.pts[n+1];}else{a=st.pts[Math.max(0,st.active-1)];b=a;}linePositions[offset++]=a.x;linePositions[offset++]=a.y;linePositions[offset++]=a.z;linePositions[offset++]=b.x;linePositions[offset++]=b.y;linePositions[offset++]=b.z;}
  strandGeometry.attributes.position.needsUpdate=true;strandGeometry.computeBoundingSphere();
}
window.addEventListener('resize',resize);
let previousTime=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=(now-previousTime)/1000;previousTime=now;simulate(dt||.016);renderer.render(scene,camera);}
requestAnimationFrame(animate);refreshStats();setTimeout(()=>document.getElementById('loading').classList.add('hidden'),650);
