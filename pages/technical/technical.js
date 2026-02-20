/* =========================================================
   STORAGE KEYS
   ========================================================= */
const EVENTS_KEY = "LEGA_EVENTS_v1";
const ACTIVE_KEY = "LEGA_ACTIVE_EVENT_ID";

/* =========================================================
   HELPERS
   ========================================================= */
function $(id){ return document.getElementById(id); }

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getQuery(name){
  const p = new URLSearchParams(location.search);
  return p.get(name) || "";
}

function loadEvents(){
  try{
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

function getActiveId(){
  return localStorage.getItem(ACTIVE_KEY) || "";
}

function setActiveId(id){
  localStorage.setItem(ACTIVE_KEY, id);
}

function show(el, yes){
  if(!el) return;
  el.style.display = yes ? "" : "none";
}

/* =========================================================
   NORMALIZE EVENT SHAPE
   ========================================================= */
function ensureEventShape(ev){
  ev = ev && typeof ev === "object" ? ev : {};
  ev.detail ||= {};

  const putra = Array.isArray(ev.detail?.nomor?.putra) ? ev.detail.nomor.putra : [];
  const putri = Array.isArray(ev.detail?.nomor?.putri) ? ev.detail.nomor.putri : [];
  const cfgMap = ev.detail?.pengaturanNomor || {};

  const labelFromKey = (k) => {
    const map = {
      inter_double: "Inter Double",
      inter_regu: "Inter Regu",
      inter_quadrant: "Inter Quadrant",
      team_double: "Team Double",
      team_regu: "Team Regu",
      team_quadrant: "Team Quadrant",
    };
    return map[k] || k;
  };

  const systemLabel = (sys) => {
    const map = {
      KNOCKOUT: "KNOCKOUT",
      SINGLE_RR: "SINGLE ROUND ROBIN",
      DOUBLE_RR: "DOUBLE ROUND ROBIN",
      GROUP_POOL: "GROUP/POOL",
    };
    return map[sys] || (sys || "-");
  };

  const desired = [];

  putra.forEach((matchKey) => {
    const cfg = cfgMap[`putra:${matchKey}`] || {};
    desired.push({
      id: `P-${matchKey}`,
      nama: `PUTRA • ${labelFromKey(matchKey)}`,
      sistem: systemLabel(cfg.system),
    });
  });

  putri.forEach((matchKey) => {
    const cfg = cfgMap[`putri:${matchKey}`] || {};
    desired.push({
      id: `W-${matchKey}`,
      nama: `PUTRI • ${labelFromKey(matchKey)}`,
      sistem: systemLabel(cfg.system),
    });
  });

  ev.nomor = desired;
  return ev;
}

/* =========================================================
   GATE LAYER
   ========================================================= */
function renderGate(){

  const noEventState = $("noEventState");
  const eventSelector = $("eventSelector");
  const eventGrid = $("eventGrid");
  const selectorTitle = document.querySelector(".selector-title");

  const events = loadEvents().map(ensureEventShape);

  show($("workView"), false);

  // ===============================
  // NO EVENT
  // ===============================
  if(events.length === 0){
    show(noEventState, true);
    show(eventSelector, false);
    return;
  }

  show(noEventState, false);
  show(eventSelector, true);

  const activeId = getActiveId();
  const activeEvent = events.find(e => String(e.id) === String(activeId));

  // ===============================
  // MODE: PILIH NOMOR
  // ===============================
  if(location.hash === "#nomor" && activeEvent){

    selectorTitle.textContent = "SEMUA NOMOR PERTANDINGAN";
    eventGrid.classList.add("nomor-list");

    const nomorArr = activeEvent.nomor || [];

    if(nomorArr.length === 0){
      eventGrid.innerHTML = `
        <div class="tc-empty">
          Nomor pertandingan belum diatur.
        </div>
      `;
      return;
    }

    eventGrid.innerHTML = nomorArr.map(n => `
      <div class="nomor-card">
        <div class="nomor-top">
          <div>
            <div class="nomor-title">${esc(n.nama)}</div>
            <div class="nomor-meta">
              Sistem: <b>${esc(n.sistem)}</b>
            </div>
          </div>
          <div class="nomor-badge">${esc(n.id)}</div>
        </div>

        <div class="nomor-actions">
          <a class="nbtn drawing"
             href="/pages/technical/workspace/drawing.html?nomor=${encodeURIComponent(n.id)}">
             MASUK WORKSPACE
          </a>
        </div>
      </div>
    `).join("");

    return;
  }

  // ===============================
  // MODE: PILIH EVENT
  // ===============================
  selectorTitle.textContent = "PILIH EVENT";
  eventGrid.classList.remove("nomor-list");

  eventGrid.innerHTML = events.map(ev2 => `
    <div class="event-card" data-id="${esc(ev2.id)}">
      <div class="event-badge">${esc(ev2.id)}</div>
      <div class="event-name">${esc(ev2.nama || "(Nama belum diisi)")}</div>
      <div class="event-hint">Klik untuk masuk</div>
    </div>
  `).join("");

  eventGrid.querySelectorAll(".event-card").forEach(card => {
    card.addEventListener("click", () => {
      setActiveId(card.dataset.id);
      location.hash = "#nomor";
      route();
    });
  });
}

/* =========================================================
   WORKSPACE REDIRECT
   ========================================================= */
function renderWorkspace(){
  const nomorId = getQuery("nomor");
  if(!nomorId){
    renderGate();
    return;
  }

  window.location.href =
    "/pages/technical/workspace/drawing.html?nomor=" +
    encodeURIComponent(nomorId);
}

/* =========================================================
   ROUTER
   ========================================================= */
function route(){
  const nomorId = getQuery("nomor");

  if(!nomorId){
    renderGate();
  }else{
    renderWorkspace();
  }
}

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener("DOMContentLoaded", route);
window.addEventListener("hashchange", route);
