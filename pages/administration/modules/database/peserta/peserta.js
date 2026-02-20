const params = new URLSearchParams(window.location.search);
const EVENT_CODE = params.get("event");

let data = [];
let selectedIndex = null;

const tbody = document.getElementById("tbodyPeserta");
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
    data = json?.peserta || [];
    render();
  }catch{
    data=[];
    render();
  }
}

async function saveData(){
  const res = await fetch(`/api/admin/database?eventCode=${EVENT_CODE}`);
  const json = await res.json();
  json.peserta = data;
  await fetch("/api/admin/database",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ eventCode:EVENT_CODE, database:json })
  });
}

/* ================= RENDER LIST ================= */

function render(){
  tbody.innerHTML = data.map((row,i)=>`
    <tr class="${selectedIndex===i?'active-row':''}" onclick="window.selectRow(${i})">
      <td>${i+1}</td>
      <td>${row.kode}</td>
      <td>${row.gender}</td>
      <td>${row.nama_klub}</td>
      <td>${row.wa}</td>
      <td>
        <button onclick="event.stopPropagation();window.editData(${i})">Edit</button>
        <button onclick="event.stopPropagation();window.deleteData(${i})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

/* ================= SELECT ================= */

window.selectRow = function(index){
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

  let pemainHTML = "";
  for(let i=1;i<=15;i++){
    pemainHTML += `<div>Pemain ${i}: ${d["pemain"+i]||""}</div>`;
  }

  detailContent.innerHTML = `
    <div><b>KODE:</b> ${d.kode}</div>
    <div><b>Gender:</b> ${d.gender}</div>
    <div><b>Nama Klub:</b> ${d.nama_klub}</div>
    <div><b>WA:</b> ${d.wa}</div>
    <hr>
    ${pemainHTML}
    <hr>
    <div><b>Manager:</b> ${d.manager||""}</div>
    <div><b>Headcoach:</b> ${d.headcoach||""}</div>
    <div><b>Assistcoach:</b> ${d.assistcoach||""}</div>
    <div><b>Doctor:</b> ${d.doctor||""}</div>
  `;
}

/* ================= KODE ================= */

function generateKode(gender){
  const filtered = data.filter(d=>d.gender===gender);
  let max=0;
  filtered.forEach(d=>{
    const n=parseInt(d.kode.slice(2));
    if(n>max) max=n;
  });
  return `P${gender}${String(max+1).padStart(3,"0")}`;
}

/* ================= ADD ================= */

function openAddModal(){
  openFormModal("Tambah Data",{},async(form)=>{
    const kode = generateKode(form.gender);
    data.push({kode,...form});
    await saveData();
    closeModal();
    render();
  });
}

/* ================= EDIT ================= */

window.editData = function(index){
  openFormModal("Edit Data",data[index],async(form)=>{
    data[index]={...data[index],...form};
    await saveData();
    closeModal();
    render();
    renderDetail();
  });
};

/* ================= DELETE ================= */

window.deleteData = function(index){
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
    const obj={
      kode:r[1],
      gender:r[2],
      nama_klub:r[3],
      wa:r[4],
      manager:r[20]||"",
      headcoach:r[21]||"",
      assistcoach:r[22]||"",
      doctor:r[23]||""
    };
    for(let i=1;i<=15;i++){
      obj["pemain"+i]=r[4+i]||"";
    }
    data.push(obj);
  });
  await saveData();
  render();
  detailSection.classList.add("hidden");
}

/* ================= TEMPLATE ================= */

function downloadTemplate(){
  const header="NO,KODE,GENDER,NAMA KLUB,WA,"+
  Array.from({length:15},(_,i)=>`PEMAIN${i+1}`).join(",")+
  ",MANAGER,HEADCOACH,ASSISTCOACH,DOCTOR";
  const blob=new Blob([header],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="template-peserta.csv";
  a.click();
}

/* ================= MODAL ================= */

function openFormModal(title,values,onSave){
  let pemainInputs="";
  for(let i=1;i<=15;i++){
    pemainInputs+=`<input id="p${i}" placeholder="Pemain ${i}" value="${values["pemain"+i]||""}">`;
  }

  modalRoot.innerHTML=`
  <div class="modal-overlay">
    <div class="modal-card">
      <h3>${title}</h3>
      <select id="m_gender">
        <option value="M" ${values.gender==="M"?"selected":""}>M</option>
        <option value="F" ${values.gender==="F"?"selected":""}>F</option>
      </select>
      <input id="m_nama" placeholder="Nama Klub" value="${values.nama_klub||""}">
      <input id="m_wa" placeholder="WA" value="${values.wa||""}">
      ${pemainInputs}
      <input id="m_manager" placeholder="Manager" value="${values.manager||""}">
      <input id="m_head" placeholder="Headcoach" value="${values.headcoach||""}">
      <input id="m_assist" placeholder="Assistcoach" value="${values.assistcoach||""}">
      <input id="m_doc" placeholder="Doctor" value="${values.doctor||""}">
      <div class="modal-actions">
        <button onclick="closeModal()">Cancel</button>
        <button id="saveBtn">Simpan</button>
      </div>
    </div>
  </div>`;

  document.getElementById("saveBtn").onclick=()=>{
    const form={
      gender:document.getElementById("m_gender").value,
      nama_klub:document.getElementById("m_nama").value,
      wa:document.getElementById("m_wa").value,
      manager:document.getElementById("m_manager").value,
      headcoach:document.getElementById("m_head").value,
      assistcoach:document.getElementById("m_assist").value,
      doctor:document.getElementById("m_doc").value
    };
    for(let i=1;i<=15;i++){
      form["pemain"+i]=document.getElementById("p"+i).value;
    }
    onSave(form);
  };
}

window.closeModal=function(){
  modalRoot.innerHTML="";
};
