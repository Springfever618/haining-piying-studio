const $ = id => document.getElementById(id);
const src = $('source'), dst = $('puppet'), photoCtx = src.getContext('2d'), ctx = dst.getContext('2d');
const names = {head:'头茬',hat:'冠帽',body:'上身',lower:'下身',lu:'左上臂',ll:'左前臂',lh:'左手',ru:'右上臂',rl:'右前臂',rh:'右手',lt:'左大腿',lc:'左小腿',lf:'左足',rt:'右大腿',rc:'右小腿',rf:'右足',prop:'持物'};
const sample = {nose:[251,132],ls:[230,219],rs:[307,216],le:[180,302],re:[343,275],lw:[140,257],rw:[381,228],lp:[241,375],rp:[292,373],lk:[226,502],rk:[311,502],la:[210,625],ra:[330,625],lf:[170,639],rf:[301,641]};
const index = {nose:0,ls:11,rs:12,le:13,re:14,lw:15,rw:16,lp:23,rp:24,lk:25,rk:26,la:27,ra:28,lf:31,rf:32};
const poses = {
  bow:{le:[180,300],re:[360,300],lw:[254,249],rw:[279,247],nose:[252,152]},
  sleeve:{le:[173,285],lw:[103,220],re:[350,226],rw:[409,149]},
  sword:{le:[167,262],lw:[124,185],re:[365,288],rw:[415,258],lk:[207,494],la:[164,620],lf:[126,636],rk:[335,503],ra:[377,625],rf:[343,638]},
  umbrella:{le:[191,288],lw:[152,374],re:[350,272],rw:[370,236]}
};
let joints=structuredClone(sample), picture, frame, detector, upload=0, drag, animated, demonstration, animation=0;
for(const [key,name] of Object.entries(names)) {
  const label=document.createElement('label'), input=document.createElement('input');
  input.type='checkbox';input.checked=true;input.id='part-'+key;
  label.append(input,' '+name);$('parts').append(label);
}
const selected = key => $('part-'+key).checked;
const controls = () => Object.fromEntries(['role','hat','upper','lower','shoe','prop','rods','mainColor','trim','gold','pose'].map(k=>[k,$(k).value]));
function poseJoints(pose=$('pose').value){
  const target=poses[pose];
  if(!target)return joints;
  const a=mid(joints.ls,joints.rs),b=mid(sample.ls,sample.rs);
  const scale=Math.min(1.35,Math.max(.45,Math.hypot(joints.rs[0]-joints.ls[0],joints.rs[1]-joints.ls[1])/77));
  return {...joints,...Object.fromEntries(Object.entries(target).map(([k,p])=>[k,[a[0]+(p[0]-b[0])*scale,a[1]+(p[1]-b[1])*scale]]))};
}
const activeJoints = () => animated || poseJoints();
const edges = [['ls','rs'],['ls','le'],['le','lw'],['rs','re'],['re','rw'],['ls','lp'],['rs','rp'],['lp','rp'],['lp','lk'],['lk','la'],['la','lf'],['rp','rk'],['rk','ra'],['ra','rf']];
const mid = (a,b) => a.map((v,i)=>(v+b[i])/2);
function poly(points,colour,stroke='#26201b',width=2.5){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  if(colour){ctx.fillStyle=colour;ctx.fill()}ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();
}
function line(a,b,colour,width=2){
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.stroke();
}
function dot([x,y],r,fill,stroke='#35261d'){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();
}
function shift([x,y],dx,dy){return [x+dx,y+dy]}
function limb(a,b,start,end,colour,trim,gold,joint=true){
  const l=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])), nx=(a[1]-b[1])/l, ny=(b[0]-a[0])/l;
  const edge=(p,w)=>shift(p,nx*w,ny*w);
  poly([edge(a,start),edge(b,end),edge(b,-end),edge(a,-start)],colour);
  const band = a.map((x,i)=>x+(b[i]-x)*.82), bw=start+(end-start)*.82;
  poly([edge(b,end),edge(band,bw),edge(band,-bw),edge(b,-end)],trim,gold,1.5);
  if(joint)dot(a,5,gold);
}
function draw(){
  photoCtx.clearRect(0,0,540,720);
  if(picture)photoCtx.drawImage(picture,...frame);
  else{photoCtx.fillStyle='#e9e8df';photoCtx.fillRect(0,0,540,720)}
  photoCtx.strokeStyle='#487c6b';photoCtx.lineWidth=3;
  for(const [a,b] of edges){photoCtx.beginPath();photoCtx.moveTo(...joints[a]);photoCtx.lineTo(...joints[b]);photoCtx.stroke()}
  for(const [key,[x,y]] of Object.entries(joints)){
    photoCtx.beginPath();photoCtx.arc(x,y,7,0,Math.PI*2);photoCtx.fillStyle=key===drag?'#a53631':'#fffae9';photoCtx.fill();photoCtx.stroke();
  }
  ctx.clearRect(0,0,540,720); const j=activeJoints(), c=controls(), gold=c.gold, red=c.trim, green=c.mainColor;
  if(c.rods==='显示') for(const side of ['l','r'])if(selected(side+'h'))line(j[side+'w'],shift(j[side+'w'],side==='l'?-95:95,85),'#302620',2);
  const skin={旦:'#edd2ab',生:'#dfba8c',净:'#a44530',末:'#c7a07b',丑:'#e4c799'}[c.role];
  const wide=c.upper==='靠'?28:c.upper==='蟒袍'?31:c.upper==='衫'?16:22;
  for(const side of ['r','l']){
    const p=j[side+'p'],k=j[side+'k'],a=j[side+'a'],f=j[side+'f'];
    if(selected(side+'t'))limb(p,k,21,18,red,green,gold);
    if(selected(side+'c'))limb(k,a,17,13,red,green,gold);
    if(selected(side+'f'))limb(a,f,c.shoe==='战靴'?16:12,c.shoe==='弓靴'?7:10,'#302520',red,gold);
  }
  const chest=mid(j.ls,j.rs), hip=mid(j.lp,j.rp), [x,y]=j.nose;
  if(c.upper==='靠'&&selected('body')){const back=shift(mid(j.ls,j.rs),-18,6);for(const [ang,col] of [[-2.3,red],[-2.0,gold],[-1.7,red],[-1.4,gold]]){const top=[back[0]+Math.cos(ang)*150,back[1]+Math.sin(ang)*150];line(back,top,'#5a4632',3);poly([top,[top[0]+Math.cos(ang+1.57)*26,top[1]+Math.sin(ang+1.57)*26],[back[0]+Math.cos(ang)*70+Math.cos(ang+1.57)*22,back[1]+Math.sin(ang)*70+Math.sin(ang+1.57)*22],[back[0]+Math.cos(ang)*70,back[1]+Math.sin(ang)*70]],col,'#26201b',1.5)}}
  if(selected('lower')&&c.lower!=='裤'){
    const hem=mid(j.lk,j.rk), flare=c.lower==='裙'?44:29;
    const a=shift(j.lp,-23,-27), b=shift(j.rp,22,-27), l=shift(hem,-flare,54), r=shift(hem,flare,54);
    poly([a,b,r,l],green); poly([shift(l,2,-12),shift(r,-2,-12),r,l],red,gold);
    for(const delta of [-22,0,22])line(shift(hip,delta,-12),shift(hem,delta*1.5,39),gold,1.4);
  }
  if(selected('body')){
    poly([shift(j.ls,-12,-14),shift(j.rs,12,-14),shift(j.rp,22,2),shift(j.lp,-22,2)],green);
    poly([shift(j.ls,-8,-12),shift(chest,10,63),shift(j.rs,4,-12),shift(chest,-6,11)],red,gold);
    poly([shift(j.lp,-22,-8),shift(j.rp,22,-8),shift(j.rp,22,9),shift(j.lp,-22,9)],red,gold);
    for(const dy of [45,67,89]) if(y+dy<hip[1]-20)dot(shift(chest,0,dy),4,gold);
    if(c.upper==='花衣'){for(const [dx,dy] of [[-30,30],[24,34],[-14,80],[30,92],[-34,118],[10,128]]){const q=shift(chest,dx,dy);if(q[1]<hip[1]){for(let t=0;t<5;t++){const an=t*Math.PI*2/5;dot([q[0]+Math.cos(an)*6,q[1]+Math.sin(an)*6],4.5,red,gold)}dot(q,3.5,gold)}}}
    if(c.upper==='蟒袍'){const q=shift(chest,0,58);dot(q,27,red,gold);dot(q,19,green,gold);ctx.beginPath();ctx.moveTo(q[0]-14,q[1]+4);for(let t=0;t<=6;t++)ctx.lineTo(q[0]-14+t*4.7,q[1]+4+(t%2?-9:9));ctx.strokeStyle=gold;ctx.lineWidth=3;ctx.stroke();poly([shift(j.lp,-26,-22),shift(j.rp,26,-22),shift(j.rp,26,-9),shift(j.lp,-26,-9)],gold,'#26201b',2);for(const dx of [-16,0,16])dot(shift(hip,dx,-15),4,'#e8f0d8');}
    if(c.upper==='靠'){for(let r=0;r<4;r++)for(let k=-2;k<=2;k++){const q=shift(chest,k*15+(r%2)*7,26+r*20);if(q[1]<hip[1]-6){ctx.beginPath();ctx.arc(q[0],q[1],8,0,Math.PI);ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.stroke()}}dot(shift(chest,0,40),13,gold,red);}
    if(c.upper==='衫'){line(shift(j.ls,6,-10),shift(chest,0,40),gold,1.5);line(shift(j.rs,-6,-10),shift(chest,0,40),gold,1.5);}
  }
  for(const side of ['r','l']){
    const s=j[side+'s'],e=j[side+'e'],w=j[side+'w'];
    if(selected(side+'u'))limb(s,e,wide,wide*.88,green,red,gold);
    if(selected(side+'l'))limb(e,w,wide*.86,wide*(c.upper==='靠'?.64:1.08),green,red,gold);
    if(selected(side+'h'))dot(w,10,skin);
  }
  if(selected('head')){
    limb(shift(chest,0,-4),[x+22,y+48],9,10,skin,skin,gold,false);
    poly([[x+8,y-44],[x+46,y-42],[x+60,y-15],[x+52,y+30],[x+30,y+51],[x+8,y+45],[x-3,y+31],[x-2,y+17],[x-15,y+9],[x-4,y-1],[x,y-22]],skin);
    poly([[x+2,y-23],[x+7,y-47],[x+34,y-56],[x+54,y-45],[x+65,y-22],[x+54,y+22],[x+45,y-8],[x+27,y-31]],'#282221');
    if(c.role==='净'){poly([[x-2,y-10],[x+29,y-19],[x+17,y+10],[x+7,y+14]],'#282221');poly([[x+12,y-30],[x+40,y-36],[x+30,y-14]],'#f3ecd8','#282221',1.5);line([x+2,y+30],[x+40,y+36],'#f3ecd8',4);}
    line([x+1,y-9],[x+16,y-12],'#3d281f',2);dot([x+7,y-3],2.7,'#251c17');
    if(c.role==='末')poly([[x-2,y+24],[x+30,y+30],[x+34,y+112],[x+16,y+120],[x+2,y+100]],'#2b2522');
    if(c.role==='丑'){poly([[x-6,y-14],[x+20,y-14],[x+20,y+14],[x-6,y+14]],'#fbf6ea','#3d281f',1.5);}
    line([x-1,y+22],[x+9,y+23],red,2);
  }
  if(selected('hat')&&c.hat!=='无'){
    const h=c.hat==='武盔'?38:25;
    poly([[x-1,y-28],[x+5,y-48],[x+29,y-48-h],[x+56,y-49],[x+60,y-30]],c.hat==='文生巾'?'#322724':red,gold);
    if(c.hat==='花冠')for(const dx of [5,24,44])dot([x+dx,y-45],8,gold);
    if(c.hat==='武盔')line([x+36,y-65],[x+80,y-112],red,5);
  }
  const w=j.rw; const prop=c.prop!=='无'?c.prop:({sword:'长剑',umbrella:'油纸伞'}[demonstration || c.pose]||'无');
  if(selected('prop')){
    if(prop==='长剑'){line(shift(w,-16,15),shift(w,97,-89),gold,4);poly([shift(w,0,-3),shift(w,88,-102),shift(w,99,-111),shift(w,94,-93),shift(w,7,5)],'#ded5bc')}
    if(prop==='折扇')poly([w,shift(w,-11,-59),shift(w,21,-70),shift(w,56,-47),shift(w,62,-22)],gold,red);
    if(prop==='油纸伞'){const [u,v]=shift(w,11,-75);line(w,[u,v],gold,4);poly([[u-87,v+4],[u-51,v-23],[u,v-38],[u+53,v-25],[u+88,v+4]],red,gold);line([u,v-36],[u,v+4],gold)}
  }
}
async function poseDetector(){
  if(!detector)detector=(async()=>{
    const version='0.10.21';
    const mod=await import(new URL('vendor/vision_bundle.mjs',location.href).href);
    const assets=await mod.FilesetResolver.forVisionTasks(new URL('vendor/wasm',location.href).href);
    return mod.PoseLandmarker.createFromOptions(assets,{baseOptions:{modelAssetPath:new URL('vendor/pose_landmarker_lite.task',location.href).href},runningMode:'IMAGE',numPoses:1});
  })().catch(err=>{detector=undefined;throw err});
  return detector;
}
$('image').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  stopDemonstration();const seq=++upload;const url=URL.createObjectURL(file);const img=new Image();
  try{
    img.src=url;await img.decode();if(seq!==upload)return;
    picture=img;const scale=Math.min(540/img.width,720/img.height), w=img.width*scale,h=img.height*scale;
    frame=[(540-w)/2,(720-h)/2,w,h];joints=structuredClone(sample);$('pose').value='photo';draw();
    $('status').textContent='正在识别头部与四肢关节…';
    const pose=await poseDetector();if(seq!==upload)return;
    const result=pose.detect(img).landmarks[0];if(!result)throw Error('未发现清晰的单人姿态');
    joints=Object.fromEntries(Object.entries(index).map(([key,i])=>[key,[frame[0]+result[i].x*w,frame[1]+result[i].y*h]]));
    $('status').textContent='姿态已识别，可以拖动关节微调。';draw();
  }catch(err){if(seq===upload)$('status').textContent='自动识别失败，可拖动示例关节手动匹配照片。'}
  finally{URL.revokeObjectURL(url);if(seq===upload)e.target.value=''}
});
$('sample').addEventListener('click',()=>{upload++;stopDemonstration();picture=undefined;joints=structuredClone(sample);$('pose').value='photo';$('status').textContent='已恢复示例。';draw()});
function pos(e){const r=src.getBoundingClientRect();return [(e.clientX-r.left)*540/r.width,(e.clientY-r.top)*720/r.height]}
src.addEventListener('pointerdown',e=>{
  const [x,y]=pos(e);drag=Object.keys(joints).find(k=>Math.hypot(joints[k][0]-x,joints[k][1]-y)<15);
  if(drag){stopDemonstration();$('pose').value='photo';src.setPointerCapture(e.pointerId);draw()}
});
src.addEventListener('pointermove',e=>{if(drag){joints[drag]=pos(e);draw()}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])src.addEventListener(event,()=>{drag=undefined;draw()});
function stopDemonstration(){
  animation++;
  animated=undefined;
  demonstration=undefined;
  $('animate').textContent='演示动作';
}
const rolePresets={旦:{hat:'花冠',upper:'花衣',lower:'裙',shoe:'弓靴',mainColor:'#c23b5e',trim:'#2f6b5a',gold:'#e2bf72'},生:{hat:'文生巾',upper:'衫',lower:'袍摆',shoe:'朝靴',mainColor:'#2e5d8c',trim:'#e6ddc4',gold:'#d7b46a'},净:{hat:'武盔',upper:'靠',lower:'裤',shoe:'战靴',mainColor:'#25221f',trim:'#b3322a',gold:'#dcb56c'},末:{hat:'文生巾',upper:'蟒袍',lower:'袍摆',shoe:'朝靴',mainColor:'#7a5530',trim:'#2f5d4a',gold:'#d9b25f'},丑:{hat:'无',upper:'衫',lower:'裤',shoe:'平底靴',mainColor:'#d9cfae',trim:'#3a5f8a',gold:'#b58d4a'}};
$('role').addEventListener('input',()=>{const pr=rolePresets[$('role').value];if(pr)for(const [k,v] of Object.entries(pr))$(k).value=v;});
document.querySelector('.controls').addEventListener('input',()=>{stopDemonstration();draw()});
$('animate').addEventListener('click',()=>{
  if(demonstration){stopDemonstration();draw();return}
  const current=$('pose').value;
  demonstration=poses[current]?current:'bow';
  const startPose=poseJoints(),target=poseJoints(demonstration);
  const entry=demonstration===current?joints:startPose;
  const token=++animation,start=performance.now();
  $('animate').textContent='停止演示';
  const tick=now=>{
    if(token!==animation)return;
    const elapsed=now-start;
    if(elapsed>=1700){stopDemonstration();draw();return}
    const returning=elapsed>1100;
    const t=returning?(elapsed-1100)/600:Math.min(1,elapsed/600);
    const e=t*t*(3-2*t);
    const from=returning?target:entry, to=returning?startPose:target;
    animated=Object.fromEntries(Object.entries(from).map(([k,p])=>[k,p.map((v,i)=>v+(to[k][i]-v)*e)]));
    draw();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
$('save').addEventListener('click',()=>{stopDemonstration();draw();dst.toBlob(b=>{if(b)download(b,'海宁皮影.png')})});
$('json').addEventListener('click',()=>download(new Blob([JSON.stringify({joints:poseJoints(),style:controls(),parts:Object.fromEntries(Object.keys(names).map(k=>[k,selected(k)]))},null,2)],{type:'application/json'}),'海宁皮影部件.json'));
draw();

function compareExample(){
  const key=$('example').value;
  $('off').src='./comparisons/'+key+'_G2.jpg';
  $('on').src='./comparisons/'+key+'_G3.jpg';
  $('compareStatus').textContent='固定种子的实验样例';
}
$('example').addEventListener('change',compareExample);
compareExample();
fetch('./api/status').then(r=>r.ok?r.json():null).then(data=>{
  if(data?.gpu){$('compareNow').hidden=false;$('compareStatus').textContent='已连接实验室 GPU，可用当前影偶生成。'}
}).catch(()=>{});
$('compareNow').addEventListener('click',async()=>{
  stopDemonstration();draw();
  const b=$('compareNow');b.disabled=true;$('example').disabled=true;
  $('compareStatus').textContent='正在分别生成关闭和开启 LoRA 的两张图…';
  try{
    const response=await fetch('./api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seed:11201,image:dst.toDataURL('image/png')})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'生成失败');
    $('off').src=result.off;$('on').src=result.on;
    $('compareStatus').textContent='同一影偶底图、提示词和种子生成，种子 '+result.seed+'。';
  }catch(err){$('compareStatus').textContent=err.message;}
  finally{b.disabled=false;$('example').disabled=false;}
});

const tabs = [$('editorTab'), $('compareTab')];
function selectTab(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute('aria-controls')).hidden = !active;
  }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs.find(item => item !== tab);
    selectTab(next);
    next.focus();
  });
}

// ---- 体验码：记录用过的功能和体验时长，供问卷核对（不记录照片或任何个人信息） ----
const QUESTIONNAIRE_URL = '';
const EXP = {t0: Date.now(), mask: 0};
const BITS = {photo:1, sample:2, drag:4, role:8, costume:16, pose:32, lora:64, export:128};
const mark = k => { EXP.mask |= BITS[k]; renderCode(); };
$('image').addEventListener('change', () => mark('photo'));
$('sample').addEventListener('click', () => mark('sample'));
src.addEventListener('pointerdown', () => mark('drag'));
$('role').addEventListener('input', () => mark('role'));
for (const id of ['hat','upper','lower','shoe','prop','mainColor','trim','gold','rods']) $(id).addEventListener('input', () => mark('costume'));
$('pose').addEventListener('input', () => mark('pose'));
$('animate').addEventListener('click', () => mark('pose'));
$('compareTab').addEventListener('click', () => mark('lora'));
$('example').addEventListener('change', () => mark('lora'));
$('save').addEventListener('click', () => mark('export'));
$('json').addEventListener('click', () => mark('export'));
const B36 = (n, w) => Math.max(0, Math.floor(n)).toString(36).toUpperCase().padStart(w, '0').slice(-w);
function expCode() {
  const stamp = B36((EXP.t0 - Date.UTC(2026, 10, 1)) / 60000, 5);
  const body = stamp + B36(EXP.mask, 2) + B36(Math.min(46655, (Date.now() - EXP.t0) / 1000), 3);
  let s = 7; for (const [i, ch] of [...('hnsp' + body)].entries()) s = (s * 31 + ch.charCodeAt(0) * (i + 3)) % 1296;
  const code = body + B36(s, 2);
  return code.slice(0, 4) + '-' + code.slice(4, 8) + '-' + code.slice(8);
}
const usedCount = () => [...Object.values(BITS)].filter(b => EXP.mask & b).length;
const panel = document.createElement('section');
panel.className = 'panel'; panel.id = 'codePanel';
panel.innerHTML = '<h2>体验码</h2><p id="codeHint" class="help"></p><p id="codeBox" style="font:600 28px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.06em;margin:8px 0" hidden></p><p class="tools" id="codeTools" hidden><button type="button" id="copyCode">复制体验码</button><a id="goSurvey" target="_blank" rel="noopener" hidden>去填体验问卷</a></p>';
document.querySelector('main').append(panel);
function renderCode() {
  const secs = (Date.now() - EXP.t0) / 1000, ok = usedCount() >= 2 && secs >= 45;
  $('codeHint').textContent = ok ? '请把这串体验码填进问卷。码会随你继续体验而变化，以填写时页面上显示的为准。'
    : '请至少体验 45 秒，并试用两种以上功能（比如上传照片或拖动关节、换行当或服饰、换动作），这里会出现体验码，问卷里需要填写。';
  $('codeBox').hidden = $('codeTools').hidden = !ok;
  if (ok) $('codeBox').textContent = expCode();
  const go = $('goSurvey'); if (QUESTIONNAIRE_URL) { go.href = QUESTIONNAIRE_URL; go.hidden = false; }
}
$('copyCode').addEventListener('click', () => {
  const t = $('codeBox').textContent, b = $('copyCode');
  const sel = () => { const r = document.createRange(); r.selectNodeContents($('codeBox')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '已选中，长按或 Ctrl+C 复制'; };
  try { navigator.clipboard.writeText(t).then(() => { b.textContent = '已复制'; }, sel); } catch (e) { sel(); }
});
setInterval(renderCode, 5000); renderCode();
