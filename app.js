const STORAGE_KEY='budget-flow-pro-state';
const THEME_KEY='budget-flow-theme';
const els={
monthlyIncome:document.getElementById('monthlyIncome'),
rolloverBtn:document.getElementById('rolloverBtn'),
startCameraBtn:document.getElementById('startCameraBtn'),
captureReceiptBtn:document.getElementById('captureReceiptBtn'),
runOcrBtn:document.getElementById('runOcrBtn'),
saveReceiptBtn:document.getElementById('saveReceiptBtn'),
clearReceiptsBtn:document.getElementById('clearReceiptsBtn'),
themeToggleBtn:document.getElementById('themeToggleBtn'),
cameraVideo:document.getElementById('cameraVideo'),
receiptPreview:document.getElementById('receiptPreview'),
captureCanvas:document.getElementById('captureCanvas'),
receiptAmount:document.getElementById('receiptAmount'),
receiptNote:document.getElementById('receiptNote'),
receiptsList:document.getElementById('receiptsList'),
ocrOutput:document.getElementById('ocrOutput'),
statusMessage:document.getElementById('statusMessage')
};
let stream=null;
let capturedImage=null;
let state=loadState();
function loadState(){try{return Object.assign({monthlyIncome:0,receipts:[]},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch{return{monthlyIncome:0,receipts:[]};}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function setStatus(message){els.statusMessage.textContent=message;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function applyTheme(){const dark=localStorage.getItem(THEME_KEY)==='dark';document.body.classList.toggle('dark',dark);els.themeToggleBtn.textContent=dark?'Light Mode':'Dark Mode';els.themeToggleBtn.setAttribute('aria-pressed',String(dark));}
function toggleTheme(){localStorage.setItem(THEME_KEY,document.body.classList.contains('dark')?'light':'dark');applyTheme();}
function render(){els.monthlyIncome.value=state.monthlyIncome||0;els.receiptsList.innerHTML='';if(!state.receipts.length){els.receiptsList.innerHTML='<p class="helper">No receipts saved yet.</p>';return;}state.receipts.slice().reverse().forEach(r=>{const item=document.createElement('div');item.className='receipt';item.innerHTML=`<img src="${r.imageData}" alt="receipt"><div><strong>$${Number(r.amount||0).toFixed(2)}</strong><div>${escapeHtml(r.note||'')}</div><div class="ocr-small">${escapeHtml((r.ocrText||'').slice(0,220))}</div><small>${new Date(r.createdAt).toLocaleString()}</small></div>`;els.receiptsList.appendChild(item);});}
async function startCamera(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});els.cameraVideo.srcObject=stream;els.captureReceiptBtn.disabled=false;els.runOcrBtn.disabled=false;setStatus('Camera started.');}catch(err){console.error(err);setStatus('Camera failed. Use HTTPS/Netlify and allow camera permissions.');}}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
function captureFrame(){const video=els.cameraVideo;const canvas=els.captureCanvas;if(!video.videoWidth){setStatus('Camera is not ready yet.');return null;}canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);capturedImage=canvas.toDataURL('image/png');els.receiptPreview.src=capturedImage;els.receiptPreview.hidden=false;els.saveReceiptBtn.disabled=false;setStatus('Receipt captured.');return capturedImage;}
function parseTotal(text){const match=text.match(/(?:total|amount|grand total)[^\d]{0,20}(\d+[\.,]\d{2})/i)||text.match(/\b\d+[\.,]\d{2}\b/);return match?String(match[1]||match[0]).replace(',','.'):'';}
async function runOCR(){if(!capturedImage){captureFrame();}if(!capturedImage){return;}try{setStatus('Reading receipt text...');els.ocrOutput.textContent='Scanning receipt...';const worker=await Tesseract.createWorker('eng');const result=await worker.recognize(capturedImage);await worker.terminate();const text=result.data.text||'';els.ocrOutput.textContent=text||'(No text found)';if(!els.receiptNote.value){els.receiptNote.value=text.split('\n').find(Boolean)||'';}const amount=parseTotal(text);if(amount&&!els.receiptAmount.value){els.receiptAmount.value=amount;}setStatus('Receipt text processed.');}catch(err){console.error(err);setStatus('OCR failed. You can still save the receipt manually.');}}
function saveReceipt(){if(!capturedImage){setStatus('Capture a receipt first.');return;}const receipt={id:crypto.randomUUID(),imageData:capturedImage,amount:Number(els.receiptAmount.value||0),note:els.receiptNote.value.trim(),ocrText:els.ocrOutput.textContent||'',createdAt:new Date().toISOString()};state.receipts.push(receipt);persist();render();els.receiptAmount.value='';els.receiptNote.value='';els.ocrOutput.textContent='';setStatus('Receipt saved successfully.');}
function clearReceipts(){if(confirm('Delete all saved receipts?')){state.receipts=[];persist();render();setStatus('Receipts cleared.');}}
function initTabs(){document.querySelectorAll('.nav-item').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');});});}
els.monthlyIncome.addEventListener('input',e=>{state.monthlyIncome=Number(e.target.value||0);persist();});
els.rolloverBtn.addEventListener('click',()=>setStatus('Month rolled over.'));
els.startCameraBtn.addEventListener('click',startCamera);
els.captureReceiptBtn.addEventListener('click',captureFrame);
els.runOcrBtn.addEventListener('click',runOCR);
els.saveReceiptBtn.addEventListener('click',saveReceipt);
els.clearReceiptsBtn.addEventListener('click',clearReceipts);
els.themeToggleBtn.addEventListener('click',toggleTheme);
window.addEventListener('beforeunload',stopCamera);
applyTheme();
initTabs();
render();
