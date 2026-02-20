let competitions=[];
const event=JSON.parse(localStorage.getItem("currentEvent"));
const eventCode=event.eventCode;

export async function renderPertandingan(container){

  container.innerHTML=`
    <h2>PERTANDINGAN</h2>
    <button class="primary" id="addBtn">+ Tambah Nomor Pertandingan</button>
    <div id="list" style="margin-top:20px;"></div>
  `;

  document.getElementById("addBtn").onclick=openModal;
  await loadData();
}

async function loadData(){
  const res=await fetch(`/api/competitions?eventCode=${eventCode}`);
  competitions=await res.json();
  if(!Array.isArray(competitions)) competitions=[];
  renderList();
}

function openModal(){

  const modal=document.createElement("div");
  modal.className="modal-backdrop";

  modal.innerHTML=`
    <div class="modal-box">
      <h3>Setup Pertandingan</h3>

      <label>Model</label>
      <select id="model">
        <option value="INTER">Inter</option>
        <option value="TEAM">Team</option>
      </select>

      <label>Tipe</label>
      <select id="type">
        <option value="DOUBLE">Double</option>
        <option value="REGU">Regu</option>
        <option value="QUADRANT">Quadrant</option>
      </select>

      <label>Kategori</label>
      <select id="category">
        <option value="PUTRA">Putra</option>
        <option value="PUTRI">Putri</option>
      </select>

      <label>Sistem</label>
      <select id="system">
        <option value="KNOCKOUT">Knock Out</option>
        <option value="KOMPETISI">Kompetisi</option>
        <option value="SETENGAH">Setengah Kompetisi</option>
        <option value="GROUP">Group / Pool</option>
      </select>

      <label>Jumlah Peserta</label>
      <input id="teamCount" type="number">

      <div class="modal-actions">
        <button class="primary" id="saveBtn">Simpan</button>
        <button class="secondary" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelBtn").onclick=()=>modal.remove();

  document.getElementById("saveBtn").onclick=async()=>{
    const comp={
      compId:"C"+Date.now(),
      model:model.value,
      type:type.value,
      category:category.value,
      system:system.value,
      teamCount:teamCount.value
    };

    await fetch("/api/competitions",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({eventCode,competition:comp})
    });

    modal.remove();
    await loadData();
  };
}

function renderList(){
  const list=document.getElementById("list");
  list.innerHTML="";

  competitions.forEach(c=>{
    list.innerHTML+=`
      <div class="comp-card">
        <div>
          <strong>${c.model} ${c.type}</strong> - ${c.category}
        </div>
        <div>
          <button class="secondary">Drawing</button>
          <button class="secondary">Edit</button>
          <button class="secondary">Hapus</button>
          <button class="secondary">Jadwal</button>
        </div>
      </div>
    `;
  });
}
