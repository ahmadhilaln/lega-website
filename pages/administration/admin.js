const tabs = document.querySelectorAll(".tab");
const content = document.getElementById("contentArea");
const eventTitle = document.querySelector(".event-title");

let currentModule = null;

/* ================= GET EVENT FROM URL ================= */

const params = new URLSearchParams(window.location.search);
const EVENT_CODE = params.get("event");

if (!EVENT_CODE) {
  alert("Event tidak ditemukan. Silakan login ulang.");
  window.location.href = "/";
}

/* ================= LOAD EVENT INFO ================= */

async function loadEventInfo() {
  try {
    const res = await fetch(`/api/admin/event?eventCode=${EVENT_CODE}`);
    if (!res.ok) throw new Error("Event tidak ditemukan");

    const data = await res.json();

    if (!data.eventInfo) {
      throw new Error("Data event rusak");
    }

    eventTitle.innerText =
      data.eventInfo.eventName + " (" + EVENT_CODE + ")";
  } catch (err) {
    console.error(err);
    alert("Event tidak valid.");
    window.location.href = "/";
  }
}

loadEventInfo();

/* ================= TAB CLICK ================= */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const moduleName = tab.dataset.main;
    activateTab(moduleName);
  });
});

/* ================= ACTIVATE TAB ================= */

function activateTab(name) {
  tabs.forEach(t => {
    if (t.dataset.main === name) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  loadModule(name);
}

/* ================= LOAD MODULE ================= */

async function loadModule(name) {
  try {
    const res = await fetch(`./modules/${name}/${name}.html`);
    if (!res.ok) throw new Error("HTML not found");

    content.innerHTML = await res.text();

    /* === LOAD CSS ONCE === */
    if (!document.getElementById(`${name}-css`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `./modules/${name}/${name}.css`;
      link.id = `${name}-css`;
      document.head.appendChild(link);
    }

    /* === DESTROY PREVIOUS MODULE === */
    if (currentModule && typeof currentModule.destroy === "function") {
      currentModule.destroy();
    }

    /* === IMPORT JS MODULE === */
    const module = await import(
      `./modules/${name}/${name}.js?v=${Date.now()}`
    );

    if (typeof module.init === "function") {
      module.init({
        eventCode: EVENT_CODE
      });
    }

    currentModule = module;

  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>Module "${name}" tidak ditemukan</h2>`;
  }
}

/* ================= AUTO LOAD DEFAULT ================= */

const moduleFromUrl = params.get("module");

if (moduleFromUrl) {
  activateTab(moduleFromUrl);
} else {
  activateTab("database");
}

/* ================= GLOBAL FUNCTIONS ================= */

window.logout = function () {
  window.location.href = "/";
};

window.goHome = function () {
  window.location.href = "/?event=" + EVENT_CODE;
};
