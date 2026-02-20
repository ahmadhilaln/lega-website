const params = new URLSearchParams(window.location.search);
const EVENT_CODE = params.get("event");

let data = [];
let selectedIndex = null;

const tbody = document.getElementById("tbodyPanitia");
const detailSection = document.getElementById("detailSection");
const detailContent = document.getElementById("detailContent");
const modalRoot = document.getElementById("modalRoot");

const btnTambah = document.getElementById("btnTambah");
const btnImport = document.getElementById("btnImport");
const btnTemplate = document.getElementById("btnTemplate");
const btnPrint = document.getElementById("btnPrint");
const fileImport = document.getElementById("fileImport");

export async function init(){
  btnTambah.onclick = openAddModal;
  btnImport.onclick = ()=>fileImport.click();
  btnTemplate.onclick = downloadTemplate;
  btnPrint.onclick = ()=>window.print();
  fileImport.onchange = importCSV;
  await loadData();
}

export function destroy(){}

/* ================= LOAD SAVE ================= */

async function loadData(){
  try{
    const res = await fetch(`/api/admin/database?eventCode=${EVENT_CODE}`);
    const json = await res.json();
    data = json?.panitia || [];
    render();
  }catch{
    data=[];
    render();
  }
}

async function saveData(){
  const res = await fetch(`/api/admin/database?eventCode=${EVENT_CODE}`);
  const json = await res.json();
  json.panitia = data;

  await fetch("/api/admin/database",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ eventCode:EVENT_CODE, database:json })
  });
}

/* ================= RENDER LIST ================= */

function render(){
  tbody.innerHTML = data.map((row,i)=>`
    <tr class="${selectedIndex===i?'active-row':''}" onclick="window.selectRowPanitia(${i})">
      <td>${i+1}</td>
      <td>${row.kode}</td>
      <td>${row.nama}</td>
      <td>${row.jabatan}</td>
      <td>${row.wa}</td>
      <td>
        <button onclick="event.stopPropagation();window.editPanitia(${i})">Edit</button>
        <button onclick="event.stopPropagation();window.deletePanitia(${i})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

/* ================= SELECT ================= */

window.selectRowPanitia = function(index){
  selectedIndex = index;
  render();
  renderDetail();
};

function renderDetail(){
  if(selectedIndex===null){
    detailSection.classList.add("hidden");
    return;
  }

  const d = data[selectedIndex];
  detailSection.classList.remove("hidden");

  detailContent.innerHTML = `
    <div><b>KODE:</b> ${d.kode}</div>
    <div><b>Nama:</b> ${d.nama}</div>
    <div><b>Gender:</b> ${d.gender}</div>
    <div><b>NIK:</b> ${d.nik}</div>
    <div><b>Jabatan:</b> ${d.jabatan}</div>
    <div><b>WA:</b> ${d.wa}</div>
    <div><b>Alamat:</b> ${d.alamat}</div>
    <div><b>Bank:</b> ${d.bank}</div>
    <div><b>Rekening:</b> ${d.rekening}</div>
  `;
}

/* ================= GENERATE KODE ================= */

function generateKode(){
  let max = 0;
  data.forEach(d=>{
    const n = parseInt(d.kode?.slice(1)) || 0;
    if(n>max) max=n;
  });
  return "C"+String(max+1).padStart(3,"0");
}

/* ================= ADD ================= */

function openAddModal(){
  openFormModal("Tambah Panitia",{},async(form)=>{
    const kode = generateKode();
    data.push({kode,...form});
    await saveData();
    closeModal();
    render();
  });
}

/* ================= EDIT ================= */

window.editPanitia = function(index){
  openFormModal("Edit Panitia",data[index],async(form)=>{
    data[index]={...data[index],...form};
    await saveData();
    closeModal();
    render();
    renderDetail();
  });
};

/* ================= DELETE ================= */

window.deletePanitia = function(index){
  if(confirm(`Yakin hapus ${data[index].kode}?`)){
    data.splice(index,1);
    selectedIndex=null;
    saveData();
    render();
    renderDetail();
  }
};

/* ================= IMPORT ================= */

async function importCSV(){
  const text = await fileImport.files[0].text();
  const rows = text.split("\n").map(r=>r.split(","));
  data=[];
  rows.slice(1).forEach(r=>{
    if(!r[1]) return;
    data.push({
      kode:r[1],
      gender:r[2],
      nama:r[3],
      nik:r[4],
      jabatan:r[5],
      wa:r[6],
      alamat:r[7],
      bank:r[8],
      rekening:r[9]
    });
  });
  await saveData();
  render();
  detailSection.classList.add("hidden");
}

/* ================= TEMPLATE ================= */

function downloadTemplate(){
  const header="NO,KODE,GENDER,NAMA,NIK,JABATAN,WA,ALAMAT,BANK,REKENING";
  const blob=new Blob([header],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="template-panitia.csv";
  a.click();
}

/* ================= MODAL ================= */

function openFormModal(title,values,onSave){
  modalRoot.innerHTML=`
  <div class="modal-overlay">
    <div class="modal-card">
      <h3>${title}</h3>
      <select id="m_gender">
        <option value="M" ${values.gender==="M"?"selected":""}>M</option>
        <option value="F" ${values.gender==="F"?"selected":""}>F</option>
      </select>
      <input id="m_nama" placeholder="Nama" value="${values.nama||""}">
      <input id="m_nik" placeholder="NIK" value="${values.nik||""}">
      <input id="m_jabatan" placeholder="Jabatan" value="${values.jabatan||""}">
      <input id="m_wa" placeholder="WA" value="${values.wa||""}">
      <input id="m_alamat" placeholder="Alamat" value="${values.alamat||""}">
      <input id="m_bank" placeholder="Bank" value="${values.bank||""}">
      <input id="m_rekening" placeholder="Rekening" value="${values.rekening||""}">
      <div class="modal-actions">
        <button onclick="closeModal()">Cancel</button>
        <button id="saveBtn">Simpan</button>
      </div>
    </div>
  </div>`;

  document.getElementById("saveBtn").onclick=()=>{
    const form={
      gender:document.getElementById("m_gender").value,
      nama:document.getElementById("m_nama").value,
      nik:document.getElementById("m_nik").value,
      jabatan:document.getElementById("m_jabatan").value,
      wa:document.getElementById("m_wa").value,
      alamat:document.getElementById("m_alamat").value,
      bank:document.getElementById("m_bank").value,
      rekening:document.getElementById("m_rekening").value
    };
    onSave(form);
  };
}

window.closeModal=function(){
  modalRoot.innerHTML="";
};
