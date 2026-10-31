(()=>{const messagesEl=document.getElementById('messages');
function refreshMessageTimes(){
 messagesEl.querySelectorAll('.chat-message').forEach(row=>{
  const time=row.querySelector('.chat-meta time');
  if(!time)return;
  let created=Number(row.dataset.createdAt);
  if(!created){
   const match=time.textContent.trim().match(/^(\\d{1,2}):(\\d{2})$/);
   if(match){
    const d=new Date();d.setHours(+match[1],+match[2],0,0);
    if(d.getTime()>Date.now())d.setDate(d.getDate()-1);
    created=d.getTime();
   }else created=Date.now()-60000;
   row.dataset.createdAt=String(created);
  }
  const age=Date.now()-created;
  time.textContent=age<60000?'just now':new Date(created).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 });
}
refreshMessageTimes();
setInterval(refreshMessageTimes,5000);
const canvas=document.getElementById('board'),ctx=canvas.getContext('2d'),area=canvas.parentElement,empty=document.getElementById('emptyState');let canvasLocked=false;const padlockButton=document.getElementById('padlockCheckBtn'),lockIndicator=document.getElementById('canvasLockIndicator');function setCanvasLocked(locked){canvasLocked=locked;area.classList.toggle('canvas-locked',locked);padlockButton.classList.toggle('is-locked',locked);padlockButton.setAttribute('aria-pressed',String(locked));padlockButton.setAttribute('aria-label',locked?'Unlock canvas':'Lock canvas');padlockButton.title=locked?'Unlock canvas':'Lock canvas';lockIndicator.hidden=!locked;canvas.style.pointerEvents=locked?'none':'auto';if(locked){drawing=false;current=null;selectEnd=null;redraw();}}padlockButton.addEventListener('click',()=>setCanvasLocked(!canvasLocked));let tool='pen',drawing=false,current=null,strokes=[],redoStack=[],clipboard=[],selected=[],brush=4,ink='#65ed78',start=null;const clone=x=>JSON.parse(JSON.stringify(x)),pos=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};function bounds(s){return{x:Math.min(...s.points.map(p=>p.x)),y:Math.min(...s.points.map(p=>p.y)),w:Math.max(2,Math.max(...s.points.map(p=>p.x))-Math.min(...s.points.map(p=>p.x))),h:Math.max(2,Math.max(...s.points.map(p=>p.y))-Math.min(...s.points.map(p=>p.y)))}}function paint(s){ctx.save();ctx.strokeStyle=s.tool==='eraser'?'#26272b':s.color;ctx.lineWidth=s.tool==='eraser'?Math.max(18,s.width*4):s.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();s.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore()}let paperStyle='default',paperImage=null;
function drawPaper(w,h){
 ctx.save();
 if(paperStyle==='default'){ctx.fillStyle='#26272b';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff0c';for(let y=10;y<h;y+=22)for(let x=10;x<w;x+=22){ctx.beginPath();ctx.arc(x,y,.8,0,Math.PI*2);ctx.fill()}}
 if(paperStyle==='blank'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}
 if(paperStyle==='lines'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d9e5f5';ctx.lineWidth=1;for(let y=38;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle='#efb3b3';ctx.beginPath();ctx.moveTo(58,0);ctx.lineTo(58,h);ctx.stroke()}
 if(paperStyle==='torn'){ctx.fillStyle='#d8c19a';ctx.fillRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#ead9b8');g.addColorStop(.55,'#c8aa7d');g.addColorStop(1,'#e2cfaa');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#70533318';for(let i=0;i<180;i++){const x=(i*97)%Math.max(1,w),y=(i*53)%Math.max(1,h);ctx.fillRect(x,y,2,2)}ctx.strokeStyle='#8b6a45';ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.strokeRect(18,18,w-36,h-36);ctx.setLineDash([])}
 if(paperStyle==='math'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d8e7f7';ctx.lineWidth=1;for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle='#e8a5a5';ctx.beginPath();ctx.moveTo(64,0);ctx.lineTo(64,h);ctx.stroke();ctx.fillStyle='#8ba2bd';ctx.font='13px "DM Sans"';ctx.fillText('MATHEMATICS',82,28);ctx.font='18px serif';ctx.fillText('x² + y² = r²',82,62);ctx.fillText('∠ABC = 90°',82,90)}
 if(paperStyle==='upload'&&paperImage){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const scale=Math.max(w/paperImage.width,h/paperImage.height);const iw=paperImage.width*scale,ih=paperImage.height*scale;ctx.drawImage(paperImage,(w-iw)/2,(h-ih)/2,iw,ih)}
 ctx.restore();
}
function redraw(){const r=area.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);drawPaper(r.width,r.height);strokes.forEach((s,i)=>{paint(s);if(selected.includes(i)){const b=bounds(s);ctx.save();ctx.strokeStyle='#ff1684';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.strokeRect(b.x-6,b.y-6,b.w+12,b.h+12);ctx.restore()}});if(current)paint(current);if(tool==='select'&&drawing&&start&&selectEnd){const x=Math.min(start.x,selectEnd.x),y=Math.min(start.y,selectEnd.y);ctx.save();ctx.strokeStyle='#333';ctx.fillStyle='rgba(0,0,0,.04)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.fillRect(x,y,Math.abs(selectEnd.x-start.x),Math.abs(selectEnd.y-start.y));ctx.strokeRect(x,y,Math.abs(selectEnd.x-start.x),Math.abs(selectEnd.y-start.y));ctx.restore()}empty.classList.toggle('hidden',strokes.length>0||!!current)}function resize(){const r=area.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);redraw()}function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));canvas.style.cursor=t==='select'?'default':t==='eraser'?'cell':'crosshair'}let selectEnd=null;
canvas.addEventListener('pointerdown',e=>{if(canvasLocked)return;canvas.setPointerCapture(e.pointerId);start=pos(e);drawing=true;if(tool==='select'){selectEnd=start;redraw();return}current={tool:tool==='eraser'?'eraser':'pen',color:ink,width:brush,points:[start]}});
canvas.addEventListener('pointermove',e=>{if(canvasLocked||!drawing)return;const p=pos(e);if(tool==='select'){selectEnd=p;redraw();return}if(current){current.points.push(p);redraw()}});
function finish(){if(canvasLocked||!drawing)return;drawing=false;if(tool==='select'&&start&&selectEnd){const x1=Math.min(start.x,selectEnd.x),y1=Math.min(start.y,selectEnd.y),x2=Math.max(start.x,selectEnd.x),y2=Math.max(start.y,selectEnd.y);if(x2-x1<7&&y2-y1<7){const hit=strokes.map((s,i)=>({i,b:bounds(s)})).filter(o=>start.x>=o.b.x-9&&start.x<=o.b.x+o.b.w+9&&start.y>=o.b.y-9&&start.y<=o.b.y+o.b.h+9).map(o=>o.i);selected=hit.length?hit:[]}else{selected=strokes.map((s,i)=>({i,b:bounds(s)})).filter(o=>o.b.x+o.b.w>=x1&&o.b.x<=x2&&o.b.y+o.b.h>=y1&&o.b.y<=y2).map(o=>o.i)}selectEnd=null;redraw();notify(selected.length?selected.length+' item(s) selected':'No drawing in selection');return}if(current){strokes.push(current);current=null;redoStack=[]}redraw()}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);let lastToolTap={name:'',time:0};const toolPanel=document.createElement('div');toolPanel.className='tool-settings-popover';toolPanel.id='toolSettingsPopover';toolPanel.innerHTML='<div class="tool-settings-title" id="toolSettingsTitle">Pencil settings</div><label id="toolSizeLabel">Nib size <input id="toolSizeRange" type="range" min="1" max="30" value="4"><output id="toolSizeValue">4</output></label><label id="toolColorLabel">Nib color <input id="toolColorInput" type="color" value="#65ed78"></label>';document.body.append(toolPanel);const toolSizeRange=toolPanel.querySelector('#toolSizeRange'),toolSizeValue=toolPanel.querySelector('#toolSizeValue'),toolColorInput=toolPanel.querySelector('#toolColorInput');function openToolSettings(name,button){const r=button.getBoundingClientRect();toolPanel.classList.add('open');toolPanel.dataset.tool=name;toolPanel.querySelector('#toolSettingsTitle').textContent=name==='pen'?'Pencil settings':'Eraser settings';toolPanel.querySelector('#toolSizeLabel').firstChild.textContent=name==='pen'?'Nib size ':'Eraser size ';toolPanel.querySelector('#toolColorLabel').style.display=name==='pen'?'flex':'none';toolSizeRange.min=name==='pen'?'1':'4';toolSizeRange.max=name==='pen'?'30':'60';toolSizeRange.value=brush;toolSizeValue.value=brush;toolSizeValue.textContent=brush;toolColorInput.value=ink;const pw=toolPanel.offsetWidth,ph=toolPanel.offsetHeight;let left=Math.min(window.innerWidth-pw-10,Math.max(10,r.left-pw-10));let top=Math.min(window.innerHeight-ph-10,Math.max(10,r.top));toolPanel.style.left=left+'px';toolPanel.style.top=top+'px'}toolSizeRange.addEventListener('input',()=>{brush=+toolSizeRange.value;toolSizeValue.value=brush;toolSizeValue.textContent=brush});toolColorInput.addEventListener('input',e=>ink=e.target.value);document.getElementById('paletteBtn').addEventListener('click',()=>toolColorInput.click());const backgroundButton=document.getElementById('backgroundBtn');
const paperPicker=document.createElement('div');paperPicker.className='paper-picker';paperPicker.id='paperPicker';
paperPicker.innerHTML='<button type="button" data-paper="default"><span class="paper-thumb paper-default"></span><small>Default</small></button><button type="button" data-paper="blank"><span class="paper-thumb paper-blank"></span><small>Blank</small></button><button type="button" data-paper="lines"><span class="paper-thumb paper-lines"></span><small>Lines</small></button><button type="button" data-paper="torn"><span class="paper-thumb paper-torn"></span><small>Vintage</small></button><button type="button" data-paper="math"><span class="paper-thumb paper-math"></span><small>Math</small></button><button type="button" class="paper-upload" id="paperUpload"><span class="paper-thumb paper-plus">＋</span><small>Add</small></button>';
const paperInput=document.createElement('input');paperInput.type='file';paperInput.accept='image/*';paperInput.hidden=true;area.append(paperPicker,paperInput);
backgroundButton.addEventListener('click',()=>{paperPicker.classList.toggle('open')});
paperPicker.addEventListener('click',e=>{const choice=e.target.closest('[data-paper]');if(choice){paperStyle=choice.dataset.paper;paperImage=null;paperPicker.querySelectorAll('[data-paper]').forEach(b=>b.classList.toggle('selected',b===choice));redraw();paperPicker.classList.remove('open');return}if(e.target.closest('#paperUpload'))paperInput.click()});
paperInput.addEventListener('change',()=>{const file=paperInput.files&&paperInput.files[0];if(!file)return;const image=new Image();image.onload=()=>{paperImage=image;paperStyle='upload';redraw();paperPicker.classList.remove('open');notify('Background added')};image.onerror=()=>notify('Could not open that image');image.src=URL.createObjectURL(file)});
document.querySelectorAll('[data-tool]').forEach(b=>{b.onclick=()=>{setTool(b.dataset.tool);const now=Date.now();if(lastToolTap.name===b.dataset.tool&&now-lastToolTap.time<420){openToolSettings(b.dataset.tool,b);lastToolTap={name:'',time:0}}else{lastToolTap={name:b.dataset.tool,time:now};if(toolPanel.classList.contains('open'))toolPanel.classList.remove('open')}};});document.addEventListener('pointerdown',e=>{if(!e.target.closest('.tool-settings-popover')&&!e.target.closest('[data-tool]'))toolPanel.classList.remove('open')});function undo(){if(strokes.length){redoStack.push(strokes.pop());selected=[];redraw()}}function redo(){if(redoStack.length){strokes.push(redoStack.pop());redraw()}}document.getElementById('undo').onclick=undo;document.getElementById('redo').onclick=redo;document.getElementById('copy').onclick=()=>{if(!selected.length)return notify('Select a drawing first');clipboard=selected.map(i=>clone(strokes[i]));notify('Copied to clipboard')};document.getElementById('cut').onclick=()=>{if(!selected.length)return notify('Select a drawing first');clipboard=selected.map(i=>clone(strokes[i]));strokes=strokes.filter((s,i)=>!selected.includes(i));selected=[];redraw();notify('Cut to clipboard')};document.getElementById('paste').onclick=()=>{if(!clipboard.length)return notify('Nothing to paste yet');clipboard.forEach(s=>{const c=clone(s);c.points=c.points.map(p=>({x:p.x+18,y:p.y+18}));strokes.push(c)});selected=strokes.slice(-clipboard.length).map((_,i)=>strokes.length-clipboard.length+i);redraw();notify('Pasted')};const moreButton=document.getElementById('moreBtn'),moreMenu=document.getElementById('moreMenu'),moreWrap=moreButton.closest('.more-wrap');
function setMoreState(open){
 moreMenu.classList.toggle('open',open);
 moreButton.closest('.toolbar').classList.toggle('more-open',open);
 moreButton.classList.toggle('is-open',open);
 moreButton.setAttribute('aria-expanded',String(open));
 const icon=moreButton.querySelector('.more-cross-icon');
 moreWrap.classList.remove('icon-animating');
 void icon.offsetWidth;
 moreWrap.classList.add('icon-animating');
}
let morePointerHandledAt=0;
moreButton.addEventListener('pointerup',e=>{
 if(e.button!==0&&e.pointerType!=='touch')return;
 e.preventDefault();
 e.stopPropagation();
 morePointerHandledAt=Date.now();
 setMoreState(moreButton.getAttribute('aria-expanded')!=='true');
});
moreButton.addEventListener('click',e=>{
 e.preventDefault();
 e.stopPropagation();
 if(Date.now()-morePointerHandledAt<700)return;
 setMoreState(moreButton.getAttribute('aria-expanded')!=='true');
});
moreButton.querySelector('.more-cross-icon').addEventListener('animationend',()=>moreWrap.classList.remove('icon-animating'));
// Keep the expanded actions open until the user taps the cross again.
function clearCanvas(){
 if(!strokes.length&&!current)return;
 // Use an in-app confirmation: native confirm dialogs can force browsers to exit fullscreen.
 if(document.getElementById('clearCanvasConfirm'))return;
 const overlay=document.createElement('div');
 overlay.id='clearCanvasConfirm';
 overlay.style.cssText='position:absolute;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:#08090bcc;backdrop-filter:blur(4px);';
 const panel=document.createElement('div');
 panel.style.cssText='width:min(340px,100%);padding:22px;border:1px solid #55545d;border-radius:16px;background:#292a30;box-shadow:0 18px 55px #0009;color:#f7f5f8;font:500 14px "DM Sans",sans-serif;';
 const title=document.createElement('strong');title.textContent='Clear canvas?';title.style.cssText='display:block;font:700 20px Outfit,sans-serif;margin-bottom:8px;';
 const message=document.createElement('p');message.textContent='This will remove every drawing from the canvas. This action cannot be undone.';message.style.cssText='margin:0 0 20px;color:#c5c2cc;line-height:1.5;';
 const actions=document.createElement('div');actions.style.cssText='display:flex;justify-content:flex-end;gap:9px;';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.style.cssText='padding:10px 15px;border:1px solid #66636e;border-radius:9px;background:#383941;color:#fff;font-weight:700;';
 const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Clear';confirm.style.cssText='padding:10px 17px;border:0;border-radius:9px;background:#ff1684;color:#fff;font-weight:700;';
 const close=()=>overlay.remove();
 cancel.addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 confirm.addEventListener('click',()=>{
  strokes=[];redoStack=[];selected=[];current=null;drawing=false;redraw();close();notify('Canvas cleared');
 });
 actions.append(cancel,confirm);panel.append(title,message,actions);overlay.append(panel);
 const previousPosition=gameShell.style.position;
 if(getComputedStyle(gameShell).position==='static')gameShell.style.position='relative';
 gameShell.append(overlay);
 cancel.focus();
}document.getElementById('clearBoard').onclick=clearCanvas;document.getElementById('clearCanvasBtn').onclick=clearCanvas;const gameShell=document.querySelector('.game-shell'),expandCanvasButton=document.getElementById('expandCanvasBtn'),expandCanvasPath=expandCanvasButton.querySelector('path');const expandIconPath='M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M8 21H3v-5m0 5 7-7m6 7h5v-5m0 5-7-7',collapseIconPath='M3 3l7 7m-5-1 5 1-1-5M21 3l-7 7m1-5-1 5 5-1M3 21l7-7m-5 1 5-1-1 5M21 21l-7-7m1 5-1-5 5 1';async function toggleCanvasExpand(){const expanded=gameShell.classList.contains('canvas-expanded-fallback')||document.fullscreenElement===gameShell;if(expanded){if(document.fullscreenElement===gameShell)await document.exitFullscreen();gameShell.classList.remove('canvas-expanded-fallback');syncExpandButton();return}try{if(gameShell.requestFullscreen)await gameShell.requestFullscreen();else throw new Error('Fullscreen unavailable')}catch(e){gameShell.classList.add('canvas-expanded-fallback')}syncExpandButton()}expandCanvasButton.addEventListener('click',toggleCanvasExpand);function syncExpandButton(){const expanded=document.fullscreenElement===gameShell||gameShell.classList.contains('canvas-expanded-fallback');expandCanvasPath.setAttribute('d',expanded?collapseIconPath:expandIconPath);expandCanvasButton.setAttribute('aria-pressed',String(expanded));expandCanvasButton.title=expanded?'Restore normal view':'Expand canvas';expandCanvasButton.setAttribute('aria-label',expandCanvasButton.title);const areaRect=area.getBoundingClientRect();if(canvas.width!==Math.round(areaRect.width*Math.min(devicePixelRatio||1,2))||canvas.height!==Math.round(areaRect.height*Math.min(devicePixelRatio||1,2)))resize()}document.addEventListener('fullscreenchange',syncExpandButton);function createBrandedDrawing(){
 const header=96,exportCanvas=document.createElement('canvas'),out=exportCanvas.getContext('2d');
 exportCanvas.width=canvas.width;
 exportCanvas.height=canvas.height+header;
 out.fillStyle='#ffffff';
 out.fillRect(0,0,exportCanvas.width,exportCanvas.height);
 out.fillStyle='#24252b';
 out.font='800 34px Outfit, "DM Sans", sans-serif';
 out.textBaseline='middle';
 out.textAlign='left';
 out.fillText('macae',24,27);
 out.fillStyle='#777984';
 out.font='600 14px "DM Sans", sans-serif';
 out.fillText(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),24,68);
 out.textAlign='right';
 out.fillStyle='#555761';
 out.font='600 15px "DM Sans", sans-serif';
 out.fillText('DRAWN BY ARTIST',Math.max(24,exportCanvas.width-24),48);
 out.textAlign='left';
 out.drawImage(canvas,0,header);
 return exportCanvas;
}
function saveBrandedDrawing(){
 const exportCanvas=createBrandedDrawing();
 const a=document.createElement('a');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 a.download='macae-sketch-'+stamp+'.png';
 a.href=exportCanvas.toDataURL('image/png');
 document.body.append(a);
 a.click();
 a.remove();
}
async function shareBrandedDrawing(){
 const button=document.getElementById('shareBtn');
 if(button.disabled)return;
 button.disabled=true;
 try{
  const blob=await new Promise((resolve,reject)=>createBrandedDrawing().toBlob(b=>b?resolve(b):reject(new Error('Could not create image')),'image/png'));
  const file=new File([blob],'macae-sketch.png',{type:'image/png'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
   await navigator.share({files:[file],title:'My Macae sketch',text:'Check out my drawing on Macae!'});
  }else{
   saveBrandedDrawing();
   notify('Image downloaded — share it from your gallery');
  }
 }catch(error){
  if(error.name!=='AbortError')notify('Sharing is unavailable here. Try Save instead.');
 }finally{
  button.disabled=false;
 }
}

document.getElementById('saveBtn').addEventListener('click',saveBrandedDrawing);
document.getElementById('shareBtn').addEventListener('click',shareBrandedDrawing);
document.getElementById('downloadBoard').onclick=saveBrandedDrawing;document.getElementById('brushSize').oninput=e=>brush=+e.target.value;document.getElementById('inkColor').oninput=e=>ink=e.target.value;let wi=0;const words=['SUNFLOWER','ROCKET','PIZZA','RAINBOW','GUITAR','BUTTERFLY'];document.getElementById('word').onclick=()=>{wi=(wi+1)%words.length;document.getElementById('word').textContent=words[wi]};const trustAction=document.getElementById('trustAction');if(trustAction)trustAction.addEventListener('click',()=>{const trusted=trustAction.classList.toggle('is-trusted');trustAction.setAttribute('aria-label',trusted?'Trusted':'Add trust');});const messages=document.getElementById('messages'),chatScrollLock=document.getElementById('chatScrollLock');let chatScrollLocked=false;chatScrollLock.onclick=()=>{chatScrollLocked=!chatScrollLocked;messages.classList.toggle('scroll-locked',chatScrollLocked);chatScrollLock.classList.toggle('is-locked',chatScrollLocked);chatScrollLock.setAttribute('aria-pressed',String(chatScrollLocked));chatScrollLock.setAttribute('aria-label',chatScrollLocked?'Unlock chat scroll':'Lock chat scroll');chatScrollLock.title=chatScrollLocked?'Unlock chat scroll':'Lock chat scroll';if(chatScrollLocked)messages.scrollTop=messages.scrollHeight;};messages.addEventListener('wheel',e=>{if(chatScrollLocked)e.preventDefault()},{passive:false});messages.addEventListener('touchmove',e=>{if(chatScrollLocked)e.preventDefault()},{passive:false});messages.addEventListener('keydown',e=>{if(chatScrollLocked&&['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))e.preventDefault()});new MutationObserver(records=>{if(chatScrollLocked&&records.some(r=>r.addedNodes.length))messages.scrollTop=messages.scrollHeight}).observe(messages,{childList:true,subtree:true});const emojiButton=document.getElementById('emoji'),emojiPicker=document.getElementById('emojiPicker'),emojiGrid=document.getElementById('emojiGrid'),chatInput=document.getElementById('chatInput');const emojiList='😀 😃 😄 😁 😆 😅 😂 🙂 🙃 😉 😊 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 🤗 🤔 🤫 🤭 🤥 😎 🥳 😏 😒 😔 😢 😭 😡 🤯 😱 😴 🤒 🤧 🥶 🥵 🤠 😇 🤩 🥺 🫡 🫶 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💞 💖 💗 💓 💯 💢 💥 💫 💦 💨 👋 🤚 🖐️ ✋ 🖖 🫱 🫲 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤝 🙏 💪 🦾 🧠 👀 👁️ 👄 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐬 🐳 🦖 🌸 🌻 🌹 🌷 🌼 🍀 🌈 ⭐ 🌟 ✨ ☀️ 🌙 ⚡ 🔥 💧 ❄️ ☁️ 🍎 🍕 🍔 🍟 🌮 🍩 🍪 🎂 🍰 🍫 🍿 ⚽ 🏀 🎮 🎨 🎵 🎸 🚀 🚗 ✈️ 🎁 🏆 💎'.split(' ');emojiList.forEach(symbol=>{const b=document.createElement('button');b.type='button';b.className='emoji-choice';b.textContent=symbol;b.setAttribute('aria-label',symbol);b.addEventListener('click',()=>{const start=chatInput.selectionStart??chatInput.value.length,end=chatInput.selectionEnd??chatInput.value.length;chatInput.value=chatInput.value.slice(0,start)+symbol+chatInput.value.slice(end);const pos=start+symbol.length;chatInput.setSelectionRange(pos,pos);});emojiGrid.append(b)});emojiButton.addEventListener('pointerdown',e=>e.preventDefault());emojiGrid.addEventListener('pointerdown',e=>{if(e.target.closest('.emoji-choice'))e.preventDefault()});emojiButton.onclick=()=>{emojiPicker.hidden=!emojiPicker.hidden;emojiButton.setAttribute('aria-expanded',String(!emojiPicker.hidden));};document.addEventListener('pointerdown',e=>{if(!e.target.closest('#emojiPicker')&&!e.target.closest('#emoji')){emojiPicker.hidden=true;emojiButton.setAttribute('aria-expanded','false')}});document.getElementById('chatForm').onsubmit=e=>{e.preventDefault();const input=document.getElementById('chatInput'),v=input.value.trim();if(!v)return;const row=document.createElement('div');row.className='chat-message theirs';row.dataset.createdAt=String(Date.now());const av=document.createElement('div');av.className='chat-avatar violet-avatar';av.textContent='Y';const content=document.createElement('div');content.className='chat-content';const meta=document.createElement('div');meta.className='chat-meta';const name=document.createElement('strong');name.textContent='You';const time=document.createElement('time');time.textContent='just now';meta.append(name,time);const p=document.createElement('p');p.textContent=v;content.append(meta,p);row.append(av,content);messages.append(row);messages.scrollTop=messages.scrollHeight;input.value=''};function notify(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>el.classList.remove('show'),1500)}let sec=60;setInterval(()=>{sec=sec>0?sec-1:60;document.getElementById('timer').textContent='00:'+String(sec).padStart(2,'0')},1000);document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(k==='p')setTool('pen');if(k==='e')setTool('eraser');if(k==='v')setTool('select');if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();undo()}if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();redo()}});new ResizeObserver(resize).observe(area);resize()})();