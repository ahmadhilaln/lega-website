let currentSubModule = null;

export function init(){

  const tabs = document.querySelectorAll(".db-tab");

  tabs.forEach(tab=>{
    tab.addEventListener("click", ()=>{
      activateTab(tab.dataset.sub);
    });
  });

  activateTab("peserta");
}

function activateTab(name){

  document.querySelectorAll(".db-tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.sub === name);
  });

  loadSubModule(name);
}

async function loadSubModule(name){

  const container = document.getElementById("dbContent");

  try{

    // ✅ ABSOLUTE PATH FIX
    const basePath = "/pages/administration/modules/database/";

    const res = await fetch(`${basePath}${name}/${name}.html`);

    if(!res.ok){
      throw new Error("HTML tidak ditemukan");
    }

    container.innerHTML = await res.text();

    // CSS inject
    if(!document.getElementById(`${name}-css`)){
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${basePath}${name}/${name}.css`;
      link.id = `${name}-css`;
      document.head.appendChild(link);
    }

    // destroy lama
    if(currentSubModule && typeof currentSubModule.destroy === "function"){
      currentSubModule.destroy();
    }

    const module = await import(
      `${basePath}${name}/${name}.js?v=${Date.now()}`
    );

    if(module.init){
      await module.init();
    }

    currentSubModule = module;

  }catch(err){
    console.error("Load submodule error:", err);
    container.innerHTML = `
      <div style="padding:20px;color:red;">
        Gagal memuat module: ${name}
      </div>
    `;
  }
}

export function destroy(){
  if(currentSubModule && typeof currentSubModule.destroy === "function"){
    currentSubModule.destroy();
  }
  currentSubModule = null;
}
