const params = new URLSearchParams(window.location.search);
const eventCode = params.get("event");
const court = params.get("court");

let eventData = null;
let masterMatches = [];
let scheduledMatches = [];

init();

async function init() {
  await loadEvent();
  buildMasterMatchList();
  populateFilters();
  renderMatchList();
}

async function loadEvent() {
  const res = await fetch(`/api/admin/event?eventCode=${eventCode}`);
  eventData = await res.json();

  document.getElementById("pageTitle")
    .innerText = `PERTANDINGAN - COURT ${court}`;
}

/* ================= MASTER MATCH ================= */

function buildMasterMatchList() {
  masterMatches = [];

  eventData.pertandingan.forEach(p => {
    if (!p.matches) return;

    p.matches.forEach(m => {
      masterMatches.push({
        id: m.id,
        nomor: p.nomor,
        stage: p.stage || "Group",
        label: m.label || "",
        klubA: m.klubA,
        klubB: m.klubB,
        status: "unscheduled"
      });
    });
  });
}

/* ================= FILTER ================= */

function populateFilters() {
  const nomorSet = [...new Set(masterMatches.map(m => m.nomor))];
  const stageSet = [...new Set(masterMatches.map(m => m.stage))];

  const nomorSelect = document.getElementById("nomorSelect");
  const stageSelect = document.getElementById("stageSelect");

  nomorSet.forEach(n => {
    nomorSelect.innerHTML += `<option value="${n}">${n}</option>`;
  });

  stageSet.forEach(s => {
    stageSelect.innerHTML += `<option value="${s}">${s}</option>`;
  });

  nomorSelect.addEventListener("change", renderMatchList);
  stageSelect.addEventListener("change", renderMatchList);
}

/* ================= RENDER MATCH LIST ================= */

function renderMatchList() {
  const nomor = document.getElementById("nomorSelect").value;
  const stage = document.getElementById("stageSelect").value;

  const container = document.getElementById("matchList");
  container.innerHTML = "";

  const filtered = masterMatches.filter(m =>
    m.nomor === nomor &&
    m.stage === stage &&
    !scheduledMatches.includes(m.id)
  );

  filtered.forEach(m => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.innerText = `${m.label} ${m.klubA} vs ${m.klubB}`;
    container.appendChild(div);
  });
}

/* ================= SLOT ================= */

window.addRow = function () {
  const tbody = document.getElementById("scheduleBody");

  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="number" min="1" value="1"></td>
    <td><input type="time"></td>
    <td>
      <select class="matchSelect">
        ${getAvailableMatchOptions()}
      </select>
    </td>
    <td><input type="number" min="1" value="1"></td>
    <td><button onclick="removeRow(this)">Hapus</button></td>
  `;

  tbody.appendChild(row);

  row.querySelector(".matchSelect")
    .addEventListener("change", updateScheduled);
}

window.removeRow = function (btn) {
  const row = btn.closest("tr");
  const select = row.querySelector(".matchSelect");
  if (select.value) {
    scheduledMatches = scheduledMatches.filter(id => id !== select.value);
  }
  row.remove();
  renderMatchList();
}

function getAvailableMatchOptions() {
  const nomor = document.getElementById("nomorSelect").value;
  const stage = document.getElementById("stageSelect").value;

  const filtered = masterMatches.filter(m =>
    m.nomor === nomor &&
    m.stage === stage &&
    !scheduledMatches.includes(m.id)
  );

  return `
    <option value="">-- pilih match --</option>
    ${filtered.map(m =>
      `<option value="${m.id}">
        ${m.label} ${m.klubA} vs ${m.klubB}
      </option>`
    ).join("")}
  `;
}

function updateScheduled(e) {
  const selectedId = e.target.value;
  if (!selectedId) return;

  scheduledMatches.push(selectedId);
  renderMatchList();
}
