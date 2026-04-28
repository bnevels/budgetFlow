const STORAGE_KEY = 'budget-app-state';
const els = {
  monthlyIncome: document.getElementById('monthlyIncome'),
  rolloverBtn: document.getElementById('rolloverBtn'),
  startCameraBtn: document.getElementById('startCameraBtn'),
  captureReceiptBtn: document.getElementById('captureReceiptBtn'),
  runOcrBtn: document.getElementById('runOcrBtn'),
  cameraVideo: document.getElementById('cameraVideo'),
  captureCanvas: document.getElementById('captureCanvas'),
  receiptAmount: document.getElementById('receiptAmount'),
  receiptNote: document.getElementById('receiptNote'),
  receiptsList: document.getElementById('receiptsList'),
  ocrOutput: document.getElementById('ocrOutput')
};
let stream = null;
let lastCapture = null;
let state = loadState();
function loadState(){ try { return Object.assign({ monthlyIncome: 0, receipts: [] }, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch { return { monthlyIncome: 0, receipts: [] }; } }
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',''':'&#39;'}[m])); }
function render(){
  els.monthlyIncome.value = state.monthlyIncome || 0;
  els.receiptsList.innerHTML = state.receipts.length ? '' : '<p>No receipts saved yet.</p>';
  state.receipts.slice().reverse().forEach(r => {
    const item = document.createElement('div');
    item.className = 'receipt';
    item.innerHTML = `<img src="${r.imageData}" alt="receipt"><div><strong>$${Number(r.total || r.amount || 0).toFixed(2)}</strong><div>${escapeHtml(r.vendor || r.note || '')}</div><div class="ocr-small">${escapeHtml((r.ocrText || '').slice(0,220))}</div><small>${new Date(r.createdAt).toLocaleString()}</small></div>`;
    els.receiptsList.appendChild(item);
  });
}
async function startCamera(){
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  els.cameraVideo.srcObject = stream;
  els.captureReceiptBtn.disabled = false;
  els.runOcrBtn.disabled = false;
}
function stopCamera(){ if(stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } els.captureReceiptBtn.disabled = true; els.runOcrBtn.disabled = true; }
function captureFrame(){
  const video = els.cameraVideo;
  const canvas = els.captureCanvas;
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  lastCapture = canvas.toDataURL('image/png');
  return lastCapture;
}

function parseTotal(text){
  const m = text.match(/(?:total|amount|balance|grand total)[^
\d]{0,30}(\$?\s*\d+[\.,]\d{2})/i) || text.match(/\$\s*\d+[\.,]\d{2}/) || text.match(/\d+[\.,]\d{2}/);
  return m ? String(m[1] || m[0]).replace(/[^\d.,]/g,'').replace(',', '.') : '';
}
function parseVendor(text){
  const lines = text.split(/
+/).map(s=>s.trim()).filter(Boolean);
  return lines[0] || '';
}

function saveReceipt(imageData, ocrText=''){
  state.receipts.push({ id: crypto.randomUUID(), imageData, amount: Number(els.receiptAmount.value || 0), note: els.receiptNote.value.trim(), vendor: parseVendor(ocrText), total: parseTotal(ocrText), ocrText, createdAt: new Date().toISOString() });
  persist(); render();
}


function preprocessCanvas(srcCanvas){
  const out = document.createElement('canvas');
  out.width = srcCanvas.width;
  out.height = srcCanvas.height;
  const ctx = out.getContext('2d');
  ctx.filter = 'contrast(1.35) grayscale(1)';
  ctx.drawImage(srcCanvas, 0, 0);
  return out;
}
async function warpAndThreshold(){
  if(!window.cv || !cv.imread) return preprocessCanvas(els.captureCanvas);
  const src = cv.imread(els.captureCanvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blurred, new cv.Size(5,5), 0);
  cv.Canny(blurred, edges, 75, 200);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  let best = null, bestArea = 0;
  for(let i=0;i<contours.size();i++){
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if(area > bestArea){
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      if(approx.rows === 4){ best = approx; bestArea = area; }
      else approx.delete();
    }
    cnt.delete();
  }
  let resultCanvas = preprocessCanvas(els.captureCanvas);
  if(best){
    const pts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      best.data32F[0], best.data32F[1],
      best.data32F[2], best.data32F[3],
      best.data32F[4], best.data32F[5],
      best.data32F[6], best.data32F[7]
    ]);
    const rect = cv.boundingRect(best);
    const dst = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0, rect.width-1,0, rect.width-1, rect.height-1, 0, rect.height-1]);
    const M = cv.getPerspectiveTransform(pts, dst);
    const warped = new cv.Mat();
    cv.warpPerspective(src, warped, M, new cv.Size(rect.width, rect.height), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    const out = document.createElement('canvas');
    out.width = warped.cols; out.height = warped.rows;
    cv.imshow(out, warped);
    const outCtx = out.getContext('2d');
    const img = outCtx.getImageData(0,0,out.width,out.height);
    for(let i=0;i<img.data.length;i+=4){
      const v = (img.data[i]*0.299 + img.data[i+1]*0.587 + img.data[i+2]*0.114) > 165 ? 255 : 0;
      img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
    }
    outCtx.putImageData(img,0,0);
    resultCanvas = out;
    warped.delete(); M.delete(); pts.delete(); dst.delete();
    best.delete();
  }
  src.delete(); gray.delete(); blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete();
  return resultCanvas;
}

async function preprocessAndOCR(){
  const cleanCanvas = await warpAndThreshold();
  const imageData = cleanCanvas.toDataURL('image/png');
  els.ocrOutput.textContent = 'Preprocessing image...';
  const worker = await Tesseract.createWorker('eng');
  const { data: { text } } = await worker.recognize(imageData, {
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
  });
  await worker.terminate();
  els.ocrOutput.textContent = text || '(no text found)';
  const vendor = parseVendor(text);
  if(vendor) els.receiptNote.value = els.receiptNote.value || vendor;
  const parsedTotal = parseTotal(text);
  if(parsedTotal && !els.receiptAmount.value) els.receiptAmount.value = parsedTotal;
  saveReceipt(imageData, text);
}

async function runOcr(){
  const cleanCanvas = await warpAndThreshold();
  const imageData = cleanCanvas.toDataURL('image/png');
  els.ocrOutput.textContent = 'Reading text...';
  const langs = ['eng','spa'];
  const worker = await Tesseract.createWorker(langs[0]);
  await worker.loadLanguage(langs.join('+'));
  await worker.initialize(langs.join('+'));
  const { data: { text } } = await worker.recognize(imageData);
  await worker.terminate();
  els.ocrOutput.textContent = text || '(no text found)';
  const vendor = parseVendor(text);
  if(vendor) els.receiptNote.value = els.receiptNote.value || vendor;
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/(?:total|amount|balance|grand total)[^
\d]{0,20}(\$?\d+[\.,]\d{2})/i) || text.match(/\$?\d+[\.,]\d{2}/);
  if(amountMatch && !els.receiptAmount.value) els.receiptAmount.value = String(amountMatch[1] || amountMatch[0]).replace('$','').replace(',','');
  saveReceipt(imageData, text);
}
els.monthlyIncome.addEventListener('input', e => { state.monthlyIncome = Number(e.target.value || 0); persist(); });
els.rolloverBtn.addEventListener('click', () => alert('Month rolled over.'));
els.startCameraBtn.addEventListener('click', startCamera);
els.captureReceiptBtn.addEventListener('click', () => { captureFrame(); els.ocrOutput.textContent = 'Image captured. You can read text now or save with current details.'; });
els.runOcrBtn.addEventListener('click', preprocessAndOCR);
window.addEventListener('beforeunload', stopCamera);
if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('sw.js')); }
render();