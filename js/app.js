(()=> {
 const canvas=document.getElementById('board'),ctx=canvas.getContext('2d'),area=canvas.parentElement;
 let tool='pen',drawing=false,start=null,last=null,strokes=[],redoStack=[],current=null;
 const color='#63f56c';
 function resize(){const old=document.createElement('canvas');old.width=canvas.width;old.height=canvas.height;if(canvas.width&&canvas.height)old.getContext('2d').drawImage(canvas,0,0);const r=area.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';redraw();if(old.width&&old.height&&strokes.length===0)ctx.drawImage(old,0,0,old.width,old.height,0,0,r.width,r.height)}
 function redraw(){const r=area.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);for(const s of strokes)paint(s);if(current)paint(current)}
 function paint(s){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=s.tool==='eraser'?'#252525':s.color;ctx.lineWidth=s.tool==='eraser'?24:s.width;ctx.beginPath();if(s.tool==='circle'){ctx.ellipse((s.x+s.x2)/2,(s.y+s.y2)/2,Math.max(1,Math.abs(s.x2-s.x)/2),Math.max(1,Math.abs(s.y2-s.y)/2),0,0,Math.PI*2)}else if(s.tool==='line'){ctx.moveTo(s.x,s.y);ctx.lineTo(s.x2,s.y2)}else{s.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y))}ctx.stroke();ctx.restore()}
 function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drawing=true;start=pos(e);last=start;current={tool,color,width:4,x:start.x,y:start.y,x2:start.x,y2:start.y,points:[start]};});
 canvas.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);if(tool==='pen'||tool==='eraser')current.points.push(p);else{current.x2=p.x;current.y2=p.y}last=p;redraw()});
 function finish(){if(!drawing)return;drawing=false;if(current){strokes.push(current);redoStack=[];current=null;redraw()}}
 canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));canvas.style.cursor=tool==='eraser'?'cell':'crosshair'}));
 document.getElementById('undo').onclick=()=>{if(strokes.length){redoStack.push(strokes.pop());redraw()}};
 document.getElementById('redo').onclick=()=>{if(redoStack.length){strokes.push(redoStack.pop());redraw()}};
 document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.download='macae-drawing.png';a.href=canvas.toDataURL('image/png');a.click();notify('Drawing downloaded')};
 function notify(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1500)}
 document.getElementById('emoji').onclick=()=>{const i=document.getElementById('chatInput');i.value+='☺';i.focus()};
 document.getElementById('chatForm').addEventListener('submit',e=>{e.preventDefault();const i=document.getElementById('chatInput'),v=i.value.trim();if(!v)return;const row=document.createElement('div');row.className='msg mine';const av=document.createElement('div');av.className='avatar';av.textContent='😎';const b=document.createElement('div');b.className='bubble';const small=document.createElement('small');small.textContent='You · now';b.append(small,document.createTextNode(v));row.append(av,b);document.getElementById('messages').append(row);i.value='';document.getElementById('messages').scrollTop=99999});
 let seconds=60;setInterval(()=>{seconds=seconds>0?seconds-1:60;document.getElementById('timer').textContent='00:'+String(seconds).padStart(2,'0')},1000);
 const words=['SUNFLOWER','ROCKET','PIZZA','RAINBOW','GUITAR'];let wi=0;document.getElementById('word').textContent='WORD';document.getElementById('word').title='Mystery word';document.getElementById('word').addEventListener('click',()=>{wi=(wi+1)%words.length;document.getElementById('word').textContent=words[wi]});
 new ResizeObserver(resize).observe(area);resize();
})();
