const EVENTS_KEY = "LEGA_EVENTS_v1";
const ACTIVE_KEY = "LEGA_ACTIVE_EVENT_ID";

/* ==== DEFAULT DB ==== */
const DEFAULT_DB = { panitia: [], peserta: [], wasit: [] };
function safeClone(obj){ return JSON.parse(JSON.stringify(obj)); }

/* ==== COLUMNS ==== */
const COLUMNS = {
  panitia: [
    { key: "kode", label: "KODE" },
    { key: "nama", label: "NAMA" },
    { key: "nik", label: "NIK" },
    { key: "wa", label: "NO WA" },
    { key: "alamat", label: "ALAMAT" },
    { key: "bank", label: "NAMA BANK" },
    { key: "rekening", label: "NO REKENING" },
  ],
  peserta: [
    { key: "kode_klub", label: "KODE KLUB" },
    { key: "nama_klub", label: "NAMA KLUB" },
    { key: "wa", label: "NO WA" },
    { key: "pemain1", label: "PEMAIN 1" },
    { key: "pemain2", label: "PEMAIN 2" },
    { key: "pemain3", label: "PEMAIN 3" },
    { key: "pemain4", label: "PEMAIN 4" },
    { key: "pemain5", label: "PEMAIN 5" },
    { key: "pemain6", label: "PEMAIN 6" },
    { key: "pemain7", label: "PEMAIN 7" },
    { key: "pemain8", label: "PEMAIN 8" },
    { key: "pemain9", label: "PEMAIN 9" },
    { key: "pemain10", label: "PEMAIN 10" },
    { key: "pemain11", label: "PEMAIN 11" },
    { key: "pemain12", label: "PEMAIN 12" },
    { key: "manager", label: "MANAGER" },
    { key: "headcoach", label: "HEAD COACH" },
    { key: "assistcoach", label: "ASSIST COACH" },
    { key: "doctor", label: "DOCTOR" },
  ],
  wasit: [
    { key: "kode", label: "KODE" },
    { key: "nama", label: "NAMA" },
    { key: "nik", label: "NIK" },
    { key: "lisensi", label: "LISENSI" },
    { key: "wa", label: "NO WA" },
    { key: "alamat", label: "ALAMAT" },
    { key: "bank", label: "NAMA BANK" },
    { key: "rekening", label: "NO REKENING" },
  ]
};

/* ==== DOM ==== */
const noEventState  = document.getElementById("noEventState");
const eventSelector = document.getElementById("eventSelector");
const eventGrid     = document.getElementById("eventGrid");
const dbSection     = document.getElementById("dbSection");

const btnSwitchEvent = document.getElementById("btnSwitchEvent");

const thead = document.getElementById("thead");
const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");
const printSubtitle = document.getElementById("printSubtitle");

const btnEdit = document.getElementById("btnEdit");
const btnImport = document.getElementById("btnImport");
const btnTemplate = document.getElementById("btnTemplate");
const btnPrint = document.getElementById("btnPrint");
const fileInput = document.getElementById("file");

/* ==== State ==== */
let currentView = "panitia";
let editEnabled = true;
let ACTIVE_EVENT_ID = "";
let ACTIVE_EVENT = null;

/* ==== storage ==== */
function loadEvents(){
  try{
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}
function saveEvents(events){
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}
function getActiveId(){
  return localStorage.getItem(ACTIVE_KEY) || "";
}
function setActiveId(id){
  localStorage.setItem(ACTIVE_KEY, id);
}
function ensureDatabase(ev){
  if(!ev.database){
    ev.database = safeClone(DEFAULT_DB);
  }else{
    ev.database.panitia ||= [];
    ev.database.peserta ||= [];
    ev.database.wasit ||= [];
  }
  return ev;
}
function persistActiveEvent(){
  if(!ACTIVE_EVENT) return;
  const events = loadEvents();
  const idx = events.findIndex(e => e.id === ACTIVE_EVENT.id);
  if(idx === -1) return;
  events[idx] = ACTIVE_EVENT;
  saveEvents(events);
}

/* ==== UI ==== */
function showOnly(which){
  if(noEventState)   noEventState.style.display   = (which === "noEvent") ? "flex" : "none";
  if(eventSelector)  eventSelector.style.display  = (which === "select")  ? "block" : "none";
  if(dbSection)      dbSection.style.display      = (which === "db")      ? "block" : "none";
  if(btnSwitchEvent) btnSwitchEvent.style.display = (which === "db")      ? "inline-block" : "none";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(yyyy_mm_dd){
  if(!yyyy_mm_dd) return "";
  const [y,m,d] = yyyy_mm_dd.split("-");
  if(!y||!m||!d) return "";
  return `${d}-${m}-${y}`;
}

/* ==== render event selector ==== */
function renderEventSelector(events){
  if(!eventGrid) return;

  eventGrid.innerHTML = events.map(ev => {
    const logo = ev.logoDataUrl || "";
    return `
      <div class="event-card" data-id="${escapeHtml(ev.id)}">
        <div class="event-badge">${escapeHtml(ev.id)}</div>

        <div class="event-logo">
          ${logo ? `<img src="${logo}" alt="Logo">` : `<div style="font-weight:900;color:#2ab57e;">LOGO</div>`}
        </div>

        <div class="event-name">${escapeHtml(ev.nama || "(Nama belum diisi)")}</div>
        <div class="event-meta">
          ${ev.tanggal ? `Tanggal: ${escapeHtml(formatDate(ev.tanggal))}<br>` : ""}
          ${ev.lokasi ? `Lokasi: ${escapeHtml(ev.lokasi)}<br>` : ""}
          ${Number.isFinite(Number(ev.lapangan)) ? `Lapangan: ${escapeHtml(ev.lapangan)}` : ""}
        </div>
        <div class="event-hint">Klik untuk masuk</div>
      </div>
    `;
  }).join("");

  eventGrid.querySelectorAll(".event-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      setActiveId(id);
      init();
    });
  });
}

/* ==== WA ==== */
function toWaE164(idNumber){
  let n = String(idNumber || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}
function waLink(raw){
  const e164 = toWaE164(raw);
  if (!e164) return "";
  return `https://wa.me/${e164}`;
}

/* ==== TABLE RENDER ==== */
function renderTable() {
  if(!ACTIVE_EVENT || !thead || !tbody) return;

  const cols = COLUMNS[currentView];
  const q = (searchInput?.value || "").trim().toLowerCase();

  thead.innerHTML = `
    <tr>
      <th class="sticky-1" style="width:var(--w-no)">NO</th>
      <th class="sticky-2">${cols[0].label}</th>
      <th class="sticky-3">${cols[1].label}</th>
      ${cols.slice(2).map(c => `<th>${c.label}</th>`).join("")}
    </tr>
  `;

  const rows = ACTIVE_EVENT.database[currentView] || [];
  const filtered = rows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => !q || Object.values(row).join(" ").toLowerCase().includes(q));

  tbody.innerHTML = filtered.map(({ row, idx }, i) => {
    const kodeKey = cols[0].key;
    const namaKey = cols[1].key;

    const kodeVal = row[kodeKey] ?? "";
    const namaVal = row[namaKey] ?? "";

    const otherTds = cols.slice(2).map(c => {
      const key = c.key;
      const val = row[key] ?? "";

      if (key === "wa") {
        if (editEnabled) {
          return `<td data-key="${key}" contenteditable="true">${escapeHtml(val)}</td>`;
        }
        const href = waLink(val);
        const show = escapeHtml(val);
        return `<td data-key="${key}">${href ? `<a class="wa-link" href="${href}" target="_blank" rel="noopener noreferrer">${show}</a>` : show}</td>`;
      }

      return `<td data-key="${key}" ${editEnabled ? 'contenteditable="true"' : ""}>${escapeHtml(val)}</td>`;
    }).join("");

    return `
      <tr data-idx="${idx}">
        <td class="sticky-1">${i + 1}</td>
        <td class="sticky-2" data-key="${kodeKey}" ${editEnabled ? 'contenteditable="true"' : ""}>${escapeHtml(kodeVal)}</td>
        <td class="sticky-3" data-key="${namaKey}" ${editEnabled ? 'contenteditable="true"' : ""}>${escapeHtml(namaVal)}</td>
        ${otherTds}
      </tr>
    `;
  }).join("");
}

/* autosave edit */
if(tbody){
  tbody.addEventListener("input", (e) => {
    if (!editEnabled || !ACTIVE_EVENT) return;

    const td = e.target.closest("td");
    const tr = e.target.closest("tr");
    if (!td || !tr) return;

    const idx = tr.dataset.idx;
    const key = td.dataset.key;
    if (idx == null || !key) return;

    ACTIVE_EVENT.database[currentView][Number(idx)][key] = td.innerText.trim();
    persistActiveEvent();
  });
}

/* tabs */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-close")) return;

    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentView = btn.dataset.view;
    renderTable();
  });
});

/* search */
if(searchInput) searchInput.addEventListener("input", renderTable);

/* edit toggle */
if(btnEdit){
  btnEdit.addEventListener("click", () => {
    editEnabled = !editEnabled;
    btnEdit.textContent = editEnabled ? "Edit: ON" : "Edit: OFF";
    renderTable();
  });
}

/* TEMPLATE CSV */
if(btnTemplate){
  btnTemplate.addEventListener("click", () => {
    if(!ACTIVE_EVENT) return;

    const cols = COLUMNS[currentView];
    const header = ["NO", ...cols.map(c => c.label)].join(",");

    const keys = cols.map(c => c.key);
    const rows = ACTIVE_EVENT.database[currentView] || [];
    const csvRows = rows.map((r, i) => {
      const row = [String(i + 1), ...keys.map(k => String(r[k] ?? ""))];
      return row.map(v => `"${v.replaceAll('"','""')}"`).join(",");
    });

    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `template-${currentView}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

/* IMPORT CSV KETAT */
if(btnImport && fileInput){
  btnImport.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const f = fileInput.files?.[0];
    if (!f) return;

    if(!ACTIVE_EVENT){
      alert("Pilih event dulu sebelum import.");
      fileInput.value = "";
      return;
    }

    const name = (f.name || "").toLowerCase();
    if(!name.endsWith(".csv")){
      alert("Import yang aktif baru CSV.\n\nSilakan pakai file .csv (Excel bisa Save As CSV).");
      fileInput.value = "";
      return;
    }

    const text = await f.text();
    const rows = parseCSV(text);

    if(rows.length <= 1){
      alert("CSV kosong / format tidak terbaca.");
      fileInput.value = "";
      return;
    }

    const header = rows[0].map(x => String(x || "").trim());
    const dataRows = rows.slice(1).filter(r => r.some(v => String(v||"").trim() !== ""));

    const cols = COLUMNS[currentView];
    const expected = ["NO", ...cols.map(c => c.label)];

    const headerNorm = header.map(normalizeHeader);
    const expectedNorm = expected.map(normalizeHeader);

    const same =
      headerNorm.length === expectedNorm.length &&
      headerNorm.every((h, i) => h === expectedNorm[i]);

    if(!same){
      alert("Header CSV tidak sesuai Template.\n\nKlik TEMPLATE lalu isi, kemudian import ulang.");
      fileInput.value = "";
      return;
    }

    const imported = dataRows.map(r => {
      const obj = {};
      cols.forEach((c, i) => obj[c.key] = String(r[i + 1] ?? "").trim());
      return obj;
    });

    const modeReplace = confirm(
      `Import ${imported.length} baris ke tab ${currentView.toUpperCase()}.\n\n` +
      `OK = REPLACE data lama\nCancel = TAMBAH (append) ke data lama`
    );

    if(modeReplace) ACTIVE_EVENT.database[currentView] = imported;
    else ACTIVE_EVENT.database[currentView] = [...(ACTIVE_EVENT.database[currentView] || []), ...imported];

    persistActiveEvent();
    renderTable();

    alert(`Import CSV sukses: ${imported.length} baris.`);
    fileInput.value = "";
  });
}

function parseCSV(csvText){
  const text = String(csvText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for(let i=0;i<text.length;i++){
    const ch = text[i];

    if(inQuotes){
      if(ch === '"'){
        const next = text[i+1];
        if(next === '"'){ cur += '"'; i++; }
        else inQuotes = false;
      }else cur += ch;
      continue;
    }

    if(ch === '"'){ inQuotes = true; continue; }
    if(ch === ","){ row.push(cur); cur = ""; continue; }
    if(ch === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; continue; }
    cur += ch;
  }

  row.push(cur);
  rows.push(row);

  while(rows.length && rows[rows.length-1].every(x => String(x||"").trim()==="")) rows.pop();
  return rows;
}

function normalizeHeader(h){
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/* print */
function getPrintName(view){
  if(view === "panitia") return "Database Panitia";
  if(view === "peserta") return "Database Peserta";
  if(view === "wasit") return "Database Wasit";
  return "Database";
}
if(btnPrint){
  btnPrint.addEventListener("click", () => {
    if (printSubtitle) printSubtitle.textContent = getPrintName(currentView);
    document.body.classList.toggle("print-landscape", currentView === "peserta");
    window.print();
    setTimeout(() => document.body.classList.remove("print-landscape"), 1000);
  });
}

/* GANTI EVENT */
if(btnSwitchEvent){
  btnSwitchEvent.addEventListener("click", () => {
    localStorage.removeItem(ACTIVE_KEY);
    ACTIVE_EVENT_ID = "";
    ACTIVE_EVENT = null;
    init();
  });
}

/* init */
function init(){
  const events = loadEvents();
  ACTIVE_EVENT_ID = getActiveId();

  if(events.length === 0){
    showOnly("noEvent");
    return;
  }

  if(!ACTIVE_EVENT_ID){
    showOnly("select");
    renderEventSelector(events);
    return;
  }

  const ev = events.find(e => e.id === ACTIVE_EVENT_ID);
  if(!ev){
    localStorage.removeItem(ACTIVE_KEY);
    showOnly("select");
    renderEventSelector(events);
    return;
  }

  ACTIVE_EVENT = ensureDatabase(ev);

  // persist structure if new
  const idx = events.findIndex(e => e.id === ACTIVE_EVENT_ID);
  if(idx !== -1){
    events[idx] = ACTIVE_EVENT;
    saveEvents(events);
  }

  showOnly("db");
  renderTable();
}

init();
