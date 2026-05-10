/* === Budget Flow Pro — Application Logic === */

const STORAGE_KEY = 'budget-flow-pro-state';
const THEME_KEY = 'budget-flow-theme';
const SETTINGS_KEY = 'budget-flow-pro-settings';

const CATEGORIES = [
  'Fuel', 'Groceries', 'Utilities', 'Rent / Mortgage', 'Insurance',
  'Medical', 'Vehicle', 'Dining', 'Supplies', 'Travel', 'Business', 'Other'
];

const $ = id => document.getElementById(id);

const els = {
  monthlyIncome: $('monthlyIncome'),
  rolloverBtn: $('rolloverBtn'),
  startCameraBtn: $('startCameraBtn'),
  captureReceiptBtn: $('captureReceiptBtn'),
  runOcrBtn: $('runOcrBtn'),
  saveReceiptBtn: $('saveReceiptBtn'),
  clearReceiptsBtn: $('clearReceiptsBtn'),
  themeToggleBtn: $('themeToggleBtn'),
  cameraVideo: $('cameraVideo'),
  receiptPreview: $('receiptPreview'),
  captureCanvas: $('captureCanvas'),
  receiptAmount: $('receiptAmount'),
  receiptNote: $('receiptNote'),
  receiptCategory: $('receiptCategory'),
  receiptsList: $('receiptsList'),
  ocrOutput: $('ocrOutput'),
  statusMessage: $('statusMessage'),
  categorySummary: $('categorySummary'),
  exportPdfBtn: $('exportPdfBtn'),
  exportJsonBtn: $('exportJsonBtn'),
  adminMetrics: $('adminMetrics'),
  adminCategoryTotals: $('adminCategoryTotals'),
  backupEndpoint: $('backupEndpoint'),
  backupApiKey: $('backupApiKey'),
  saveBackupSettingsBtn: $('saveBackupSettingsBtn'),
  syncBackupBtn: $('syncBackupBtn'),
  restoreBackupBtn: $('restoreBackupBtn'),
  importBackupFile: $('importBackupFile'),
  backupStatus: $('backupStatus'),
  stripeCheckoutUrl: $('stripeCheckoutUrl'),
  saveSettingsBtn: $('saveSettingsBtn'),
  subscribeBtn: $('subscribeBtn'),
  uploadReceiptFile: $('uploadReceiptFile'),
  receiptSearch: $('receiptSearch'),
  receiptFilterCategory: $('receiptFilterCategory'),
  ocrConfidence: $('ocrConfidence'),
  receiptLightbox: $('receiptLightbox'),
  closeLightboxBtn: $('closeLightboxBtn'),
  lightboxImg: $('lightboxImg'),
  lightboxDetails: $('lightboxDetails'),
  receiptCountBadge: $('receiptCountBadge')
};

let stream = null;
let capturedImage = null;
let state = loadState();
let settings = loadSettings();

/* --- State Management --- */

function loadState() {
  try {
    return Object.assign({ monthlyIncome: 0, receipts: [] },
      JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch { return { monthlyIncome: 0, receipts: [] }; }
}

function loadSettings() {
  try {
    return Object.assign({ backupEndpoint: '', backupApiKey: '', stripeCheckoutUrl: '' },
      JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
  } catch { return { backupEndpoint: '', backupApiKey: '', stripeCheckoutUrl: '' }; }
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function persistSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

/* --- Utilities --- */

function setStatus(message) {
  if (els.statusMessage) els.statusMessage.textContent = message;
}

function setBackupStatus(message) {
  if (els.backupStatus) els.backupStatus.textContent = message;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function currency(n) { return '$' + Number(n || 0).toFixed(2); }

/* --- Theme --- */

function applyTheme() {
  const dark = localStorage.getItem(THEME_KEY) === 'dark';
  document.body.classList.toggle('dark', dark);
  if (els.themeToggleBtn) {
    els.themeToggleBtn.textContent = dark ? 'Light Mode' : 'Dark Mode';
    els.themeToggleBtn.setAttribute('aria-pressed', String(dark));
  }
}

function toggleTheme() {
  localStorage.setItem(THEME_KEY,
    document.body.classList.contains('dark') ? 'light' : 'dark');
  applyTheme();
}

/* --- Category Helpers --- */

function populateCategories() {
  const options = CATEGORIES.map(c =>
    '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
  if (els.receiptCategory) els.receiptCategory.innerHTML = options;
  if (els.receiptFilterCategory) {
    els.receiptFilterCategory.innerHTML =
      '<option value="">All Categories</option>' + options;
  }
}

function categoryTotals() {
  return state.receipts.reduce((acc, r) => {
    const c = r.category || 'Other';
    acc[c] = (acc[c] || 0) + Number(r.amount || 0);
    return acc;
  }, {});
}

/* --- Rendering --- */

function render() {
  if (els.monthlyIncome) els.monthlyIncome.value = state.monthlyIncome || '';
  renderReceipts();
  renderCategorySummary();
  renderAdmin();
  updateReceiptCount();
}

function updateReceiptCount() {
  if (!els.receiptCountBadge) return;
  const count = state.receipts.length;
  els.receiptCountBadge.textContent = count;
  els.receiptCountBadge.hidden = count === 0;
}

function getFilteredReceipts() {
  const query = (els.receiptSearch?.value || '').toLowerCase().trim();
  const catFilter = els.receiptFilterCategory?.value || '';
  return state.receipts.filter(r => {
    if (catFilter && (r.category || 'Other') !== catFilter) return false;
    if (!query) return true;
    const searchable = (r.vendor || '') + ' ' + (r.note || '') + ' ' +
      (r.category || '') + ' ' + (r.ocrText || '');
    return searchable.toLowerCase().includes(query);
  });
}

function renderReceipts() {
  if (!els.receiptsList) return;
  els.receiptsList.innerHTML = '';
  const filtered = getFilteredReceipts();

  if (!state.receipts.length) {
    els.receiptsList.innerHTML = '<p class="helper">No receipts saved yet. Use the scanner above to add your first receipt.</p>';
    return;
  }
  if (!filtered.length) {
    els.receiptsList.innerHTML = '<p class="helper">No receipts match your search.</p>';
    return;
  }

  filtered.slice().reverse().forEach(r => {
    const item = document.createElement('div');
    item.className = 'receipt';
    item.setAttribute('data-receipt-id', r.id);
    item.innerHTML =
      '<img src="' + r.imageData + '" alt="receipt" title="Tap to view full size">' +
      '<div class="receipt-info">' +
        '<strong>' + currency(r.amount) + '</strong>' +
        '<div>' + escapeHtml(r.vendor || r.note || 'Receipt') + '</div>' +
        '<div><span class="pill">' + escapeHtml(r.category || 'Other') + '</span></div>' +
        '<div class="ocr-small">' + escapeHtml((r.ocrText || '').slice(0, 200)) + '</div>' +
        '<small>' + new Date(r.createdAt).toLocaleString() + '</small>' +
        '<div class="receipt-actions">' +
          '<button class="secondary" data-action="view" type="button">View</button>' +
          '<button class="danger" data-action="delete" type="button">Delete</button>' +
        '</div>' +
      '</div>';

    item.querySelector('img').addEventListener('click', () => openLightbox(r));
    item.querySelector('[data-action="view"]').addEventListener('click', () => openLightbox(r));
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteReceipt(r.id));
    els.receiptsList.appendChild(item);
  });
}

function renderCategorySummary() {
  if (!els.categorySummary) return;
  const totals = categoryTotals();
  const html = CATEGORIES.filter(c => totals[c]).map(c =>
    '<div class="metric"><span>' + escapeHtml(c) + '</span><strong>' +
    currency(totals[c]) + '</strong></div>').join('');
  els.categorySummary.innerHTML = html ||
    '<p class="helper">Category totals will appear after receipts are saved.</p>';
}

function renderAdmin() {
  if (els.adminMetrics) {
    const total = state.receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const avg = state.receipts.length ? total / state.receipts.length : 0;
    const remaining = state.monthlyIncome - total;
    els.adminMetrics.innerHTML =
      '<div class="metric"><span>Receipts</span><strong>' + state.receipts.length + '</strong></div>' +
      '<div class="metric"><span>Total Spend</span><strong>' + currency(total) + '</strong></div>' +
      '<div class="metric"><span>Average</span><strong>' + currency(avg) + '</strong></div>' +
      '<div class="metric"><span>Income</span><strong>' + currency(state.monthlyIncome) + '</strong></div>' +
      '<div class="metric"><span>Remaining</span><strong>' + currency(remaining) + '</strong></div>';
  }

  if (els.adminCategoryTotals) {
    const totals = categoryTotals();
    const html = Object.entries(totals).map(([c, v]) =>
      '<div class="row"><span>' + escapeHtml(c) + '</span><strong>' +
      currency(v) + '</strong></div>').join('');
    els.adminCategoryTotals.innerHTML = html ||
      '<p class="helper">No category data yet.</p>';
  }
}

/* --- Camera --- */

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Camera is not available. Use Safari or Chrome on HTTPS.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    els.cameraVideo.srcObject = stream;
    await els.cameraVideo.play();
    els.captureReceiptBtn.disabled = false;
    els.runOcrBtn.disabled = false;
    setStatus('Camera started. Point at the receipt and tap Capture.');
  } catch (err) {
    console.error(err);
    setStatus('Camera failed. Allow camera permission and retry on HTTPS.');
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

function captureFrame() {
  const video = els.cameraVideo, canvas = els.captureCanvas;
  if (!video || !canvas || !video.videoWidth) {
    setStatus('Camera is not ready yet. Wait a moment and try again.');
    return null;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedImage = canvas.toDataURL('image/jpeg', 0.86);
  if (els.receiptPreview) {
    els.receiptPreview.src = capturedImage;
    els.receiptPreview.hidden = false;
  }
  if (els.saveReceiptBtn) els.saveReceiptBtn.disabled = false;
  setStatus('Receipt captured. AI parse it or fill in fields and save.');
  return capturedImage;
}

/* --- OCR --- */

function parseTotal(text) {
  const match =
    text.match(/(?:grand total|total|amount due|amount|balance)[^\d]{0,30}(\d+[\.,]\d{2})/i) ||
    text.match(/\$\s*(\d+[\.,]\d{2})/) ||
    text.match(/\b\d+[\.,]\d{2}\b/);
  return match ? String(match[1] || match[0]).replace(/[^\d.,]/g, '').replace(',', '.') : '';
}

function parseVendor(text) {
  return text.split('\n').map(s => s.trim()).find(Boolean) || '';
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/shell|bp|exxon|chevron|marathon|fuel|gas|petro/.test(t)) return 'Fuel';
  if (/walmart|kroger|aldi|publix|grocery|market|food|heb/.test(t)) return 'Groceries';
  if (/restaurant|cafe|grill|pizza|taco|burger|mcdonald|wendy|chick/.test(t)) return 'Dining';
  if (/utility|electric|water|internet|phone|att|verizon|comcast/.test(t)) return 'Utilities';
  if (/auto|tire|oil|parts|mechanic|autozone|orielly/.test(t)) return 'Vehicle';
  if (/hotel|airline|uber|lyft|travel|airbnb|delta|southwest/.test(t)) return 'Travel';
  if (/insurance|geico|state farm|allstate|progressive/.test(t)) return 'Insurance';
  if (/pharmacy|cvs|walgreens|doctor|clinic|hospital|medical/.test(t)) return 'Medical';
  if (/office|staples|depot|supply|supplies/.test(t)) return 'Supplies';
  return 'Other';
}

async function runOCR() {
  if (!capturedImage) captureFrame();
  if (!capturedImage) return;
  try {
    setStatus('AI parsing receipt...');
    if (els.runOcrBtn) els.runOcrBtn.disabled = true;
    els.ocrOutput.textContent = 'Scanning receipt...';
    showOcrConfidence(null);

    const worker = await Tesseract.createWorker('eng');
    const result = await worker.recognize(capturedImage);
    await worker.terminate();

    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    els.ocrOutput.textContent = text || '(No text found)';
    showOcrConfidence(confidence);

    const vendor = parseVendor(text);
    const amount = parseTotal(text);
    const category = inferCategory(text);

    if (vendor && !els.receiptNote.value) els.receiptNote.value = vendor;
    if (amount && !els.receiptAmount.value) els.receiptAmount.value = amount;
    if (els.receiptCategory) els.receiptCategory.value = category;

    if (els.runOcrBtn) els.runOcrBtn.disabled = false;
    setStatus('AI parse complete (' + Math.round(confidence) + '% confidence). Review and save.');
  } catch (err) {
    console.error(err);
    if (els.runOcrBtn) els.runOcrBtn.disabled = false;
    setStatus('OCR failed. You can still enter fields manually and save.');
  }
}

function showOcrConfidence(confidence) {
  if (!els.ocrConfidence) return;
  if (confidence === null || confidence === undefined) {
    els.ocrConfidence.hidden = true;
    return;
  }
  els.ocrConfidence.hidden = false;
  let level = 'low', label = 'Low';
  if (confidence >= 75) { level = 'high'; label = 'High'; }
  else if (confidence >= 50) { level = 'medium'; label = 'Medium'; }
  els.ocrConfidence.className = 'ocr-confidence ' + level;
  els.ocrConfidence.textContent = 'OCR Confidence: ' + Math.round(confidence) + '% (' + label + ')';
}

/* --- Receipt Management --- */

function saveReceipt() {
  if (!capturedImage) { setStatus('Capture or upload a receipt first.'); return; }
  const text = els.ocrOutput?.textContent || '';
  const receipt = {
    id: crypto.randomUUID(),
    imageData: capturedImage,
    amount: Number(els.receiptAmount?.value || 0),
    note: els.receiptNote?.value.trim() || '',
    vendor: els.receiptNote?.value.trim() || parseVendor(text),
    category: els.receiptCategory?.value || inferCategory(text),
    ocrText: text,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending'
  };
  state.receipts.push(receipt);
  persist();
  render();

  // Reset form
  if (els.receiptAmount) els.receiptAmount.value = '';
  if (els.receiptNote) els.receiptNote.value = '';
  if (els.ocrOutput) els.ocrOutput.textContent = '';
  showOcrConfidence(null);
  capturedImage = null;
  if (els.receiptPreview) els.receiptPreview.hidden = true;
  if (els.saveReceiptBtn) els.saveReceiptBtn.disabled = true;
  if (els.runOcrBtn) els.runOcrBtn.disabled = true;
  setStatus('Receipt saved successfully.');
}

function deleteReceipt(id) {
  if (!confirm('Delete this receipt?')) return;
  state.receipts = state.receipts.filter(r => r.id !== id);
  persist();
  render();
  setStatus('Receipt deleted.');
}

function clearReceipts() {
  if (!state.receipts.length) { setStatus('No receipts to clear.'); return; }
  if (confirm('Delete all ' + state.receipts.length + ' saved receipts?')) {
    state.receipts = [];
    persist();
    render();
    setStatus('All receipts cleared.');
  }
}

/* --- File Upload --- */

function handleUploadFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    capturedImage = reader.result;
    if (els.receiptPreview) {
      els.receiptPreview.src = capturedImage;
      els.receiptPreview.hidden = false;
    }
    if (els.saveReceiptBtn) els.saveReceiptBtn.disabled = false;
    if (els.runOcrBtn) els.runOcrBtn.disabled = false;
    setStatus('Photo loaded. AI parse it or fill fields and save.');
  };
  reader.readAsDataURL(file);
}

/* --- Lightbox --- */

function openLightbox(receipt) {
  if (!els.receiptLightbox) return;
  els.lightboxImg.src = receipt.imageData;
  els.lightboxDetails.innerHTML =
    '<p><strong>' + currency(receipt.amount) + '</strong></p>' +
    '<p>' + escapeHtml(receipt.vendor || receipt.note || 'Receipt') + '</p>' +
    '<p><span class="pill">' + escapeHtml(receipt.category || 'Other') + '</span></p>' +
    '<p><small>' + new Date(receipt.createdAt).toLocaleString() + '</small></p>' +
    (receipt.ocrText ? '<details><summary>OCR Text</summary>' +
      '<pre style="white-space:pre-wrap;font-size:.82rem;margin-top:6px;max-height:200px;overflow-y:auto">' +
      escapeHtml(receipt.ocrText) + '</pre></details>' : '');
  els.receiptLightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (els.receiptLightbox) els.receiptLightbox.hidden = true;
  document.body.style.overflow = '';
}

/* --- Budget Rollover --- */

function rolloverMonth() {
  const total = state.receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const remaining = state.monthlyIncome - total;
  const count = state.receipts.length;
  state.receipts = [];
  persist();
  render();
  setStatus('Month rolled over. ' + count + ' receipts cleared. ' +
    (remaining >= 0 ? currency(remaining) + ' was remaining.' :
      currency(Math.abs(remaining)) + ' over budget.'));
}

/* --- Export --- */

function exportJSON() {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2)],
    { type: 'application/json' }
  );
  downloadBlob(blob, 'budget-flow-pro-backup.json');
  setStatus('JSON backup exported.');
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportPDF() {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) { setStatus('PDF library failed to load. Try refreshing.'); return; }
  if (!state.receipts.length) { setStatus('No receipts to export.'); return; }

  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(18);
  doc.text('Budget Flow Pro — Receipt Report', 14, y); y += 10;
  doc.setFontSize(10);
  doc.text('Generated: ' + new Date().toLocaleString(), 14, y); y += 4;
  doc.text('Total receipts: ' + state.receipts.length, 14, y); y += 10;

  state.receipts.forEach((r, i) => {
    if (y > 270) { doc.addPage(); y = 18; }
    doc.setFontSize(12);
    doc.text((i + 1) + '. ' + (r.vendor || r.note || 'Receipt') + ' — ' + currency(r.amount), 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text('Category: ' + (r.category || 'Other') + '  |  ' +
      new Date(r.createdAt).toLocaleString(), 14, y);
    y += 8;
  });

  doc.save('budget-flow-pro-receipts.pdf');
  setStatus('PDF exported with ' + state.receipts.length + ' receipts.');
}

/* --- Backup --- */

function saveBackupSettings() {
  settings.backupEndpoint = els.backupEndpoint?.value.trim() || '';
  settings.backupApiKey = els.backupApiKey?.value.trim() || '';
  settings.stripeCheckoutUrl = els.stripeCheckoutUrl?.value.trim() || settings.stripeCheckoutUrl || '';
  persistSettings();
  setBackupStatus('Backup settings saved.');
}

async function syncBackup() {
  saveBackupSettings();
  if (!settings.backupEndpoint) {
    setBackupStatus('No cloud endpoint set. Use JSON export for beta backup.');
    return;
  }
  try {
    setBackupStatus('Syncing to cloud...');
    const res = await fetch(settings.backupEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': settings.backupApiKey ? 'Bearer ' + settings.backupApiKey : ''
      },
      body: JSON.stringify({ app: 'Budget Flow Pro', syncedAt: new Date().toISOString(), state })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.receipts = state.receipts.map(r => Object.assign({}, r, { syncStatus: 'synced' }));
    persist();
    render();
    setBackupStatus('Cloud backup complete.');
  } catch (err) {
    console.error(err);
    setBackupStatus('Cloud backup failed. Data is still saved locally.');
  }
}

async function restoreBackup() {
  saveBackupSettings();
  if (!settings.backupEndpoint) {
    setBackupStatus('No cloud endpoint set. Import a JSON backup instead.');
    return;
  }
  try {
    const res = await fetch(settings.backupEndpoint, {
      headers: { 'Authorization': settings.backupApiKey ? 'Bearer ' + settings.backupApiKey : '' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state = Object.assign({ monthlyIncome: 0, receipts: [] }, data.state || data);
    persist();
    render();
    setBackupStatus('Cloud backup restored.');
  } catch (err) {
    console.error(err);
    setBackupStatus('Cloud restore failed.');
  }
}

function importBackupFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = Object.assign({ monthlyIncome: 0, receipts: [] }, data.state || data);
      persist();
      render();
      setBackupStatus('Backup JSON imported — ' + state.receipts.length + ' receipts restored.');
    } catch { setBackupStatus('Invalid backup JSON file.'); }
  };
  reader.readAsText(file);
}

/* --- Settings --- */

function saveSettings() {
  settings.stripeCheckoutUrl = els.stripeCheckoutUrl?.value.trim() || '';
  persistSettings();
  setStatus('Settings saved.');
}

/* --- Navigation --- */

function initTabs() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = $('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
      renderAdmin();
    });
  });
}

/* --- Event Wiring --- */

function wireEvents() {
  // Budget
  els.monthlyIncome?.addEventListener('input', e => {
    state.monthlyIncome = Number(e.target.value || 0);
    persist();
    renderAdmin();
  });
  els.rolloverBtn?.addEventListener('click', rolloverMonth);

  // Receipt Scanner
  els.startCameraBtn?.addEventListener('click', startCamera);
  els.captureReceiptBtn?.addEventListener('click', captureFrame);
  els.runOcrBtn?.addEventListener('click', runOCR);
  els.saveReceiptBtn?.addEventListener('click', saveReceipt);
  els.clearReceiptsBtn?.addEventListener('click', clearReceipts);
  els.uploadReceiptFile?.addEventListener('change', handleUploadFile);

  // Search & Filter
  els.receiptSearch?.addEventListener('input', renderReceipts);
  els.receiptFilterCategory?.addEventListener('change', renderReceipts);

  // Lightbox
  els.closeLightboxBtn?.addEventListener('click', closeLightbox);
  els.receiptLightbox?.querySelector('.lightbox-backdrop')?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // Theme
  els.themeToggleBtn?.addEventListener('click', toggleTheme);

  // Exports
  els.exportPdfBtn?.addEventListener('click', exportPDF);
  els.exportJsonBtn?.addEventListener('click', exportJSON);

  // Backup
  els.saveBackupSettingsBtn?.addEventListener('click', saveBackupSettings);
  els.syncBackupBtn?.addEventListener('click', syncBackup);
  els.restoreBackupBtn?.addEventListener('click', restoreBackup);
  els.importBackupFile?.addEventListener('change', importBackupFile);

  // Settings
  els.saveSettingsBtn?.addEventListener('click', saveSettings);

  // PWA Install
  const installBtn = $('installPwaBtn');
  if (installBtn) {
    installBtn.addEventListener('click', installPWA);
  }

  // Cleanup
  window.addEventListener('beforeunload', stopCamera);
}

/* --- PWA Install Prompt --- */

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = $('installPwaBtn');
  const hint = $('installHint');
  if (btn) btn.hidden = false;
  if (hint) hint.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = $('installPwaBtn');
  const hint = $('installHint');
  const installed = $('installedHint');
  if (btn) btn.hidden = true;
  if (hint) hint.hidden = true;
  if (installed) installed.hidden = false;
});

function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') {
      const btn = $('installPwaBtn');
      if (btn) btn.hidden = true;
    }
    deferredInstallPrompt = null;
  });
}

if (window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true) {
  const hint = $('installHint');
  const installed = $('installedHint');
  if (hint) hint.hidden = true;
  if (installed) installed.hidden = false;
}

/* --- Init --- */

function initSettingsFields() {
  if (els.backupEndpoint) els.backupEndpoint.value = settings.backupEndpoint || '';
  if (els.backupApiKey) els.backupApiKey.value = settings.backupApiKey || '';
  if (els.stripeCheckoutUrl) els.stripeCheckoutUrl.value = settings.stripeCheckoutUrl || '';
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('sw.js').catch(console.warn));
}

// Boot
populateCategories();
applyTheme();
initSettingsFields();
initTabs();
wireEvents();
render();
