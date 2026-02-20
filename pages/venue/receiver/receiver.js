(() => {
  const EVENTS_KEY = "LEGA_EVENTS_v1";
  const VENUE_STATE_PREFIX = "LEGA_VENUE_STATE_";

  function qs(name){
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  function normalizeEvent(ev){
    if(!ev || typeof ev !== "object") ev = {};
    if(!ev.id) ev.id = "EVT" + String(Date.now());
    if(typeof ev.nama !== "string") ev.nama = "";
    if(typeof ev.detail !== "object" || !ev.detail) ev.detail = {};
    return ev;
  }

  function loadEvents(){
    try{
      const raw = localStorage.getItem(EVENTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch{
      return [];
    }
  }

  function venueKey(eventId){ return VENUE_STATE_PREFIX + eventId; }

  const isWasit = !!document.getElementById("lapNo");
  const isScoreboard = !!document.getElementById("sbEvent");

  let currentEventId = qs("id") || null;

  function renderFromState(eventId, st){
    if(!st) return;

    const events = loadEvents().map(normalizeEvent);
    const ev = events.find(x => x.id === eventId) || { id: eventId, nama: eventId, detail:{} };

    const lapParam = Number(qs("lap"));
    const activeLap = Number(st.scoreboard?.activeLap || 1);
    const lap = Number.isFinite(lapParam) && lapParam > 0 ? lapParam : activeLap;

    const item = (st.scoresheet?.lapangan || []).find(x => x.lap === lap) || st.scoresheet?.lapangan?.[0];

    if(isWasit){
      document.getElementById("lapNo").textContent = String(lap);
      document.getElementById("rxMeta").textContent = `Event: ${ev.nama || ev.id} • ID: ${ev.id}`;
      if(item){
        document.getElementById("teamA").textContent = item.teamA || "TEAM A";
        document.getElementById("teamB").textContent = item.teamB || "TEAM B";
        document.getElementById("scoreA").textContent = String(item.scoreA ?? 0);
        document.getElementById("scoreB").textContent = String(item.scoreB ?? 0);
      }
    }

    if(isScoreboard){
      const it = (st.scoresheet?.lapangan || []).find(x => x.lap === activeLap) || st.scoresheet?.lapangan?.[0];
      document.getElementById("sbEvent").textContent = ev.nama || ev.id;
      document.getElementById("sbLap").textContent = `Lapangan ${activeLap}`;

      if(it){
        document.getElementById("sbTeamA").textContent = it.teamA || "TEAM A";
        document.getElementById("sbTeamB").textContent = it.teamB || "TEAM B";
        document.getElementById("sbScoreA").textContent = String(it.scoreA ?? 0);
        document.getElementById("sbScoreB").textContent = String(it.scoreB ?? 0);
        document.getElementById("sbFooter").textContent = `Update: ${new Date().toLocaleTimeString()}`;
      }else{
        document.getElementById("sbFooter").textContent = "Tidak ada data lapangan.";
      }
    }
  }

  function showNoActive(){
    if(isScoreboard) document.getElementById("sbFooter").textContent = "Belum ada event aktif. Tunggu controller memilih event.";
    if(isWasit) document.getElementById("rxMeta").textContent = "Belum ada event aktif. Tunggu controller memilih event.";
  }

  if(typeof io === "undefined"){
    showNoActive();
    return;
  }

  const socket = io();

  function join(eventId){
    currentEventId = eventId;
    socket.emit("join_event", { eventId, role: isWasit ? "wasit" : "scoreboard", lap: qs("lap") || null });

    // render dari cache kalau ada
    try{
      const raw = localStorage.getItem(venueKey(eventId));
      if(raw) renderFromState(eventId, JSON.parse(raw));
    }catch{}
  }

  socket.on("connect", () => {
    // kalau URL ada id -> join itu, kalau tidak -> join active event (server handle)
    socket.emit("join_event", { eventId: currentEventId, role: isWasit ? "wasit" : "scoreboard", lap: qs("lap") || null });
  });

  socket.on("no_active_event", () => showNoActive());

  socket.on("active_event", ({ eventId }) => {
    // kalau receiver dibuka tanpa id, otomatis pindah ke event aktif
    if(!qs("id") && eventId) join(eventId);
  });

  socket.on("venue_state", (payload) => {
    if(!payload || !payload.eventId || !payload.state) return;

    // cache
    localStorage.setItem(venueKey(payload.eventId), JSON.stringify(payload.state));

    // render kalau event sesuai current
    if(!currentEventId) currentEventId = payload.eventId;
    if(payload.eventId !== currentEventId) return;

    renderFromState(payload.eventId, payload.state);
  });
})();
