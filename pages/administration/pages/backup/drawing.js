const params = new URLSearchParams(window.location.search);
const eventCode = params.get("event");
const matchId = String(params.get("matchId"));

let matchData = null;
let allMatch = [];
let participants = [];
let selectedClub = null;

init();

/* ================= INIT ================= */

async function init(){

  document.getElementById("eventTitle").innerText = eventCode;

  const matchRes = await fetch(`/api/admin/match-number?eventCode=${eventCode}`);
  allMatch = await matchRes.json();

  matchData = allMatch.find(m => String(m.id) === matchId);

  document.getElementById("matchTitle").innerText =
    `${matchData.nomor} - ${matchData.kategori} (${matchData.gender})`;

  if(!matchData.drawing){
    matchData.drawing = {};
  }

  await loadParticipants();
  renderLayout();
}

/* ================= LOAD DATABASE ================= */

async function loadParticipants(){

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

/* ================= CHECK USED ================= */

function isClubUsed(name){

  if(matchData.drawing.groups){
    return matchData.drawing.groups.flat().includes(name);
  }

  if(matchData.drawing.teams){
    return matchData.drawing.teams.includes(name);
  }

  return false;
}

/* ================= RENDER ================= */

function renderLayout(){

  const grid = document.getElementById("drawingGrid");
  grid.innerHTML = "";

  renderDatabaseColumn(grid);

  const sistem = (matchData.sistem || "").toLowerCase();

  if(sistem === "group/pool"){
    renderGroup(grid);
  }else{
    renderNumberSystem(grid);
  }
}

/* ================= DATABASE ================= */

function renderDatabaseColumn(grid){

  const col = document.createElement("div");
  col.className = "column";

  const sistem = (matchData.sistem || "").toLowerCase();
  const totalPool = Number(matchData.jumlahPool || 0);

  let controls = "";

  if(sistem === "group/pool"){

    controls = `
      <div class="db-controls">
          <input type="text"
                 id="searchInput"
                 placeholder="Search"
                 oninput="filterDatabase()">

          <select id="poolSelect">
            ${Array.from({length: totalPool}, (_,i)=>
              `<option value="${i}">
                 ${i+1}
               </option>`
            ).join("")}
          </select>

          <select id="rowSelect">
            ${Array.from({length: 20}, (_,i)=>
              `<option value="${i}">
                 ${i+1}
               </option>`
            ).join("")}
          </select>

          <button onclick="generateToPool()">Generate</button>
      </div>
    `;
  }else{

    controls = `
      <div class="db-controls">
          <input type="text"
                 id="searchInput"
                 placeholder="Search"
                 oninput="filterDatabase()">

          <select id="numberSelect">
            ${Array.from({length: 64}, (_,i)=>
              `<option value="${i+1}">
                 ${i+1}
               </option>`
            ).join("")}
          </select>

          <button onclick="generateByNumber()">Generate</button>
      </div>
    `;
  }

  col.innerHTML = `
    ${controls}
    <table>
      <tr>
        <th>Nama Klub</th>
        <th></th>
      </tr>
      ${participants.map(p=>{

        const used = isClubUsed(p.nama_klub);

        return `
        <tr>
          <td onclick="selectClub('${p.nama_klub}')"
              class="${used ? 'red-used' : ''}"
              style="cursor:pointer;">
              ${p.nama_klub}
          </td>
          <td class="delete-btn"
              onclick="deleteFromDatabase('${p.nama_klub}')">
              x
          </td>
        </tr>
        `;
      }).join("")}
    </table>
  `;

  grid.appendChild(col);
}

/* ================= GROUP ================= */

function renderGroup(grid){

  const totalPool = Number(matchData.jumlahPool);

  if(!matchData.drawing.groups){
    matchData.drawing.groups =
      Array.from({length: totalPool}, ()=>[]);
  }

  const matchIndex =
    allMatch.findIndex(m => String(m.id) === matchId);

  const startChar = matchIndex * totalPool;

  for(let i=0;i<totalPool;i++){

    const col = document.createElement("div");
    col.className = "column";

    const poolLetter =
      String.fromCharCode(65 + startChar + i);

    col.innerHTML = `
      <h3>${poolLetter}</h3>
      <table>
        ${matchData.drawing.groups[i]
          .map((team,index)=>`
            <tr>
              <td>${index+1}</td>
              <td>${team}</td>
              <td class="delete-btn"
                  onclick="removeFromGroup(${i},${index})">x</td>
            </tr>
          `).join("")}
      </table>
    `;

    grid.appendChild(col);
  }
}

/* ================= NUMBER SYSTEM ================= */

function renderNumberSystem(grid){

  if(!matchData.drawing.teams){
    matchData.drawing.teams = [];
  }

  const col = document.createElement("div");
  col.className = "column";

  col.innerHTML = `
    <h3>Bagan</h3>
    <table>
      ${matchData.drawing.teams.map((team,index)=>`
        <tr>
          <td>${index+1}</td>
          <td>${team || "-"}</td>
          <td class="delete-btn"
              onclick="removeFromNumber(${index})">x</td>
        </tr>
      `).join("")}
    </table>
  `;

  grid.appendChild(col);
}

/* ================= GENERATE ================= */

function generateToPool(){

  if(!selectedClub) return alert("Pilih klub dulu");
  if(isClubUsed(selectedClub)) return;

  const pool = Number(document.getElementById("poolSelect").value);
  const row = Number(document.getElementById("rowSelect").value);

  matchData.drawing.groups[pool][row] = selectedClub;

  selectedClub = null;
  autoSave();
  renderLayout();
}

function generateByNumber(){

  if(!selectedClub) return alert("Pilih klub dulu");
  if(isClubUsed(selectedClub)) return;

  const number = Number(document.getElementById("numberSelect").value);

  if(!matchData.drawing.teams){
    matchData.drawing.teams = [];
  }

  matchData.drawing.teams[number-1] = selectedClub;

  selectedClub = null;
  autoSave();
  renderLayout();
}

/* ================= REMOVE ================= */

function removeFromGroup(pool,index){
  matchData.drawing.groups[pool].splice(index,1);
  autoSave();
  renderLayout();
}

function removeFromNumber(index){
  matchData.drawing.teams.splice(index,1);
  autoSave();
  renderLayout();
}

/* ================= DATABASE DELETE ================= */

function deleteFromDatabase(name){

  if(!confirm("Hapus klub dari database?")) return;

  participants = participants.filter(p=>p.nama_klub !== name);
  renderLayout();
}

/* ================= SEARCH ================= */

function filterDatabase(){

  const input = document.getElementById("searchInput");
  const keyword = input.value.toLowerCase();

  const rows = document.querySelectorAll(".column table tr");

  rows.forEach((row,index)=>{
    if(index === 0) return;
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(keyword) ? "" : "none";
  });
}

/* ================= SELECT ================= */

function selectClub(name){
  selectedClub = name;
  document.getElementById("searchInput").value = name;
}

/* ================= AUTO SAVE ================= */

async function autoSave(){
  await fetch("/api/admin/match-number",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      eventCode,
      matchNumber: matchData
    })
  });
}

/* ================= PRINT ================= */

function printDrawing(){
  window.print();
}

window.generateToPool = generateToPool;
window.generateByNumber = generateByNumber;
window.selectClub = selectClub;
window.filterDatabase = filterDatabase;
window.removeFromGroup = removeFromGroup;
window.removeFromNumber = removeFromNumber;
window.deleteFromDatabase = deleteFromDatabase;
window.printDrawing = printDrawing;
