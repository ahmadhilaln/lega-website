const COLUMNS = {
  peserta: [
    "gender","nama_klub","wa",
    ...Array.from({length:15},(_,i)=>"pemain"+(i+1)),
    "manager","headcoach","assistcoach","doctor","barcode"
  ],
  panitia: [
    "gender","nama","wa","nik","jabatan","alamat","bank","rekening"
  ],
  wasit: [
    "gender","nama","wa","nik","jabatan","lisensi","alamat","bank","rekening"
  ]
};

let currentView="peserta";
let editMode=true;
let dataStore={peserta:[],panitia:[],wasit:[]};

const thead=document.getElementById("thead");
const tbody=document.getElementById("tbody");
const search=document.getElementById("search");
const fileInput=document.getElementById("file");

document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentView=btn.dataset.view;
    render();
  };
});

document.getElementById("btnEdit").onclick=()=>{
  editMode=!editMode;
  document.getElementById("btnEdit").innerText="Edit: "+(editMode?"ON":"OFF");
  render();
};

document.getElementById("btnTemplate").onclick=()=>{
  const cols=COLUMNS[currentView];
  const header=["NO",...cols].join(",");
  const blob=new Blob([header],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="template-"+currentView+".csv";
  a.click();
};

document.getElementById("btnImport").onclick=()=>fileInput.click();

fileInput.onchange=async()=>{
  const text=await fileInput.files[0].text();
  const rows=text.split("\n").map(r=>r.split(","));
  const cols=COLUMNS[currentView];
  rows.slice(1).forEach(r=>{
    const obj={};
    cols.forEach((c,i)=>obj[c]=r[i+1]||"");
    dataStore[currentView].push(obj);
  });
  render();
};

document.getElementById("btnPrint").onclick=()=>window.print();

search.oninput=render;

function render(){
  const cols=COLUMNS[currentView];

  thead.innerHTML=
    `<tr>
      <th class="sticky-1">NO</th>
      <th class="sticky-2">${cols[0].toUpperCase()}</th>
      <th class="sticky-3">${cols[1].toUpperCase()}</th>
      ${cols.slice(2).map(c=>`<th>${c.toUpperCase()}</th>`).join("")}
    </tr>`;

  let rows=dataStore[currentView];
  const q=search.value.toLowerCase();
  if(q) rows=rows.filter(r=>Object.values(r).join(" ").toLowerCase().includes(q));

  tbody.innerHTML=rows.map((row,i)=>{
    const first=row[cols[0]]||"";
    const second=row[cols[1]]||"";
    const others=cols.slice(2).map(c=>{
      let val=row[c]||"";
      if(c==="wa"&&val){
        return `<td>${editMode?val:`<a class="wa-link" target="_blank" href="https://wa.me/${val}">${val}</a>`}</td>`;
      }
      return `<td ${editMode?'contenteditable="true"':''}>${val}</td>`;
    }).join("");

    return `
      <tr>
        <td class="sticky-1">${i+1}</td>
        <td class="sticky-2" ${editMode?'contenteditable="true"':''}>${first}</td>
        <td class="sticky-3" ${editMode?'contenteditable="true"':''}>${second}</td>
        ${others}
      </tr>
    `;
  }).join("");
}

render();
