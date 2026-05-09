const STORAGE_KEY = 'midsouth-utility-app-state';
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
  const m = text.match(/(?:total|amount|balance|grand total)[^\n\d]{0,30}(\$?\s*\d+[\.,]\d{2})/i) || text.match(/\$\s*\d+[\.,]\d{2}/) || text.match(/\b\d+[\.,]\d{2}\b/);
  return m ? String(m[1] || m[0]).replace(/[^\d.,]/g,'').replace(',', '.') : '';
}
function parseVendor(text){
  const lines = text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
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
async function warpAndThreshold(){ return preprocessCanvas(els.captureCanvas); }
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
async function runOcr(){ return preprocessAndOCR(); }
els.monthlyIncome.addEventListener('input', e => { state.monthlyIncome = Number(e.target.value || 0); persist(); });
els.rolloverBtn.addEventListener('click', () => alert('Month rolled over.'));
els.startCameraBtn.addEventListener('click', startCamera);
els.captureReceiptBtn.addEventListener('click', () => { captureFrame(); els.ocrOutput.textContent = 'Image captured. You can read text now or save with current details.'; });
els.runOcrBtn.addEventListener('click', preprocessAndOCR);
window.addEventListener('beforeunload', stopCamera);
if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('sw.js')); }
render();