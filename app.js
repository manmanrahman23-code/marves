/* ========================
   GarmentOS – app.js
   ======================== */

// ---- DATA ----

const rollData = [
  { id:'RL-00841', fabric:'Cotton Poplin 40s', color:'NVY-204', batch:'B-0610', weight:24.5, length:148.0, qc:'pass' },
  { id:'RL-00842', fabric:'Cotton Poplin 40s', color:'NVY-204', batch:'B-0610', weight:23.8, length:144.5, qc:'pass' },
  { id:'RL-00843', fabric:'Polyester Twill',   color:'WHT-001', batch:'B-0609', weight:19.2, length:132.0, qc:'hold' },
  { id:'RL-00844', fabric:'Rayon Challis',     color:'GRY-112', batch:'B-0608', weight:21.0, length:155.0, qc:'pass' },
  { id:'RL-00845', fabric:'Denim 12oz',        color:'IND-307', batch:'B-0607', weight:31.4, length:98.5,  qc:'fail' },
  { id:'RL-00846', fabric:'Cotton Poplin 40s', color:'RED-055', batch:'B-0611', weight:22.1, length:141.0, qc:'pending' },
  { id:'RL-00847', fabric:'Linen Mix',         color:'CRM-010', batch:'B-0612', weight:18.7, length:122.0, qc:'pass' },
  { id:'RL-00848', fabric:'Polyester Twill',   color:'BLK-001', batch:'B-0609', weight:25.3, length:160.0, qc:'pending' },
];

const spkData = [
  { no:'SPK-1041', order:'ORD-SHT-0204', style:"Men's oxford shirt", deadline:'25 Jun', qty:600, done:432, status:'running' },
  { no:'SPK-1042', order:'ORD-TRS-0091', style:"Women's trousers",   deadline:'26 Jun', qty:480, done:168, status:'running' },
  { no:'SPK-1043', order:'ORD-JKT-0033', style:"Unisex jacket",      deadline:'28 Jun', qty:320, done:32,  status:'queued'  },
  { no:'SPK-1040', order:'ORD-SHT-0198', style:"Kids polo shirt",    deadline:'24 Jun', qty:900, done:900, status:'done'    },
  { no:'SPK-1044', order:'ORD-DRS-0055', style:"Summer dress",       deadline:'30 Jun', qty:250, done:0,   status:'queued'  },
];

let activeSpkIndex = 0;

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  startClock();
  renderRolls();
  renderSPK();
  updateEfficiency();
  setupNavigation();
});

function setTodayDate() {
  const d = document.getElementById('f-date');
  if (d) d.value = new Date().toISOString().slice(0,10);
  const m = document.getElementById('m-deadline');
  if (m) m.value = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
}

function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const mn = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const el = document.getElementById('clockDisplay');
    if (el) el.textContent = `${h}:${mn}:${s} WIB`;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const de = document.getElementById('dateDisplay');
    if (de) de.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ---- NAVIGATION ----

function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const titleMap = {
        dashboard: 'Production dashboard',
        fabric: 'Fabric receipt',
        inventory: 'Inventory',
        cutting: 'Cutting room',
        reports: 'Reports',
        settings: 'Settings'
      };
      document.getElementById('pageTitle').textContent = titleMap[page] || page;
      if (window.innerWidth <= 1100) closeSidebar();
    });
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ---- RENDER ROLLS ----

function qcBadge(qc) {
  const map = { pass:'badge-pass', fail:'badge-fail', hold:'badge-hold', pending:'badge-pending' };
  const label = { pass:'Pass', fail:'Fail', hold:'Hold', pending:'Pending' };
  return `<span class="badge ${map[qc]||''}">${label[qc]||qc}</span>`;
}

function renderRolls() {
  const search = (document.getElementById('rollSearch')?.value||'').toLowerCase();
  const qcF = document.getElementById('qcFilter')?.value||'';
  const tbody = document.getElementById('rollTbody');
  if (!tbody) return;

  const filtered = rollData.filter(r => {
    const matchSearch = !search || r.id.toLowerCase().includes(search) || r.fabric.toLowerCase().includes(search) || r.color.toLowerCase().includes(search);
    const matchQC = !qcF || r.qc === qcF;
    return matchSearch && matchQC;
  });

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><span class="mono">${r.id}</span></td>
      <td>${r.fabric}</td>
      <td><span class="mono">${r.color}</span></td>
      <td><span class="mono text-muted">${r.batch}</span></td>
      <td class="mono">${r.weight.toFixed(1)}</td>
      <td class="mono">${r.length.toFixed(1)}</td>
      <td>${qcBadge(r.qc)}</td>
      <td><button class="tbl-btn" onclick="viewRoll('${r.id}')">Lihat</button></td>
    </tr>
  `).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--gray-400);padding:20px">Tidak ada data</td></tr>`;
}

function filterRolls() { renderRolls(); }

// ---- RENDER SPK ----

function statusBadge(s) {
  const map = { running:'badge-running', queued:'badge-queued', done:'badge-done' };
  const label = { running:'Running', queued:'Queued', done:'Done' };
  return `<span class="badge ${map[s]||''}">${label[s]||s}</span>`;
}

function progColor(s) {
  if (s==='done') return 'green';
  if (s==='queued') return 'amber';
  return 'blue';
}

function renderSPK() {
  const tbody = document.getElementById('spkTbody');
  if (!tbody) return;
  tbody.innerHTML = spkData.map((spk,i) => {
    const pct = Math.round((spk.done/spk.qty)*100);
    const isActive = i === activeSpkIndex;
    return `
      <tr class="spk-row-clickable ${isActive?'spk-row-active':''}" onclick="selectSPK(${i})">
        <td><span class="spk-style">${spk.no}</span></td>
        <td>
          <div class="spk-style">${spk.order}</div>
          <div class="spk-name">${spk.style}</div>
        </td>
        <td class="text-muted">${spk.deadline}</td>
        <td class="mono">${spk.qty.toLocaleString()}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-bar"><div class="prog-fill ${progColor(spk.status)}" style="width:${pct}%"></div></div>
            <span class="prog-pct">${pct}%</span>
          </div>
        </td>
        <td>${statusBadge(spk.status)}</td>
      </tr>
    `;
  }).join('');
}

function selectSPK(i) {
  activeSpkIndex = i;
  const spk = spkData[i];
  document.getElementById('aj-spk').textContent = spk.no;
  document.getElementById('aj-meta').textContent = `${spk.style} · ${spk.qty.toLocaleString()} pcs`;
  document.getElementById('c-pieces').value = spk.done;
  updateEfficiency();
  renderSPK();
  showToast(`SPK ${spk.no} dipilih sebagai active job`, 'info');
}

// ---- EFFICIENCY CALC ----

function updateEfficiency() {
  const w = parseFloat(document.getElementById('c-weight')?.value)||0;
  const waste = parseFloat(document.getElementById('c-waste')?.value)||0;
  const pcs = parseFloat(document.getElementById('c-pieces')?.value)||0;

  const total = w + waste;
  const eff = total > 0 ? ((w/total)*100) : 0;
  const wasteR = total > 0 ? ((waste/total)*100) : 0;
  const pcsPerKg = w > 0 ? (pcs/w) : 0;

  const effEl = document.getElementById('eff-pct');
  const wasteEl = document.getElementById('waste-pct');
  const ppsEl = document.getElementById('pcs-per-kg');
  const barEl = document.getElementById('eff-bar');

  if (effEl) effEl.textContent = eff.toFixed(1)+'%';
  if (wasteEl) wasteEl.textContent = wasteR.toFixed(1)+'%';
  if (ppsEl) ppsEl.textContent = pcsPerKg.toFixed(1);
  if (barEl) barEl.style.width = Math.min(eff,100)+'%';

  if (effEl) {
    effEl.className = 'eff-val ' + (eff>=90?'green':eff>=75?'amber':'red');
  }
  if (barEl) {
    barEl.style.background = eff>=90?'var(--green)':eff>=75?'var(--amber)':'var(--red)';
  }
}

// ---- SHIPMENT FORM ----

function registerBatch(e) {
  e.preventDefault();
  const supplier = document.getElementById('f-supplier').value;
  const po = document.getElementById('f-po').value;
  const rolls = parseInt(document.getElementById('f-rolls').value)||0;
  const weight = parseFloat(document.getElementById('f-weight').value)||0;
  const length = parseFloat(document.getElementById('f-length').value)||0;
  const color = document.getElementById('f-color').value;
  const fabric = document.getElementById('f-fabric').value;
  const qc = document.getElementById('f-qc').value;

  if (!supplier || !po || !color) {
    showToast('Lengkapi data: Supplier, PO Number, dan Kode Warna', 'error');
    return;
  }

  const lastId = rollData.length > 0
    ? parseInt(rollData[rollData.length-1].id.replace('RL-',''))
    : 848;
  const batchCode = 'B-' + String(new Date().getMonth()+1).padStart(2,'0') + String(new Date().getDate()).padStart(2,'0');

  for (let i = 0; i < rolls; i++) {
    rollData.push({
      id: 'RL-' + String(lastId+i+1).padStart(5,'0'),
      fabric, color, batch: batchCode,
      weight: parseFloat(weight.toFixed(1)),
      length: parseFloat(length.toFixed(1)),
      qc
    });
  }

  updateStatCards();
  renderRolls();
  showToast(`${rolls} roll dari ${po} berhasil didaftarkan!`, 'success');
  e.target.reset();
  setTodayDate();
}

function simulateQR() {
  const codes = ['PO-2026-0842','PO-2026-0843','PO-2026-0844'];
  const random = codes[Math.floor(Math.random()*codes.length)];
  document.getElementById('f-po').value = random;
  showToast(`QR terbaca: ${random}`, 'info');
}

// ---- SPK MODAL ----

function showNewSPKModal() { openModal('spkModal'); }

function addSPK() {
  const no = document.getElementById('m-spk').value.trim();
  const order = document.getElementById('m-order').value.trim();
  const style = document.getElementById('m-style').value.trim();
  const qty = parseInt(document.getElementById('m-qty').value)||0;
  const dl = document.getElementById('m-deadline').value;

  if (!no || !order || !style || !qty) {
    showToast('Lengkapi semua field SPK', 'error');
    return;
  }

  const d = dl ? new Date(dl) : new Date(Date.now()+7*86400000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const deadline = `${d.getDate()} ${months[d.getMonth()]}`;

  spkData.unshift({ no, order, style, deadline, qty, done:0, status:'queued' });
  activeSpkIndex = 1;
  renderSPK();
  closeModal('spkModal');
  showToast(`SPK ${no} berhasil dibuat`, 'success');
  updateStatCards();
}

// ---- ROLL MODAL ----

function viewRoll(id) {
  const r = rollData.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modal-roll-id').textContent = id;
  document.getElementById('rollModalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">Jenis kain</div><div style="font-weight:600">${r.fabric}</div></div>
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">Kode warna</div><div style="font-family:var(--font-mono);font-weight:600">${r.color}</div></div>
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">Batch</div><div style="font-family:var(--font-mono)">${r.batch}</div></div>
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">QC status</div>${qcBadge(r.qc)}</div>
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">Berat</div><div style="font-family:var(--font-mono)">${r.weight.toFixed(1)} kg</div></div>
      <div><div style="font-size:10px;color:var(--gray-400);margin-bottom:3px">Panjang</div><div style="font-family:var(--font-mono)">${r.length.toFixed(1)} yds</div></div>
    </div>
    <div style="margin-top:14px;padding:10px 12px;background:var(--gray-50);border-radius:var(--radius-sm);border:1px solid var(--gray-200)">
      <div style="font-size:11px;color:var(--gray-400)">Masuk ke SPK aktif: <strong style="color:var(--blue)">${spkData[activeSpkIndex]?.no||'—'}</strong></div>
    </div>
  `;
  openModal('rollModal');
}

function assignRoll() {
  closeModal('rollModal');
  const rollId = document.getElementById('modal-roll-id').textContent;
  const spk = spkData[activeSpkIndex];
  document.getElementById('aj-roll-ids').textContent = rollId;
  showToast(`Roll ${rollId} di-assign ke ${spk?.no||'SPK aktif'}`, 'success');
}

// ---- FINISH JOB ----

function finishJob() {
  const spk = spkData[activeSpkIndex];
  if (!spk) return;
  const pieces = parseInt(document.getElementById('c-pieces').value)||0;
  const weight = parseFloat(document.getElementById('c-weight').value)||0;
  const waste = parseFloat(document.getElementById('c-waste').value)||0;

  if (pieces === 0) { showToast('Masukkan jumlah potongan terlebih dahulu', 'error'); return; }

  spkData[activeSpkIndex].done = spkData[activeSpkIndex].qty;
  spkData[activeSpkIndex].status = 'done';

  const stat = document.getElementById('stat-pieces');
  if (stat) {
    const cur = parseInt(stat.textContent.replace(/,/g,''))||0;
    stat.textContent = (cur+pieces).toLocaleString();
  }

  renderSPK();
  showToast(`SPK ${spk.no} selesai! ${pieces.toLocaleString()} pcs · ${weight.toFixed(1)}kg digunakan`, 'success');
}

// ---- GENERATE LABELS ----

function generateLabels() {
  const spk = spkData[activeSpkIndex];
  if (!spk) return;
  const pieces = parseInt(document.getElementById('c-pieces').value)||0;
  if (pieces === 0) { showToast('Masukkan jumlah potongan terlebih dahulu', 'error'); return; }
  showToast(`Generating ${pieces.toLocaleString()} label untuk ${spk.no}…`, 'info');
  setTimeout(() => showToast(`${pieces.toLocaleString()} label siap dicetak`, 'success'), 1800);
}

// ---- STAT CARDS ----

function updateStatCards() {
  const rollsEl = document.getElementById('stat-rolls');
  if (rollsEl) rollsEl.textContent = rollData.length;
  const holdEl = document.getElementById('stat-hold');
  if (holdEl) holdEl.textContent = rollData.filter(r=>r.qc==='hold').length;
  const spkEl = document.getElementById('stat-spk');
  if (spkEl) spkEl.textContent = spkData.filter(s=>s.status==='running'||s.status==='queued').length;
}

// ---- MODAL HELPERS ----

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ---- TOAST ----

function showToast(msg, type='') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type==='success'?'✓':type==='error'?'✗':'ℹ';
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
