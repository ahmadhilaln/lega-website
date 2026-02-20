const params = new URLSearchParams(window.location.search);
const eventCode = params.get("event");
const matchId = String(params.get("id"));

let matchData = null;
let allMatch = [];
let participants = [];
let selectedClub = null;

init();

/* =========================================================
   INIT
========================================================= */
async function init() {

  document.getElementById("eventTitle").innerText = eventCode;

  try {

    // ambil semua pertandingan
    const matchRes = await fetch(`/api/admin/match-number?eventCode=${eventCode}`);
    allMatch = await matchRes.json();

    matchData = allMatch.find(m => String(m.id) === matchId);

    if (!matchData) {
      alert("Match tidak ditemukan");
      return;
    }

    document.getElementById("matchTitle").innerText =
      `${matchData.nomor} - ${matchData.kategori} (${matchData.gender})`;

    if (!matchData.drawing) {
      matchData.drawing = {};
    }

    await loadParticipants();
    renderLayout();

  } catch (err) {
    console.error("Init error:", err);
  }
}

/* =========================================================
   LOAD PESERTA SESUAI GENDER
========================================================= */
async function loadParticipants() {

  const res = await fetch(`/api/admin/database?eventCode=${eventCode}`);
  const data = await res.json();

  const pesertaList = data.peserta || [];
  const genderMatch = (matchData.gender || "").toLowerCase();

  participants = pesertaList.filter(p => {
    const dbGender =
      p.gender === "M" ? "putra" :
      p.gender === "F" ? "putri" : "";
    return dbGender === genderMatch;
  });
}

/* =========================================================
   CHECK USED
========================================================= */
function isClubUsed(name) {

  if (matchData.drawing.groups) {
    return matchData.drawing.groups.flat().includes(name);
  }

  if (matchData.drawing.teams) {
    return matchData.drawing.teams.includes(name);
  }

  return false;
}

/* =========================================================
   RENDER LAYOUT
========================================================= */
function renderLayout() {

  const grid = document.getElementById("drawingGrid");
  grid.innerHTML = "";

  renderDatabaseColumn(grid);

  const sistem = (matchData.sistem || "").toLowerCase();

  if (sistem === "group/pool") {
    renderGroup(grid);
  } else {
    renderNumberSystem(grid);
  }
}

/* =========================================================
   DATABASE COLUMN
========================================================= */
function renderDatabaseColumn(grid) {

  const col = document.createElement("div");
  col.className = "column";

  col.innerHTML = `
    <h3>DATABASE</h3>
    <table>
      <tr><th>Nama Klub</th></tr>
      ${participants.map(p => `
        <tr>
          <td onclick="selectClub('${p.nama_klub}')"
              class="club-name ${isClubUsed(p.nama_klub) ? 'red-used' : ''}"
              style="cursor:pointer;">
              ${p.nama_klub}
          </td>
        </tr>
      `).join("")}
    </table>
  `;

  grid.appendChild(col);
}

/* =========================================================
   GROUP SYSTEM
========================================================= */
function renderGroup(grid) {

  const totalPool = Number(matchData.jumlahPool || 0);

  if (!matchData.drawing.groups) {
    matchData.drawing.groups =
      Array.from({ length: totalPool }, () => Array(20).fill(null));
  }

  for (let i = 0; i < totalPool; i++) {

    const col = document.createElement("div");
    col.className = "column";

    col.innerHTML = `
      <h3>POOL ${String.fromCharCode(65 + i)}</h3>
      <table>
        ${matchData.drawing.groups[i]
          .map((team, index) => `
            <tr>
              <td>${index + 1}</td>
              <td onclick="placeToGroup(${i},${index})"
                  style="cursor:pointer;">
                  ${team || "-"}
              </td>
            </tr>
          `).join("")}
      </table>
    `;

    grid.appendChild(col);
  }
}

/* =========================================================
   NUMBER SYSTEM
========================================================= */
function renderNumberSystem(grid) {

  if (!matchData.drawing.teams) {
    matchData.drawing.teams = Array(32).fill(null);
  }

  const col = document.createElement("div");
  col.className = "column";

  col.innerHTML = `
    <h3>BAGAN</h3>
    <table>
      ${matchData.drawing.teams.map((team, index) => `
        <tr>
          <td>${index + 1}</td>
          <td onclick="placeToNumber(${index})"
              style="cursor:pointer;">
              ${team || "-"}
          </td>
        </tr>
      `).join("")}
    </table>
  `;

  grid.appendChild(col);
}

/* =========================================================
   PLACE CLUB
========================================================= */
function placeToGroup(pool, row) {

  if (!selectedClub) return alert("Pilih klub dulu");
  if (isClubUsed(selectedClub)) return alert("Sudah digunakan");

  matchData.drawing.groups[pool][row] = selectedClub;
  selectedClub = null;

  autoSave();
  renderLayout();
}

function placeToNumber(index) {

  if (!selectedClub) return alert("Pilih klub dulu");
  if (isClubUsed(selectedClub)) return alert("Sudah digunakan");

  matchData.drawing.teams[index] = selectedClub;
  selectedClub = null;

  autoSave();
  renderLayout();
}

/* =========================================================
   SELECT CLUB
========================================================= */
function selectClub(name) {
  selectedClub = name;
}

/* =========================================================
   AUTO SAVE
========================================================= */
async function autoSave() {

  await fetch("/api/admin/match-number", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventCode,
      matchNumber: matchData
    })
  });
}

/* =========================================================
   PRINT
========================================================= */
function printDrawing() {
  window.print();
}

/* =========================================================
   GLOBAL
========================================================= */
window.selectClub = selectClub;
window.placeToGroup = placeToGroup;
window.placeToNumber = placeToNumber;
window.printDrawing = printDrawing;
