const tabs = document.querySelectorAll(".tab");
const content = document.getElementById("contentArea");

let currentModule = null;

tabs.forEach(tab=>{
  tab.addEventListener("click", ()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    loadModule(tab.dataset.main);
  });
});

async function loadModule(name){

  try{

    // LOAD HTML
    const res = await fetch(`./modules/${name}/${name}.html`);
    if(!res.ok) throw new Error("HTML not found");
    content.innerHTML = await res.text();

    // LOAD CSS (only once)
    if(!document.getElementById(`${name}-css`)){
      const link = document.createElement("link");
      link.rel="stylesheet";
      link.href=`./modules/${name}/${name}.css`;
      link.id=`${name}-css`;
      document.head.appendChild(link);
    }

    // DESTROY OLD MODULE
    if(currentModule && currentModule.destroy){
      currentModule.destroy();
    }

    // IMPORT JS MODULE
    const module = await import(`./modules/${name}/${name}.js`);

    if(module.init){
      module.init();
    }

    currentModule = module;

  }catch(err){
    console.error(err);
    content.innerHTML = `<h2>Module "${name}" tidak ditemukan</h2>`;
  }
}

// Default load
loadModule("database");

function logout(){
  alert("Logout");
}

function goHome(){
  window.location.href="/";
}
