const tabs = document.querySelectorAll(".tab");
const content = document.getElementById("contentArea");

let competitions = [];

/* =========================
   TAB SYSTEM
========================= */

tabs.forEach(tab=>{
  tab.addEventListener("click", ()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    render(tab.dataset.main);
  });
});

function render(main){

  if(main==="database"){
    content.innerHTML = "<h2>DATABASE</h2>";
  }

  if(main==="pertandingan"){
    renderPertandingan();
  }

  if(main==="schedule"){
    content.innerHTML = "<h2>SCHEDULE</h2>";
  }

  if(main==="lembar"){
    content.innerHTML = "<h2>LEMBAR CETAK</h2>";
  }
}

/* =========================
   PERTANDINGAN
========================= */

function renderPertandingan(){

  content.innerHTML = `
    <h2>PERTANDINGAN</h2>
    <button class="primary" id="addBtn">+ Tambah Nomor Pertandingan</button>

    <h3 style="margin-top:25px;">Putra</h3>
    <div id="listPutra"></div>

    <h3 style="margin-top:25px;">Putri</h3>
    <div id="listPutri"></div>
  `;

  document.getElementById("addBtn").onclick = openModal;

  renderList();
}

/* =========================
   MODAL
========================= */

function openModal(){

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-box">
      <h3>Setup Pertandingan</h3>

      <label>Model</label>
      <select id="model">
        <option>Inter</option>
        <option>Team</option>
      </select>

      <label>Tipe</label>
      <select id="type">
        <option>Double</option>
        <option>Regu</option>
        <option>Quadrant</option>
      </select>

      <label>Kategori</label>
      <select id="category">
        <option>Putra</option>
        <option>Putri</option>
      </select>

      <label>Sistem</label>
      <select id="system">
        <option>Knock Out</option>
        <option>Kompetisi</option>
        <option>Setengah Kompetisi</option>
        <option>Group / Pool</option>
      </select>

      <div id="groupExtra" style="display:none; margin-top:10px;">

        <label>Jumlah Pool</label>
        <input type="number" id="poolCount">

        <label style="margin-top:10px;">
          <input type="checkbox" id="juaraGroup">
          Juara Group
        </label>

        <label>
          <input type="checkbox" id="runnerUp">
          Runner Up Group
        </label>

        <label>
          <input type="checkbox" id="best3">
          Best 3
        </label>

        <input type="number"
          id="best3Count"
          placeholder="Jumlah Best 3"
          style="display:none;">
      </div>

      <label>Jumlah Peserta</label>
      <input type="number" id="teamCount">

      <div class="modal-actions">
        <button class="primary" id="saveBtn">Simpan</button>
        <button class="secondary" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const systemSelect = document.getElementById("system");
  const groupExtra = document.getElementById("groupExtra");
  const best3Checkbox = document.getElementById("best3");
  const best3Count = document.getElementById("best3Count");

  systemSelect.addEventListener("change", function(){
    if(this.value === "Group / Pool"){
      groupExtra.style.display = "block";
    }else{
      groupExtra.style.display = "none";
    }
  });

  best3Checkbox.addEventListener("change", function(){
    best3Count.style.display = this.checked ? "block" : "none";
  });

  document.getElementById("cancelBtn").onclick = ()=>{
    modal.remove();
  };

  document.getElementById("saveBtn").onclick = ()=>{

    const comp = {
      model: document.getElementById("model").value,
      type: document.getElementById("type").value,
      category: document.getElementById("category").value,
      system: document.getElementById("system").value,
      teamCount: document.getElementById("teamCount").value,
      poolCount: document.getElementById("poolCount")?.value || null,
      advance:{
        juara: document.getElementById("juaraGroup")?.checked || false,
        runner: document.getElementById("runnerUp")?.checked || false,
        best3: document.getElementById("best3")?.checked || false,
        best3Count: document.getElementById("best3Count")?.value || null
      }
    };

    competitions.push(comp);
    modal.remove();
    renderList();
  };
}

/* =========================
   RENDER LIST
========================= */

function renderList(){

  const listPutra = document.getElementById("listPutra");
  const listPutri = document.getElementById("listPutri");

  if(!listPutra || !listPutri) return;

  listPutra.innerHTML = "";
  listPutri.innerHTML = "";

  competitions.forEach((c,index)=>{

    const card = `
      <div class="comp-card">
        <div>
          <strong>${c.model} ${c.type}</strong><br>
          <small>${c.system}</small>
        </div>
        <div>
          <button class="secondary">Drawing</button>
          <button class="secondary">Edit</button>
          <button class="secondary" onclick="deleteComp(${index})">Hapus</button>
        </div>
      </div>
    `;

    if(c.category === "Putra"){
      listPutra.innerHTML += card;
    }else{
      listPutri.innerHTML += card;
    }
  });
}

/* =========================
   DELETE
========================= */

function deleteComp(index){
  if(confirm("Hapus nomor pertandingan ini?")){
    competitions.splice(index,1);
    renderList();
  }
}

/* =========================
   INIT
========================= */

render("database");
