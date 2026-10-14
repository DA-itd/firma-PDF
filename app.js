(() => {
  const $ = id => document.getElementById(id);
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdfInput=$('pdfFiles'), sigInput=$('sigFiles'), summary=$('fileSummary'), startBtn=$('startBtn');
  const editor=$('editor'), uploadPanel=document.querySelector('.upload-panel');
  const canvas=$('pdfCanvas'), ctx=canvas.getContext('2d'), overlay=$('overlay'), paper=$('paper');
  let pdfs=[], signatures=[], activeSig=0, placements=[], currentPdfIndex=0, renderScale=1, baseWidth=0, baseHeight=0;
  const imageData = file => new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  function updateSummary(){
    pdfs=Array.from(pdfInput.files||[]); signatures=Array.from(sigInput.files||[]).slice(0,5);
    const problems=[]; if(!pdfs.length) problems.push('selecciona al menos un PDF'); if(!signatures.length) problems.push('selecciona al menos una firma PNG');
    summary.textContent=problems.length ? `Para continuar, ${problems.join(' y ')}.` : `${pdfs.length} PDF${pdfs.length===1?'':'s'} y ${signatures.length} firma${signatures.length===1?'':'s'} listos. Máximo 5 firmas; la aplicación procesa los archivos localmente.`;
    if((sigInput.files||[]).length>5) summary.textContent+=' Solo se usarán las primeras 5 imágenes de firma.';
    startBtn.disabled=!(pdfs.length&&signatures.length);
  }
  pdfInput.addEventListener('change',updateSummary); sigInput.addEventListener('change',updateSummary);
  async function startEditor(){
    try{
      if(!window.pdfjsLib||!window.PDFLib||!window.JSZip) throw new Error('No se pudieron cargar las bibliotecas necesarias. Comprueba tu conexión a Internet y recarga la página.');
      placements=[]; activeSig=0; currentPdfIndex=0;
      $('signatureList').innerHTML=''; $('pdfSelect').innerHTML='';
      signatures=signatures.map((file,index)=>({file,index,url:URL.createObjectURL(file),data:null}));
      for(const s of signatures){s.data=await imageData(s.file);const item=document.createElement('button');item.type='button';item.className='sig-item'+(s.index===activeSig?' active':'');item.innerHTML=`<img alt="Vista previa de firma ${s.index+1}"><span></span>`;item.querySelector('img').src=s.url;item.querySelector('span').textContent=s.file.name;item.addEventListener('click',()=>{activeSig=s.index;document.querySelectorAll('.sig-item').forEach((el,i)=>el.classList.toggle('active',i===activeSig));});$('signatureList').appendChild(item);}
      pdfs.forEach((file,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=file.name;$('pdfSelect').appendChild(opt)});
      uploadPanel.classList.add('hidden');editor.classList.remove('hidden');await renderPdf(0);updatePlacementCount();editor.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){alert(e.message||String(e));}
  }
  startBtn.addEventListener('click',startEditor);
  async function renderPdf(index){
    currentPdfIndex=index; $('pdfSelect').value=String(index); $('status').textContent='';
    const bytes=await pdfs[index].arrayBuffer(); const doc=await pdfjsLib.getDocument({data:bytes}).promise; const page=await doc.getPage(1);
    const natural=page.getViewport({scale:1}); const maxWidth=Math.min(760, paper.parentElement.clientWidth||760); renderScale=Math.min(maxWidth/natural.width,1.35); const viewport=page.getViewport({scale:renderScale});
    canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';baseWidth=viewport.width;baseHeight=viewport.height;
    await page.render({canvasContext:ctx,viewport}).promise;overlay.style.width=baseWidth+'px';overlay.style.height=baseHeight+'px';
    $('pageInfo').textContent=`${pdfs[index].name} · primera página`; renderPlacements();
  }
  $('pdfSelect').addEventListener('change',e=>renderPdf(Number(e.target.value)).catch(showError));
  function signatureDims(sigIndex){const im=new Image();return new Promise(resolve=>{im.onload=()=>resolve({w:im.naturalWidth,h:im.naturalHeight});im.src=signatures[sigIndex].url})}
  async function addPlacement(x,y,sigIndex=activeSig){const d=await signatureDims(sigIndex);const scale=Number($('sizeRange').value)/100;const w=Math.min(baseWidth*.8,Math.max(55,baseWidth*.18*scale));const h=w*d.h/d.w;placements.push({sigIndex,x:Math.max(0,Math.min(x,baseWidth-w)),y:Math.max(0,Math.min(y,baseHeight-h)),w,h,scale});renderPlacements();updatePlacementCount();}
  function renderPlacements(){overlay.innerHTML='';placements.forEach((p,i)=>{const s=signatures[p.sigIndex];const im=document.createElement('img');im.className='placed-signature';im.src=s.url;im.alt='Firma colocada';im.draggable=false;im.style.left=p.x+'px';im.style.top=p.y+'px';im.style.width=p.w+'px';im.style.height=p.h+'px';im.addEventListener('pointerdown',e=>dragStart(e,i,im));im.addEventListener('click',()=>{document.querySelectorAll('.placed-signature').forEach(el=>el.classList.remove('selected'));im.classList.add('selected')});overlay.appendChild(im);});}
  function dragStart(e,index,el){e.preventDefault();const p=placements[index],startX=e.clientX,startY=e.clientY,origX=p.x,origY=p.y;el.classList.add('selected');el.setPointerCapture?.(e.pointerId);function move(ev){const rect=paper.getBoundingClientRect();p.x=Math.max(0,Math.min(baseWidth-p.w,origX+(ev.clientX-startX)*baseWidth/rect.width));p.y=Math.max(0,Math.min(baseHeight-p.h,origY+(ev.clientY-startY)*baseHeight/rect.width));el.style.left=p.x+'px';el.style.top=p.y+'px';}function up(){window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);updatePlacementCount()}window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}
  overlay.addEventListener('click',e=>{if(e.target!==overlay)return;const rect=paper.getBoundingClientRect();const x=(e.clientX-rect.left)*baseWidth/rect.width,y=(e.clientY-rect.top)*baseHeight/rect.width;addPlacement(x,y).catch(showError)});
  $('sizeRange').addEventListener('input',e=>$('sizeValue').textContent=e.target.value+'%');
  $('clearBtn').addEventListener('click',()=>{placements=[];renderPlacements();updatePlacementCount()});
  function updatePlacementCount(){$('placementCount').textContent=`${placements.length} firma${placements.length===1?'':'s'} colocada${placements.length===1?'':'s'}`}
  function showError(e){$('status').className='status error';$('status').textContent=e.message||String(e)}
  $('backBtn').addEventListener('click',()=>{editor.classList.add('hidden');uploadPanel.classList.remove('hidden');uploadPanel.scrollIntoView({behavior:'smooth'})});
  $('processBtn').addEventListener('click',processFiles);
  async function processFiles(){
    const status=$('status'); if(!placements.length){status.className='status error';status.textContent='Coloca al menos una firma sobre la vista previa antes de procesar.';return}
    const button=$('processBtn');button.disabled=true;status.className='status';status.textContent='Procesando documentos en este navegador… No cierres esta pestaña.';
    try{
      const zip=new JSZip();
      for(let i=0;i<pdfs.length;i++){
        status.textContent=`Procesando ${i+1} de ${pdfs.length}: ${pdfs[i].name}`;
        const bytes=await pdfs[i].arrayBuffer();const doc=await PDFLib.PDFDocument.load(bytes);const page=doc.getPages()[0];const pageSize=page.getSize();
        // Coordinates are relative to the rendered preview, with origin at top-left.
        for(const p of placements){const sig=signatures[p.sigIndex];const png=await doc.embedPng(await sig.file.arrayBuffer());const x=(p.x/baseWidth)*pageSize.width;const w=(p.w/baseWidth)*pageSize.width;const h=(p.h/baseHeight)*pageSize.height;const y=pageSize.height-((p.y/baseHeight)*pageSize.height)-h;page.drawImage(png,{x,y,width:w,height:h});}
        const out=await doc.save();const name=pdfs[i].name.replace(/\.pdf$/i,'')+'_firmado.pdf';zip.file(name,out);
      }
      status.textContent='Preparando archivo ZIP…';const blob=await zip.generateAsync({type:'blob'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='documentos_firmados.zip';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),30000);status.className='status success';status.textContent='¡Listo! Se descargó documentos_firmados.zip. Los PDF originales no se modificaron.';
    }catch(e){showError(e)}finally{button.disabled=false}
  }
})();
