// js/storage.js
// Helper LocalStorage untuk sistem LEGA (Event = master)

window.LEGA_STORE = (() => {
  const EVENTS_KEY = "LEGA_EVENTS_v1";
  const ACTIVE_EVENT_KEY = "LEGA_ACTIVE_EVENT_ID";

  const safeJsonParse = (raw, fallback) => {
    try { return JSON.parse(raw); } catch { return fallback; }
  };

  const getEvents = () => {
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr = safeJsonParse(raw || "[]", []);
    return Array.isArray(arr) ? arr : [];
  };

  const setEvents = (events) => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events || []));
  };

  const getActiveEventId = () => localStorage.getItem(ACTIVE_EVENT_KEY) || "";
  const setActiveEventId = (id) => localStorage.setItem(ACTIVE_EVENT_KEY, id);
  const clearActiveEvent = () => localStorage.removeItem(ACTIVE_EVENT_KEY);

  const findEventById = (id) => getEvents().find(e => e && e.id === id) || null;

  const getActiveEvent = () => {
    const id = getActiveEventId();
    if(!id) return null;
    return findEventById(id);
  };

  const upsertEvent = (eventObj) => {
    const events = getEvents();
    const idx = events.findIndex(e => e && e.id === eventObj.id);
    if(idx === -1) events.push(eventObj);
    else events[idx] = eventObj;
    setEvents(events);
  };

  const deleteEvent = (id) => {
    const events = getEvents().filter(e => e && e.id !== id);
    setEvents(events);
    if(getActiveEventId() === id) clearActiveEvent();
  };

  return {
    EVENTS_KEY,
    ACTIVE_EVENT_KEY,
    getEvents,
    setEvents,
    getActiveEventId,
    setActiveEventId,
    clearActiveEvent,
    findEventById,
    getActiveEvent,
    upsertEvent,
    deleteEvent
  };
})();
